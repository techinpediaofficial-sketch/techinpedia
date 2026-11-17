'use client';

import { useState, useEffect } from 'react';
import {
  Users2,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Calendar,
  Check,
  X,
  Send,
  Building2,
  FileCheck,
  CalendarDays,
  UserCheck,
  Phone,
  Mail,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export default function ManagerDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'approvals' | 'pipeline'>('roster');

  const fetchManagerData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboards/manager');
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load manager dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  const handleLeaveDecision = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/hr/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId, status }),
      });
      const json = await res.json();
      if (res.ok) {
        alert(json.message);
        fetchManagerData();
      } else {
        alert(json.error || 'Failed to review leave');
      }
    } catch (err) {
      console.error('Review leave error:', err);
    }
  };

  const handleRegularizationDecision = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/hr/attendance/regularize', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status }),
      });
      const json = await res.json();
      if (res.ok) {
        alert(json.message);
        fetchManagerData();
      } else {
        alert(json.error || 'Failed to review regularization');
      }
    } catch (err) {
      console.error('Review regularization error:', err);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent mb-3"></div>
        <p className="text-sm text-slate-500">Loading operational team cockpit...</p>
      </div>
    );
  }

  const team = data?.team;
  const metrics = data?.metrics || {};
  const roster = data?.roster || [];
  const approvals = data?.pendingApprovals || { leaves: [], regularizations: [] };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Manager & Team Leader Cockpit</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              {team?.name || 'Operations Team'}
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time team presence, approval triage queue, sales velocity, and delivery oversight.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Dept: <strong>{team?.department?.name || 'Corporate'}</strong></span>
          <span>•</span>
          <span>Leader: <strong>{team?.leader?.name || 'Team Lead'}</strong></span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Team Size</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">{metrics.totalMembers || 0}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Clocked In</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{metrics.presentCount || 0}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Late Entries</span>
          <span className="text-2xl font-extrabold text-amber-600 mt-1 block">{metrics.lateCount || 0}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">On Leave</span>
          <span className="text-2xl font-extrabold text-purple-600 mt-1 block">{metrics.leaveCount || 0}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Pending Actions</span>
          <span className="text-2xl font-extrabold text-rose-600 mt-1 block">{metrics.pendingApprovalsCount || 0}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Team Pipeline</span>
          <span className="text-xl font-extrabold text-violet-600 mt-1 block">{formatINR(metrics.pipelineValue || 0)}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'roster'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Live Team Roster ({roster.length})
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pending Approvals Queue
          {metrics.pendingApprovalsCount > 0 && (
            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
              {metrics.pendingApprovalsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'pipeline'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Team Pipeline & Follow-ups ({(data?.teamDeals || []).length})
        </button>
      </div>

      {/* Tab 1: Live Team Roster */}
      {activeTab === 'roster' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-3.5">Team Member</th>
                  <th className="px-5 py-3.5">Check In Time</th>
                  <th className="px-5 py-3.5">Duration Logged</th>
                  <th className="px-5 py-3.5">Presence Status</th>
                  <th className="px-5 py-3.5">Flags</th>
                  <th className="px-5 py-3.5 text-right">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {roster.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                      <span className="text-xs text-slate-400">{m.employeeCode} • {m.designation?.title || 'Team Member'}</span>
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono text-slate-700 dark:text-slate-300">
                      {m.attendance?.checkIn
                        ? new Date(m.attendance.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {m.attendance?.totalHours ? `${m.attendance.totalHours} hrs` : '0 hrs'}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        m.punchStatus === 'CHECKED_IN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : m.punchStatus === 'CHECKED_OUT'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : m.punchStatus === 'ON_LEAVE'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {m.punchStatus.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {m.attendance?.isLate && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-800">
                            Late
                          </span>
                        )}
                        {m.attendance?.isEarlyExit && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-100 text-rose-800">
                            Early Exit
                          </span>
                        )}
                        {!m.attendance?.isLate && !m.attendance?.isEarlyExit && m.attendance && (
                          <span className="text-xs text-slate-400">On Track</span>
                        )}
                        {!m.attendance && <span className="text-xs text-slate-400">—</span>}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right text-xs text-slate-400">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`mailto:${m.companyEmail}`} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                        {m.phone && (
                          <a href={`tel:${m.phone}`} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Pending Approvals Queue */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Leaves Approvals */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Team Leave Applications (Pending Review)</span>
              <span className="text-xs font-normal text-slate-400">
                Approving automatically updates employee attendance records
              </span>
            </h2>

            {approvals.leaves.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No pending leave requests from team members.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {approvals.leaves.map((l: any) => (
                  <div key={l.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {l.employee.name} ({l.employee.employeeCode})
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {l.leaveType} • {l.daysCount} days ({new Date(l.startDate).toLocaleDateString('en-IN')} → {new Date(l.endDate).toLocaleDateString('en-IN')})
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                        "{l.reason}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLeaveDecision(l.id, 'REJECTED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleLeaveDecision(l.id, 'APPROVED')}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      >
                        Approve & Sync
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Regularizations Approvals */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Attendance Regularizations (Pending Review)</span>
              <span className="text-xs font-normal text-slate-400">
                Approving recalculates working hours and marks regularized
              </span>
            </h2>

            {approvals.regularizations.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No pending regularization requests.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {approvals.regularizations.map((r: any) => (
                  <div key={r.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {r.employee.name} ({r.employee.employeeCode})
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Date: {new Date(r.date).toLocaleDateString('en-IN')} • Timing: {new Date(r.requestedCheckIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} → {new Date(r.requestedCheckOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                        "{r.reason}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRegularizationDecision(r.id, 'REJECTED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleRegularizationDecision(r.id, 'APPROVED')}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      >
                        Approve & Sync
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Team Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Team Deals</h2>
            {(data?.teamDeals || []).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No active deals assigned to team members.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.teamDeals || []).map((d: any) => (
                  <div key={d.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{d.title}</div>
                      <span className="text-xs text-slate-400">Owner: {d.assignedEmployee?.name || 'Staff'} • Stage: {d.stage?.name}</span>
                    </div>
                    <span className="font-mono font-bold text-sm text-emerald-600">{formatINR(d.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Scheduled Follow-ups</h2>
            {(data?.teamFollowUps || []).length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No pending follow-ups for team members.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.teamFollowUps || []).map((f: any) => (
                  <div key={f.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">{f.notes || 'Follow-up Task'}</div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(f.scheduledAt).toLocaleDateString('en-IN')} • Rep: {f.assignedEmployee?.name || 'Staff'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-semibold">
                      {f.type || 'CALL'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
