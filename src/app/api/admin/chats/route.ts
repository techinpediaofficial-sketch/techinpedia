import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, requireAuth } from '@/lib/auth';
import { ChatStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const authUser = await requireAuth();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (statusParam && Object.values(ChatStatus).includes(statusParam as ChatStatus)) {
      where.status = statusParam as ChatStatus;
    }

    if (search && search.trim()) {
      where.OR = [
        { userName: { contains: search.trim() } },
        { userEmail: { contains: search.trim() } },
        { lastMessage: { contains: search.trim() } },
      ];
    }

    const sessions = await db.chatSession.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    console.error('Error fetching admin chats:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch chats.' }, { status: 500 });
  }
}
