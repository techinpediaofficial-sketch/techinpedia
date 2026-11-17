import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MessageSender } from '@prisma/client';
import { sendNewChatMessageAdminNotification, sendChatMessageUserNotification } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, message, sender } = body;

    if (!sessionId || !message || !message.trim()) {
      return NextResponse.json({ error: 'Session ID and message are required.' }, { status: 400 });
    }

    const session = await db.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Chat session not found.' }, { status: 404 });
    }

    const msgSender = sender === 'ADMIN' ? MessageSender.ADMIN : MessageSender.USER;

    // Save message to MySQL
    const chatMsg = await db.chatMessage.create({
      data: {
        sessionId,
        sender: msgSender,
        message: message.trim(),
      },
    });

    // Update session state
    await db.chatSession.update({
      where: { id: sessionId },
      data: {
        lastMessage: message.trim(),
        lastSender: msgSender,
        updatedAt: new Date(),
      },
    });

    // Trigger SMTP Email Notification asynchronously
    if (msgSender === MessageSender.USER) {
      sendNewChatMessageAdminNotification({
        sessionId,
        userName: session.userName,
        userEmail: session.userEmail,
        message: message.trim(),
      }).catch((err) => console.error('Silent SMTP Chat Admin notify error:', err));
    } else if (msgSender === MessageSender.ADMIN) {
      sendChatMessageUserNotification({
        sessionId,
        userName: session.userName,
        userEmail: session.userEmail,
        message: message.trim(),
      }).catch((err) => console.error('Silent SMTP Chat User notify error:', err));
    }

    return NextResponse.json({ success: true, message: chatMsg });
  } catch (error) {
    console.error('Error posting chat message:', error);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required.' }, { status: 400 });
    }

    const messages = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages.' }, { status: 500 });
  }
}
