import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { indexKnowledgeBaseItem } from '@/lib/ai/knowledge-retrieval';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const item = await db.aiKnowledgeBase.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.companyId && item.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error: any) {
    console.error('Error fetching knowledge item:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.knowledge.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to modify knowledge' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await db.aiKnowledgeBase.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: any = {
      version: (existing.version || 1) + 1,
    };
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.content !== undefined) updateData.content = body.content.trim();
    if (body.category !== undefined) updateData.category = body.category?.trim() || null;
    if (body.priority !== undefined) updateData.priority = parseInt(body.priority);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);

    const updated = await db.aiKnowledgeBase.update({
      where: { id },
      data: updateData,
    });

    // Re-index chunks if content or status changed
    if (body.content !== undefined || body.status !== undefined) {
      if (existing.companyId) {
        await indexKnowledgeBaseItem(id, existing.companyId);
      }
    }

    return NextResponse.json({
      success: true,
      item: updated,
    });
  } catch (error: any) {
    console.error('Error updating knowledge item:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.knowledge.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to delete knowledge' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await db.aiKnowledgeBase.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Knowledge item not found' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cascade deletes chunks
    await db.aiKnowledgeBase.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Knowledge item deleted',
    });
  } catch (error: any) {
    console.error('Error deleting knowledge item:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
