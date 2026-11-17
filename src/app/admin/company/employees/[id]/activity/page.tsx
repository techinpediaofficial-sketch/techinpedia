'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Clock,
  ArrowLeft,
  RefreshCw,
  Target,
  MessageSquare,
  FileText,
  UserCheck,
  Calendar,
  Filter,
  Shield,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';

export default function EmployeeActivityPage() {
  const params = useParams();
  const employeeId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<string>('today');
  const [category, setCategory] = useState<string>('all');

  const fetchActivity = async () => {
    if (!employeeId) return;
    setRefreshing(true);
    try {
      const res = await fetch(
        `/api/admin/employees/${employeeId}/activity?timeRange=${timeRange}&category=${category}`
      );
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load employee activity', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [employeeId, timeRange, category]);

  const employee = data?.employee;
  const events = data?.events || [];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'WHATSAPP_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'LEAD_EVENT':
        return <Target className="w-4 h-4 text-purple-500" />;
      case 'NOTE':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'REASSIGNMENT':
        return <UserCheck className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b18] text-slate-900 dark:text-white pb-20">
      <AdminHeader title="Employee Activity Timeline" />

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/assignments"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assignment Monitor
          </Link>

          <button
            onClick={fetchActivity}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Employee Profile Header Card */}
        {employee && (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600/10 text-purple-600 font-black text-xl flex items-center justify-center">
                {employee.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-slate-900 dark:text-white">
                    {employee.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {employee.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{employee.email}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {employee.designation} • {employee.department} • {employee.team}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Work Status</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {employee.status}
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
          {/* Time Range Chips */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-semibold mr-1">Period:</span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'This Week' },
              { id: 'all', label: 'All History' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setTimeRange(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  timeRange === p.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-semibold mr-1">Type:</span>
            {[
              { id: 'all', label: 'All Actions' },
              { id: 'leads', label: 'CRM Leads' },
              { id: 'whatsapp', label: 'WhatsApp' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  category === c.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Timeline Stream */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <RefreshCw className="w-7 h-7 animate-spin text-purple-600" />
              <p className="text-xs">Loading employee activity timeline...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No recorded activity for this employee in the selected time window.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {events.map((evt: any) => {
                const timeStr = new Date(evt.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const dateStr = new Date(evt.timestamp).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div key={evt.id} className="relative group">
                    {/* Timeline bullet */}
                    <div className="absolute -left-6 top-3 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-purple-600 flex items-center justify-center shadow-sm">
                      {getEventIcon(evt.type)}
                    </div>

                    {/* Event Content Card */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800/60 transition shadow-sm space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {evt.title}
                        </span>
                        <span className="font-mono text-[11px]">
                          {dateStr} at {timeStr}
                        </span>
                      </div>
                      {evt.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {evt.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
