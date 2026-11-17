import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { Role } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole([Role.SUPER_ADMIN]);
    const { id } = await params;
    const body = await request.json();
    const { name, email, password, role, status, resetMustChangePassword } = body;

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (role !== undefined && Object.values(Role).includes(role)) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (resetMustChangePassword) updateData.mustChangePassword = true;

    if (password && password.length >= 8) {
      updateData.password = await hashPassword(password);
      updateData.mustChangePassword = true;
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        mustChangePassword: true,
        updatedAt: true,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: id,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole([Role.SUPER_ADMIN]);
    const { id } = await params;

    if (session.userId === id) {
      return NextResponse.json({ error: 'You cannot delete your own logged-in account.' }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (targetUser?.role === Role.SUPER_ADMIN) {
      const superAdminCount = await db.user.count({ where: { role: Role.SUPER_ADMIN } });
      if (superAdminCount <= 1) {
        return NextResponse.json({ error: 'Cannot delete the sole Super Admin account.' }, { status: 400 });
      }
    }

    await db.user.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_USER',
      entityType: 'User',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'User deleted.' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}
