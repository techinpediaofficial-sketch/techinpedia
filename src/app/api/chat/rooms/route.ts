import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

// Fetch all chats for the current user
export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const chats = await db.teamChat.findMany({
      where: {
        participants: {
          some: { userId: session.userId }
        }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Fetch chats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Create a new direct or group chat
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { userIds, type = 'DIRECT', name } = body; // userIds is an array of IDs to chat with

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    const allParticipantIds = Array.from(new Set([session.userId, ...userIds]));

    if (type === 'DIRECT' && allParticipantIds.length === 2) {
      // Check if a direct chat already exists
      const existingChats = await db.teamChat.findMany({
        where: { type: 'DIRECT' },
        include: { participants: true }
      });
      
      const existingDirectChat = existingChats.find(chat => {
        const participantIds = chat.participants.map(p => p.userId);
        return participantIds.includes(allParticipantIds[0]) && participantIds.includes(allParticipantIds[1]) && participantIds.length === 2;
      });

      if (existingDirectChat) {
        return NextResponse.json({ chat: existingDirectChat });
      }
    }

    // Create new chat
    const newChat = await db.teamChat.create({
      data: {
        type,
        name: type === 'GROUP' ? name : null,
        participants: {
          create: allParticipantIds.map(id => ({ userId: id }))
        }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          }
        }
      }
    });

    return NextResponse.json({ chat: newChat });
  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
