import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.warnings.manage') && !hasPermission(session, 'hr.employees.view')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const warning = await prisma.employeeWarning.findUnique({
      where: { id: params.id },
      include: {
        employee: { select: { id: true, name: true, employeeCode: true, department: true } },
        issuedBy: { select: { name: true } },
      }
    });

    if (!warning) {
      return NextResponse.json({ error: 'Warning not found' }, { status: 404 });
    }

    return NextResponse.json(warning);
  } catch (error) {
    console.error('Error fetching warning:', error);
    return NextResponse.json({ error: 'Failed to fetch warning' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.warnings.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const warning = await prisma.employeeWarning.update({
      where: { id: params.id },
      data: {
        title: body.title,
        severity: body.severity,
        description: body.description,
        actionRequired: body.actionRequired,
        status: body.status, // ACTIVE, RESOLVED, ACKNOWLEDGED
      }
    });

    return NextResponse.json(warning);
  } catch (error) {
    console.error('Error updating warning:', error);
    return NextResponse.json({ error: 'Failed to update warning' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.warnings.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.employeeWarning.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Warning deleted successfully.' });
  } catch (error) {
    console.error('Error deleting warning:', error);
    return NextResponse.json({ error: 'Failed to delete warning' }, { status: 500 });
  }
}
