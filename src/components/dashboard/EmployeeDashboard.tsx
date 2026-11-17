'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Briefcase,
  Calendar,
  Zap,
  UserCheck,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface EmployeeDashboardProps {
  session: any;
}

const WORK_STATUSES = [
  { value: 'AVAILABLE', label: 'Available', color: 'bg-emerald-500' },
  { value: 'BUSY', label: 'Busy', color: 'bg-amber-500' },
  { value: 'ON_BREAK', label: 'On Break', color: 'bg-indigo-500' },
  { value: 'OFFLINE', label: 'Offline', color: 'bg-slate-400' },
];

export function EmployeeDashboard({ session }: EmployeeDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('AVAILABLE');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/dashboards/employee');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.myStatus) setCurrentStatus(json.myStatus);
      }
    } catch (e) {
      console.error('Failed to load employee dashboard data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    setCurrentStatus(newStatus);
    try {
      await fetch('/api/admin/employee-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.error('Failed to update status', e);
    } finally {
      setUpdatingStatus(false);
    }
  };

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
        <RefreshCw className="w-8 h-8 animate-spin text-violet-600" />
        <p className="text-sm font-medium">Loading your personal workspace...</p>
      </div>
    );
  }

  const myWork = data?.myWork || {};
  const myPerformance = data?.myPerformance || {};
  const leads = myWork.leads || {};
  const chats = myWork.chats || {};
  const tickets = myWork.tickets || {};
  const recentLeads = data?.recentLeads || [];

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Header & Live Work Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-violet-900/10 via-purple-900/5 to-transparent border border-violet-200 dark:border-violet-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              Personal Workbench
            </span>
            <span className="text-xs text-slate-400">
              Welcome back, <strong>{session?.name || session?.email}</strong>
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            My Daily Assignments & Operations
          </h1>
        </div>

        {/* Live Work Status Toggle */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 font-medium pl-1">Work Status:</span>
          <div className="flex items-center gap-1">
            {WORK_STATUSES.map((ws) => (
              <button
                key={ws.value}
                onClick={() => handleStatusChange(ws.value)}
                disabled={updatingStatus}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  currentStatus === ws.value
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${ws.color}`} />
                {ws.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Urgent Alert Banner if pending acceptance */}
      {(leads.awaitingAcceptance > 0 || chats.unaccepted > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                You have assignments awaiting your acceptance!
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {leads.awaitingAcceptance > 0 && `${leads.awaitingAcceptance} lead(s) `}
                {leads.awaitingAcceptance > 0 && chats.unaccepted > 0 && 'and '}
                {chats.unaccepted > 0 && `${chats.unaccepted} WhatsApp chat(s) `}
                require your acceptance to start working.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {chats.unaccepted > 0 && (
              <Link
                href="/admin/whatsapp?tab=inbox&folder=AWAITING_ACCEPTANCE"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Accept Chats
              </Link>
            )}
            {leads.awaitingAcceptance > 0 && (
              <Link
                href="/admin/leads?status=NEW"
                className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold transition"
              >
                Accept Leads
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 1. My Work Overview */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Briefcase className="w-4 h-4 text-violet-600" />
          My Current Workload
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/admin/leads"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-800 transition group"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 block group-hover:text-violet-600 transition">My Active Leads</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{leads.total || 0}</span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">+{leads.newAssignments || 0} assigned today</span>
          </Link>

          <Link
            href="/admin/leads?status=NEW"
            className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 hover:border-amber-400 transition"
          >
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Awaiting My Accept</span>
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 block">{leads.awaitingAcceptance || 0}</span>
            <span className="text-[10px] text-amber-600 mt-1 block">Pending response</span>
          </Link>

          <Link
            href="/admin/whatsapp?tab=inbox&folder=MY_CHATS"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-800 transition"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 block">My Active Chats</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{chats.active || 0}</span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">{chats.resolvedToday || 0} resolved today</span>
          </Link>

          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40">
            <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">Follow-ups Due</span>
            <span className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1 block">{leads.followUpDue || 0}</span>
            <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{leads.overdueFollowUp || 0} overdue</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-blue-500 block">In Progress</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{leads.inProgress || 0}</span>
            <span className="text-[10px] text-blue-500 mt-1 block">Active negotiations</span>
          </div>

          <Link
            href="/admin/support/tickets"
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-300 transition"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 block">My Tickets</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{tickets.open || 0}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">{tickets.resolvedToday || 0} closed today</span>
          </Link>
        </div>
      </div>

      {/* 2. My Performance Overview */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500" />
          My Personal Performance & SLA
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Leads Accepted</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{myPerformance.leadsAccepted || 0}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Assigned to you</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Leads Converted</span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">{myPerformance.leadsConverted || 0}</span>
            <span className="text-[10px] text-emerald-600 mt-1 block">Deals closed</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Accept Time</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {formatSeconds(myPerformance.avgAcceptanceSeconds)}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">Your acceptance speed</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-blue-500 block">Avg Response Time</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
              {formatSeconds(myPerformance.avgResponseSeconds)}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">First outbound message</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Chats Handled</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{myPerformance.chatsHandled || 0}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Today</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">SLA Breaches</span>
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1 block">{myPerformance.slaBreaches || 0}</span>
            <span className="text-[10px] text-rose-500 mt-1 block">Unaccepted overtime</span>
          </div>
        </div>
      </div>

      {/* 3. Recent Activity Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            My Recent Leads & Assignments
          </h2>
          <Link href="/admin/leads" className="text-xs text-violet-600 hover:underline font-medium">
            View All My Leads →
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
          {recentLeads.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No recent lead assignments for you today.
            </div>
          ) : (
            recentLeads.map((lead: any) => (
              <div key={lead.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    🎯
                  </div>
                  <div className="min-w-0">
                    <Link href={`/admin/leads?id=${lead.id}`} className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-violet-600 transition truncate block">
                      {lead.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {lead.status}
                      </span>
                      {lead.priority && (
                        <span className="text-[11px] text-amber-500 font-medium">
                          {lead.priority}
                        </span>
                      )}
                      <span>•</span>
                      <span>Assigned: {lead.assignedAt ? new Date(lead.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!lead.assignmentAcceptedAt ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold">
                      Awaiting Acceptance
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Accepted
                    </span>
                  )}
                  <Link
                    href={`/admin/leads?id=${lead.id}`}
                    className="p-1.5 text-slate-400 hover:text-violet-600 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
