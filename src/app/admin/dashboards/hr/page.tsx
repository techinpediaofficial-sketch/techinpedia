'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck2,
  Users2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Award,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function HROperationsDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHRData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboards/hr');
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load HR dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent mb-3"></div>
        <p className="text-sm text-slate-500">Loading HR operations command center...</p>
      </div>
    );
  }

  const presence = data?.presence || {};
  const deptStats = data?.departmentStats || [];
  const alerts = data?.alerts || {};
  const payroll = data?.payrollReadiness || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>HR Operations Command Center</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Live Presence: {presence.presenceRate || 0}%
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Company-wide workforce attendance, department presence health, pending HR approvals, and payroll readiness.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/hr/attendance"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            Attendance Desk
          </Link>
          <Link
            href="/admin/hr/payroll"
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-500/20 transition-all"
          >
            Payroll Hub
          </Link>
        </div>
      </div>

      {/* Hero Presence & Workforce Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Headcount</span>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{presence.totalStaff || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1">Active staff members</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Present Today</span>
          <span className="text-3xl font-extrabold text-emerald-600 mt-2">{presence.presentToday || 0}</span>
          <span className="text-[11px] text-emerald-600 font-medium mt-1">{presence.presenceRate || 0}% workforce rate</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Late Arrivals</span>
          <span className="text-3xl font-extrabold text-amber-600 mt-2">{presence.lateToday || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1">Clocked in &gt; 09:45 AM</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Half Days</span>
          <span className="text-3xl font-extrabold text-indigo-600 mt-2">{presence.halfDayToday || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1">&lt; 4 hours work logged</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">On Approved Leave</span>
          <span className="text-3xl font-extrabold text-purple-600 mt-2">{presence.onLeaveToday || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1">Authorized leave roster</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unrecorded Absences</span>
          <span className="text-3xl font-extrabold text-rose-600 mt-2">{presence.absentToday || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1">Pending punch or absent</span>
        </div>
      </div>

      {/* Two Column Grid: Department Health & Payroll Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Presence Health */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Department Presence Distribution</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time attendance rates across functional business units.</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">{deptStats.length} Departments</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {deptStats.map((d: any) => (
              <div key={d.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-violet-500" />
                    {d.name}
                  </div>
                  <div className="text-slate-500">
                    <strong>{d.presentToday}</strong> / {d.totalHeadcount} present ({d.presenceRate}%)
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      d.presenceRate >= 80 ? 'bg-emerald-500' : d.presenceRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${d.presenceRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Payroll Readiness Cockpit */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-500" />
                Monthly Payroll Readiness
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                payroll.isGenerated ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {payroll.isGenerated ? 'Generated' : 'Preparing Cycle'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Attendance-driven compensation estimates for current payroll cycle.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-[11px] text-slate-400 block">Projected Gross Burn</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white mt-1 block">
                  {formatINR(payroll.projectedGrossBurn || 0)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-[11px] text-slate-400 block">Loss-of-Pay Days</span>
                <span className="text-lg font-extrabold text-rose-600 mt-1 block">
                  {payroll.lopDaysAccumulated || 0} days
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-violet-50/50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 text-xs text-violet-700 dark:text-violet-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-violet-600" />
                Automated LOP Calculation Active
              </div>
              <p className="text-[11px] opacity-90">
                Any unpaid leaves or unregularized absences will automatically compute as deductions upon monthly run.
              </p>
            </div>
          </div>

          <Link
            href="/admin/hr/payroll"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <span>Open Payroll Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* HR Action Center (Pending Approvals across Organization) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Regularizations */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Pending Regularizations</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {alerts.pendingRegularizationsCount || 0}
              </span>
            </h3>
            <Link href="/admin/hr/attendance" className="text-xs font-semibold text-violet-600 hover:underline">
              View All
            </Link>
          </div>

          {(alerts.pendingRegularizations || []).length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">No pending attendance regularizations.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(alerts.pendingRegularizations || []).slice(0, 4).map((r: any) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{r.employee.name}</span>
                    <span className="text-slate-400 ml-1.5">({r.employee.department?.name})</span>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">"{r.reason}"</p>
                  </div>
                  <Link href="/admin/hr/attendance" className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 font-semibold text-[11px]">
                    Triage
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Leaves */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Pending Leave Applications</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold">
                {alerts.pendingLeavesCount || 0}
              </span>
            </h3>
            <Link href="/admin/hr/leaves" className="text-xs font-semibold text-violet-600 hover:underline">
              View All
            </Link>
          </div>

          {(alerts.pendingLeaves || []).length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">No pending leave applications.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(alerts.pendingLeaves || []).slice(0, 4).map((l: any) => (
                <div key={l.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{l.employee.name}</span>
                    <span className="text-slate-400 ml-1.5">• {l.leaveType} ({l.daysCount}d)</span>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">"{l.reason}"</p>
                  </div>
                  <Link href="/admin/hr/leaves" className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 font-semibold text-[11px]">
                    Triage
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
