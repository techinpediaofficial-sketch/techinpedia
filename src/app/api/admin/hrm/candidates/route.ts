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
    const jobOpeningId = searchParams.get('jobOpeningId');
    const search = searchParams.get('search');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (jobOpeningId) where.appliedPositionId = jobOpeningId;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { candidateId: { contains: search } }
      ];
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: {
          appliedPosition: { select: { id: true, title: true, jobId: true } },
          recruiter: { select: { id: true, name: true, avatar: true } },
          _count: { select: { interviews: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.candidate.count({ where })
    ]);

    return NextResponse.json({
      candidates,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.fullName || !body.email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Auto generate Candidate ID
    const candidateId = `CND-${Date.now().toString().slice(-6)}`;

    const candidate = await prisma.candidate.create({
      data: {
        candidateId,
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        whatsappNumber: body.whatsappNumber,
        city: body.city,
        state: body.state,
        currentCompany: body.currentCompany,
        currentDesignation: body.currentDesignation,
        currentSalary: body.currentSalary ? parseFloat(body.currentSalary) : null,
        expectedSalary: body.expectedSalary ? parseFloat(body.expectedSalary) : null,
        totalExperience: body.totalExperience ? parseFloat(body.totalExperience) : null,
        relevantExperience: body.relevantExperience ? parseFloat(body.relevantExperience) : null,
        noticePeriod: body.noticePeriod ? parseInt(body.noticePeriod) : null,
        skills: body.skills,
        qualification: body.qualification,
        source: body.source || 'Manual',
        appliedPositionId: body.appliedPositionId || null,
        recruiterId: body.recruiterId || session.employeeId || null,
        status: body.status || 'APPLIED',
        resumeUrl: body.resumeUrl,
        portfolioUrl: body.portfolioUrl,
        linkedinUrl: body.linkedinUrl,
        notes: body.notes,
      }
    });

    // Create Audit Log
    try {
      await prisma.activityLog.create({
        data: {
          action: 'CANDIDATE_ADDED',
          userId: session.id,
          entityType: 'CANDIDATE',
          entityId: candidate.id,
          details: `Added candidate: ${candidate.fullName} for position ${body.appliedPositionId || 'General'}`,
        }
      });
    } catch (e) {
      console.warn("Could not log activity:", e);
    }

    return NextResponse.json(candidate, { status: 201 });
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }
}
