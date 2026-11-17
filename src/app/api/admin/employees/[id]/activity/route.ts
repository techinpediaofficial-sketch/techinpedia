import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isOwnerOrAdmin, isManager } from '@/lib/access-policy';

/**
 * GET /api/admin/employees/[id]/activity
 * 
 * Fetches legitimate application-level activity timeline for an employee:
 * - Leads assigned, viewed, accepted
 * - Outbound WhatsApp messages sent
 * - Lead timeline events & notes
 * - Follow-ups created
 * - Reassignment actions
 * 
 * Filters: date (today, yesterday, this_week, all), category (all, leads, whatsapp, followups)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: targetId } = await params; // Can be userId or employeeId

    const companyId = session.companyId || null;
    const isOwnerAdmin = isOwnerOrAdmin(session);
    const isMgr = isManager(session);

    // Permission check: only managers/owners or the employee themselves
    if (!isOwnerAdmin && !isMgr && session.userId !== targetId && session.employeeId !== targetId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Resolve User record
    const user = await db.user.findFirst({
      where: {
        OR: [{ id: targetId }, { employeeId: targetId }],
        ...(companyId ? { companyId } : {}),
      },
      include: {
        employee: {
          include: {
            department: true,
            team: true,
            designation: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Employee not found in your company' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'today'; // today, yesterday, week, all
    const category = searchParams.get('category') || 'all'; // all, leads, whatsapp, followups

    const now = new Date();
    let startDate: Date | undefined;

    if (timeRange === 'today') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (timeRange === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      y.setHours(0, 0, 0, 0);
      startDate = y;
    } else if (timeRange === 'week') {
      const w = new Date();
      w.setDate(w.getDate() - 7);
      startDate = w;
    }

    const dateFilter = startDate ? { gte: startDate } : undefined;

    // Parallel fetch events from legitimate sources
    const [timelineEvents, whatsappMessages, reassignments, notes, employeeStatus] = await Promise.all([
      db.leadTimelineEvent.findMany({
        where: {
          actorEmail: user.email,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.whatsappMessage.findMany({
        where: {
          senderUserId: user.id,
          direction: 'OUTBOUND',
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { conversation: { select: { waNumber: true, customerName: true } } },
      }),
      db.reassignmentHistory.findMany({
        where: {
          OR: [{ toUserId: user.id }, { fromUserId: user.id }, { reassignedBy: user.id }],
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      db.enquiryNote.findMany({
        where: {
          userId: user.id,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      db.employeeStatus.findUnique({
        where: { userId: user.id },
      }),
    ]);

    // Unify events into normalized timeline items
    const events: any[] = [];

    for (const t of timelineEvents) {
      if (category !== 'all' && category !== 'leads') continue;
      events.push({
        id: `timeline-${t.id}`,
        type: 'LEAD_EVENT',
        category: 'leads',
        title: t.title,
        description: t.description,
        timestamp: t.createdAt,
        icon: 'Target',
      });
    }

    for (const m of whatsappMessages) {
      if (category !== 'all' && category !== 'whatsapp') continue;
      events.push({
        id: `wa-${m.id}`,
        type: 'WHATSAPP_MESSAGE',
        category: 'whatsapp',
        title: `Outbound WhatsApp to ${m.conversation?.customerName || m.conversation?.waNumber || 'Contact'}`,
        description: m.type === 'internal_note' ? `[Internal Note] ${m.textBody}` : (m.textBody || `Sent ${m.type} message`),
        timestamp: m.createdAt,
        icon: 'MessageSquare',
      });
    }

    for (const r of reassignments) {
      if (category !== 'all' && category !== 'leads' && category !== 'whatsapp') continue;
      const isRecipient = r.toUserId === user.id;
      events.push({
        id: `reassign-${r.id}`,
        type: 'REASSIGNMENT',
        category: 'leads',
        title: isRecipient ? `Assignment Received (${r.resourceType})` : `Assignment Transferred`,
        description: `Reason: ${r.reason || 'Manager Action'}${r.notes ? ' - ' + r.notes : ''}`,
        timestamp: r.createdAt,
        icon: 'UserCheck',
      });
    }

    for (const n of notes) {
      if (category !== 'all' && category !== 'leads') continue;
      events.push({
        id: `note-${n.id}`,
        type: 'NOTE',
        category: 'leads',
        title: 'Lead Note Added',
        description: n.note,
        timestamp: n.createdAt,
        icon: 'FileText',
      });
    }

    // Sort descending by timestamp
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      employee: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.companyRole || 'STAFF',
        employeeCode: user.employee?.employeeCode,
        department: user.employee?.department?.name || 'General',
        team: user.employee?.team?.name || 'Main Team',
        designation: user.employee?.designation?.title || user.companyRole,
        status: employeeStatus?.status || 'OFFLINE',
        lastActivityAt: employeeStatus?.lastActivityAt || null,
      },
      events: events.slice(0, 100),
    });
  } catch (e: any) {
    console.error('Fetch employee activity error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
