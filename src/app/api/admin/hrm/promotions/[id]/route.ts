import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.promotions.view') && !hasPermission(session, 'hr.employees.view')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const promotion = await prisma.employeePromotion.findUnique({
      where: { id: params.id },
      include: {
        employee: { select: { id: true, name: true, employeeCode: true, department: true } },
        oldDesignation: { select: { title: true } },
        newDesignation: { select: { title: true } },
        recommendedBy: { select: { name: true } },
        approvedBy: { select: { name: true } }
      }
    });

    if (!promotion) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Error fetching promotion:', error);
    return NextResponse.json({ error: 'Failed to fetch promotion' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.promotions.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const existingPromo = await prisma.employeePromotion.findUnique({
      where: { id: params.id },
      include: { employee: true }
    });

    if (!existingPromo) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }

    if (existingPromo.status === 'APPROVED') {
      return NextResponse.json({ error: 'Cannot edit an already approved promotion' }, { status: 400 });
    }

    // Determine if it's being approved right now
    const isApproving = body.status === 'APPROVED';

    const promotion = await prisma.employeePromotion.update({
      where: { id: params.id },
      data: {
        newDesignationId: body.newDesignationId !== undefined ? body.newDesignationId : existingPromo.newDesignationId,
        newSalary: body.newSalary ? parseFloat(body.newSalary) : existingPromo.newSalary,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : existingPromo.effectiveDate,
        reason: body.reason,
        status: body.status,
        approvedById: isApproving ? (session.employeeId || null) : null,
      }
    });

    // If auto-approved, trigger the effect
    if (isApproving) {
      await prisma.$transaction(async (tx) => {
        // Update employee
        await tx.employee.update({
          where: { id: existingPromo.employeeId },
          data: {
            designationId: promotion.newDesignationId,
            basicSalary: promotion.newSalary,
            grossSalary: promotion.newSalary,
          }
        });

        // Add Career Timeline Event
        await tx.employeeCareerEvent.create({
          data: {
            employeeId: existingPromo.employeeId,
            type: 'PROMOTION',
            title: 'Promoted',
            description: promotion.reason || 'Performance-based promotion/increment',
            date: promotion.effectiveDate
          }
        });

        // Log Activity
        await tx.activityLog.create({
          data: {
            action: 'PROMOTION_APPROVED',
            userId: session.id,
            entityType: 'PROMOTION',
            entityId: promotion.id,
            details: `Approved promotion for ${existingPromo.employee.name}`,
          }
        });
      });
    }

    return NextResponse.json(promotion);
  } catch (error) {
    console.error('Error updating promotion:', error);
    return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 });
  }
}
