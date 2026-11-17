import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const where: any = { id };
    if (session.isTenant || session.companyId) {
      where.companyId = session.companyId;
    }

    const ticket = await db.supportTicket.findFirst({
      where,
      include: {
        customer: true,
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Fetch ticket error:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket.' }, { status: 500 });
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
    const { status, priority, category, assignedTo, assignedToName } = body;

    const where: any = { id };
    if (session.isTenant || session.companyId) {
      where.companyId = session.companyId;
    }

    const currentTicket = await db.supportTicket.findFirst({ where });
    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'RESOLVED' || status === 'CLOSED') {
        updateData.resolvedAt = new Date();
      } else if (currentTicket.resolvedAt && status !== 'RESOLVED' && status !== 'CLOSED') {
        updateData.resolvedAt = null;
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (assignedToName !== undefined) updateData.assignedToName = assignedToName;

    const updated = await db.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'TICKET',
      entityId: id,
      details: `Updated ticket ${currentTicket.ticketNumber} status to ${status || currentTicket.status}`,
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error('Update ticket error:', error);
    return NextResponse.json({ error: 'Failed to update ticket.' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { message, isInternal = false, authorName = 'Support Agent', authorRole = 'AGENT' } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message content is required.' }, { status: 400 });
    }

    const where: any = { id };
    if (session.isTenant || session.companyId) {
      where.companyId = session.companyId;
    }

    const currentTicket = await db.supportTicket.findFirst({ where });
    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const comment = await db.ticketComment.create({
      data: {
        ticketId: id,
        message,
        isInternal,
        authorName,
        authorRole,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'TICKET_COMMENT',
      entityId: comment.id,
      details: `Added ${isInternal ? 'internal note' : 'reply'} to ticket ID: ${id}`,
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Add ticket comment error:', error);
    return NextResponse.json({ error: 'Failed to add comment.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const ticket = await db.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    await db.supportTicket.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      action: 'DELETE',
      entityType: 'TICKET',
      entityId: id,
      details: `Deleted ticket ${ticket.ticketNumber}`,
    });

    return NextResponse.json({ success: true, message: 'Ticket deleted successfully.' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    return NextResponse.json({ error: 'Failed to delete ticket.' }, { status: 500 });
  }
}
