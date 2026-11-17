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
    const status = searchParams.get('status');

    const where: any = {};
    if (candidateId) where.candidateId = candidateId;
    if (status) where.status = status;

    const offers = await prisma.jobOffer.findMany({
      where,
      include: {
        candidate: { select: { id: true, fullName: true, candidateId: true } },
        jobOpening: { select: { id: true, title: true } },
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        manager: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.candidateId || !body.proposedJoiningDate || !body.salary || !body.validUntil) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const offer = await prisma.jobOffer.create({
      data: {
        candidateId: body.candidateId,
        jobOpeningId: body.jobOpeningId || null,
        designationId: body.designationId || null,
        departmentId: body.departmentId || null,
        managerId: body.managerId || null,
        proposedJoiningDate: new Date(body.proposedJoiningDate),
        salary: parseFloat(body.salary),
        ctc: body.ctc ? parseFloat(body.ctc) : null,
        probationMonths: parseInt(body.probationMonths) || 3,
        employmentType: body.employmentType || 'FULL_TIME',
        workLocation: body.workLocation || 'OFFICE',
        validUntil: new Date(body.validUntil),
        specialTerms: body.specialTerms,
        hrNotes: body.hrNotes,
        status: body.status || 'DRAFT',
      }
    });

    // Update candidate status
    if (offer.status === 'SENT') {
      await prisma.candidate.update({ where: { id: body.candidateId }, data: { status: 'OFFER_SENT' } });
    }

    try {
      await prisma.activityLog.create({
        data: {
          action: 'OFFER_CREATED',
          userId: session.id,
          entityType: 'JOB_OFFER',
          entityId: offer.id,
          details: `Created offer for Candidate ID: ${body.candidateId}`,
        }
      });
    } catch (e) {
      console.warn("Could not log activity:", e);
    }

    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
  }
}
