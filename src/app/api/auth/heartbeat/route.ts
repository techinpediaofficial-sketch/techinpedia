import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status = 'ONLINE' } = await request.json().catch(() => ({}));

    // Find the most recent active session if employeeSession model exists
    if ((db as any).employeeSession) {
      const activeSession = await (db as any).employeeSession.findFirst({
        where: { userId: session.userId },
        orderBy: { loginAt: 'desc' },
      });

      if (activeSession) {
        await (db as any).employeeSession.update({
          where: { id: activeSession.id },
          data: { 
            lastActiveAt: new Date(),
            status: status, // Can be ONLINE, IDLE
            // Clear logoutAt just in case it was marked offline erroneously
            logoutAt: null 
          },
        });
      } else {
        // If no session exists but user is authenticated, create one (rare edge case)
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown';
        const userAgent = request.headers.get('user-agent') || 'Unknown';
        
        await (db as any).employeeSession.create({
          data: {
            userId: session.userId,
            ipAddress: String(ipAddress).substring(0, 45),
            userAgent: String(userAgent),
            status: status,
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
