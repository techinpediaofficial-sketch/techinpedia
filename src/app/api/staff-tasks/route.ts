import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiAuthError } from '@/lib/auth-errors';

export const dynamic = 'force-dynamic';

// GET: List all staff tasks
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const employeeId = searchParams.get('employeeId') || '';
    const isRecurring = searchParams.get('isRecurring');

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (isRecurring !== null) where.isRecurring = isRecurring === 'true';

    // If filtering by employee
    if (employeeId) {
      where.assignees = { some: { employeeId } };
    }

    const tasks = await db.staffTask.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        assignees: true,
        replies: { orderBy: { createdAt: 'asc' }, take: 1 },
        _count: { select: { replies: true } },
      },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('GET staff tasks error:', error);
    return NextResponse.json({ error: 'Failed to load tasks.' }, { status: 500 });
  }
}

// POST: Create a new staff task
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const {
      title,
      description,
      priority = 'MEDIUM',
      status = 'TODO',
      dueDate,
      isRecurring = false,
      recurringTime,
      assignees = [], // [{ employeeId, employeeName, employeeCode }]
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Task title is required.' }, { status: 400 });
    }

    const task = await db.staffTask.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        isRecurring,
        recurringTime: isRecurring ? (recurringTime || '09:00') : null,
        createdByUserId: session.userId,
        assignees: assignees.length > 0 ? {
          create: assignees.map((a: any) => ({
            employeeId: a.employeeId || null,
            employeeName: a.employeeName,
            employeeCode: a.employeeCode || null,
          }))
        } : undefined,
      },
      include: {
        assignees: true,
        _count: { select: { replies: true } },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('POST staff task error:', error);
    return NextResponse.json({ error: 'Failed to create task.' }, { status: 500 });
  }
}
