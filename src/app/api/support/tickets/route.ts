import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const customerId = searchParams.get('customerId');
    const queryCompanyId = searchParams.get('companyId');
    const search = searchParams.get('search') || '';

    const where: any = {};
    
    // Strict Tenant Isolation
    if (session.isTenant || session.companyId) {
      where.companyId = session.companyId;
    } else if (queryCompanyId && queryCompanyId !== 'master') {
      where.companyId = queryCompanyId;
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (customerId) where.customerId = customerId;

    if (search.trim()) {
      where.OR = [
        { ticketNumber: { contains: search } },
        { subject: { contains: search } },
        { clientName: { contains: search } },
        { clientEmail: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const tickets = await db.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, company: { select: { name: true } } } },
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });

    const openCount = tickets.filter(t => t.status === 'OPEN').length;
    const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    const urgentCount = tickets.filter(t => t.priority === 'URGENT' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
    const resolvedCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

    return NextResponse.json({
      success: true,
      tickets,
      metrics: {
        total: tickets.length,
        open: openCount,
        inProgress: inProgressCount,
        urgent: urgentCount,
        resolved: resolvedCount,
      },
    });
  } catch (error) {
    console.error('Fetch tickets error:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const {
      customerId,
      clientName,
      clientEmail,
      subject,
      description,
      category = 'TECHNICAL',
      priority = 'MEDIUM',
      assignedTo,
      assignedToName,
      companyId, // allow super admin to specify
    } = body;

    const effectiveCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (companyId || session.companyId);

    if (!clientName || !clientEmail || !subject || !description) {
      return NextResponse.json({ error: 'Client name, email, subject, and description are required.' }, { status: 400 });
    }

    // Generate ticketNumber TICK-YYYY-XXXX
    const count = await db.supportTicket.count();
    const ticketNumber = `TICK-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // SLA Due Date calculation based on priority
    const now = new Date();
    let slaHours = 48; // default
    if (priority === 'URGENT') slaHours = 4;
    else if (priority === 'HIGH') slaHours = 12;
    else if (priority === 'MEDIUM') slaHours = 24;
    else if (priority === 'LOW') slaHours = 72;
    const slaDueDate = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    const ticket = await db.supportTicket.create({
      data: {
        ticketNumber,
        companyId: effectiveCompanyId || null,
        customerId: customerId || null,
        clientName,
        clientEmail,
        subject,
        description,
        category,
        priority,
        status: 'OPEN',
        assignedTo: assignedTo || null,
        assignedToName: assignedToName || null,
        slaDueDate,
      },
      include: {
        customer: true,
        comments: true,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'TICKET',
      entityId: ticket.id,
      details: `Created support ticket ${ticket.ticketNumber} - ${subject} (${priority})`,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json({ error: 'Failed to create ticket.' }, { status: 500 });
  }
}
