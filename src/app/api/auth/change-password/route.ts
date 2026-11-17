import { NextResponse } from 'next/server';
import { requireAuth, hashPassword, comparePasswords, generateToken, setAuthCookie } from '@/lib/auth';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/activity';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const isMatch = await comparePasswords(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect current password.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    // Re-issue token with updated mustChangePassword status
    const newToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: false,
    });
    await setAuthCookie(newToken);

    await logActivity({
      userId: user.id,
      userEmail: user.email,
      action: 'CHANGE_PASSWORD',
      entityType: 'User',
      entityId: user.id,
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Failed to change password.' }, { status: 500 });
  }
}
