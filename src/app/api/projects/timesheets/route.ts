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
    const employeeId = searchParams.get('employeeId');

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (employeeId) where.employeeId = employeeId;

    const timesheets = await db.timesheet.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        project: { select: { id: true, name: true, code: true } },
        task: { select: { id: true, title: true } },
      },
    });

    const totalHours = timesheets.reduce((acc, t) => acc + t.hours, 0);

    return NextResponse.json({
      success: true,
      timesheets,
      metrics: { totalHours },
    });
  } catch (error) {
    console.error('Fetch timesheets error:', error);
    return NextResponse.json({ error: 'Failed to fetch timesheets.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { projectId, taskId, hours, description, isBillable = true, date } = body;

    const parsedHours = parseFloat(hours);
    if (!projectId || !parsedHours || parsedHours <= 0) {
      return NextResponse.json({ error: 'Project and positive hours are required.' }, { status: 400 });
    }

    const timesheet = await db.timesheet.create({
      data: {
        projectId,
        taskId: taskId || null,
        hours: parsedHours,
        description: description || null,
        isBillable,
        date: date ? new Date(date) : new Date(),
        employeeId: session.userId,
        employeeName: session.email,
      },
    });

    // Increment actual hours on the task if linked
    if (taskId) {
      await db.task.update({
        where: { id: taskId },
        data: { actualHours: { increment: parsedHours } },
      });
    }

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'LOG_TIMESHEET',
      entityType: 'Timesheet',
      entityId: timesheet.id,
      metadata: { projectId, hours: parsedHours },
    });

    return NextResponse.json({ success: true, timesheet });
  } catch (error: any) {
    console.error('Log timesheet error:', error);
    return NextResponse.json({ error: error.message || 'Failed to log timesheet.' }, { status: 500 });
  }
}
