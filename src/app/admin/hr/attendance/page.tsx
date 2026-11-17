'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  Plus,
  Filter,
  ShieldCheck,
  MapPin,
  Laptop,
  Check,
  AlertTriangle,
  RefreshCw,
  Send,
  FileCheck,
} from 'lucide-react';

interface Attendance {
  id: string;
  totalHours: number;
  workMinutes: number;
  status: string;
  isLate: boolean;
  isEarlyExit: boolean;
  regularized: boolean;
  regularizationReason?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  ipAddress?: string | null;
  device?: string | null;
  notes?: string | null;
  date: string;
  employee: {
    id: string;
    name: string;
    employeeCode: string;
    department?: { id: string; name: string } | null;
    team?: { id: string; name: string } | null;
  };
}

interface Regularization {
  id: string;
  employeeId: string;
  date: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: string;
  managerNotes?: string | null;
  createdAt: string;
  employee: {
    id: string;
    name: string;
    employeeCode: string;
    department?: { name: string } | null;
  };
  approvedBy?: {
    name: string;
    employeeCode: string;
  } | null;
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'ledger' | 'regularizations'>('ledger');
  const [records, setRecords] = useState<Attendance[]>([]);
  const [regularizations, setRegularizations] = useState<Regularization[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    presentCount: 0,
    lateCount: 0,
    halfDayCount: 0,
    leaveCount: 0,
    regularizedCount: 0,
  });
  const [regMetrics, setRegMetrics] = useState({ pendingCount: 0, approvedCount: 0, rejectedCount: 0 });
  const [loading, setLoading] = useState(true);

  // Live Clock & Punch State
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [punchState, setPunchState] = useState<string>('NOT_CHECKED_IN');
  const [todayPunchRecord, setTodayPunchRecord] = useState<any>(null);
  const [punchLoading, setPunchLoading] = useState(false);

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('');

  // Regularize Modal
  const [showRegModal, setShowRegModal] = useState(false);
  const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [regInTime, setRegInTime] = useState('09:30');
  const [regOutTime, setRegOutTime] = useState('18:30');
  const [regReason, setRegReason] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);

  // Manual Record Modal (HR)
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualEmpId, setManualEmpId] = useState('');
  const [manualStatus, setManualStatus] = useState('PRESENT');
  const [manualHours, setManualHours] = useState('8');
  const [manualNotes, setManualNotes] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Decision Modal
  const [reviewModal, setReviewModal] = useState<Regularization | null>(null);
  const [managerNotes, setManagerNotes] = useState('');
  const [processingReview, setProcessingReview] = useState(false);

  // Real-time digital clock tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setCurrentDateStr(now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPunchStatus = async () => {
    try {
      const res = await fetch('/api/hr/attendance/punch');
      const data = await res.json();
      if (res.ok) {
        setPunchState(data.punchState || 'NOT_CHECKED_IN');
        setTodayPunchRecord(data.record);
      }
    } catch (err) {
      console.error('Failed to load punch status:', err);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let url = `/api/hr/attendance?date=${selectedDate}`;
      if (selectedStatus !== 'ALL') url += `&status=${selectedStatus}`;
      if (selectedDept) url += `&departmentId=${selectedDept}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegularizations = async () => {
    try {
      const res = await fetch('/api/hr/attendance/regularize');
      const data = await res.json();
      if (res.ok) {
        setRegularizations(data.requests || []);
        if (data.metrics) setRegMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load regularizations:', err);
    }
  };

  useEffect(() => {
    fetchPunchStatus();
    fetchAttendance();
    fetchRegularizations();

    fetch('/api/hr/employees')
      .then((res) => res.json())
      .then((data) => {
        if (data.employees) {
          setEmployees(data.employees);
          if (data.employees.length > 0 && !manualEmpId) {
            setManualEmpId(data.employees[0].id);
          }
        }
      })
      .catch(() => {});

    fetch('/api/hr/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.departments) setDepartments(data.departments);
      })
      .catch(() => {});
  }, [selectedDate, selectedStatus, selectedDept]);

  const handlePunch = async (action: 'CLOCK_IN' | 'CLOCK_OUT') => {
    setPunchLoading(true);
    try {
      const res = await fetch('/api/hr/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchPunchStatus();
        fetchAttendance();
      } else {
        alert(data.error || 'Punch action failed.');
      }
    } catch (err) {
      console.error('Punch failed:', err);
    } finally {
      setPunchLoading(false);
    }
  };

  const handleApplyRegularization = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReg(true);
    try {
      const startDateTime = new Date(`${regDate}T${regInTime}:00`);
      const endDateTime = new Date(`${regDate}T${regOutTime}:00`);

      const res = await fetch('/api/hr/attendance/regularize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: regDate,
          requestedCheckIn: startDateTime.toISOString(),
          requestedCheckOut: endDateTime.toISOString(),
          reason: regReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Regularization request submitted!');
        setShowRegModal(false);
        setRegReason('');
        fetchRegularizations();
      } else {
        alert(data.error || 'Failed to submit regularization request');
      }
    } catch (err) {
      console.error('Error submitting regularization:', err);
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleReviewDecision = async (status: 'APPROVED' | 'REJECTED') => {
    if (!reviewModal) return;
    setProcessingReview(true);
    try {
      const res = await fetch('/api/hr/attendance/regularize', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: reviewModal.id,
          status,
          managerNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setReviewModal(null);
        setManagerNotes('');
        fetchRegularizations();
        fetchAttendance();
      } else {
        alert(data.error || 'Failed to review request');
      }
    } catch (err) {
      console.error('Review decision error:', err);
    } finally {
      setProcessingReview(false);
    }
  };

  const handleManualRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSubmitting(true);
    try {
      const res = await fetch('/api/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: manualEmpId,
          status: manualStatus,
          totalHours: manualHours,
          notes: manualNotes,
        }),
      });
      if (res.ok) {
        setShowManualModal(false);
        setManualNotes('');
        fetchAttendance();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to record attendance');
      }
    } catch (err) {
      console.error('Failed to record attendance:', err);
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Attendance & Punch Desk</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50">
              Shift: 09:30 AM – 06:30 PM
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise attendance engine with web punch-in/out, automated late & half-day detection, and regularization approvals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowRegModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all"
          >
            <Send className="w-4 h-4 text-violet-500" />
            Request Regularization
          </button>
          <button
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-violet-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Manual Entry
          </button>
        </div>
      </div>

      {/* Hero Live Punch Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-gradient-to-br from-white via-slate-50/50 to-violet-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Time (IST)
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{currentDateStr}</span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white mt-2 tracking-tight">
                {currentTime || '09:30:00 AM'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> IP: {todayPunchRecord?.ipAddress || 'Auto Detected'}</span>
                <span className="flex items-center gap-1"><Laptop className="w-3.5 h-3.5 text-slate-400" /> Device: {todayPunchRecord?.device || 'Web Browser'}</span>
              </p>
            </div>

            {/* Punch Action Buttons */}
            <div className="w-full sm:w-auto flex flex-col sm:items-end gap-2.5">
              {punchState === 'NOT_CHECKED_IN' && (
                <button
                  onClick={() => handlePunch('CLOCK_IN')}
                  disabled={punchLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all text-sm"
                >
                  <Clock className="w-4 h-4" />
                  {punchLoading ? 'Clocking In...' : 'Clock In Now'}
                </button>
              )}

              {punchState === 'CHECKED_IN' && (
                <div className="flex flex-col sm:items-end gap-2">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Checked in at {todayPunchRecord?.checkIn ? new Date(todayPunchRecord.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                  <button
                    onClick={() => handlePunch('CLOCK_OUT')}
                    disabled={punchLoading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 transition-all text-sm"
                  >
                    <Clock className="w-4 h-4" />
                    {punchLoading ? 'Clocking Out...' : 'Clock Out'}
                  </button>
                </div>
              )}

              {punchState === 'CHECKED_OUT' && (
                <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Shift Complete ({todayPunchRecord?.totalHours || 8} hrs logged)
                </div>
              )}

              {punchState === 'NOT_REGISTERED_EMPLOYEE' && (
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  Admin session (Use manual entry or test employee profile).
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <span>Grace Period: <strong>15 mins (Late after 09:45 AM)</strong></span>
            <span>Half-Day Cutoff: <strong>Under 4 hours (240 mins)</strong></span>
            <span>Standard Exit: <strong>06:30 PM (Early exit before 06:00 PM)</strong></span>
          </div>
        </div>

        {/* Shift Policy Summary Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Regularization Queue</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                {regMetrics.pendingCount} Pending
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Missed punches and attendance disputes can be requested by employees and approved by Team Leads or HR.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('regularizations')}
            className="w-full mt-4 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950/40 dark:hover:text-violet-400 transition-colors flex items-center justify-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5" />
            Review Requests ({regMetrics.pendingCount})
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Present Today</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{metrics.presentCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Late Check-ins</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">{metrics.lateCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Half Days</span>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">{metrics.halfDayCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">On Leave</span>
          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 block">{metrics.leaveCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Regularized</span>
          <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1 block">{metrics.regularizedCount}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'ledger'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Attendance Ledger ({records.length})
        </button>
        <button
          onClick={() => setActiveTab('regularizations')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'regularizations'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Regularization Requests
          {regMetrics.pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
              {regMetrics.pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Attendance Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-violet-500" />
                Date:
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Filter className="w-4 h-4 text-slate-400" />
                Status:
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-violet-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </div>

              {departments.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Department:
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setSelectedStatus('ALL'); setSelectedDept(''); }}
              className="text-xs font-medium text-slate-500 hover:text-violet-600 transition-colors"
            >
              Reset Filters
            </button>
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Check In</th>
                    <th className="px-5 py-3.5">Check Out</th>
                    <th className="px-5 py-3.5">Work Duration</th>
                    <th className="px-5 py-3.5">Status & Flags</th>
                    <th className="px-5 py-3.5">IP / Device</th>
                    <th className="px-5 py-3.5 text-right">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
                        <p className="text-sm">Loading attendance entries...</p>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                        <AlertCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">No attendance entries for selected date & filters</p>
                        <p className="text-xs text-slate-400 mt-1">Use the Clock-in desk or record an entry manually.</p>
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">{r.employee.name}</div>
                          <span className="text-xs text-slate-400">
                            {r.employee.employeeCode} • {r.employee.department?.name || 'Operations'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
                          {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>

                        <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
                          {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>

                        <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                          {r.totalHours} hrs {r.workMinutes > 0 && <span className="text-slate-400 font-normal">({r.workMinutes}m)</span>}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === 'PRESENT'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                  : r.status === 'LATE'
                                  ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                                  : r.status === 'HALF_DAY'
                                  ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                                  : r.status === 'ON_LEAVE'
                                  ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {r.status}
                            </span>

                            {r.isLate && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                Late Entry
                              </span>
                            )}
                            {r.isEarlyExit && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                                Early Exit
                              </span>
                            )}
                            {r.regularized && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                                Regularized
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                          <div>{r.ipAddress || '—'}</div>
                          <div className="text-[10px] text-slate-400">{r.device || 'Desktop'}</div>
                        </td>

                        <td className="px-5 py-3.5 text-right text-xs text-slate-400 italic max-w-[200px] truncate">
                          {r.notes || r.regularizationReason || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Regularization Requests Queue */}
      {activeTab === 'regularizations' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Pending & Resolved Regularization Requests</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Approved requests automatically sync and recalculate the employee's attendance record and working hours.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">Total: {regularizations.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Missed Punch Date</th>
                  <th className="px-5 py-3.5">Requested Timing</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {regularizations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                      <FileCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No regularization requests filed</p>
                    </td>
                  </tr>
                ) : (
                  regularizations.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{req.employee.name}</div>
                        <span className="text-xs text-slate-400">{req.employee.employeeCode} • {req.employee.department?.name || 'Ops'}</span>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
                        {new Date(req.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      <td className="px-5 py-3.5 text-xs font-mono text-slate-600 dark:text-slate-300">
                        {new Date(req.requestedCheckIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        {' → '}
                        {new Date(req.requestedCheckOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 max-w-[280px]">
                        {req.reason}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'PENDING'
                              ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                              : req.status === 'APPROVED'
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                              : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {req.status === 'PENDING' ? (
                          <button
                            onClick={() => setReviewModal(req)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
                          >
                            Review & Decide
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {req.status === 'APPROVED' ? `Approved by ${req.approvedBy?.name || 'Manager'}` : 'Rejected'}
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
      )}

      {/* Modal: Request Regularization */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-violet-600" />
                Submit Attendance Regularization
              </h2>
              <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyRegularization} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Missed / Disputed Date
                </label>
                <input
                  type="date"
                  required
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Actual Check-In Time
                  </label>
                  <input
                    type="time"
                    required
                    value={regInTime}
                    onChange={(e) => setRegInTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Actual Check-Out Time
                  </label>
                  <input
                    type="time"
                    required
                    value={regOutTime}
                    onChange={(e) => setRegOutTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Reason for Regularization
                </label>
                <textarea
                  required
                  rows={3}
                  value={regReason}
                  onChange={(e) => setRegReason(e.target.value)}
                  placeholder="e.g. Worked from client site / System punch failure / Forgotten check-in..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReg}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md transition-all"
                >
                  {submittingReg ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Review Decision */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Review Regularization Request
              </h2>
              <button onClick={() => setReviewModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-bold text-slate-900 dark:text-white">{reviewModal.employee.name} ({reviewModal.employee.employeeCode})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(reviewModal.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Times:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {new Date(reviewModal.requestedCheckIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  {' → '}
                  {new Date(reviewModal.requestedCheckOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 block mb-1">Reason:</span>
                <p className="text-slate-700 dark:text-slate-300 italic">{reviewModal.reason}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Manager Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                placeholder="Add approval justification or notes..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={processingReview}
                onClick={() => handleReviewDecision('REJECTED')}
                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800 transition-colors"
              >
                Reject Request
              </button>
              <button
                type="button"
                disabled={processingReview}
                onClick={() => handleReviewDecision('APPROVED')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all"
              >
                {processingReview ? 'Approving...' : 'Approve & Sync Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual Record (Admin) */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record Manual Attendance</h2>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualRecord} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Select Employee</label>
                <select
                  value={manualEmpId}
                  onChange={(e) => setManualEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late Entry</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Logged Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Optional manual logging note"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md transition-all"
                >
                  {manualSubmitting ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
