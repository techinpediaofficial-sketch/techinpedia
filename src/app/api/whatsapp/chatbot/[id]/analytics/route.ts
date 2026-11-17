import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const bot = await db.whatsappChatbot.findUnique({ where: { id } });
    if (!bot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.companyId && bot.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const totalSessions = await db.chatbotSession.count({ where: { botId: id } });
    const completedSessions = await db.chatbotSession.count({ where: { botId: id, status: 'COMPLETED' } });
    const handedOffSessions = await db.chatbotSession.count({ where: { botId: id, status: 'HANDED_OFF' } });
    const waitingSessions = await db.chatbotSession.count({ where: { botId: id, status: 'WAITING_FOR_USER' } });
    const failedSessions = await db.chatbotSession.count({ where: { botId: id, status: 'FAILED' } });

    // Node exit breakdown
    const exitNodes = await db.chatbotSession.groupBy({
      by: ['currentNodeId'],
      where: { botId: id, status: { in: ['COMPLETED', 'HANDED_OFF'] } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    const handoffRate = totalSessions > 0 ? Math.round((handedOffSessions / totalSessions) * 100) : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        totalSessions,
        completedSessions,
        handedOffSessions,
        waitingSessions,
        failedSessions,
        completionRate,
        handoffRate,
        topExitNodes: exitNodes.map(n => ({
          nodeId: n.currentNodeId,
          count: n._count.id,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching chatbot analytics:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
