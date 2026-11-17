import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.rewards.view') && !hasPermission(session, 'hr.employees.view')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const type = searchParams.get('type'); // APPRECIATION, REWARD_POINTS, BONUS, PROMOTION_RECOMMENDATION
    
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (type) where.type = type;

    const rewards = await prisma.employeeReward.findMany({
      where,
      include: {
        employee: { select: { name: true, employeeCode: true, avatar: true } },
        givenBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rewards);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.rewards.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.employeeId || !body.title || !body.type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const reward = await prisma.employeeReward.create({
      data: {
        employeeId: body.employeeId,
        title: body.title,
        type: body.type, // APPRECIATION, REWARD_POINTS, BONUS, PROMOTION_RECOMMENDATION
        description: body.description,
        amount: body.amount ? parseFloat(body.amount) : null,
        points: body.points ? parseInt(body.points) : null,
        givenById: body.givenById || session.employeeId || null,
        date: body.date ? new Date(body.date) : new Date(),
        isPublic: body.isPublic ?? true,
        status: body.status || 'APPROVED', // PENDING, APPROVED
      },
      include: {
        employee: { select: { name: true } }
      }
    });

    // Create Activity and notification
    try {
      await prisma.activityLog.create({
        data: {
          action: 'REWARD_GIVEN',
          userId: session.id,
          entityType: 'EMPLOYEE_REWARD',
          entityId: reward.id,
          details: `Gave ${reward.type} to ${reward.employee?.name}`,
        }
      });
      // Here we could trigger a push notification to the employee
    } catch (e) {
      console.warn("Could not log activity:", e);
    }

    return NextResponse.json(reward, { status: 201 });
  } catch (error) {
    console.error('Error creating reward:', error);
    return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
  }
}
