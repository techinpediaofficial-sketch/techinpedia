import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { recordLeadTimelineEvent } from '@/lib/crm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const existing = await db.enquiry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });
    }

    if (session.isTenant && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Must be assigned to this user/employee
    const isAssigned = (session.userType === 'Employee' && existing.assignedEmployeeId === session.employeeId) || 
                       (existing.assignedTo === session.userId);

    if (!isAssigned && session.role !== 'SUPER_ADMIN') {
       return NextResponse.json({ error: 'You are not assigned to this lead.' }, { status: 403 });
    }

    if (existing.assignmentAcceptedAt) {
      return NextResponse.json({ error: 'Lead already accepted.' }, { status: 400 });
    }

    const acceptedBy = session.userType === 'Employee' ? session.employeeId : session.userId;

    await db.enquiry.update({
      where: { id },
      data: {
        assignmentAcceptedAt: new Date(),
        assignmentAcceptedBy: acceptedBy,
      },
    });

    await recordLeadTimelineEvent({
      enquiryId: id,
      type: 'STATUS_CHANGE',
      title: 'Lead Accepted',
      description: `Lead was accepted by assigned representative ${session.name}.`,
      actorEmail: session.email,
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'ACCEPT_ENQUIRY',
      entityType: 'Enquiry',
      entityId: id,
      details: 'Assigned representative accepted the lead',
    });

    return NextResponse.json({ success: true, message: 'Lead accepted successfully.' });
  } catch (error: any) {
    console.error('Accept Enquiry error:', error);
    return NextResponse.json({ error: 'Failed to accept lead.' }, { status: 500 });
  }
}
