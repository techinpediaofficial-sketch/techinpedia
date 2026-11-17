import { NextResponse } from 'next/server';
import { clearAuthCookie, getAuthSession } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { db } from '@/lib/db';

export async function POST() {
  const session = await getAuthSession();
  if (session) {
    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: session.userId,
    });

    const activeSession = await db.employeeSession.findFirst({
      where: { userId: session.userId, status: { in: ['ONLINE', 'IDLE'] } },
      orderBy: { loginAt: 'desc' },
    });

    if (activeSession) {
      await db.employeeSession.update({
        where: { id: activeSession.id },
        data: { logoutAt: new Date(), status: 'OFFLINE' },
      });
    }
  }
  await clearAuthCookie();
  return NextResponse.json({ success: true, message: 'Logged out successfully.' });
}
