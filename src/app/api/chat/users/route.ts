// @ts-nocheck
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all users with their active sessions
    const users = await db.user.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        sessions: {
          orderBy: { lastActiveAt: 'desc' },
          take: 1,
          select: {
            status: true,
            lastActiveAt: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      onlineStatus: u.sessions[0]?.status || 'OFFLINE',
      lastActiveAt: u.sessions[0]?.lastActiveAt || null,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Fetch chat users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
