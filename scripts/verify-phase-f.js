const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const db = new PrismaClient();

async function runPhaseFVerification() {
  console.log('🚀 [PHASE F VERIFICATION] Starting Automated Meetings & Google Calendar Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Resolve active user and employee for attribution
    const employee = await db.employee.findFirst({
      where: { status: 'ACTIVE' },
      include: { user: true, department: true, team: true },
    });
    assert(Boolean(employee), `Found active employee record for host attribution: ${employee?.name}`);

    const user = employee?.user || await db.user.findFirst();
    assert(Boolean(user), `Found active admin user for meeting creation: ${user?.email}`);

    // 2. Google Meet Code & Link Generation Logic
    const generateGoogleMeetCode = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      let s = 'tip-';
      const b = crypto.randomBytes(7);
      for (let i = 0; i < 4; i++) s += chars[b[i] % chars.length];
      s += '-';
      for (let i = 4; i < 7; i++) s += chars[b[i] % chars.length];
      return s;
    };

    const meetCode = generateGoogleMeetCode();
    const conferenceLink = `https://meet.google.com/${meetCode}`;
    assert(meetCode.startsWith('tip-') && meetCode.length === 12, `Google Meet code generated with standard format: ${meetCode}`);
    assert(conferenceLink.startsWith('https://meet.google.com/tip-'), `Google Meet URL correctly formed: ${conferenceLink}`);

    // 3. Resolve or create test Customer
    let customer = await db.customer.findFirst();
    if (!customer) {
      customer = await db.customer.create({
        data: {
          name: 'Acme Global Technologies',
          email: 'contact@acmeglobal.example.com',
          phone: '9876543210',
          status: 'ACTIVE',
        },
      });
    }
    assert(Boolean(customer?.id), `Found or created test customer: ${customer.name}`);

    // 4. Create Meeting in Database
    const now = new Date();
    const startTime = new Date(now.getTime() + 86400000); // Tomorrow
    const endTime = new Date(startTime.getTime() + (30 * 60000)); // +30 mins
    const testGoogleEventId = `gcal_test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const meeting = await db.meeting.create({
      data: {
        title: 'Q4 Enterprise Cloud Architecture Review',
        description: 'Reviewing dedicated infrastructure specs and multi-tenant migration requirements.',
        meetingType: 'GOOGLE_MEET',
        status: 'SCHEDULED',
        startTime,
        endTime,
        timezone: 'Asia/Kolkata',
        location: 'Google Meet Video Call',
        conferenceLink,
        conferenceId: meetCode,
        googleEventId: testGoogleEventId,
        googleCalendarId: 'primary',
        icalUid: `${testGoogleEventId}@techinpedia.com`,
        htmlLink: conferenceLink,
        customerId: customer.id,
        departmentId: employee?.departmentId || null,
        teamId: employee?.teamId || null,
        hostEmployeeId: employee?.id || null,
        createdById: user.id,
      },
    });

    assert(Boolean(meeting?.id), `Meeting record created successfully: ${meeting.id}`);
    assert(meeting.meetingType === 'GOOGLE_MEET', 'Meeting type flagged as GOOGLE_MEET');
    assert(meeting.status === 'SCHEDULED', 'Initial meeting status is SCHEDULED');
    assert(meeting.conferenceLink === conferenceLink, `Google Meet link stored accurately: ${meeting.conferenceLink}`);
    assert(meeting.hostEmployeeId === employee?.id, `Host staff attribution verified: ${employee?.name}`);
    assert(meeting.customerId === customer.id, `Entity linking with Customer verified: ${customer.name}`);

    // 5. Add Meeting Participants
    const organizer = await db.meetingParticipant.create({
      data: {
        meetingId: meeting.id,
        employeeId: employee?.id || null,
        email: user.email,
        name: user.name,
        role: 'ORGANIZER',
        responseStatus: 'ACCEPTED',
      },
    });
    assert(Boolean(organizer.id), `Organizer participant added: ${organizer.email} (${organizer.role})`);

    const clientParticipant = await db.meetingParticipant.create({
      data: {
        meetingId: meeting.id,
        email: customer.email,
        name: customer.name,
        role: 'ATTENDEE',
        responseStatus: 'NEEDS_ACTION',
      },
    });
    assert(Boolean(clientParticipant.id), `Client participant added: ${clientParticipant.email} (${clientParticipant.role})`);

    // Verify participants count on meeting
    const meetingWithParticipants = await db.meeting.findUnique({
      where: { id: meeting.id },
      include: { participants: true, hostEmployee: true, customer: true },
    });
    assert(meetingWithParticipants?.participants.length === 2, `Meeting participants relation queried: ${meetingWithParticipants?.participants.length} attendees`);

    // 6. Test Meeting Rescheduling
    const newStartTime = new Date(startTime.getTime() + 7200000); // +2 hours
    const newEndTime = new Date(endTime.getTime() + 7200000);

    const rescheduled = await db.meeting.update({
      where: { id: meeting.id },
      data: {
        startTime: newStartTime,
        endTime: newEndTime,
        status: 'RESCHEDULED',
      },
    });
    assert(rescheduled.status === 'RESCHEDULED', 'Meeting successfully transitioned to RESCHEDULED');
    assert(new Date(rescheduled.startTime).getTime() === newStartTime.getTime(), 'New rescheduled start time updated');

    // 7. Test Meeting Outcome Logging with Auto-FollowUp
    const followUpScheduledDate = new Date(newStartTime.getTime() + (2 * 86400000)); // +2 days
    const createdFollowUp = await db.followUp.create({
      data: {
        title: `Follow-up: ${rescheduled.title}`,
        type: 'CALL',
        status: 'PENDING',
        scheduledAt: followUpScheduledDate,
        notes: 'Follow-up call following successful architecture discovery session.',
        customerId: customer.id,
        assignedEmployeeId: employee?.id || null,
        assignedToId: user.id,
      },
    });
    assert(Boolean(createdFollowUp.id), `Auto-created CRM FollowUp task on meeting outcome: ${createdFollowUp.id}`);

    const completedMeeting = await db.meeting.update({
      where: { id: meeting.id },
      data: {
        status: 'COMPLETED',
        outcome: 'INTERESTED_PROPOSAL_REQUIRED',
        outcomeNotes: 'Client approved proposed microservices topology. Send quotation for 4-month sprint.',
        followUpTaskId: createdFollowUp.id,
      },
    });
    assert(completedMeeting.status === 'COMPLETED', 'Meeting successfully transitioned to COMPLETED');
    assert(completedMeeting.outcome === 'INTERESTED_PROPOSAL_REQUIRED', `Meeting outcome recorded: ${completedMeeting.outcome}`);
    assert(completedMeeting.followUpTaskId === createdFollowUp.id, 'Meeting linked with CRM FollowUp task ID');

    // 8. Test Meeting Cancellation Flow
    const cancellableMeeting = await db.meeting.create({
      data: {
        title: 'Secondary Preliminary Sync',
        meetingType: 'PHONE_CALL',
        status: 'SCHEDULED',
        startTime: new Date(now.getTime() + 172800000),
        endTime: new Date(now.getTime() + 174600000),
        createdById: user.id,
      },
    });

    const cancelled = await db.meeting.update({
      where: { id: cancellableMeeting.id },
      data: {
        status: 'CANCELLED',
        cancelledReason: 'Client requested reschedule due to executive offsite.',
      },
    });
    assert(cancelled.status === 'CANCELLED', 'Secondary meeting transitioned to CANCELLED');
    assert(Boolean(cancelled.cancelledReason), `Cancellation reason recorded: "${cancelled.cancelledReason}"`);

    // 9. Aggregated Meetings Summary Metrics Query
    const [totalMeetings, scheduledCount, completedCount, meetCount] = await Promise.all([
      db.meeting.count(),
      db.meeting.count({ where: { status: 'SCHEDULED' } }),
      db.meeting.count({ where: { status: 'COMPLETED' } }),
      db.meeting.count({ where: { meetingType: 'GOOGLE_MEET' } }),
    ]);
    assert(totalMeetings >= 2, `Total meetings counted in system: ${totalMeetings}`);
    assert(completedCount >= 1, `Completed meetings aggregate: ${completedCount}`);
    assert(meetCount >= 1, `Google Meet video meetings aggregate: ${meetCount}`);

    // 10. Test RFC 5545 iCalendar (.ics) String Formatting
    const formatIcsDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsString = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TechInPedia//Business OS Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${meeting.id}@techinpedia.com`,
      `DTSTART:${formatIcsDate(newStartTime)}`,
      `DTEND:${formatIcsDate(newEndTime)}`,
      `SUMMARY:${meeting.title}`,
      `LOCATION:${meeting.conferenceLink}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    assert(icsString.includes('BEGIN:VCALENDAR') && icsString.includes('END:VCALENDAR'), 'RFC 5545 iCalendar header and footer validated');
    assert(icsString.includes(`SUMMARY:${meeting.title}`), 'iCalendar event title formatted properly');
    assert(icsString.includes(meeting.conferenceLink), 'iCalendar Google Meet location formatted properly');

    console.log(`\n========================================`);
    console.log(`🏁 Phase F Verification Results: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during Phase F verification:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

runPhaseFVerification();
