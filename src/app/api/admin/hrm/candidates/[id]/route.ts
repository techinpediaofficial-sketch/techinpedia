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

    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        appliedPosition: { select: { id: true, title: true, jobId: true, department: true } },
        recruiter: { select: { id: true, name: true, employeeCode: true, avatar: true } },
        referredBy: { select: { id: true, name: true } },
        interviews: {
          include: {
            interviewers: { include: { employee: { select: { id: true, name: true, avatar: true } } } },
            feedbacks: true,
          },
          orderBy: { date: 'asc' }
        },
        offers: true,
      }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json({ error: 'Failed to fetch candidate' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const candidate = await prisma.candidate.update({
      where: { id: params.id },
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        whatsappNumber: body.whatsappNumber,
        city: body.city,
        state: body.state,
        address: body.address,
        currentCompany: body.currentCompany,
        currentDesignation: body.currentDesignation,
        currentSalary: body.currentSalary ? parseFloat(body.currentSalary) : null,
        expectedSalary: body.expectedSalary ? parseFloat(body.expectedSalary) : null,
        totalExperience: body.totalExperience ? parseFloat(body.totalExperience) : null,
        relevantExperience: body.relevantExperience ? parseFloat(body.relevantExperience) : null,
        noticePeriod: body.noticePeriod ? parseInt(body.noticePeriod) : null,
        lastWorkingDate: body.lastWorkingDate ? new Date(body.lastWorkingDate) : null,
        skills: body.skills,
        qualification: body.qualification,
        source: body.source,
        appliedPositionId: body.appliedPositionId || null,
        recruiterId: body.recruiterId || null,
        status: body.status,
        rating: body.rating ? parseInt(body.rating) : undefined,
        resumeUrl: body.resumeUrl,
        portfolioUrl: body.portfolioUrl,
        linkedinUrl: body.linkedinUrl,
        githubUrl: body.githubUrl,
        notes: body.notes,
      }
    });

    // Create Audit Log
    try {
      await prisma.activityLog.create({
        data: {
          action: 'CANDIDATE_UPDATED',
          userId: session.id,
          entityType: 'CANDIDATE',
          entityId: candidate.id,
          details: `Updated candidate: ${candidate.fullName} to status ${candidate.status}`,
        }
      });
    } catch (e) {
      console.warn("Could not log activity:", e);
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.candidate.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Candidate deleted successfully.' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 });
  }
}
