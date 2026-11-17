import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { validateChatbotFlow } from '@/lib/chatbot/flow-validator';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'chatbot.publish') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to publish chatbots' }, { status: 403 });
    }

    const { id } = await params;
    const bot = await db.whatsappChatbot.findUnique({ where: { id } });

    if (!bot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.companyId && bot.companyId !== session.companyId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    let nodes = [];
    let edges = [];
    try {
      nodes = JSON.parse(bot.nodesJson || '[]');
      edges = JSON.parse(bot.edgesJson || '[]');
    } catch (e) {
      return NextResponse.json({ error: 'Malformed flow JSON' }, { status: 400 });
    }

    // Strict pre-activation validation
    const validation = validateChatbotFlow(nodes, edges);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed before activation',
        validationErrors: validation.errors,
      }, { status: 400 });
    }

    const nextPublishedVersion = (bot.publishedVersion || 0) + 1;

    const publishedBot = await db.whatsappChatbot.update({
      where: { id },
      data: {
        publishedNodesJson: bot.nodesJson,
        publishedEdgesJson: bot.edgesJson,
        publishedVersion: nextPublishedVersion,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      chatbot: publishedBot,
      version: nextPublishedVersion,
    });
  } catch (error: any) {
    console.error('Error publishing chatbot:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
