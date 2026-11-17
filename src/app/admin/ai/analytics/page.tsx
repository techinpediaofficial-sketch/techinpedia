'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LineChart,
  Brain,
  MessageSquare,
  Zap,
  Clock,
  Coins,
  ShieldAlert,
  Bot,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  BarChart2,
} from 'lucide-react';
import { CompanySwitcher } from '@/components/admin/CompanySwitcher';

function AiAnalyticsContent() {
  const searchParams = useSearchParams();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Multi-Company / Tenant State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(searchParams.get('companyId') || '');
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);

  const handleCompanyChange = (newCompanyId: string) => {
    setSelectedCompanyId(newCompanyId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newCompanyId) {
        url.searchParams.set('companyId', newCompanyId);
      } else {
        url.searchParams.delete('companyId');
      }
      window.history.replaceState({}, '', url.toString());
    }
    fetchAnalytics(days, newCompanyId);
  };

  const fetchAnalytics = async (period: number, targetCid = selectedCompanyId) => {
    try {
      setLoading(true);
      const cidParam = targetCid ? `&companyId=${encodeURIComponent(targetCid)}` : '';
      const res = await fetch(`/api/ai/analytics?days=${period}${cidParam}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
      if (json.availableCompanies) {
        setAvailableCompanies(json.availableCompanies);
      }
      if (json.companyId && !targetCid) {
        setSelectedCompanyId(json.companyId);
      }
    } catch (err) {
      console.error('Error fetching AI analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  const metrics = data?.metrics;
  const quota = metrics?.quota;
  const monthPct = quota ? Math.min(100, Math.round((quota.currentMonthTokens / quota.monthlyLimit) * 100)) : 0;
  const dailyPct = quota ? Math.min(100, Math.round((quota.currentDayRequests / quota.dailyLimit) * 100)) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400">
              <LineChart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                AI & Chatbot Analytics
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">Tenant Scoped</span>
              </h1>
              <p className="text-xs text-slate-400">Real-time usage telemetry, token quotas, estimated provider costs, and handoff rates</p>
            </div>
          </div>
        </div>

        {/* Timeframe + Company Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <CompanySwitcher
            selectedCompanyId={selectedCompanyId}
            availableCompanies={availableCompanies}
            onCompanyChange={handleCompanyChange}
          />
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            {[7, 14, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  days === d ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading analytics telemetry...</div>
      ) : (
        <>
          {/* Top Metric Cards Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                <span>Total AI Invocations</span>
                <Brain className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{metrics?.totalCalls || 0}</div>
              <div className="text-[11px] text-slate-500">Across WhatsApp bots & Co-Pilot</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                <span>AI Resolution Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 mb-1">{metrics?.resolutionRate || '100%'}</div>
              <div className="text-[11px] text-slate-500">Resolved autonomously without human</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                <span>Human Handoff Rate</span>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 mb-1">{metrics?.handoffRate || '0%'}</div>
              <div className="text-[11px] text-slate-500">{metrics?.handoffsCount || 0} chats escalated to staff</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2 text-xs">
                <span>Average Response Latency</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{metrics?.avgLatencyMs || 0}ms</div>
              <div className="text-[11px] text-slate-500">Non-blocking background execution</div>
            </div>
          </div>

          {/* Quotas & Telemetry Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quota Progress */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-violet-400" />
                Monthly Quota & Safety Limits
              </h3>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Monthly Token Allowance</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {(quota?.currentMonthTokens || 0).toLocaleString()} / {(quota?.monthlyLimit || 500000).toLocaleString()} ({monthPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width: `${monthPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Daily Request Quota</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {quota?.currentDayRequests || 0} / {quota?.dailyLimit || 2000} ({dailyPct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${dailyPct}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Human Handoffs</span>
                  <span className="text-lg font-bold text-rose-400">{metrics?.handoffsCount || 0}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Estimated Token Cost</span>
                  <span className="text-lg font-bold text-emerald-400">${metrics?.totalCost || 0}</span>
                </div>
              </div>
            </div>

            {/* Top Customer Intents */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                Top Customer Intents
              </h3>

              <div className="space-y-2.5 text-xs">
                {(metrics?.topIntents || []).slice(0, 6).map((item: any) => (
                  <div key={item.intent} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-slate-300 font-mono">{item.intent}</span>
                    <span className="font-bold text-white px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                      {item.count} queries
                    </span>
                  </div>
                ))}
                {(!metrics?.topIntents || metrics.topIntents.length === 0) && (
                  <div className="text-center text-slate-500 py-6">No intent telemetry recorded yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Knowledge Gaps Section */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Unresolved Customer Questions (Knowledge Gaps)
            </h3>
            <p className="text-xs text-slate-400">
              Questions asked by customers that AI could not answer with high confidence. Add official answers to your Knowledge Base to resolve them automatically in future conversations.
            </p>

            <div className="space-y-2.5 text-xs">
              {(metrics?.knowledgeGaps || []).map((gap: any) => (
                <div key={gap.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-slate-200 font-medium">"{gap.question}"</p>
                    <span className="text-[10px] text-slate-500">Asked {gap.frequency} times by customers</span>
                  </div>
                  <a
                    href={`/admin/ai/knowledge`}
                    className="px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 font-semibold text-[11px] shrink-0 transition"
                  >
                    + Add to Knowledge
                  </a>
                </div>
              ))}
              {(!metrics?.knowledgeGaps || metrics.knowledgeGaps.length === 0) && (
                <div className="text-center text-slate-500 py-6">No unresolved knowledge gaps currently pending! All customer inquiries were addressed.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AiAnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading AI Analytics...</div>}>
      <AiAnalyticsContent />
    </Suspense>
  );
}
