import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            contacts: true,
          },
        },
        contact: true,
        deals: {
          orderBy: { createdAt: 'desc' },
          include: {
            stage: true,
            pipeline: true,
            items: true,
            stageHistories: { orderBy: { createdAt: 'desc' }, take: 5 },
          },
        },
        followUps: {
          orderBy: { scheduledAt: 'desc' },
          include: {
            assignedEmployee: { select: { id: true, name: true, employeeCode: true } },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            payments: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        projects: {
          orderBy: { createdAt: 'desc' },
          include: {
            tasks: { take: 5, orderBy: { dueDate: 'asc' } },
          },
        },
        rentalOrders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: { include: { asset: true } },
          },
        },
        amcContracts: {
          orderBy: { createdAt: 'desc' },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          include: {
            plan: true,
            product: true,
          },
        },
        tickets: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    // Compute metrics
    const totalPaid = customer.payments.reduce((acc, p) => acc + p.amount, 0);
    const totalInvoiced = customer.invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const outstanding = Math.max(0, totalInvoiced - totalPaid);

    // Query WhatsApp conversation history
    const customerPhone = customer.phone || customer.contact?.phone;
    let whatsappConversation = null;
    if (customerPhone || customer.id) {
      const { normalizePhone } = await import('@/lib/phone');
      const norm = normalizePhone(customerPhone);
      whatsappConversation = await db.whatsappConversation.findFirst({
        where: {
          OR: [
            { customerId: customer.id },
            ...(norm.canonical ? [{ waNumber: norm.canonical }] : []),
            ...(customer.contactId ? [{ contactId: customer.contactId }] : []),
          ],
        },
        include: {
          messages: {
            take: 50,
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    const dealIds = customer.deals.map((d) => d.id);
    const [timelineEvents, quotations, proposals] = await Promise.all([
      db.leadTimelineEvent.findMany({
        where: {
          OR: [
            { customerId: id },
            ...(dealIds.length > 0 ? [{ dealId: { in: dealIds } }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      dealIds.length > 0
        ? db.quotation.findMany({
            where: { dealId: { in: dealIds } },
            orderBy: { createdAt: 'desc' },
          })
        : [],
      dealIds.length > 0
        ? db.proposal.findMany({
            where: { dealId: { in: dealIds } },
            orderBy: { createdAt: 'desc' },
          })
        : [],
    ]);

    return NextResponse.json({
      success: true,
      customer: {
        ...customer,
        quotations,
        proposals,
        timelineEvents,
      },
      whatsappConversation,
      metrics: {
        totalPaid,
        totalInvoiced,
        outstanding,
        dealCount: customer.deals.length,
        projectCount: customer.projects.length,
        activeRentals: customer.rentalOrders.filter((r) => r.status === 'ACTIVE').length,
        openTickets: customer.tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
      },
    });
  } catch (error) {
    console.error('Fetch customer 360 error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer 360.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    const { name, email, phone, status, notes, companyId, contactId } = body;
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (companyId !== undefined) updateData.companyId = companyId || null;
    if (contactId !== undefined) updateData.contactId = contactId || null;

    const updated = await db.customer.update({
      where: { id },
      data: updateData,
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_CUSTOMER',
      entityType: 'Customer',
      entityId: id,
      metadata: updateData,
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json({ error: 'Failed to update customer.' }, { status: 500 });
  }
}
