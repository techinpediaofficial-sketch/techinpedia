import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logAuditEvent } from '@/lib/auditLogger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await db.meeting.findUnique({
      where: { id },
      include: { customer: true, enquiry: true, deal: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const {
      outcome,
      outcomeNotes,
      createFollowUp = false,
      followUpDate,
      followUpType = 'CALL',
      followUpNotes,
    } = body;

    if (!outcome) {
      return NextResponse.json({ error: 'Outcome is required' }, { status: 400 });
    }

    const newStatus = outcome === 'NO_SHOW' ? 'NO_SHOW' : 'COMPLETED';

    let createdFollowUp: any = null;

    const updated = await db.$transaction(async (tx) => {
      let followUpTaskId: string | null = null;

      // Automatically create a CRM FollowUp task if requested
      if (createFollowUp && followUpDate) {
        const scheduledAt = new Date(followUpDate);
        if (!isNaN(scheduledAt.getTime())) {
          createdFollowUp = await tx.followUp.create({
            data: {
              title: `Follow-up: ${existing.title}`,
              type: followUpType,
              status: 'PENDING',
              scheduledAt,
              notes: followUpNotes || `Generated from meeting outcome: ${outcome.replace(/_/g, ' ')}`,
              customerId: existing.customerId || null,
              enquiryId: existing.enquiryId || null,
              dealId: existing.dealId || null,
              assignedEmployeeId: existing.hostEmployeeId || session.employeeId || null,
              assignedToId: session.userId,
            },
          });
          followUpTaskId = createdFollowUp.id;
        }
      }

      const updatedMeeting = await tx.meeting.update({
        where: { id },
        data: {
          outcome,
          outcomeNotes: outcomeNotes || null,
          status: newStatus,
          followUpTaskId,
        },
        include: {
          hostEmployee: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          enquiry: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
        },
      });

      // Record CRM activity note if linked to enquiry
      if (existing.enquiryId) {
        await tx.enquiryNote.create({
          data: {
            enquiryId: existing.enquiryId,
            userId: session.userId,
            note: `[MEETING OUTCOME: ${outcome.replace(/_/g, ' ')}] ${outcomeNotes || 'No additional notes provided.'}${
              createdFollowUp ? ` -> Next follow-up scheduled for ${new Date(followUpDate).toLocaleDateString()}` : ''
            }`,
          },
        });
      }

      return updatedMeeting;
    });

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      action: 'STATUS_CHANGED',
      entityType: 'MEETING',
      entityId: id,
      before: {
        status: existing.status,
        outcome: existing.outcome,
        outcomeNotes: existing.outcomeNotes,
      },
      after: {
        status: updated.status,
        outcome: updated.outcome,
        outcomeNotes: updated.outcomeNotes,
        followUpTaskId: updated.followUpTaskId,
      },
      details: `Meeting "${existing.title}" outcome logged as ${outcome} by ${session.email}`,
    });

    return NextResponse.json({
      success: true,
      meeting: updated,
      followUp: createdFollowUp,
    });
  } catch (error: any) {
    console.error('Error recording meeting outcome:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to record outcome' },
      { status: 500 }
    );
  }
}
