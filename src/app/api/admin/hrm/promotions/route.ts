import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.promotions.view') && !hasPermission(session, 'hr.employees.view')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const promotions = await prisma.employeePromotion.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, employeeCode: true, avatar: true } },
        oldDesignation: { select: { title: true } },
        newDesignation: { select: { title: true } },
        recommendedBy: { select: { name: true } },
        approvedBy: { select: { name: true } }
      },
      orderBy: { effectiveDate: 'desc' },
    });

    return NextResponse.json(promotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.promotions.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.employeeId || !body.effectiveDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: body.employeeId }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const promotion = await prisma.employeePromotion.create({
      data: {
        employeeId: body.employeeId,
        oldDesignationId: employee.designationId,
        newDesignationId: body.newDesignationId || employee.designationId, // Could just be a salary hike
        oldSalary: employee.basicSalary,
        newSalary: body.newSalary ? parseFloat(body.newSalary) : employee.basicSalary,
        effectiveDate: new Date(body.effectiveDate),
        reason: body.reason,
        performanceScoreRef: body.performanceScoreRef ? parseFloat(body.performanceScoreRef) : null,
        recommendedById: body.recommendedById || session.employeeId || null,
        approvedById: body.status === 'APPROVED' ? (session.employeeId || null) : null,
        status: body.status || 'PENDING',
      },
      include: {
        employee: { select: { name: true } }
      }
    });

    // If auto-approved, trigger the effect
    if (promotion.status === 'APPROVED') {
      await prisma.$transaction(async (tx) => {
        // Update employee
        await tx.employee.update({
          where: { id: body.employeeId },
          data: {
            designationId: promotion.newDesignationId,
            basicSalary: promotion.newSalary,
            grossSalary: promotion.newSalary,
          }
        });

        // Add Career Timeline Event
        await tx.employeeCareerEvent.create({
          data: {
            employeeId: body.employeeId,
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
            details: `Approved promotion for ${employee.name}`,
          }
        });
      });
    }

    return NextResponse.json(promotion, { status: 201 });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 });
  }
}
