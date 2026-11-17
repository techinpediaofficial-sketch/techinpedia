import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiAuthError } from '@/lib/auth-errors';

export const dynamic = 'force-dynamic';

// POST: Add a reply to a staff task
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: taskId } = await params;
    const body = await request.json();

    const { message, authorName, authorRole = 'EMPLOYEE' } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Reply message is required.' }, { status: 400 });
    }

    const task = await db.staffTask.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    const reply = await db.staffTaskReply.create({
      data: {
        taskId,
        authorId: session.userId,
        authorName: authorName || session.name || session.email,
        authorRole,
        message: message.trim(),
      },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('POST staff task reply error:', error);
    return NextResponse.json({ error: 'Failed to add reply.' }, { status: 500 });
  }
}

// GET: Get all replies for a task
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: taskId } = await params;

    const replies = await db.staffTaskReply.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ replies });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: 'Failed to load replies.' }, { status: 500 });
  }
}
