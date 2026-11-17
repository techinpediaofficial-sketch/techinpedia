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

    const job = await prisma.jobOpening.findUnique({
      where: { id: params.id },
      include: {
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        hiringManager: { select: { id: true, name: true, employeeCode: true, avatar: true } },
        recruiter: { select: { id: true, name: true, employeeCode: true, avatar: true } },
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job opening not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const job = await prisma.jobOpening.update({
      where: { id: params.id },
      data: {
        title: body.title,
        departmentId: body.departmentId || null,
        designationId: body.designationId || null,
        vacancies: parseInt(body.vacancies) || undefined,
        employmentType: body.employmentType,
        workMode: body.workMode,
        location: body.location,
        minExperience: body.minExperience ? parseFloat(body.minExperience) : null,
        maxExperience: body.maxExperience ? parseFloat(body.maxExperience) : null,
        requiredSkills: body.requiredSkills,
        preferredSkills: body.preferredSkills,
        minQualification: body.minQualification,
        salaryMin: body.salaryMin ? parseFloat(body.salaryMin) : null,
        salaryMax: body.salaryMax ? parseFloat(body.salaryMax) : null,
        currency: body.currency,
        hiringManagerId: body.hiringManagerId || null,
        recruiterId: body.recruiterId || null,
        description: body.description,
        responsibilities: body.responsibilities,
        requirements: body.requirements,
        benefits: body.benefits,
        closingDate: body.closingDate ? new Date(body.closingDate) : null,
        priority: body.priority,
        internalNotes: body.internalNotes,
        status: body.status,
      }
    });

    // Create Audit Log
    try {
      await prisma.activityLog.create({
        data: {
          action: 'JOB_UPDATED',
          userId: session.id,
          entityType: 'JOB_OPENING',
          entityId: job.id,
          details: `Updated job opening: ${job.title} (${job.jobId})`,
        }
      });
    } catch (e) {
      console.warn("Could not log activity:", e);
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Instead of hard delete, maybe just change status to CANCELLED or check if it has candidates.
    // For now, allow delete if no candidates are linked, otherwise error or archive.
    const job = await prisma.jobOpening.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { candidates: true }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job opening not found' }, { status: 404 });
    }

    if (job._count.candidates > 0) {
      // Soft delete / cancel
      const updated = await prisma.jobOpening.update({
        where: { id: params.id },
        data: { status: 'CANCELLED' }
      });
      return NextResponse.json({ message: 'Job has candidates, marked as Cancelled.', job: updated });
    } else {
      // Hard delete
      await prisma.jobOpening.delete({
        where: { id: params.id }
      });
      return NextResponse.json({ message: 'Job deleted successfully.' });
    }
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
