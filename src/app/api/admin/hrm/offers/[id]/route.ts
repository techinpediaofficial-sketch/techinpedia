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

    const offer = await prisma.jobOffer.findUnique({
      where: { id: params.id },
      include: {
        candidate: true,
        jobOpening: { select: { id: true, title: true } },
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
        manager: { select: { id: true, name: true } },
      }
    });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Error fetching offer:', error);
    return NextResponse.json({ error: 'Failed to fetch offer' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.recruitment.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const offer = await prisma.jobOffer.update({
      where: { id: params.id },
      data: {
        jobOpeningId: body.jobOpeningId,
        designationId: body.designationId,
        departmentId: body.departmentId,
        managerId: body.managerId,
        proposedJoiningDate: body.proposedJoiningDate ? new Date(body.proposedJoiningDate) : undefined,
        salary: body.salary ? parseFloat(body.salary) : undefined,
        ctc: body.ctc ? parseFloat(body.ctc) : null,
        probationMonths: body.probationMonths ? parseInt(body.probationMonths) : undefined,
        employmentType: body.employmentType,
        workLocation: body.workLocation,
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
        specialTerms: body.specialTerms,
        hrNotes: body.hrNotes,
        status: body.status,
      }
    });

    // Sync candidate status based on offer status
    if (offer.status === 'SENT') {
      await prisma.candidate.update({ where: { id: offer.candidateId }, data: { status: 'OFFER_SENT' } });
    } else if (offer.status === 'ACCEPTED') {
      await prisma.candidate.update({ where: { id: offer.candidateId }, data: { status: 'OFFER_ACCEPTED' } });
    } else if (offer.status === 'REJECTED') {
      await prisma.candidate.update({ where: { id: offer.candidateId }, data: { status: 'OFFER_REJECTED' } });
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 });
  }
}
