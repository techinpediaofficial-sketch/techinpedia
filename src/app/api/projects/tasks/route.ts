import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { notifyIndexNow } from '@/lib/indexnow';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await db.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true, code: true } },
        milestone: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { title, projectId, milestoneId, description, priority, dueDate, estimatedHours, assignedToName } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and Project are required.' }, { status: 400 });
    }

    const task = await db.task.create({
      data: {
        title: title.trim(),
        projectId,
        milestoneId: milestoneId || null,
        description: description || null,
        priority: priority || 'MEDIUM',
        status: 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 0,
        assignedUserId: session.userId,
        assignedToName: assignedToName || session.email,
      },
      include: {
        project: true,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_TASK',
      entityType: 'Task',
      entityId: task.id,
      metadata: { title: task.title, project: task.project.name },
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create task.' }, { status: 500 });
  }
}
