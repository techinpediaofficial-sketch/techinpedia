import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { deleteGoogleCalendarMeeting } from '@/lib/googleCalendar';
import { logAuditEvent } from '@/lib/auditLogger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await db.meeting.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const cancelledReason = body.reason || 'Cancelled by organizer';

    // Remove or cancel on Google Calendar
    if (existing.googleEventId) {
      await deleteGoogleCalendarMeeting(existing.googleEventId);
    }

    const updated = await db.meeting.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledReason,
      },
      include: {
        hostEmployee: { select: { id: true, name: true } },
        participants: true,
      },
    });

    // If linked to Enquiry, append an activity note
    if (existing.enquiryId) {
      await db.enquiryNote.create({
        data: {
          enquiryId: existing.enquiryId,
          userId: session.userId,
          note: `[MEETING CANCELLED] Reason: ${cancelledReason}`,
        },
      });
    }

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      action: 'CANCELLED',
      entityType: 'MEETING',
      entityId: id,
      before: {
        status: existing.status,
        cancelledReason: existing.cancelledReason,
      },
      after: {
        status: 'CANCELLED',
        cancelledReason,
      },
      details: `Meeting "${existing.title}" cancelled. Reason: ${cancelledReason}`,
    });

    return NextResponse.json({ success: true, meeting: updated });
  } catch (error: any) {
    console.error('Error cancelling meeting:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to cancel meeting' },
      { status: 500 }
    );
  }
}
