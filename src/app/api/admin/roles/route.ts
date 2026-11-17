import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission, ALL_PERMISSIONS } from '@/lib/permissions';
import { ensureSystemRoles } from '@/lib/rbac/seedRoles';

export async function GET() {
  try {
    const session = await requireAuth();
    requirePermission(session, 'admin.roles.manage');

    // Ensure all system roles and permissions are synced in DB
    const dbPermCount = await db.permission.count();
    if (dbPermCount < ALL_PERMISSIONS.length) {
      await ensureSystemRoles();
    }

    const roles = await db.appRole.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
            employees: true,
          },
        },
      },
    });

    const formattedRoles = roles.map((r) => ({
      id: r.id,
      name: r.name,
      displayName: r.displayName,
      description: r.description,
      isSystem: r.isSystem,
      userCount: r._count.users,
      employeeCount: r._count.employees,
      permissions: r.permissions.map((p) => p.permission.code),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      roles: formattedRoles,
      allPermissions: ALL_PERMISSIONS,
    });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'admin.roles.manage');

    const body = await req.json();
    const { name, displayName, description, permissions = [] } = body;

    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Role name and display name are required' },
        { status: 400 }
      );
    }

    const normalizedName = name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    // Check duplicate
    const existing = await db.appRole.findUnique({
      where: { name: normalizedName },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Role with name "${normalizedName}" already exists` },
        { status: 400 }
      );
    }

    // Get permissions from DB
    const dbPermissions = await db.permission.findMany({
      where: { code: { in: permissions } },
    });

    const newRole = await db.appRole.create({
      data: {
        name: normalizedName,
        displayName,
        description,
        isSystem: false,
        permissions: {
          create: dbPermissions.map((p) => ({
            permissionId: p.id,
          })),
        },
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    // Record activity
    await db.activityLog.create({
      data: {
        userId: session.userId,
        action: 'ROLE_CREATED',
        entityType: 'AppRole',
        entityId: newRole.id,
        metadata: JSON.stringify({ name: normalizedName, displayName, permissionsCount: permissions.length }),
      },
    });

    return NextResponse.json({
      success: true,
      role: {
        id: newRole.id,
        name: newRole.name,
        displayName: newRole.displayName,
        description: newRole.description,
        isSystem: newRole.isSystem,
        permissions: newRole.permissions.map((p) => p.permission.code),
      },
    }, { status: 201 });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
