import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { AiCopilot } from '@/lib/ai/copilot';
import { resolveEffectiveCompanyId } from '@/lib/access-policy';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.assist.use') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to use AI Co-Pilot' }, { status: 403 });
    }

    const body = await request.json();
    const { action, conversationId, contactId, draftText, style } = body;
    const companyId = await resolveEffectiveCompanyId(session, body.companyId);

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    switch (action) {
      case 'SUGGEST_REPLY': {
        if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
        const result = await AiCopilot.suggestReplies({ companyId, conversationId });
        return NextResponse.json({ success: true, ...result });
      }

      case 'REWRITE_DRAFT': {
        if (!draftText) return NextResponse.json({ error: 'draftText required' }, { status: 400 });
        const result = await AiCopilot.rewriteDraft({
          companyId,
          draftText,
          style: style || 'PROFESSIONAL',
        });
        return NextResponse.json({ success: true, ...result });
      }

      case 'SUMMARIZE_CONVERSATION': {
        if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
        const result = await AiCopilot.summarizeConversation({ companyId, conversationId });
        return NextResponse.json({ success: true, ...result });
      }

      case 'QUALIFY_LEAD': {
        if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
        const result = await AiCopilot.extractLeadQualification({ companyId, conversationId, contactId });
        return NextResponse.json({ success: true, ...result });
      }

      default:
        return NextResponse.json({ error: `Unknown co-pilot action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in AI Co-Pilot:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
