import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const chatbot = await db.whatsappChatbot.findUnique({
      where: { id },
      include: {
        _count: {
          select: { sessions: true },
        },
      },
    });

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    // Tenant isolation check
    if (session.role !== 'SUPER_ADMIN' && session.companyId && chatbot.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden: Access denied to another tenant chatbot' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      chatbot,
    });
  } catch (error: any) {
    console.error('Error fetching chatbot:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'chatbot.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to modify chatbots' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await db.whatsappChatbot.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden: Cannot edit another tenant chatbot' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.triggerType !== undefined) updateData.triggerType = body.triggerType;
    if (body.triggerKeywords !== undefined) {
      updateData.triggerKeywords = Array.isArray(body.triggerKeywords)
        ? JSON.stringify(body.triggerKeywords)
        : body.triggerKeywords;
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isDefault !== undefined) {
      updateData.isDefault = Boolean(body.isDefault);
      if (body.isDefault && existing.companyId) {
        await db.whatsappChatbot.updateMany({
          where: { companyId: existing.companyId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
    }

    if (body.nodes !== undefined) {
      updateData.nodesJson = typeof body.nodes === 'string' ? body.nodes : JSON.stringify(body.nodes);
      updateData.draftVersion = (existing.draftVersion || 1) + 1;
    }
    if (body.edges !== undefined) {
      updateData.edgesJson = typeof body.edges === 'string' ? body.edges : JSON.stringify(body.edges);
    }

    const updated = await db.whatsappChatbot.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      chatbot: updated,
    });
  } catch (error: any) {
    console.error('Error updating chatbot:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'chatbot.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to delete chatbots' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await db.whatsappChatbot.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.companyId && existing.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden: Cannot delete another tenant chatbot' }, { status: 403 });
    }

    await db.whatsappChatbot.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Chatbot deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting chatbot:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
