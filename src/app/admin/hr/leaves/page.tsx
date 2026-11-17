'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Clock,
  Briefcase,
  HeartPulse,
  Award,
  AlertTriangle,
  User,
  Filter,
} from 'lucide-react';

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: string;
  approvedBy?: string | null;
  createdAt: string;
  employee: {
    id: string;
    name: string;
    employeeCode: string;
    companyEmail: string;
    department?: { name: string } | null;
    team?: { name: string } | null;
  };
}

interface LeaveBalance {
  id: string;
  year: number;
  leaveType: string;
  totalAllocated: number;
  used: number;
  pending: number;
  carriedForward: number;
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState('');

  // Apply Leave Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysCount, setDaysCount] = useState('1');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      let url = `/api/hr/leaves?status=${filterStatus}`;
      if (selectedEmpFilter) url += `&employeeId=${selectedEmpFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setLeaves(data.leaveRequests || []);
        if (data.balances) setBalances(data.balances);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [filterStatus, selectedEmpFilter]);

  useEffect(() => {
    fetch('/api/hr/employees')
      .then((res) => res.json())
      .then((data) => {
        if (data.employees) {
          setEmployees(data.employees);
          if (data.employees.length > 0 && !selectedEmployeeId) {
            setSelectedEmployeeId(data.employees[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Auto-calculate days count when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (e >= s) {
        const diffDays = Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
        setDaysCount(diffDays.toString());
      }
    }
  }, [startDate, endDate]);

  const handleUpdateStatus = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/hr/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId, status }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Leave ${status.toLowerCase()} successfully`);
        fetchLeaves();
      } else {
        alert(data.error || 'Failed to update leave status');
      }
    } catch (err) {
      console.error('Error updating leave status:', err);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/hr/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          leaveType,
          startDate,
          endDate,
          daysCount,
          reason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Leave applied successfully!');
        setShowModal(false);
        setReason('');
        setStartDate('');
        setEndDate('');
        fetchLeaves();
      } else {
        alert(data.error || 'Failed to apply leave');
      }
    } catch (err) {
      console.error('Error applying leave:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Current balance for modal selected type
  const activeBalance = balances.find((b) => b.leaveType === leaveType);
  const availableDays = activeBalance
    ? Math.max(0, activeBalance.totalAllocated + activeBalance.carriedForward - activeBalance.used - activeBalance.pending)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Leave Management & Balances</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              CY {new Date().getFullYear()} Quotas
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Annual leave allocations, real-time balance checks, and automated attendance synchronization upon approval.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-violet-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Apply For Leave
        </button>
      </div>

      {/* Leave Balances Visual Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.length > 0 ? (
          balances.map((b) => {
            const total = b.totalAllocated + b.carriedForward;
            const avail = Math.max(0, total - b.used - b.pending);
            const percentUsed = total > 0 ? Math.min(100, Math.round((b.used / total) * 100)) : 0;

            const config: Record<string, { icon: any; color: string; bg: string }> = {
              CASUAL: { icon: Briefcase, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' },
              SICK: { icon: HeartPulse, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500' },
              PAID: { icon: Award, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' },
              UNPAID: { icon: Clock, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500' },
            };

            const itemConfig = config[b.leaveType] || { icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-500' };
            const Icon = itemConfig.icon;

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {b.leaveType} LEAVE
                    </span>
                    <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 ${itemConfig.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{avail}</span>
                    <span className="text-xs text-slate-400">days available</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Used: <strong>{b.used}</strong> • Pending: <strong>{b.pending}</strong> • Total: <strong>{total}</strong>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Utilization</span>
                    <span>{percentUsed}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${itemConfig.bg} rounded-full transition-all duration-500`}
                      style={{ width: `${percentUsed}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-sm">
            Leave quotas initialize automatically on employee application or staff onboarding.
          </div>
        )}
      </div>

      {/* Filter and Stats Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Filter className="w-4 h-4 text-violet-500" />
            Status:
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-violet-500"
            >
              <option value="ALL">All Applications ({metrics.total})</option>
              <option value="PENDING">Pending Approvals ({metrics.pendingCount})</option>
              <option value="APPROVED">Approved ({metrics.approvedCount})</option>
              <option value="REJECTED">Rejected ({metrics.rejectedCount})</option>
            </select>
          </div>

          {employees.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <User className="w-4 h-4 text-slate-400" />
              Employee:
              <select
                value={selectedEmpFilter}
                onChange={(e) => setSelectedEmpFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-violet-500"
              >
                <option value="">All Staff</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>Pending: <strong className="text-amber-600">{metrics.pendingCount}</strong></span>
          <span>Approved: <strong className="text-emerald-600">{metrics.approvedCount}</strong></span>
          <span>Rejected: <strong className="text-rose-600">{metrics.rejectedCount}</strong></span>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Leave Type</th>
                <th className="px-5 py-3.5">Date Range</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">Reason</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
                    <p className="text-sm">Loading leave applications...</p>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No leave requests found</p>
                    <p className="text-xs text-slate-400 mt-1">Applications filed by employees will appear in this desk.</p>
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{l.employee.name}</div>
                      <span className="text-xs text-slate-400">
                        {l.employee.employeeCode} • {l.employee.department?.name || 'Operations'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {l.leaveType}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                      {new Date(l.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' → '}
                      {new Date(l.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {l.daysCount} {l.daysCount === 1 ? 'day' : 'days'}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 max-w-[260px]">
                      {l.reason}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === 'APPROVED'
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                            : l.status === 'REJECTED'
                            ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                            : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {l.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(l.id, 'APPROVED')}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 transition-colors"
                            title="Approve Leave & Sync Attendance"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(l.id, 'REJECTED')}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 transition-colors"
                            title="Reject Leave"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {l.status === 'APPROVED' ? `Approved (${l.approvedBy || 'HR'})` : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Apply Leave */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600" />
                Apply For Leave
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Employee Profile
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick Leave (SL)</option>
                  <option value="PAID">Paid Leave (PL)</option>
                  <option value="UNPAID">Unpaid Leave (Loss of Pay)</option>
                </select>

                {leaveType !== 'UNPAID' && (
                  <div className="mt-1.5 text-xs flex items-center justify-between text-slate-500">
                    <span>Available Balance:</span>
                    <span className={`font-bold ${availableDays > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {availableDays} day(s)
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Days Count
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={daysCount}
                  onChange={(e) => setDaysCount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Reason for Absence
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide details about the planned absence..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
