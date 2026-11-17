import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';

// Fetch messages for a chat room
export async function GET(request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { chatId } = await params;

    // Verify user is part of chat or is admin
    const chat = await db.teamChat.findUnique({
      where: { id: chatId },
      include: { participants: true }
    });

    if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    const isParticipant = chat.participants.some(p => p.userId === session.userId);
    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

    if (!isParticipant && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await db.teamChatMessage.findMany({
      where: { chatId },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        reads: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark as read for this user
    const unreadMessages = messages.filter(m => !m.reads.some(r => r.userId === session.userId));
    if (unreadMessages.length > 0) {
      await db.teamChatMessageRead.createMany({
        data: unreadMessages.map(m => ({
          messageId: m.id,
          userId: session.userId,
        })),
        skipDuplicates: true
      });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Send a new message
export async function POST(request: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { chatId } = await params;
    const body = await request.json();
    const { content, sharedLeadId, sharedTaskId } = body;

    if (!content && !sharedLeadId && !sharedTaskId) {
      return NextResponse.json({ error: 'Message content is empty' }, { status: 400 });
    }

    // Verify participant
    const participant = await db.teamChatParticipant.findFirst({
      where: { chatId, userId: session.userId }
    });

    const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

    if (!participant && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newMessage = await db.teamChatMessage.create({
      data: {
        chatId,
        senderId: session.userId,
        content: content || '',
        sharedLeadId,
        sharedTaskId,
        reads: {
          create: [{ userId: session.userId }] // Auto read by sender
        }
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Update chat's updatedAt timestamp
    await db.teamChat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ message: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
