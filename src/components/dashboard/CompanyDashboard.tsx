'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  MessageSquare,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Briefcase,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface CompanyDashboardProps {
  session: any;
}

export function CompanyDashboard({ session }: CompanyDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/dashboards/company');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load company dashboard data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatSeconds = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
        <p className="text-sm font-medium">Loading company operations dashboard...</p>
      </div>
    );
  }

  const workforce = data?.workforce || {};
  const leads = data?.leads || {};
  const whatsapp = data?.whatsapp || {};

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              data?.dashboardScope === 'TEAM'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
            }`}>
              {data?.dashboardScope === 'TEAM' ? 'Team Operations' : 'Company Operations'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {data?.teamName || session?.companyName || 'Workspace'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {data?.dashboardScope === 'TEAM' ? 'Team Management Cockpit' : 'Company Executive Cockpit'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {data?.scopeDescription || 'Real-time workforce deployment, CRM lead pipeline, and WhatsApp communication SLA health.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/assignments"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Clock className="w-3.5 h-3.5" />
            Live SLA Monitor
          </Link>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. Workforce Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-600" />
            Workforce Live Telemetry
          </h2>
          <Link href="/admin/company/employees" className="text-xs text-purple-600 hover:underline font-medium">
            Manage Staff →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Staff</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{workforce.total || 0}</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">{workforce.online || 0}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-blue-500 block">Available</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{workforce.available || 0}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-amber-500 block">Busy</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{workforce.busy || 0}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Offline</span>
            <span className="text-2xl font-black text-slate-500 mt-1 block">{workforce.offline || 0}</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Pending Accept</span>
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 block">{workforce.withPendingAssignments || 0}</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">SLA Breached</span>
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1 block">{workforce.withSlaBreaches || 0}</span>
          </div>
        </div>
      </div>

      {/* 2. Company Lead Pipeline Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-600" />
            CRM Lead Pipeline
          </h2>
          <Link href="/admin/leads" className="text-xs text-purple-600 hover:underline font-medium">
            View All Leads →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pipeline</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{leads.total || 0}</span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">+{leads.newToday || 0} new today</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Unassigned</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1 block">{leads.unassigned || 0}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Awaiting distribution</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Awaiting Accept</span>
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 block">{leads.awaitingAcceptance || 0}</span>
            <span className="text-[10px] text-amber-600 mt-1 block">Assigned but unaccepted</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-blue-500 block">Accepted / Active</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{leads.accepted || 0}</span>
            <span className="text-[10px] text-blue-500 mt-1 block">In agent handling</span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40">
            <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">Follow-ups Due</span>
            <span className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1 block">{leads.followUpDue || 0}</span>
            <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{leads.overdueFollowUp || 0} overdue</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Deals Won</span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">{leads.won || 0}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">{leads.lost || 0} lost</span>
          </div>
        </div>
      </div>

      {/* 3. Company WhatsApp Overview with SLA Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            WhatsApp Communications & SLA Performance
          </h2>
          <Link href="/admin/whatsapp?tab=inbox" className="text-xs text-purple-600 hover:underline font-medium">
            Open WhatsApp Inbox →
          </Link>
        </div>

        {/* SLA Speed Averages */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Acceptance Speed</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {formatSeconds(whatsapp.avgAcceptanceSeconds)}
              </p>
              <span className="text-[10px] text-slate-400">Assigned → Agent Accepted</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg First Response</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {formatSeconds(whatsapp.avgFirstResponseSeconds)}
              </p>
              <span className="text-[10px] text-slate-400">Assigned → First Customer Reply</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Resolution Time</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {formatSeconds(whatsapp.avgResolutionSeconds)}
              </p>
              <span className="text-[10px] text-slate-400">Creation → Conversation Closed</span>
            </div>
          </div>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Chats</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{whatsapp.active || 0}</span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">+{whatsapp.newToday || 0} new today</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Unassigned</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1 block">{whatsapp.unassigned || 0}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Needs routing</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Unaccepted Chats</span>
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 block">{whatsapp.assignedNotAccepted || 0}</span>
            <span className="text-[10px] text-amber-600 mt-1 block">Assigned but pending</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-blue-500 block">Waiting Agent</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{whatsapp.waitingForAgent || 0}</span>
            <span className="text-[10px] text-blue-500 mt-1 block">Customer replied last</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">SLA Breaches</span>
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1 block">{whatsapp.slaBreached || 0}</span>
            <span className="text-[10px] text-amber-600 font-semibold mt-1 block">{whatsapp.slaWarning || 0} in warning</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Resolved Today</span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">{whatsapp.resolvedToday || 0}</span>
            <span className="text-[10px] text-emerald-600 mt-1 block">Closed conversations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
