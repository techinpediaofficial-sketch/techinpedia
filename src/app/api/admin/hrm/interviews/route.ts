import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage') && !hasPermission(session, 'hr.employees.view')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const jobOpeningId = searchParams.get('jobOpeningId');
    const status = searchParams.get('status');

    const where: any = {};
    if (candidateId) where.candidateId = candidateId;
    if (jobOpeningId) where.jobOpeningId = jobOpeningId;
    if (status) where.status = status;

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        candidate: { select: { id: true, fullName: true, candidateId: true } },
        jobOpening: { select: { id: true, title: true } },
        coordinator: { select: { id: true, name: true } },
        interviewers: { include: { employee: { select: { id: true, name: true, avatar: true } } } },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(interviews);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.candidateId || !body.date || !body.startTime || !body.roundName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const interviewId = `INT-${Date.now().toString().slice(-6)}`;

    // Handle array of interviewer employee IDs
    const interviewerIds = body.interviewers || []; // array of employee IDs
    
    const interview = await prisma.interview.create({
      data: {
        interviewId,
        candidateId: body.candidateId,
        jobOpeningId: body.jobOpeningId || null,
        roundNumber: parseInt(body.roundNumber) || 1,
        roundName: body.roundName,
        type: body.type || 'TECHNICAL',
        date: new Date(body.date),
        startTime: body.startTime,
        expectedDuration: parseInt(body.expectedDuration) || 60,
        mode: body.mode || 'GOOGLE_MEET',
        location: body.location,
        meetingLink: body.meetingLink,
        coordinatorId: body.coordinatorId || session.employeeId || null,
        reminder: body.reminder ?? true,
        instructions: body.instructions,
        notes: body.notes,
        status: 'SCHEDULED',
        interviewers: {
          create: interviewerIds.map((empId: string) => ({
            employeeId: empId
          }))
        }
      },
      include: {
        candidate: { select: { fullName: true } }
      }
    });

    // Update candidate status to INTERVIEW_SCHEDULED if it's currently earlier in the pipeline
    await prisma.candidate.update({
      where: { id: body.candidateId },
      data: { status: 'INTERVIEW_SCHEDULED' }
    });

    try {
      await prisma.activityLog.create({
        data: {
          action: 'INTERVIEW_SCHEDULED',
          userId: session.id,
          entityType: 'INTERVIEW',
          entityId: interview.id,
          details: `Scheduled ${interview.roundName} for ${interview.candidate?.fullName || 'Candidate'}`,
        }
      });
    } catch (e) {
      console.warn("Could not log activity:", e);
    }

    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    return NextResponse.json({ error: 'Failed to schedule interview' }, { status: 500 });
  }
}
