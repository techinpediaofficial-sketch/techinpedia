import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { indexKnowledgeBaseItem } from '@/lib/ai/knowledge-retrieval';
import { resolveEffectiveCompanyId } from '@/lib/access-policy';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.knowledge.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to sync knowledge base' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    const items = await db.aiKnowledgeBase.findMany({
      where: { companyId, status: 'ACTIVE' },
    });

    let indexedCount = 0;
    for (const item of items) {
      try {
        await indexKnowledgeBaseItem(item.id, companyId);
        indexedCount++;
      } catch (err) {
        console.error(`Failed to re-index item ${item.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      totalItems: items.length,
      indexedCount,
    });
  } catch (error: any) {
    console.error('Error syncing knowledge base:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
