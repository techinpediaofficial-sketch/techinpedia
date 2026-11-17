import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { resumeAiForConversation } from '@/lib/ai/handoff-engine';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.conversation.pause') && !hasPermission(session, 'comm.chat.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to toggle AI for conversation' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const pause = Boolean(body.pause); // true = pause, false = resume

    const conv = await db.whatsappConversation.findUnique({ where: { id } });
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.companyId && conv.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let updatedConv;
    if (pause) {
      if (body.action === 'TAKEOVER') {
        const { employeeTakeover } = await import('@/lib/ai/handoff-engine');
        updatedConv = await employeeTakeover({
          companyId: conv.companyId || '',
          conversationId: id,
          employeeUserId: session.userId,
        });
      } else {
        updatedConv = await db.whatsappConversation.update({
          where: { id },
          data: {
            isAiPaused: true,
            aiPausedAt: new Date(),
            aiPausedBy: session.userId,
            handoffState: 'HUMAN_ACTIVE',
            lastAiHandoffReason: body.reason || 'Manual pause by agent',
          },
        });
      }
    } else {
      updatedConv = await resumeAiForConversation({
        companyId: conv.companyId || '',
        conversationId: id,
        resumedByUserId: session.userId,
      });
    }

    return NextResponse.json({
      success: true,
      isAiPaused: updatedConv.isAiPaused,
      conversation: updatedConv,
    });
  } catch (error: any) {
    console.error('Error toggling AI state for conversation:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
