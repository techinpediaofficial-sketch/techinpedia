'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  CreditCard,
  DollarSign,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Building2,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  LifeBuoy,
  RefreshCw,
} from 'lucide-react';

export default function ExecutiveDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchExecutiveData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboards/executive');
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load executive dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutiveData();
  }, []);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent mb-3"></div>
        <p className="text-sm text-slate-500">Loading senior management executive cockpit...</p>
      </div>
    );
  }

  const fin = data?.financials || {};
  const pipe = data?.pipeline || {};
  const del = data?.delivery || {};
  const wf = data?.workforce || {};

  // Financial Efficiency Ratio
  const revenueToBurnRatio = wf.monthlyGrossPayroll > 0 ? (fin.totalCollected / wf.monthlyGrossPayroll).toFixed(2) : '1.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Executive Business Cockpit</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              C-Level View
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Holistic enterprise health tracking revenue realization, weighted sales forecasts, delivery SLAs, and workforce burn.
          </p>
        </div>

        <button
          onClick={fetchExecutiveData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-violet-500" />
          Refresh Metrics
        </button>
      </div>

      {/* Financial Realization KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue Collected</span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatINR(fin.totalCollected)}
            </div>
            <span className="text-[11px] text-slate-400">Realized cash flow</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Invoiced Volume</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {formatINR(fin.totalInvoiced)}
            </div>
            <span className="text-[11px] text-rose-600 font-medium">Due: {formatINR(fin.outstandingDue)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Recurring (MRR)</span>
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {formatINR(fin.monthlyRecurringRevenue)}
            </div>
            <span className="text-[11px] text-slate-400">ARR: {formatINR(fin.annualRecurringRevenue)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Weighted Pipeline Forecast</span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {formatINR(pipe.weightedPipelineForecast)}
            </div>
            <span className="text-[11px] text-slate-400">From {pipe.openDealsCount} open deals</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Pipeline Health & Delivery SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Funnel & Pipeline Velocity */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              Sales Velocity & Deal Pipeline
            </h2>
            <span className="text-xs text-slate-400">Win Rate: <strong>{pipe.winRate}%</strong></span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-xs text-slate-400 block">Total Open Pipeline</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                {formatINR(pipe.totalOpenPipeline)}
              </span>
              <span className="text-[11px] text-slate-500">{pipe.openDealsCount} Active Deals</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-xs text-slate-400 block">Won Revenue Closed</span>
              <span className="text-xl font-extrabold text-emerald-600 mt-1 block">
                {formatINR(pipe.totalWonRevenue)}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">{pipe.wonDealsCount} Deals Converted</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-violet-50/50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 text-xs text-violet-700 dark:text-violet-300">
            <div className="font-semibold mb-1 flex items-center justify-between">
              <span>Weighted Revenue Realization</span>
              <span className="font-bold">{formatINR(pipe.weightedPipelineForecast)}</span>
            </div>
            <p className="text-[11px] opacity-90">
              Probability-weighted forecast across stages (Prospecting, Proposal Sent, Negotiation) factoring historical win velocities.
            </p>
          </div>
        </div>

        {/* Project Delivery Health & Client SLA */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-violet-500" />
              Delivery Health & Support SLA
            </h2>
            <span className="text-xs text-emerald-600 font-bold">{del.ticketSlaRate}% SLA Resolved</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-xs text-slate-400 block">Active Client Projects</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                {del.activeProjects}
              </span>
              <span className="text-[11px] text-slate-500">
                {del.completedProjects} Completed • {del.delayedProjects > 0 ? <strong className="text-rose-600">{del.delayedProjects} Delayed</strong> : '0 Delayed'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-xs text-slate-400 block">Support Tickets Desk</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                {del.openTickets} Open
              </span>
              <span className="text-[11px] text-slate-500">
                {del.resolvedTickets} Resolved ({del.totalTickets} total)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Project Delivery On-Track Rate</span>
              <span className="text-[11px] text-slate-400">
                {del.totalProjects > 0 ? Math.round(((del.activeProjects - del.delayedProjects) / Math.max(1, del.activeProjects)) * 100) : 100}% on schedule
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Healthy
            </span>
          </div>
        </div>
      </div>

      {/* Workforce & Capital Efficiency */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Workforce Capital & Burn Efficiency
          </span>
          <div className="flex flex-wrap items-baseline gap-4 mt-2">
            <div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {wf.totalHeadcount} Staff Members
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">Total Organization Headcount</span>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
              <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                {formatINR(wf.monthlyGrossPayroll)}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">Estimated Monthly Payroll Burn</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl text-xs">
          <div>
            <span className="text-slate-400 block">Revenue Realization to Burn</span>
            <span className="text-base font-extrabold text-emerald-600">{revenueToBurnRatio}x Multiplier</span>
          </div>
          <ShieldCheck className="w-6 h-6 text-emerald-500 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}
