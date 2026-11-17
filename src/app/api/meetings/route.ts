import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createGoogleCalendarMeeting, MeetingParticipantParam } from '@/lib/googleCalendar';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const range = searchParams.get('range') || 'all'; // today, upcoming, past, all
    const customerId = searchParams.get('customerId');
    const enquiryId = searchParams.get('enquiryId');
    const dealId = searchParams.get('dealId');
    const projectRecordId = searchParams.get('projectRecordId');
    const hostEmployeeId = searchParams.get('hostEmployeeId');
    const meetingType = searchParams.get('meetingType');

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (meetingType && meetingType !== 'ALL') {
      where.meetingType = meetingType;
    }

    if (customerId) where.customerId = customerId;
    if (enquiryId) where.enquiryId = enquiryId;
    if (dealId) where.dealId = dealId;
    if (projectRecordId) where.projectRecordId = projectRecordId;
    if (hostEmployeeId) where.hostEmployeeId = hostEmployeeId;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (range === 'today') {
      where.startTime = { gte: startOfToday, lte: endOfToday };
    } else if (range === 'upcoming') {
      where.startTime = { gte: now };
    } else if (range === 'past') {
      where.endTime = { lte: now };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
        { customer: { name: { contains: search } } },
        { enquiry: { name: { contains: search } } },
        { participants: { some: { email: { contains: search } } } },
      ];
    }

    const [meetings, totalCount] = await Promise.all([
      db.meeting.findMany({
        where,
        include: {
          hostEmployee: { select: { id: true, name: true, employeeCode: true, companyEmail: true } },
          createdByUser: { select: { id: true, name: true, email: true } },
          customer: { select: { id: true, name: true, email: true, phone: true } },
          enquiry: { select: { id: true, name: true, email: true, phone: true, company: true } },
          deal: { select: { id: true, title: true, value: true } },
          projectRecord: { select: { id: true, name: true, code: true } },
          participants: {
            include: {
              employee: { select: { id: true, name: true, companyEmail: true } },
            },
            orderBy: { role: 'asc' },
          },
        },
        orderBy: { startTime: range === 'past' ? 'desc' : 'asc' },
        skip,
        take: limit,
      }),
      db.meeting.count({ where }),
    ]);

    // High-level summary metrics
    const [todayCount, upcomingCount, completedCount, meetCount] = await Promise.all([
      db.meeting.count({
        where: {
          startTime: { gte: startOfToday, lte: endOfToday },
          status: { in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] },
        },
      }),
      db.meeting.count({
        where: {
          startTime: { gte: now },
          status: 'SCHEDULED',
        },
      }),
      db.meeting.count({
        where: { status: 'COMPLETED' },
      }),
      db.meeting.count({
        where: { meetingType: 'GOOGLE_MEET' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      meetings,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      summary: {
        todayCount,
        upcomingCount,
        completedCount,
        meetCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch meetings' },
      { status: error?.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const {
      title,
      description,
      meetingType = 'GOOGLE_MEET',
      startTime,
      endTime,
      timezone = 'Asia/Kolkata',
      location,
      customerId,
      contactId,
      enquiryId,
      dealId,
      projectRecordId,
      participants = [],
    } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Meeting title, start time, and end time are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (endDate <= startDate) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Resolve Host Employee Attribution
    let hostEmployeeId = body.hostEmployeeId || session.employeeId;
    if (!hostEmployeeId) {
      // Fallback to active employee record matching user
      const emp = await db.employee.findFirst({
        where: { OR: [{ companyEmail: session.email }, { personalEmail: session.email }] },
      });
      if (emp) hostEmployeeId = emp.id;
    }

    // Resolve Department & Team from host employee
    let departmentId = null;
    let teamId = null;
    if (hostEmployeeId) {
      const hostEmp = await db.employee.findUnique({
        where: { id: hostEmployeeId },
        select: { departmentId: true, teamId: true, name: true, companyEmail: true },
      });
      if (hostEmp) {
        departmentId = hostEmp.departmentId;
        teamId = hostEmp.teamId;
      }
    }

    // Build attendees array for Google Calendar invite
    const attendeesMap = new Map<string, MeetingParticipantParam>();

    // 1. Add organizer
    attendeesMap.set(session.email.toLowerCase(), {
      email: session.email.toLowerCase(),
      name: session.name || 'Organizer',
      role: 'ORGANIZER',
      employeeId: hostEmployeeId || undefined,
    });

    // 2. Add client attendee if linked
    if (customerId) {
      const cust = await db.customer.findUnique({ where: { id: customerId } });
      if (cust?.email) {
        attendeesMap.set(cust.email.toLowerCase(), {
          email: cust.email.toLowerCase(),
          name: cust.name,
          role: 'ATTENDEE',
        });
      }
    } else if (enquiryId) {
      const enq = await db.enquiry.findUnique({ where: { id: enquiryId } });
      if (enq?.email) {
        attendeesMap.set(enq.email.toLowerCase(), {
          email: enq.email.toLowerCase(),
          name: enq.name,
          role: 'ATTENDEE',
        });
      }
    }

    // 3. Add any explicitly provided participants
    if (Array.isArray(participants)) {
      for (const p of participants) {
        if (p?.email) {
          const lower = p.email.trim().toLowerCase();
          attendeesMap.set(lower, {
            email: lower,
            name: p.name || undefined,
            role: p.role || 'ATTENDEE',
            employeeId: p.employeeId || undefined,
          });
        }
      }
    }

    const attendeesList = Array.from(attendeesMap.values());

    // Call Google Calendar service to generate event & Meet link
    const calResult = await createGoogleCalendarMeeting({
      title,
      description,
      startTime: startDate,
      endTime: endDate,
      timezone,
      location: location || (meetingType === 'GOOGLE_MEET' ? 'Google Meet Video Call' : undefined),
      meetingType,
      attendees: attendeesList,
    });

    // Save Meeting and Participants in MySQL Transaction
    const meeting = await db.$transaction(async (tx) => {
      const newMeeting = await tx.meeting.create({
        data: {
          title,
          description: description || null,
          meetingType,
          status: 'SCHEDULED',
          startTime: startDate,
          endTime: endDate,
          timezone,
          location: location || null,
          conferenceLink: calResult.conferenceLink || null,
          conferenceId: calResult.conferenceId || null,
          googleEventId: calResult.googleEventId,
          googleCalendarId: calResult.googleCalendarId,
          icalUid: calResult.icalUid,
          htmlLink: calResult.htmlLink,
          customerId: customerId || null,
          contactId: contactId || null,
          enquiryId: enquiryId || null,
          dealId: dealId || null,
          projectRecordId: projectRecordId || null,
          departmentId,
          teamId,
          hostEmployeeId,
          createdById: session.userId,
        },
      });

      // Insert participants
      for (const att of attendeesList) {
        await tx.meetingParticipant.create({
          data: {
            meetingId: newMeeting.id,
            employeeId: att.employeeId || null,
            email: att.email,
            name: att.name || null,
            role: att.role || 'ATTENDEE',
            responseStatus: att.role === 'ORGANIZER' ? 'ACCEPTED' : 'NEEDS_ACTION',
          },
        });
      }

      // If linked to Enquiry, append an automatic CRM note
      if (enquiryId) {
        await tx.enquiryNote.create({
          data: {
            enquiryId,
            userId: session.userId,
            note: `[MEETING SCHEDULED] ${title} on ${startDate.toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}. Video Link: ${calResult.conferenceLink || 'N/A'}`,
          },
        });
      }

      return newMeeting;
    });

    // Fetch complete meeting with relations for response
    const fullMeeting = await db.meeting.findUnique({
      where: { id: meeting.id },
      include: {
        hostEmployee: { select: { id: true, name: true, employeeCode: true } },
        createdByUser: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true, email: true } },
        enquiry: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, title: true, value: true } },
        participants: true,
      },
    });

    return NextResponse.json({
      success: true,
      meeting: fullMeeting,
      isSimulated: calResult.isSimulated,
    });
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to schedule meeting' },
      { status: error?.message?.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
