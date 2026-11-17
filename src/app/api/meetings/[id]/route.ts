import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { updateGoogleCalendarMeeting, deleteGoogleCalendarMeeting } from '@/lib/googleCalendar';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const meeting = await db.meeting.findUnique({
      where: { id },
      include: {
        hostEmployee: { select: { id: true, name: true, employeeCode: true, companyEmail: true } },
        createdByUser: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        enquiry: { select: { id: true, name: true, email: true, phone: true } },
        deal: { select: { id: true, title: true, value: true } },
        projectRecord: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        participants: {
          include: {
            employee: { select: { id: true, name: true, companyEmail: true } },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, meeting });
  } catch (error: any) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch meeting' },
      { status: 500 }
    );
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

    const existing = await db.meeting.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const { startTime, endTime, timezone, title, description, location } = body;

    const updateData: any = {};
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (timezone) updateData.timezone = timezone;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;

    if (updateData.startTime && updateData.endTime) {
      if (updateData.endTime <= updateData.startTime) {
        return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
      }
      updateData.status = 'RESCHEDULED';
    }

    // Update on Google Calendar if event ID exists
    if (existing.googleEventId && (updateData.startTime || updateData.endTime || updateData.title)) {
      await updateGoogleCalendarMeeting(existing.googleEventId, {
        title: updateData.title || existing.title,
        description: updateData.description !== undefined ? updateData.description : existing.description,
        startTime: updateData.startTime || existing.startTime,
        endTime: updateData.endTime || existing.endTime,
        timezone: updateData.timezone || existing.timezone,
      });
    }

    const updated = await db.meeting.update({
      where: { id },
      data: updateData,
      include: {
        hostEmployee: { select: { id: true, name: true } },
        participants: true,
      },
    });

    // If linked to Enquiry, append a note
    if (existing.enquiryId && updateData.startTime) {
      await db.enquiryNote.create({
        data: {
          enquiryId: existing.enquiryId,
          userId: session.userId,
          note: `[MEETING RESCHEDULED] Rescheduled to ${updateData.startTime.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}`,
        },
      });
    }

    return NextResponse.json({ success: true, meeting: updated });
  } catch (error: any) {
    console.error('Error rescheduling meeting:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update meeting' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const existing = await db.meeting.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Cancel on Google Calendar
    if (existing.googleEventId) {
      await deleteGoogleCalendarMeeting(existing.googleEventId);
    }

    await db.meeting.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true, message: 'Meeting cancelled successfully' });
  } catch (error: any) {
    console.error('Error cancelling meeting:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to cancel meeting' },
      { status: 500 }
    );
  }
}
