import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Calculate start and end of this week (Monday to Sunday)
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diffToMonday));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const [
      todayCount,
      weekCount,
      completedCount,
      meetCount,
      pendingOutcomeCount,
      recentMeetings,
    ] = await Promise.all([
      db.meeting.count({
        where: {
          startTime: { gte: startOfToday, lte: endOfToday },
          status: { in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] },
        },
      }),
      db.meeting.count({
        where: {
          startTime: { gte: startOfWeek, lte: endOfWeek },
          status: { in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] },
        },
      }),
      db.meeting.count({
        where: { status: 'COMPLETED' },
      }),
      db.meeting.count({
        where: { meetingType: 'GOOGLE_MEET' },
      }),
      db.meeting.count({
        where: {
          endTime: { lte: now },
          status: 'SCHEDULED',
          outcome: null,
        },
      }),
      db.meeting.findMany({
        where: {
          startTime: { gte: startOfToday },
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
        include: {
          hostEmployee: { select: { name: true } },
          customer: { select: { name: true } },
          enquiry: { select: { name: true } },
        },
        orderBy: { startTime: 'asc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      summary: {
        todayCount,
        weekCount,
        completedCount,
        meetCount,
        pendingOutcomeCount,
      },
      recentMeetings,
    });
  } catch (error: any) {
    console.error('Error fetching meetings summary:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch summary' },
      { status: 500 }
    );
  }
}
