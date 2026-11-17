'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Printer,
  X,
  FileText,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface PayrollRecord {
  id: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  grossSalary: number;
  totalDaysInMonth: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  lossOfPayDays: number;
  lossOfPayDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  allowances: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: string;
  paymentMode?: string | null;
  referenceNumber?: string | null;
  paymentDate?: string | null;
  notes?: string | null;
  employee: {
    id: string;
    name: string;
    employeeCode: string;
    companyEmail: string;
    phone?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
    panNumber?: string | null;
    department?: { name: string } | null;
    team?: { name: string } | null;
  };
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [metrics, setMetrics] = useState({
    totalGross: 0,
    totalNet: 0,
    totalLossOfPay: 0,
    employeeCount: 0,
    paidCount: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Payslip Modal
  const [viewPayslip, setViewPayslip] = useState<PayrollRecord | null>(null);

  // Status Change Modal
  const [statusModal, setStatusModal] = useState<PayrollRecord | null>(null);
  const [newStatus, setNewStatus] = useState('APPROVED');
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/payroll?month=${selectedMonth}&year=${selectedYear}`);
      const data = await res.json();
      if (res.ok) {
        setPayrolls(data.payrolls || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load payroll:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [selectedMonth, selectedYear]);

  const handleGeneratePayroll = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/hr/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Payroll generated successfully!');
        fetchPayroll();
      } else {
        alert(data.error || 'Failed to generate payroll');
      }
    } catch (err) {
      console.error('Error generating payroll:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModal) return;
    setStatusSubmitting(true);
    try {
      const res = await fetch('/api/hr/payroll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payrollId: statusModal.id,
          status: newStatus,
          paymentMode: newStatus === 'PAID' ? paymentMode : undefined,
          referenceNumber: newStatus === 'PAID' ? referenceNumber : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setStatusModal(null);
        setReferenceNumber('');
        fetchPayroll();
      } else {
        alert(data.error || 'Failed to update payroll status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setStatusSubmitting(false);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Automated Payroll & Compensation</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Attendance-Driven
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dynamic compensation processing linking actual attendance logs, leave balances, Loss-of-Pay (LOP) deductions, and corporate payslips.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGeneratePayroll}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md shadow-violet-500/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Processing Attendance...' : `Run ${monthNames[selectedMonth - 1]} Payroll`}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Net Payout</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{formatINR(metrics.totalNet)}</div>
            <span className="text-[11px] text-slate-400">Gross: {formatINR(metrics.totalGross)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Loss of Pay Deductions</span>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">{formatINR(metrics.totalLossOfPay)}</div>
            <span className="text-[11px] text-slate-400">Absences & unpaid leaves</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Disbursement Status</span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {metrics.paidCount} / {metrics.employeeCount}
            </div>
            <span className="text-[11px] text-slate-400">{metrics.pendingCount} Pending / Under Review</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Employees Processed</span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{metrics.employeeCount}</div>
            <span className="text-[11px] text-slate-400">Active Staff Ledger</span>
          </div>
        </div>
      </div>

      {/* Month / Year Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Calendar className="w-4 h-4 text-violet-500" />
            Payroll Month:
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-violet-500"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Year:
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-violet-500"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Showing compensation ledger for <strong>{monthNames[selectedMonth - 1]} {selectedYear}</strong>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Attendance Breakdown</th>
                <th className="px-5 py-3.5">Gross Salary</th>
                <th className="px-5 py-3.5">LOP Deduction</th>
                <th className="px-5 py-3.5">Net Payout</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
                    <p className="text-sm">Calculating payroll entries...</p>
                  </td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No payroll generated for {monthNames[selectedMonth - 1]} {selectedYear}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click the "Run Payroll" button above to compute attendance-driven salaries.
                    </p>
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => {
                  const gross = p.grossSalary || (p.basicSalary + p.allowances);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{p.employee.name}</div>
                        <span className="text-xs text-slate-400">
                          {p.employee.employeeCode} • {p.employee.department?.name || 'Operations'}
                        </span>
                        {p.employee.bankName && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {p.employee.bankName} (A/C: ••••{p.employee.accountNumber?.slice(-4) || '—'})
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                        <div>
                          Present: <strong>{p.presentDays || 0}</strong> / {p.totalDaysInMonth || 30} days
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Paid Leaves: {p.paidLeaveDays || 0} • LOP: <strong className="text-rose-600">{p.lossOfPayDays || 0}</strong> days
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {formatINR(gross)}
                        <div className="text-[10px] text-slate-400 font-normal">
                          Basic: {formatINR(p.basicSalary)}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">
                        {p.lossOfPayDeduction > 0 ? `-${formatINR(p.lossOfPayDeduction)}` : '₹0'}
                        {p.taxDeduction > 0 && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            TDS: -{formatINR(p.taxDeduction)}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatINR(p.netSalary)}
                      </td>

                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => {
                            setStatusModal(p);
                            setNewStatus(p.status === 'GENERATED' ? 'APPROVED' : p.status === 'APPROVED' ? 'PAID' : p.status);
                          }}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                            p.status === 'PAID'
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                              : p.status === 'APPROVED'
                              ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
                              : p.status === 'REVIEWED'
                              ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
                              : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                          }`}
                        >
                          {p.status} ✎
                        </button>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setViewPayslip(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-violet-500" />
                          Payslip
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Interactive & Printable Payslip */}
      {viewPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8">
            {/* Payslip Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
                    T
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                      TechInPedia Solutions Pvt. Ltd.
                    </h2>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Corporate Business OS • Payroll Division
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Payslip for: <strong>{monthNames[viewPayslip.month - 1]} {viewPayslip.year}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 hover:bg-violet-100 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button onClick={() => setViewPayslip(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Employee Information */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
              <div>
                <span className="text-slate-400 block">Employee Name</span>
                <strong className="text-slate-900 dark:text-white">{viewPayslip.employee.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Employee Code</span>
                <strong className="text-slate-900 dark:text-white">{viewPayslip.employee.employeeCode}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Department</span>
                <strong className="text-slate-900 dark:text-white">{viewPayslip.employee.department?.name || 'General'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">PAN Number</span>
                <strong className="text-slate-900 dark:text-white font-mono">{viewPayslip.employee.panNumber || 'ABCDE1234F'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Bank Name</span>
                <strong className="text-slate-900 dark:text-white">{viewPayslip.employee.bankName || 'HDFC Bank'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Account Number</span>
                <strong className="text-slate-900 dark:text-white font-mono">{viewPayslip.employee.accountNumber || '••••••••1234'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Days in Month</span>
                <strong className="text-slate-900 dark:text-white">{viewPayslip.totalDaysInMonth || 30} days</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Present / Paid</span>
                <strong className="text-emerald-600">{(viewPayslip.presentDays || 0) + (viewPayslip.paidLeaveDays || 0)} days</strong>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Earnings */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Earnings
                </div>
                <div className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Basic Salary</span>
                    <span className="font-mono font-semibold">{formatINR(viewPayslip.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">House Rent Allowance (HRA)</span>
                    <span className="font-mono font-semibold">{formatINR(viewPayslip.hra || viewPayslip.basicSalary * 0.4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Special Allowance</span>
                    <span className="font-mono font-semibold">{formatINR(viewPayslip.specialAllowance || viewPayslip.basicSalary * 0.2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-white">
                    <span>Gross Earnings</span>
                    <span className="font-mono">{formatINR(viewPayslip.grossSalary || (viewPayslip.basicSalary * 1.6))}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                  Deductions
                </div>
                <div className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Loss of Pay (LOP) ({viewPayslip.lossOfPayDays || 0} days)</span>
                    <span className="font-mono font-semibold text-rose-600">{formatINR(viewPayslip.lossOfPayDeduction || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TDS / Tax Deduction</span>
                    <span className="font-mono font-semibold">{formatINR(viewPayslip.taxDeduction || viewPayslip.basicSalary * 0.05)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Other Deductions</span>
                    <span className="font-mono font-semibold">{formatINR(viewPayslip.otherDeductions || 0)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-white">
                    <span>Total Deductions</span>
                    <span className="font-mono text-rose-600">
                      {formatINR((viewPayslip.lossOfPayDeduction || 0) + (viewPayslip.taxDeduction || viewPayslip.basicSalary * 0.05))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold opacity-90 block">Net Payable Salary (Direct Bank Transfer)</span>
                <span className="text-2xl font-black font-mono">{formatINR(viewPayslip.netSalary)}</span>
              </div>
              <div className="text-right text-xs opacity-90">
                <span>Status: <strong>{viewPayslip.status}</strong></span>
                {viewPayslip.paymentDate && (
                  <div className="text-[11px]">Paid On: {new Date(viewPayslip.paymentDate).toLocaleDateString()}</div>
                )}
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400">
              This is a system-generated document and does not require a physical signature.
            </div>
          </div>
        </div>
      )}

      {/* Modal: Update Status */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Update Payroll Status — {statusModal.employee.name}
              </h2>
              <button onClick={() => setStatusModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Lifecycle Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  <option value="GENERATED">GENERATED (Draft)</option>
                  <option value="REVIEWED">REVIEWED (Team Lead)</option>
                  <option value="APPROVED">APPROVED (HR Head)</option>
                  <option value="PAID">PAID (Disbursed)</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                </select>
              </div>

              {newStatus === 'PAID' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    >
                      <option value="BANK_TRANSFER">Bank NEFT / RTGS / IMPS</option>
                      <option value="UPI">UPI Direct</option>
                      <option value="CHEQUE">Corporate Cheque</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      UTR / Reference Number
                    </label>
                    <input
                      type="text"
                      required
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. UTR19284729104"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusSubmitting}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md transition-all"
                >
                  {statusSubmitting ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
