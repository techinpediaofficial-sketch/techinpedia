import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    
    // Check if the user is actually an interviewer for this interview, or has HR permissions
    const hasHRManage = hasPermission(session, 'hr.recruitment.manage');
    
    // Find the interviewer record for the current user
    const interviewer = await prisma.interviewInterviewer.findFirst({
      where: {
        interviewId: params.id,
        employeeId: session.employeeId || 'NO_EMPLOYEE_ID'
      }
    });

    if (!hasHRManage && !interviewer) {
      return NextResponse.json({ error: 'You are not assigned as an interviewer for this round.' }, { status: 403 });
    }

    const body = await request.json();
    
    // We only allow one feedback per interviewer per interview
    const existingFeedback = await prisma.interviewFeedback.findFirst({
      where: {
        interviewId: params.id,
        interviewerId: body.interviewerId || session.employeeId,
      }
    });

    if (existingFeedback && !hasHRManage) {
      return NextResponse.json({ error: 'You have already submitted feedback for this interview.' }, { status: 400 });
    }

    const data = {
      interviewId: params.id,
      interviewerId: body.interviewerId || session.employeeId,
      communication: parseInt(body.communication) || 0,
      technicalKnowledge: parseInt(body.technicalKnowledge) || 0,
      problemSolving: parseInt(body.problemSolving) || 0,
      relevantExperience: parseInt(body.relevantExperience) || 0,
      confidence: parseInt(body.confidence) || 0,
      roleUnderstanding: parseInt(body.roleUnderstanding) || 0,
      cultureFit: parseInt(body.cultureFit) || 0,
      leadership: parseInt(body.leadership) || 0,
      teamwork: parseInt(body.teamwork) || 0,
      overallSuitability: parseInt(body.overallSuitability) || 0,
      strengths: body.strengths,
      weaknesses: body.weaknesses,
      technicalNotes: body.technicalNotes,
      behaviorNotes: body.behaviorNotes,
      concerns: body.concerns,
      salaryRecommendation: body.salaryRecommendation ? parseFloat(body.salaryRecommendation) : null,
      recommendation: body.recommendation || 'HOLD',
    };

    let feedback;
    if (existingFeedback) {
      feedback = await prisma.interviewFeedback.update({
        where: { id: existingFeedback.id },
        data
      });
    } else {
      feedback = await prisma.interviewFeedback.create({ data });
    }

    // Auto-complete interview if all interviewers have submitted feedback (optional logic, skipping for now)
    
    return NextResponse.json(feedback, { status: existingFeedback ? 200 : 201 });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
