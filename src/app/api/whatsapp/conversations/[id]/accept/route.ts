import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const existing = await db.whatsappConversation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    if (session.isTenant && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Must be assigned to this user/employee
    const acceptedBy = session.userType === 'Employee' ? session.employeeId : session.userId;
    const isAssigned = existing.assignedUserId === acceptedBy;

    if (!isAssigned && session.role !== 'SUPER_ADMIN') {
       return NextResponse.json({ error: 'You are not assigned to this conversation.' }, { status: 403 });
    }

    if (existing.assignmentAcceptedAt) {
      return NextResponse.json({ error: 'Conversation already accepted.' }, { status: 400 });
    }

    await db.whatsappConversation.update({
      where: { id },
      data: {
        assignmentAcceptedAt: new Date(),
        assignmentAcceptedBy: acceptedBy,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'ACCEPT_WHATSAPP_CONVERSATION',
      entityType: 'WhatsappConversation',
      entityId: id,
      details: 'Assigned representative accepted the WhatsApp conversation',
    });

    return NextResponse.json({ success: true, message: 'Conversation accepted successfully.' });
  } catch (error: any) {
    console.error('Accept Conversation error:', error);
    return NextResponse.json({ error: 'Failed to accept conversation.' }, { status: 500 });
  }
}
