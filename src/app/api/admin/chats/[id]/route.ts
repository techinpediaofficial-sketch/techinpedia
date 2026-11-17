import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { ChatStatus, MessageSender } from '@prisma/client';
import { sendChatMessageUserNotification } from '@/lib/email';
import { logActivity } from '@/lib/activity';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuth();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const session = await db.chatSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Chat session not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error('Error fetching chat session details:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch session.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuth();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, replyMessage } = body;

    const existing = await db.chatSession.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    let updatedSession = existing;

    // Send admin reply if provided
    if (replyMessage && replyMessage.trim()) {
      await db.chatMessage.create({
        data: {
          sessionId: id,
          sender: MessageSender.ADMIN,
          message: replyMessage.trim(),
        },
      });

      updatedSession = await db.chatSession.update({
        where: { id },
        data: {
          lastMessage: replyMessage.trim(),
          lastSender: MessageSender.ADMIN,
          status: status || existing.status,
          updatedAt: new Date(),
        },
      });

      // Send email via SMTP to user
      sendChatMessageUserNotification({
        sessionId: id,
        userName: existing.userName,
        userEmail: existing.userEmail,
        message: replyMessage.trim(),
      }).catch((err) => console.error('Silent SMTP Chat User notify error:', err));
    } else if (status && Object.values(ChatStatus).includes(status)) {
      updatedSession = await db.chatSession.update({
        where: { id },
        data: { status, updatedAt: new Date() },
      });
    }

    await logActivity({
      userId: authUser.userId,
      userEmail: authUser.email,
      action: replyMessage ? 'REPLIED_LIVE_CHAT' : 'UPDATE_CHAT_STATUS',
      entityType: 'ChatSession',
      entityId: id,
      metadata: { status: updatedSession.status },
    });

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error: any) {
    console.error('Error updating chat session:', error);
    return NextResponse.json({ error: error.message || 'Failed to update chat.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await requireAuth();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    await db.chatSession.delete({ where: { id } });

    await logActivity({
      userId: authUser.userId,
      userEmail: authUser.email,
      action: 'DELETE_CHAT_SESSION',
      entityType: 'ChatSession',
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete session.' }, { status: 500 });
  }
}
