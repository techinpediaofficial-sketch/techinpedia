'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Plus,
  DollarSign,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  TrendingUp,
  Users,
  Building2,
  Layers,
  Settings,
  XCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import GeneratePaymentLinkModal from '@/components/admin/GeneratePaymentLinkModal';

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'links' | 'ledger' | 'analytics'>('links');
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [metrics, setMetrics] = useState({ totalCollected: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, linkRes, repRes] = await Promise.all([
        fetch('/api/finance/payments'),
        fetch(`/api/payments/links?status=${statusFilter}&search=${encodeURIComponent(search)}`),
        fetch('/api/payments/reports'),
      ]);

      const [payData, linkData, repData] = await Promise.all([
        payRes.json(),
        linkRes.json(),
        repRes.json(),
      ]);

      if (payRes.ok) {
        setPayments(payData.payments || []);
        if (payData.metrics) setMetrics(payData.metrics);
      }
      if (linkRes.ok) {
        setPaymentLinks(linkData.links || []);
      }
      if (repRes.ok) {
        setReports(repData);
      }
    } catch (err) {
      console.error('Failed to load payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCopyLink = (shortUrl: string, id: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancelLink = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this payment link?')) return;
    try {
      const res = await fetch(`/api/payments/links/${id}/cancel`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel link');
      }
    } catch (err) {
      console.error('Cancel link error:', err);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'CREATED':
      case 'SENT':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'CANCELLED':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      case 'EXPIRED':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Razorpay Payment System & Ledger</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
              Official API
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Attributed payment links, automated webhook receipts, and departmental collection tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/settings/integrations"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Config</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Payment Link</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Realized Revenue
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
            {formatINR(metrics.totalCollected || reports?.metrics?.totalCollected || 0)}
          </span>
          <span className="text-xs text-slate-400 mt-0.5 block">From verified bank & Razorpay receipts</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Payment Links Issued
            </span>
            <CreditCard className="w-4 h-4 text-violet-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
            {paymentLinks.length}
          </span>
          <span className="text-xs text-slate-400 mt-0.5 block">
            {paymentLinks.filter((l) => l.status === 'PAID').length} Paid links
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Completed Transactions
            </span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
            {payments.length}
          </span>
          <span className="text-xs text-slate-400 mt-0.5 block">In transaction ledger</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Attributed Reps
            </span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block">
            {reports?.metrics?.attributedEmployeesCount || 0} Staff
          </span>
          <span className="text-xs text-slate-400 mt-0.5 block">With closed collections</span>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('links')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'links'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Links ({paymentLinks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Receipts Ledger ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-violet-600 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Attribution & Analytics</span>
        </button>
      </div>

      {/* TAB 1: Payment Links Desk */}
      {activeTab === 'links' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="CREATED">Active / Sent</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by client, ID, purpose..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                className="px-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-64 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={fetchData}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Search
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-3">Link / ID</th>
                    <th className="px-5 py-3">Client & Purpose</th>
                    <th className="px-5 py-3">Attributed Staff</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Amount (₹)</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                        <div className="inline-block animate-spin rounded-full h-7 w-7 border-3 border-violet-500 border-t-transparent mb-2"></div>
                        <p className="text-xs">Loading payment links...</p>
                      </td>
                    </tr>
                  ) : paymentLinks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-xs">
                        No payment links match your filter. Click "Generate Payment Link" to create one.
                      </td>
                    </tr>
                  ) : (
                    paymentLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400">
                            {link.providerLinkId}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(link.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {link.clientName || 'Direct Client'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{link.purpose.replace(/_/g, ' ')}</span>
                            {link.clientEmail && <span>• {link.clientEmail}</span>}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">
                            {link.salesEmployee?.name || link.createdByUser?.name || 'Admin'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {link.department?.name || 'General Operations'}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(link.status)}`}>
                            {link.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right font-extrabold text-slate-900 dark:text-white text-sm">
                          {formatINR(link.amount)}
                        </td>

                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleCopyLink(link.shortUrl, link.id)}
                              title="Copy URL"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                            >
                              {copiedId === link.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {link.clientPhone && (
                              <a
                                href={`https://wa.me/${link.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `Hello, here is your payment link for ${link.purpose}: ${link.shortUrl}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Share via WhatsApp"
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {link.status !== 'PAID' && link.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleCancelLink(link.id)}
                                title="Cancel Link"
                                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* TAB 2: Receipts Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-3">Receipt / ID</th>
                  <th className="px-5 py-3">Customer / Invoice</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Gateway / Method</th>
                  <th className="px-5 py-3">Reference / UTR</th>
                  <th className="px-5 py-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
                      <p className="text-sm">Loading payments ledger...</p>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-xs">
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                          {payment.providerPaymentId || payment.id.substring(0, 10)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {payment.provider === 'RAZORPAY' ? (
                            <span className="text-violet-600 font-semibold">Razorpay Verified</span>
                          ) : (
                            <span>Offline / Manual</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {payment.customer?.name || 'Direct Customer'}
                        </div>
                        {payment.invoice && (
                          <div className="text-[11px] text-slate-400">
                            Invoice: {payment.invoice.invoiceNumber}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {payment.paymentMethod}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {payment.referenceId || 'N/A'}
                      </td>

                      <td className="px-5 py-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatINR(payment.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Attribution & Analytics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Employee Leaderboard */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-600" />
              <span>Sales Staff Collection Attribution</span>
            </h3>

            {!reports?.employeeLeaderboard || reports.employeeLeaderboard.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No attributed staff collections recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {reports.employeeLeaderboard.map((item: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.employee.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.employee.employeeCode} • {item.employee.department?.name || 'Sales'} • {item.count} closed payments
                      </div>
                    </div>
                    <div className="font-extrabold text-emerald-600 text-sm">
                      {formatINR(item.totalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Department Breakdown */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Departmental Collections</span>
            </h3>

            {!reports?.departmentBreakdown || reports.departmentBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No departmental records yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {reports.departmentBreakdown.map((item: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{item.count} payments processed</div>
                    </div>
                    <div className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                      {formatINR(item.totalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Payment Link Modal */}
      <GeneratePaymentLinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
