import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { notifyIndexNow } from '@/lib/indexnow';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search.trim()) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const projects = await db.projectRecord.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        tasks: { select: { id: true, status: true, priority: true } },
        milestones: { select: { id: true, title: true, isCompleted: true } },
        _count: { select: { tasks: true, milestones: true, timesheets: true } },
      },
    });

    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error('Fetch internal projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { name, customerId, budget, deadline, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required.' }, { status: 400 });
    }

    const code = `PRJ-${Date.now().toString().slice(-6)}`;

    const project = await db.projectRecord.create({
      data: {
        code,
        name: name.trim(),
        customerId: customerId || null,
        budget: budget ? parseFloat(budget) : 0,
        deadline: deadline ? new Date(deadline) : null,
        description: description || null,
        managerId: session.userId,
        managerName: session.email,
        status: 'ACTIVE',
        progress: 0,
      },
      include: {
        customer: true,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_PROJECT',
      entityType: 'ProjectRecord',
      entityId: project.id,
      metadata: { code, name: project.name },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error('Create internal project error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create project.' }, { status: 500 });
  }
}
