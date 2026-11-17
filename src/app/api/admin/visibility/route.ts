import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET: Fetch visibility policy for a resource
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resourceType');
    const resourceId = searchParams.get('resourceId');

    if (!resourceType || !resourceId) {
      return NextResponse.json({ error: 'resourceType and resourceId are required' }, { status: 400 });
    }

    const policy = await db.resourceVisibility.findUnique({
      where: { resourceType_resourceId: { resourceType, resourceId } },
    });

    return NextResponse.json({ policy: policy || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Set or update visibility policy
export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const role = (session.companyRole || session.role || '').toUpperCase();
    const canManage = ['OWNER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(role);
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden: Only managers and above can set visibility' }, { status: 403 });
    }

    const body = await request.json();
    const { resourceType, resourceId, visibilityType, employeeIds, teamIds, departmentIds } = body;

    if (!resourceType || !resourceId || !visibilityType) {
      return NextResponse.json({ error: 'resourceType, resourceId, and visibilityType are required' }, { status: 400 });
    }

    const companyId = session.companyId || '';

    const policy = await db.resourceVisibility.upsert({
      where: { resourceType_resourceId: { resourceType, resourceId } },
      update: {
        visibilityType,
        employeeIds: employeeIds ? JSON.stringify(employeeIds) : null,
        teamIds: teamIds ? JSON.stringify(teamIds) : null,
        departmentIds: departmentIds ? JSON.stringify(departmentIds) : null,
        setByUserId: session.userId,
      },
      create: {
        companyId,
        resourceType,
        resourceId,
        visibilityType,
        employeeIds: employeeIds ? JSON.stringify(employeeIds) : null,
        teamIds: teamIds ? JSON.stringify(teamIds) : null,
        departmentIds: departmentIds ? JSON.stringify(departmentIds) : null,
        setByUserId: session.userId,
      },
    });

    return NextResponse.json({ success: true, policy });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE: Remove visibility restriction (revert to default role-based)
export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resourceType');
    const resourceId = searchParams.get('resourceId');

    const role = (session.companyRole || session.role || '').toUpperCase();
    if (!['OWNER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!resourceType || !resourceId) {
      return NextResponse.json({ error: 'resourceType and resourceId are required' }, { status: 400 });
    }

    await db.resourceVisibility.deleteMany({
      where: { resourceType, resourceId },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
