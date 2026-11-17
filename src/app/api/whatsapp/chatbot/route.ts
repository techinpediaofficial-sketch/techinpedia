import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { resolveEffectiveCompanyId, getAvailableCompaniesForAdmin } from '@/lib/access-policy';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'chatbot.view') && !hasPermission(session, 'whatsapp.view')) {
      return NextResponse.json({ error: 'Unauthorized to view chatbots' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    const [chatbots, availableCompanies] = await Promise.all([
      db.whatsappChatbot.findMany({
        where: { companyId },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { sessions: true },
          },
        },
      }),
      getAvailableCompaniesForAdmin(session),
    ]);

    return NextResponse.json({
      success: true,
      companyId,
      availableCompanies,
      chatbots: chatbots.map(bot => ({
        ...bot,
        totalSessions: bot._count.sessions,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching chatbots:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const isAuthorized =
      session.role === 'SUPER_ADMIN' ||
      session.role === 'ADMIN' ||
      session.companyRole === 'OWNER' ||
      session.companyRole === 'ADMIN' ||
      hasPermission(session, 'chatbot.manage');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to manage chatbots' }, { status: 403 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, body.companyId || searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    const name = body.name?.trim() || 'New Chatbot';
    const description = body.description?.trim() || null;
    const triggerType = body.triggerType || 'KEYWORD';
    const triggerKeywords = body.triggerKeywords ? JSON.stringify(body.triggerKeywords) : null;
    const isDefault = Boolean(body.isDefault);

    // Initial starter nodes if not provided
    const defaultNodes = [
      {
        id: 'node-1',
        type: 'entry',
        position: { x: 100, y: 150 },
        data: { label: 'Start Flow', triggerType },
      },
      {
        id: 'node-2',
        type: 'send_message',
        position: { x: 350, y: 150 },
        data: { label: 'Greeting Message', messageType: 'text', text: 'Hello! Welcome to our automated WhatsApp desk. How can we help you today?' },
      },
      {
        id: 'node-3',
        type: 'question',
        position: { x: 600, y: 150 },
        data: { label: 'Ask Name', questionText: 'May I know your full name please?', variableName: 'userName', contactField: 'name' },
      },
      {
        id: 'node-4',
        type: 'end',
        position: { x: 850, y: 150 },
        data: { label: 'End Flow' },
      },
    ];

    const defaultEdges = [
      { id: 'e1-2', source: 'node-1', target: 'node-2' },
      { id: 'e2-3', source: 'node-2', target: 'node-3' },
      { id: 'e3-4', source: 'node-3', target: 'node-4' },
    ];

    const nodesJson = body.nodes ? JSON.stringify(body.nodes) : JSON.stringify(defaultNodes);
    const edgesJson = body.edges ? JSON.stringify(body.edges) : JSON.stringify(defaultEdges);

    if (isDefault) {
      // Unset previous defaults
      await db.whatsappChatbot.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const chatbot = await db.whatsappChatbot.create({
      data: {
        companyId,
        name,
        description,
        triggerType,
        triggerKeywords,
        isDefault,
        status: 'DRAFT',
        nodesJson,
        edgesJson,
        createdById: session.userId,
      },
    });

    return NextResponse.json({
      success: true,
      chatbot,
    });
  } catch (error: any) {
    console.error('Error creating chatbot:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
