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
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { jobId: { contains: search } }
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.jobOpening.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, title: true } },
          hiringManager: { select: { id: true, name: true } },
          recruiter: { select: { id: true, name: true } },
          _count: {
            select: { candidates: true, interviews: true, offers: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.jobOpening.count({ where })
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch job openings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    // Basic Validation
    if (!body.title) {
      return NextResponse.json({ error: 'Job title is required' }, { status: 400 });
    }

    // Auto generate Job ID if not provided
    const jobId = body.jobId || `JOB-${Date.now().toString().slice(-6)}`;

    const job = await prisma.jobOpening.create({
      data: {
        jobId,
        title: body.title,
        departmentId: body.departmentId || null,
        designationId: body.designationId || null,
        vacancies: parseInt(body.vacancies) || 1,
        employmentType: body.employmentType || 'FULL_TIME',
        workMode: body.workMode || 'OFFICE',
        location: body.location,
        minExperience: body.minExperience ? parseFloat(body.minExperience) : null,
        maxExperience: body.maxExperience ? parseFloat(body.maxExperience) : null,
        requiredSkills: body.requiredSkills,
        preferredSkills: body.preferredSkills,
        minQualification: body.minQualification,
        salaryMin: body.salaryMin ? parseFloat(body.salaryMin) : null,
        salaryMax: body.salaryMax ? parseFloat(body.salaryMax) : null,
        currency: body.currency || 'INR',
        hiringManagerId: body.hiringManagerId || null,
        recruiterId: body.recruiterId || null,
        description: body.description || '',
        responsibilities: body.responsibilities,
        requirements: body.requirements,
        benefits: body.benefits,
        closingDate: body.closingDate ? new Date(body.closingDate) : null,
        priority: body.priority || 'MEDIUM',
        internalNotes: body.internalNotes,
        status: body.status || 'OPEN',
      }
    });

    // Create Audit Log
    try {
      await prisma.activityLog.create({
        data: {
          action: 'JOB_CREATED',
          userId: session.userId || session.id,
          entityType: 'JOB_OPENING',
          entityId: job.id,
          metadata: JSON.stringify({ details: `Created job opening: ${job.title} (${job.jobId})` }),
        }
      });
    } catch (e) {
      console.warn("Could not log activity:", e);
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job opening' }, { status: 500 });
  }
}
