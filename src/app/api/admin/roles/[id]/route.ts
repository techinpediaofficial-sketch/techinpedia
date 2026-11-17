import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission, ALL_PERMISSIONS } from '@/lib/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'admin.roles.manage');

    const { id } = await params;
    const role = await db.appRole.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { users: true, employees: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        isSystem: role.isSystem,
        userCount: role._count.users,
        employeeCount: role._count.employees,
        permissions: role.permissions.map((p) => p.permission.code),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'admin.roles.manage');

    const { id } = await params;
    const body = await req.json();
    const { displayName, description, permissions } = body;

    const existingRole = await db.appRole.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Capture before state for audit trail
    const beforeState = {
      displayName: existingRole.displayName,
      description: existingRole.description,
      permissions: existingRole.permissions.map((p) => p.permission.code),
    };

    // Update basic fields
    await db.appRole.update({
      where: { id },
      data: {
        displayName: displayName ?? existingRole.displayName,
        description: description !== undefined ? description : existingRole.description,
      },
    });

    // If permissions array is provided, sync permission links
    if (Array.isArray(permissions)) {
      const requestedCodes = permissions as string[];

      // Upsert any missing permissions from ALL_PERMISSIONS into db.permission
      for (const code of requestedCodes) {
        const permDef = ALL_PERMISSIONS.find((p) => p.code === code);
        if (permDef) {
          await db.permission.upsert({
            where: { code: permDef.code },
            update: { name: permDef.name, category: permDef.category, description: permDef.description },
            create: { code: permDef.code, name: permDef.name, category: permDef.category, description: permDef.description },
          });
        }
      }

      // Find matching permission IDs
      const dbPermissions = await db.permission.findMany({
        where: { code: { in: requestedCodes } },
      });

      // Delete existing role permissions
      await db.appRolePermission.deleteMany({
        where: { roleId: id },
      });

      // Create new role permissions
      if (dbPermissions.length > 0) {
        await db.appRolePermission.createMany({
          data: dbPermissions.map((p) => ({
            roleId: id,
            permissionId: p.id,
          })),
        });
      }
    }

    // Fetch updated
    const updatedRole = await db.appRole.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    // Audit log
    await db.activityLog.create({
      data: {
        userId: session.userId,
        action: 'ROLE_UPDATED',
        entityType: 'AppRole',
        entityId: id,
        metadata: JSON.stringify({
          before: beforeState,
          after: {
            displayName: updatedRole?.displayName,
            description: updatedRole?.description,
            permissions: updatedRole?.permissions.map((p) => p.permission.code),
          },
        }),
      },
    });

    return NextResponse.json({
      success: true,
      role: {
        id: updatedRole?.id,
        name: updatedRole?.name,
        displayName: updatedRole?.displayName,
        description: updatedRole?.description,
        isSystem: updatedRole?.isSystem,
        permissions: updatedRole?.permissions.map((p) => p.permission.code),
      },
    });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'admin.roles.manage');

    const { id } = await params;
    const role = await db.appRole.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, employees: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete built-in system role' },
        { status: 400 }
      );
    }

    if (role._count.users > 0 || role._count.employees > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete role assigned to ${role._count.users} user(s) and ${role._count.employees} employee(s). Reassign them first.`,
        },
        { status: 400 }
      );
    }

    await db.appRole.delete({
      where: { id },
    });

    await db.activityLog.create({
      data: {
        userId: session.userId,
        action: 'ROLE_DELETED',
        entityType: 'AppRole',
        entityId: id,
        metadata: JSON.stringify({ name: role.name, displayName: role.displayName }),
      },
    });

    return NextResponse.json({ success: true, message: 'Role deleted successfully' });
  } catch (error: any) {
    if (error.message?.startsWith('Forbidden') || error.message?.startsWith('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
