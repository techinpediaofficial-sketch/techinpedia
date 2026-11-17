import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();

    // Must be ADMIN or SUPER_ADMIN
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const whereScope = session.isTenant ? { companyId: session.companyId } : {};

    // Get all users in the company
    const users = await db.user.findMany({
      where: whereScope,
      select: {
        id: true,
        name: true,
        email: true,
        companyRole: true,
      },
    });

    // Get active assignments for leads
    const leads = await db.enquiry.findMany({
      where: {
        ...whereScope,
        status: { notIn: ['WON', 'LOST'] },
        OR: [
          { assignedTo: { not: null } },
          { assignedEmployeeId: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        assignedTo: true,
        assignedEmployeeId: true,
        assignedAt: true,
        assignmentAcceptedAt: true,
      }
    });

    // Get active assignments for WhatsApp
    const chats = await db.whatsappConversation.findMany({
      where: {
        ...whereScope,
        status: 'OPEN',
        assignedUserId: { not: null }
      },
      select: {
        id: true,
        waNumber: true,
        customerName: true,
        assignedUserId: true,
        assignedAt: true,
        assignmentAcceptedAt: true,
      }
    });

    // Aggregate by user
    const monitorData = users.map(user => {
      const userLeads = leads.filter(l => l.assignedTo === user.id || l.assignedEmployeeId === user.id);
      const userChats = chats.filter(c => c.assignedUserId === user.id);

      const unacceptedLeads = userLeads.filter(l => !l.assignmentAcceptedAt);
      const unacceptedChats = userChats.filter(c => !c.assignmentAcceptedAt);

      return {
        user: { id: user.id, name: user.name, email: user.email, role: user.companyRole },
        stats: {
          totalLeads: userLeads.length,
          unacceptedLeads: unacceptedLeads.length,
          totalChats: userChats.length,
          unacceptedChats: unacceptedChats.length,
        },
        unacceptedDetails: {
          leads: unacceptedLeads,
          chats: unacceptedChats,
        }
      };
    });

    // Sort by most unaccepted items
    monitorData.sort((a, b) => 
      (b.stats.unacceptedLeads + b.stats.unacceptedChats) - 
      (a.stats.unacceptedLeads + a.stats.unacceptedChats)
    );

    return NextResponse.json({ data: monitorData });
  } catch (error: any) {
    console.error('Assignment Monitor error:', error);
    return NextResponse.json({ error: 'Failed to fetch assignment monitor data' }, { status: 500 });
  }
}
