import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

import { resolveEffectiveCompanyId, getAvailableCompaniesForAdmin } from '@/lib/access-policy';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.analytics.view') && !hasPermission(session, 'ai.brain.view') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized to view AI analytics' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    const days = parseInt(searchParams.get('days') || '30');
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // 1. Quota & Limits
    const config = await db.aiConfig.findUnique({ where: { companyId } });

    // 2. Aggregate Usage Logs
    const usageLogs = await db.aiUsageLog.findMany({
      where: {
        companyId,
        createdAt: { gte: sinceDate },
      },
      select: {
        id: true,
        feature: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        estimatedCost: true,
        latencyMs: true,
        provider: true,
        model: true,
        createdAt: true,
      },
    });

    const totalCalls = usageLogs.length;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let totalCost = 0;
    let totalLatency = 0;

    const featureCounts: Record<string, number> = {};
    const providerCounts: Record<string, number> = {};

    for (const log of usageLogs) {
      totalPromptTokens += log.promptTokens;
      totalCompletionTokens += log.completionTokens;
      totalTokens += log.totalTokens;
      totalCost += log.estimatedCost;
      totalLatency += log.latencyMs;

      featureCounts[log.feature] = (featureCounts[log.feature] || 0) + 1;
      providerCounts[log.provider] = (providerCounts[log.provider] || 0) + 1;
    }

    const avgLatencyMs = totalCalls > 0 ? Math.round(totalLatency / totalCalls) : 0;

    // 3. Human Handoffs in period
    const handoffsCount = await db.whatsappConversation.count({
      where: {
        companyId,
        lastAiHandoffAt: { gte: sinceDate },
      },
    });

    // 4. Chatbot Sessions
    const chatbotSessionsCount = await db.chatbotSession.count({
      where: {
        companyId,
        startedAt: { gte: sinceDate },
      },
    });

    // 5. Total AI Conversations in period
    const totalAiConversations = await db.whatsappConversation.count({
      where: {
        companyId,
        createdAt: { gte: sinceDate },
      },
    });

    // 6. Knowledge Gaps (Unresolved Customer Questions)
    const knowledgeGaps = await db.aiKnowledgeSuggestion.findMany({
      where: { companyId, status: 'PENDING' },
      orderBy: { frequency: 'desc' },
      take: 6,
      select: {
        id: true,
        question: true,
        frequency: true,
        createdAt: true,
      },
    }).catch(() => []);

    // 7. Top Customer Intents from Usage Logs
    const intentCounts: Record<string, number> = {};
    for (const log of usageLogs) {
      if ((log as any).intent) {
        intentCounts[(log as any).intent] = (intentCounts[(log as any).intent] || 0) + 1;
      }
    }

    const resolutionRate = totalAiConversations > 0
      ? Math.max(0, Math.min(100, Math.round(((totalAiConversations - handoffsCount) / totalAiConversations) * 100)))
      : 100;

    const handoffRate = totalAiConversations > 0
      ? Math.min(100, Math.round((handoffsCount / totalAiConversations) * 100))
      : 0;

    const [availableCompanies] = await Promise.all([
      getAvailableCompaniesForAdmin(session),
    ]);

    return NextResponse.json({
      success: true,
      companyId,
      availableCompanies,
      periodDays: days,
      metrics: {
        totalCalls,
        totalTokens,
        totalPromptTokens,
        totalCompletionTokens,
        totalCost: parseFloat(totalCost.toFixed(4)),
        avgLatencyMs,
        totalAiConversations,
        handoffsCount,
        resolutionRate: `${resolutionRate}%`,
        handoffRate: `${handoffRate}%`,
        chatbotSessionsCount,
        knowledgeGaps,
        topIntents: Object.entries(intentCounts).map(([intent, count]) => ({ intent, count })),
        quota: {
          monthlyLimit: config?.monthlyTokenLimit || 500000,
          currentMonthTokens: config?.currentMonthTokens || 0,
          dailyLimit: config?.dailyRequestLimit || 2000,
          currentDayRequests: config?.currentDayRequests || 0,
        },
        breakdowns: {
          byFeature: featureCounts,
          byProvider: providerCounts,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching AI analytics:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
