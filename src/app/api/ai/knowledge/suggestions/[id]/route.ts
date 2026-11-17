import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { indexKnowledgeBaseItem } from '@/lib/ai/knowledge-retrieval';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.knowledge.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const action = body.action; // 'APPROVE' or 'REJECT'

    const suggestion = await db.aiKnowledgeSuggestion.findUnique({ where: { id } });
    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.companyId && suggestion.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'APPROVE') {
      const q = body.question || suggestion.question;
      const a = body.proposedAnswer || suggestion.proposedAnswer;

      // Create new knowledge base entry
      const kb = await db.aiKnowledgeBase.create({
        data: {
          companyId: suggestion.companyId,
          title: q,
          content: a,
          sourceType: 'FAQ',
          category: 'Customer FAQs',
          status: 'ACTIVE',
          createdById: session.userId,
        },
      });

      if (suggestion.companyId) {
        await indexKnowledgeBaseItem(kb.id, suggestion.companyId);
      }

      await db.aiKnowledgeSuggestion.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedById: session.userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Knowledge suggestion approved and indexed into active knowledge base',
        knowledgeBaseItem: kb,
      });
    } else {
      await db.aiKnowledgeSuggestion.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedById: session.userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Suggestion rejected',
      });
    }
  } catch (error: any) {
    console.error('Error handling suggestion review:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
