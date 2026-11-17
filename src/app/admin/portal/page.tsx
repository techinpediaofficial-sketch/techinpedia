'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  FileText,
  Send,
  Briefcase,
  HeartPulse,
  Award,
  Plus,
  Printer,
  ChevronRight,
  ShieldCheck,
  User,
  Building2,
  Users2,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Laptop,
  Check,
  CalendarDays,
} from 'lucide-react';

export default function ESSPortalPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [punchLoading, setPunchLoading] = useState(false);

  // Payslip Modal
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  // Apply Leave Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveDays, setLeaveDays] = useState('1');
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Regularize Modal
  const [showRegModal, setShowRegModal] = useState(false);
  const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [regInTime, setRegInTime] = useState('09:30');
  const [regOutTime, setRegOutTime] = useState('18:30');
  const [regReason, setRegReason] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);

  // Digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setCurrentDateStr(now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchESS = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboards/ess');
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load ESS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchESS();
  }, []);

  const handlePunch = async (action: 'CLOCK_IN' | 'CLOCK_OUT') => {
    setPunchLoading(true);
    try {
      const res = await fetch('/api/hr/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const resJson = await res.json();
      if (res.ok) {
        alert(resJson.message);
        fetchESS();
      } else {
        alert(resJson.error || 'Punch failed');
      }
    } catch (err) {
      console.error('Punch error:', err);
    } finally {
      setPunchLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLeave(true);
    try {
      const res = await fetch('/api/hr/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: data?.employee?.id,
          leaveType,
          startDate: leaveStart,
          endDate: leaveEnd,
          daysCount: leaveDays,
          reason: leaveReason,
        }),
      });
      const resJson = await res.json();
      if (res.ok) {
        alert(resJson.message || 'Leave applied successfully!');
        setShowLeaveModal(false);
        setLeaveReason('');
        fetchESS();
      } else {
        alert(resJson.error || 'Failed to submit leave');
      }
    } catch (err) {
      console.error('Leave error:', err);
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleRegularize = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReg(true);
    try {
      const startDateTime = new Date(`${regDate}T${regInTime}:00`);
      const endDateTime = new Date(`${regDate}T${regOutTime}:00`);

      const res = await fetch('/api/hr/attendance/regularize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: data?.employee?.id,
          date: regDate,
          requestedCheckIn: startDateTime.toISOString(),
          requestedCheckOut: endDateTime.toISOString(),
          reason: regReason,
        }),
      });
      const resJson = await res.json();
      if (res.ok) {
        alert(resJson.message || 'Regularization request submitted!');
        setShowRegModal(false);
        setRegReason('');
        fetchESS();
      } else {
        alert(resJson.error || 'Failed to submit regularization');
      }
    } catch (err) {
      console.error('Regularize error:', err);
    } finally {
      setSubmittingReg(false);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent mb-3"></div>
        <p className="text-sm text-slate-500">Loading your self-service workspace...</p>
      </div>
    );
  }

  const emp = data?.employee;
  const punchState = data?.punchState || 'NOT_CHECKED_IN';
  const todayRec = data?.todayRecord;
  const attSummary = data?.monthlyAttendance;

  return (
    <div className="space-y-6">
      {/* Employee Profile Hero */}
      <div className="bg-gradient-to-br from-white via-slate-50/60 to-violet-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
              {emp?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {emp?.name || 'Staff Member'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Active Staff
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span>Code: <strong>{emp?.employeeCode || 'EMP-001'}</strong></span>
                <span>•</span>
                <span>{emp?.designation?.title || 'Associate'}</span>
                <span>•</span>
                <span>{emp?.department?.name || 'Operations'} ({emp?.team?.name || 'General'})</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {emp?.companyEmail}</span>
                {emp?.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {emp?.phone}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowLeaveModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-sm transition-all"
            >
              <Calendar className="w-4 h-4 text-violet-500" />
              Apply Leave
            </button>
            <button
              onClick={() => setShowRegModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              Request Regularization
            </button>
          </div>
        </div>
      </div>
      {/* Task Alerts */}
      {data?.assignedTasks?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 shadow-sm mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full text-yellow-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-yellow-900">New Task Assigned</h3>
              <p className="text-xs text-yellow-800 mt-0.5">You have {data.assignedTasks.length} active task(s) waiting for you.</p>
            </div>
          </div>
          <a href="/admin/tasks" className="px-5 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap">
            View Tasks
          </a>
        </div>
      )}

      {/* Grid: Live Punch Widget & Monthly Attendance Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Punch Desk Widget */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Web Punch (IST)
                </span>
                <span className="text-xs text-slate-400">{currentDateStr}</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white mt-2">
                {currentTime || '09:30:00 AM'}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {todayRec?.ipAddress || 'Auto Logged'}</span>
                <span className="flex items-center gap-1"><Laptop className="w-3.5 h-3.5" /> {todayRec?.device || 'Desktop'}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div>
              {punchState === 'NOT_CHECKED_IN' && (
                <button
                  onClick={() => handlePunch('CLOCK_IN')}
                  disabled={punchLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 text-sm"
                >
                  <Clock className="w-4 h-4" />
                  {punchLoading ? 'Recording...' : 'Clock In (09:30 AM Shift)'}
                </button>
              )}

              {punchState === 'CHECKED_IN' && (
                <div className="flex flex-col sm:items-end gap-2">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    In at {todayRec?.checkIn ? new Date(todayRec.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                  <button
                    onClick={() => handlePunch('CLOCK_OUT')}
                    disabled={punchLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/20 text-sm"
                  >
                    <Clock className="w-4 h-4" />
                    {punchLoading ? 'Recording...' : 'Clock Out (Shift End)'}
                  </button>
                </div>
              )}

              {punchState === 'CHECKED_OUT' && (
                <div className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Shift Complete ({todayRec?.totalHours || 8} hrs logged)
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Shift: <strong>09:30 AM – 06:30 PM</strong></span>
            <span>Grace: <strong>15 mins (Late after 09:45 AM)</strong></span>
            <span>Half-Day: <strong>Under 4 hours (240 mins)</strong></span>
          </div>
        </div>

        {/* Monthly Attendance Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">This Month's Attendance</span>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-[11px] text-slate-400 block">Present Days</span>
                <span className="text-xl font-extrabold text-emerald-600">{attSummary?.presentDays || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-[11px] text-slate-400 block">Late Check-ins</span>
                <span className="text-xl font-extrabold text-amber-600">{attSummary?.lateDays || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-[11px] text-slate-400 block">Half Days</span>
                <span className="text-xl font-extrabold text-indigo-600">{attSummary?.halfDays || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span className="text-[11px] text-slate-400 block">Leaves Taken</span>
                <span className="text-xl font-extrabold text-purple-600">{attSummary?.leaveDays || 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            Records logged this month: <strong>{attSummary?.totalRecorded || 0}</strong>
          </div>
        </div>
      </div>

      {/* Leave Balances Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(data?.leaveBalances || []).map((b: any) => {
          const total = b.totalAllocated + b.carriedForward;
          const avail = Math.max(0, total - b.used - b.pending);
          const percentUsed = total > 0 ? Math.min(100, Math.round((b.used / total) * 100)) : 0;

          const config: Record<string, { icon: any; color: string; bg: string }> = {
            CASUAL: { icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-500' },
            SICK: { icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-500' },
            PAID: { icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-500' },
            UNPAID: { icon: Clock, color: 'text-slate-600', bg: 'bg-slate-500' },
          };
          const itemConfig = config[b.leaveType] || { icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-500' };
          const Icon = itemConfig.icon;

          return (
            <div key={b.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{b.leaveType} LEAVE</span>
                  <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 ${itemConfig.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{avail}</span>
                  <span className="text-xs text-slate-400">days left</span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Used: {b.used} • Total: {total}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${itemConfig.bg} rounded-full`} style={{ width: `${percentUsed}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Payslips & Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Payslips */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-violet-500" />
              My Recent Payslips
            </h2>
            <span className="text-xs text-slate-400">Confidential</span>
          </div>

          {(data?.recentPayrolls || []).length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No payslips released yet. Payslips appear here once generated by HR.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(data?.recentPayrolls || []).map((p: any) => (
                <div key={p.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {monthNames[p.month - 1]} {p.year}
                    </div>
                    <span className="text-xs text-slate-400">
                      Net: <strong className="text-emerald-600">{formatINR(p.netSalary)}</strong> • Gross: {formatINR(p.grossSalary || (p.basicSalary * 1.6))}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {p.status}
                    </span>
                    <button
                      onClick={() => setSelectedPayslip(p)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Recent Leave Applications */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-violet-500" />
              My Leave Requests
            </h2>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="text-xs font-semibold text-violet-600 hover:underline"
            >
              + Apply New
            </button>
          </div>

          {(data?.recentLeaves || []).length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No leave requests filed yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(data?.recentLeaves || []).map((l: any) => (
                <div key={l.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">
                      {l.leaveType} • {l.daysCount} {l.daysCount === 1 ? 'day' : 'days'}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(l.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' → '}
                      {new Date(l.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    l.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : l.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Interactive Corporate Payslip */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  TechInPedia Solutions Pvt. Ltd.
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Payslip for: <strong>{monthNames[selectedPayslip.month - 1]} {selectedPayslip.year}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-600 hover:bg-violet-100"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / PDF
                </button>
                <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <div><span className="text-slate-400 block">Name:</span> <strong>{selectedPayslip.employee?.name}</strong></div>
              <div><span className="text-slate-400 block">Code:</span> <strong>{selectedPayslip.employee?.employeeCode}</strong></div>
              <div><span className="text-slate-400 block">Bank:</span> <strong>{selectedPayslip.employee?.bankName || 'HDFC Bank'}</strong></div>
              <div><span className="text-slate-400 block">A/C:</span> <strong>{selectedPayslip.employee?.accountNumber || '••••••••1234'}</strong></div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2">
                <div className="font-bold uppercase text-slate-400 text-[10px]">Earnings</div>
                <div className="flex justify-between"><span>Basic:</span> <strong>{formatINR(selectedPayslip.basicSalary)}</strong></div>
                <div className="flex justify-between"><span>HRA:</span> <strong>{formatINR(selectedPayslip.hra || selectedPayslip.basicSalary * 0.4)}</strong></div>
                <div className="flex justify-between"><span>Special Allowance:</span> <strong>{formatINR(selectedPayslip.specialAllowance || selectedPayslip.basicSalary * 0.2)}</strong></div>
                <div className="pt-2 border-t font-bold flex justify-between"><span>Gross:</span> <span>{formatINR(selectedPayslip.grossSalary || selectedPayslip.basicSalary * 1.6)}</span></div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2">
                <div className="font-bold uppercase text-slate-400 text-[10px]">Deductions</div>
                <div className="flex justify-between"><span>LOP Deduction:</span> <strong className="text-rose-600">{formatINR(selectedPayslip.lossOfPayDeduction || 0)}</strong></div>
                <div className="flex justify-between"><span>TDS / Tax:</span> <strong>{formatINR(selectedPayslip.taxDeduction || selectedPayslip.basicSalary * 0.05)}</strong></div>
                <div className="pt-2 border-t font-bold flex justify-between"><span>Total Deductions:</span> <span className="text-rose-600">{formatINR((selectedPayslip.lossOfPayDeduction || 0) + (selectedPayslip.taxDeduction || selectedPayslip.basicSalary * 0.05))}</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <span className="text-xs opacity-90 block">Net Payable Salary</span>
                <span className="text-2xl font-black font-mono">{formatINR(selectedPayslip.netSalary)}</span>
              </div>
              <div className="text-xs opacity-90 text-right">
                <span>Status: <strong>{selectedPayslip.status}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Apply Leave */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-600" />
                Apply For Leave
              </h2>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick Leave (SL)</option>
                  <option value="PAID">Paid Leave (PL)</option>
                  <option value="UNPAID">Unpaid Leave (Loss of Pay)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Reason for absence..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold"
                >
                  {submittingLeave ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Regularization */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-violet-600" />
                Request Attendance Regularization
              </h2>
              <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegularize} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Missed Date</label>
                <input
                  type="date"
                  required
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Check-in</label>
                  <input
                    type="time"
                    required
                    value={regInTime}
                    onChange={(e) => setRegInTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Check-out</label>
                  <input
                    type="time"
                    required
                    value={regOutTime}
                    onChange={(e) => setRegOutTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={regReason}
                  onChange={(e) => setRegReason(e.target.value)}
                  placeholder="Explain missed biometric/web punch..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReg}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold"
                >
                  {submittingReg ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
