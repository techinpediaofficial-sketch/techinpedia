import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.warnings.manage') && !hasPermission(session, 'hr.employees.view')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const severity = searchParams.get('severity');

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (severity) where.severity = severity;

    const warnings = await prisma.employeeWarning.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, employeeCode: true, avatar: true } },
        issuedBy: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(warnings);
  } catch (error) {
    console.error('Error fetching warnings:', error);
    return NextResponse.json({ error: 'Failed to fetch warnings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.warnings.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.employeeId || !body.title || !body.severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const warning = await prisma.employeeWarning.create({
      data: {
        employeeId: body.employeeId,
        title: body.title,
        severity: body.severity, // LOW, MEDIUM, HIGH, PIP_TRIGGER
        description: body.description,
        actionRequired: body.actionRequired,
        issuedById: body.issuedById || session.employeeId || null,
        date: body.date ? new Date(body.date) : new Date(),
        status: body.status || 'ACTIVE',
      },
      include: {
        employee: { select: { name: true } }
      }
    });

    // If it's a PIP Trigger, we could automatically create a PIP record
    if (body.severity === 'PIP_TRIGGER') {
      await prisma.employeePip.create({
        data: {
          employeeId: body.employeeId,
          startDate: new Date(),
          endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days default
          reason: body.description,
          goals: body.actionRequired || 'Improve performance immediately',
          status: 'ACTIVE',
          managerId: body.issuedById || session.employeeId || null
        }
      });
    }

    // Log Activity
    try {
      await prisma.activityLog.create({
        data: {
          action: 'WARNING_ISSUED',
          userId: session.id,
          entityType: 'EMPLOYEE_WARNING',
          entityId: warning.id,
          details: `Issued ${warning.severity} warning to ${warning.employee?.name}`,
        }
      });
    } catch (e) {
      console.warn("Could not log activity:", e);
    }

    return NextResponse.json(warning, { status: 201 });
  } catch (error) {
    console.error('Error creating warning:', error);
    return NextResponse.json({ error: 'Failed to create warning' }, { status: 500 });
  }
}
