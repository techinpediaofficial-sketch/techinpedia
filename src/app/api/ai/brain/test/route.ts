import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { AIEngine } from '@/lib/ai/ai-engine';
import { IntentEngine } from '@/lib/ai/intent-engine';
import { retrieveRelevantKnowledge } from '@/lib/ai/knowledge-retrieval';
import { resolveEffectiveCompanyId } from '@/lib/access-policy';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const isAuthorized =
      session.role === 'SUPER_ADMIN' ||
      session.role === 'ADMIN' ||
      session.companyRole === 'OWNER' ||
      session.companyRole === 'ADMIN' ||
      hasPermission(session, 'ai.brain.view');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to use AI Playground' }, { status: 403 });
    }

    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, body.companyId || searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    const userMessage = body.message?.trim();
    if (!userMessage) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // 1. Intent Detection Trace
    const detectedIntent = await IntentEngine.detectIntent(companyId, userMessage);

    // 2. Knowledge Retrieval Trace
    const knowledgeResult = await retrieveRelevantKnowledge({
      companyId,
      query: userMessage,
      maxChunks: 4,
    });

    // 3. Tool & Live Business Data Simulation
    const { AiToolRunner } = await import('@/lib/ai/tools');
    const toolsCalled: string[] = [];
    let liveData: any = null;

    const pkgMatch = userMessage.match(/\b([1-9])\b|rice\s*wax|glam\s*special|super\s*saver|golden\s*glow|patel\s*glow|premium\s*glow|soft\s*glam|divine\s*glow|elite\s*glow/i);
    if (pkgMatch) {
      const res = await AiToolRunner.executeTool('getPackageDetails', { packageIdentifier: pkgMatch[1] || pkgMatch[0] }, { companyId });
      if (res.success) {
        toolsCalled.push('getPackageDetails');
        liveData = { package: res.data };
      }
    } else if (detectedIntent.intentName === 'PACKAGE_QUERY') {
      const res = await AiToolRunner.executeTool('getPackageList', {}, { companyId });
      toolsCalled.push('getPackageList');
      liveData = { packagesCount: res.data?.length };
    }

    // 4. AI Generation Simulation
    const aiResponse = await AIEngine.generateReply({
      companyId,
      feature: 'TEST_PLAYGROUND',
      messages: [{ role: 'user', content: userMessage }],
    });

    // 5. Safe Operational Trace
    const operationalTrace = {
      userMessage,
      detectedIntent: detectedIntent ? {
        name: detectedIntent.intentName,
        confidence: detectedIntent.confidence,
        source: detectedIntent.source,
        actionType: detectedIntent.actionType,
        department: detectedIntent.department || 'SUPPORT',
      } : null,
      knowledgeRetrieved: {
        matchStatus: knowledgeResult.matchStatus,
        bestScore: knowledgeResult.bestScore,
        chunksUsed: knowledgeResult.chunks.map(c => ({
          title: c.title,
          category: c.category,
          score: c.score,
          snippet: c.content.slice(0, 140) + '...',
        })),
      },
      toolsCalled,
      liveData,
      proposedReply: aiResponse.reply,
      handoffDecision: {
        recommended: aiResponse.handoffRecommended || (detectedIntent.isEscalation) || false,
        reason: aiResponse.handoffReason || (detectedIntent.isEscalation ? 'Intent Escalation Rule' : null),
      },
      telemetry: {
        providerUsed: aiResponse.providerUsed,
        modelUsed: aiResponse.modelUsed,
        tokens: aiResponse.tokens,
        latencyMs: aiResponse.latencyMs,
        estimatedCost: aiResponse.estimatedCost,
      },
    };

    return NextResponse.json({
      success: true,
      simulation: operationalTrace,
    });
  } catch (error: any) {
    console.error('Error simulating AI Playground response:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
