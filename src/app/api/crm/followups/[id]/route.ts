import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { status, outcome, notes, scheduledAt } = body;

    const existing = await db.followUp.findUnique({
      where: { id },
      include: { enquiry: { select: { assignedTo: true, assignedEmployeeId: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Follow-up not found.' }, { status: 404 });
    }

    const canManageAll =
      session.role === 'SUPER_ADMIN' ||
      session.appRoleName === 'SUPER_ADMIN' ||
      (session.isTenant && !!session.companyId && (session.companyRole === 'OWNER' || session.companyRole === 'ADMIN')) ||
      session.permissions?.includes('meetings.team.view') ||
      session.permissions?.includes('crm.leads.assign') ||
      session.permissions?.includes('hr.assignments.view');

    if (!canManageAll) {
      const isOwner =
        existing.assignedToId === session.userId ||
        (session.employeeId && existing.assignedEmployeeId === session.employeeId) ||
        existing.enquiry?.assignedTo === session.userId ||
        (session.employeeId && existing.enquiry?.assignedEmployeeId === session.employeeId);

      if (!isOwner) {
        return NextResponse.json({ error: 'You do not have permission to modify this follow-up.' }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }
    if (outcome !== undefined) updateData.outcome = outcome;
    if (notes !== undefined) updateData.notes = notes;
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);

    const updated = await db.followUp.update({
      where: { id },
      data: updateData,
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_FOLLOWUP',
      entityType: 'FollowUp',
      entityId: id,
      metadata: { status: updated.status, outcome: updated.outcome },
    });

    return NextResponse.json({ success: true, followUp: updated });
  } catch (error) {
    console.error('Update follow-up error:', error);
    return NextResponse.json({ error: 'Failed to update follow-up.' }, { status: 500 });
  }
}
