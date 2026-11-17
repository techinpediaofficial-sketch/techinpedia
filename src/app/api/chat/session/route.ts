import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MessageSender } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userName, userEmail, userPhone } = body;

    if (!userName || !userName.trim() || !userEmail || !userEmail.trim()) {
      return NextResponse.json({ error: 'Name and email are required to start live chat.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Create session in database
    const session = await db.chatSession.create({
      data: {
        userName: userName.trim(),
        userEmail: userEmail.trim().toLowerCase(),
        userPhone: userPhone?.trim() || null,
        status: 'ACTIVE',
        lastMessage: 'Chat session initiated',
        lastSender: MessageSender.SYSTEM,
        messages: {
          create: [
            {
              sender: MessageSender.SYSTEM,
              message: `Welcome ${userName.trim()}! An engineering specialist will respond shortly. You can also receive replies directly in your email (${userEmail.trim()}).`,
            },
          ],
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error starting chat session:', error);
    return NextResponse.json({ error: 'Failed to initiate chat session.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required.' }, { status: 400 });
    }

    const session = await db.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return NextResponse.json({ error: 'Failed to fetch chat session.' }, { status: 500 });
  }
}
