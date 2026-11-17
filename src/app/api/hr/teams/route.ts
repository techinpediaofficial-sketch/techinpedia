import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');

    const where: any = {};
    if (departmentId) where.departmentId = departmentId;

    const teams = await db.team.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        leader: {
          select: { id: true, name: true, employeeCode: true, companyEmail: true },
        },
        members: {
          select: { id: true, name: true, employeeCode: true, designation: { select: { title: true } } },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json({ success: true, teams });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'hr.employees.manage');

    const body = await req.json();
    const { name, code, description, departmentId, leaderId } = body;

    if (!name?.trim() || !departmentId) {
      return NextResponse.json(
        { error: 'Team name and department are required' },
        { status: 400 }
      );
    }

    const normalizedCode = code?.trim() ? code.trim().toUpperCase() : null;

    const team = await db.team.create({
      data: {
        name: name.trim(),
        code: normalizedCode,
        description: description?.trim() || null,
        departmentId,
        leaderId: leaderId || null,
      },
      include: {
        department: true,
        leader: { select: { id: true, name: true, employeeCode: true } },
      },
    });

    // If leader is assigned, ensure that employee's team is also set to this team
    if (leaderId) {
      await db.employee.update({
        where: { id: leaderId },
        data: { teamId: team.id },
      });
    }

    await db.activityLog.create({
      data: {
        userId: session.userId,
        action: 'TEAM_CREATED',
        entityType: 'Team',
        entityId: team.id,
        metadata: JSON.stringify({ name: team.name, departmentId }),
      },
    });

    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'hr.employees.manage');

    const body = await req.json();
    const { id, name, code, description, departmentId, leaderId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const team = await db.team.update({
      where: { id },
      data: {
        name: name?.trim() ? name.trim() : undefined,
        code: code?.trim() ? code.trim().toUpperCase() : null,
        description: description !== undefined ? description?.trim() : undefined,
        departmentId: departmentId || undefined,
        leaderId: leaderId !== undefined ? leaderId || null : undefined,
      },
      include: {
        department: true,
        leader: { select: { id: true, name: true, employeeCode: true } },
      },
    });

    if (leaderId) {
      await db.employee.update({
        where: { id: leaderId },
        data: { teamId: team.id },
      });
    }

    return NextResponse.json({ success: true, team });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'hr.employees.manage');

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const team = await db.team.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team._count.members > 0) {
      return NextResponse.json(
        { error: `Cannot delete team with ${team._count.members} assigned members. Reassign members first.` },
        { status: 400 }
      );
    }

    await db.team.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Team deleted successfully' });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}
