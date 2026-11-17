import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

export async function GET() {
  try {
    const session = await requireAuth();
    // Allow viewing departments if user has hr.employees.view or crm.leads.view or is authenticated staff
    const departments = await db.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        head: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            companyEmail: true,
          },
        },
        teams: {
          select: {
            id: true,
            name: true,
            code: true,
            leader: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: { members: true },
            },
          },
        },
        _count: {
          select: {
            employees: true,
            teams: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      departments,
    });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'hr.employees.manage');

    const body = await req.json();
    const { name, code, description, headId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    const normalizedName = name.trim();
    const normalizedCode = code?.trim() ? code.trim().toUpperCase() : undefined;

    // Check duplicate name
    const existing = await db.department.findUnique({
      where: { name: normalizedName },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Department "${normalizedName}" already exists` },
        { status: 400 }
      );
    }

    const department = await db.department.create({
      data: {
        name: normalizedName,
        code: normalizedCode || null,
        description: description?.trim() || null,
        headId: headId || null,
      },
      include: {
        head: {
          select: { id: true, name: true, employeeCode: true },
        },
      },
    });

    await db.activityLog.create({
      data: {
        userId: session.userId,
        action: 'DEPARTMENT_CREATED',
        entityType: 'Department',
        entityId: department.id,
        metadata: JSON.stringify({ name: department.name, code: department.code }),
      },
    });

    return NextResponse.json({ success: true, department }, { status: 201 });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating department:', error);
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'hr.employees.manage');

    const body = await req.json();
    const { id, name, code, description, headId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const department = await db.department.update({
      where: { id },
      data: {
        name: name?.trim() ? name.trim() : undefined,
        code: code?.trim() ? code.trim().toUpperCase() : null,
        description: description !== undefined ? description?.trim() : undefined,
        headId: headId !== undefined ? headId || null : undefined,
      },
      include: {
        head: {
          select: { id: true, name: true, employeeCode: true },
        },
      },
    });

    return NextResponse.json({ success: true, department });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error updating department:', error);
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'hr.employees.manage');

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const dept = await db.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true, teams: true },
        },
      },
    });

    if (!dept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    if (dept._count.employees > 0) {
      return NextResponse.json(
        { error: `Cannot delete department with ${dept._count.employees} assigned employee(s). Reassign them first.` },
        { status: 400 }
      );
    }

    await db.department.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Department deleted successfully' });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}
