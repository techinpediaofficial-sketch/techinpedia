import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage') && !hasPermission(session, 'hr.employees.view')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: params.id },
      include: {
        candidate: { select: { id: true, fullName: true, candidateId: true, email: true, phone: true } },
        jobOpening: { select: { id: true, title: true } },
        coordinator: { select: { id: true, name: true } },
        interviewers: { include: { employee: { select: { id: true, name: true, avatar: true } } } },
        feedbacks: { include: { interviewer: { select: { id: true, name: true, avatar: true } } } },
      }
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json({ error: 'Failed to fetch interview' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const interview = await prisma.interview.update({
      where: { id: params.id },
      data: {
        roundNumber: body.roundNumber ? parseInt(body.roundNumber) : undefined,
        roundName: body.roundName,
        type: body.type,
        date: body.date ? new Date(body.date) : undefined,
        startTime: body.startTime,
        expectedDuration: body.expectedDuration ? parseInt(body.expectedDuration) : undefined,
        mode: body.mode,
        location: body.location,
        meetingLink: body.meetingLink,
        coordinatorId: body.coordinatorId,
        reminder: body.reminder,
        instructions: body.instructions,
        notes: body.notes,
        status: body.status,
      }
    });

    // Handle interviewer changes if provided
    if (body.interviewers && Array.isArray(body.interviewers)) {
      // Delete existing
      await prisma.interviewInterviewer.deleteMany({
        where: { interviewId: params.id }
      });
      // Add new
      if (body.interviewers.length > 0) {
        await prisma.interviewInterviewer.createMany({
          data: body.interviewers.map((empId: string) => ({
            interviewId: params.id,
            employeeId: empId
          }))
        });
      }
    }

    // Update candidate status based on interview status
    if (body.status === 'IN_PROGRESS') {
      await prisma.candidate.update({ where: { id: interview.candidateId }, data: { status: 'INTERVIEWING' } });
    } else if (body.status === 'NO_SHOW') {
      await prisma.candidate.update({ where: { id: interview.candidateId }, data: { status: 'NO_SHOW' } });
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Error updating interview:', error);
    return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.interview.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Interview deleted successfully.' });
  } catch (error) {
    console.error('Error deleting interview:', error);
    return NextResponse.json({ error: 'Failed to delete interview' }, { status: 500 });
  }
}
