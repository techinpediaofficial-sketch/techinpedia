import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { indexKnowledgeBaseItem } from '@/lib/ai/knowledge-retrieval';
import { resolveEffectiveCompanyId, getAvailableCompaniesForAdmin } from '@/lib/access-policy';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.knowledge.manage') && !hasPermission(session, 'ai.brain.view') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to view knowledge base' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    const [items, availableCompanies] = await Promise.all([
      db.aiKnowledgeBase.findMany({
        where: { companyId },
        orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
        include: {
          _count: {
            select: { chunks: true },
          },
        },
      }),
      getAvailableCompaniesForAdmin(session),
    ]);

    return NextResponse.json({
      success: true,
      companyId,
      availableCompanies,
      items: items.map(item => ({
        ...item,
        totalChunks: item._count.chunks,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching knowledge base:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.knowledge.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to add knowledge' }, { status: 403 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, body.companyId || searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    const title = body.title?.trim();
    const content = body.content?.trim();
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const sourceType = body.sourceType || 'MANUAL_QA';
    const category = body.category?.trim() || 'General';
    const tags = body.tags ? JSON.stringify(body.tags) : null;
    const priority = parseInt(body.priority || '10');

    // Create knowledge record
    const item = await db.aiKnowledgeBase.create({
      data: {
        companyId,
        title,
        content,
        sourceType,
        category,
        tags,
        priority,
        status: 'ACTIVE',
        syncStatus: 'PROCESSING',
        createdById: session.userId,
      },
    });

    // Automatically chunk and index immediately
    try {
      await indexKnowledgeBaseItem(item.id, companyId);
    } catch (indexErr) {
      console.error('[KnowledgeBase] Auto-indexing failed:', indexErr);
      await db.aiKnowledgeBase.update({
        where: { id: item.id },
        data: { syncStatus: 'FAILED' },
      });
    }

    const indexedItem = await db.aiKnowledgeBase.findUnique({
      where: { id: item.id },
      include: { _count: { select: { chunks: true } } },
    });

    return NextResponse.json({
      success: true,
      item: indexedItem,
    });
  } catch (error: any) {
    console.error('Error creating knowledge item:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
