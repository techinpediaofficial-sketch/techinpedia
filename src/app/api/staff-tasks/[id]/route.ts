import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiAuthError } from '@/lib/auth-errors';

export const dynamic = 'force-dynamic';

// GET: Get single staff task with full details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const task = await db.staffTask.findUnique({
      where: { id },
      include: {
        assignees: true,
        replies: { orderBy: { createdAt: 'asc' } },
        _count: { select: { replies: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: 'Failed to load task.' }, { status: 500 });
  }
}

// PATCH: Update task (status, priority, title, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await db.staffTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    const {
      title,
      description,
      priority,
      status,
      dueDate,
      completionNote,
      isRecurring,
      recurringTime,
      assignees,
    } = body;

    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (completionNote !== undefined) updateData.completionNote = completionNote?.trim() || null;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (recurringTime !== undefined) updateData.recurringTime = recurringTime || null;

    const task = await db.staffTask.update({
      where: { id },
      data: updateData,
    });

    // If assignees provided, replace them
    if (assignees !== undefined) {
      await db.staffTaskAssignee.deleteMany({ where: { taskId: id } });
      if (assignees.length > 0) {
        await db.staffTaskAssignee.createMany({
          data: assignees.map((a: any) => ({
            taskId: id,
            employeeId: a.employeeId || null,
            employeeName: a.employeeName,
            employeeCode: a.employeeCode || null,
          })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await db.staffTask.findUnique({
      where: { id },
      include: {
        assignees: true,
        replies: { orderBy: { createdAt: 'asc' } },
        _count: { select: { replies: true } },
      },
    });

    return NextResponse.json({ task: updated });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('PATCH staff task error:', error);
    return NextResponse.json({ error: 'Failed to update task.' }, { status: 500 });
  }
}

// DELETE: Delete task (admin password verified in frontend, API trusts session auth)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Admin password verification - check against a fixed admin password via env or direct check
    const { adminPassword } = body;
    if (!adminPassword || adminPassword !== (process.env.ADMIN_DELETE_PASSWORD || 'TechInPedia@2026')) {
      return NextResponse.json({ error: 'Invalid admin password.' }, { status: 403 });
    }

    const existing = await db.staffTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    await db.staffTask.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('DELETE staff task error:', error);
    return NextResponse.json({ error: 'Failed to delete task.' }, { status: 500 });
  }
}
