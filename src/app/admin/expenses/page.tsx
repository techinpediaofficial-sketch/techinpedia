'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Receipt,
  Calendar,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';

interface Expense {
  id: string;
  category: string;
  vendorName?: string | null;
  amount: number;
  taxAmount: number;
  date: string;
  paymentMethod: string;
  notes?: string | null;
  status: string;
  approvedBy?: string | null;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [metrics, setMetrics] = useState({ totalExpense: 0 });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Create Expense Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    category: 'INFRASTRUCTURE',
    vendorName: '',
    amount: '',
    taxAmount: '0',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
  });
  const [creating, setCreating] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/finance/expenses', window.location.origin);
      if (categoryFilter) url.searchParams.set('category', categoryFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok) {
        setExpenses(data.expenses || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setForm({
          category: 'INFRASTRUCTURE',
          vendorName: '',
          amount: '',
          taxAmount: '0',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'BANK_TRANSFER',
          notes: '',
        });
        fetchExpenses();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to record expense');
      }
    } catch (err) {
      console.error('Failed to record expense:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Expense Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track operational expenditures, cloud servers, hardware procurement, and company costs.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Log Expense
        </button>
      </div>

      {/* Metric Cards & Category Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Total Operational Expenditure
          </span>
          <span className="text-3xl font-extrabold text-red-600 mt-1 block">
            ₹{metrics.totalExpense.toLocaleString('en-IN')}
          </span>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        >
          <option value="">All Expense Categories</option>
          <option value="INFRASTRUCTURE">Cloud & Infrastructure</option>
          <option value="HARDWARE">Hardware Procurement</option>
          <option value="SOFTWARE_SUBSCRIPTIONS">Software Subscriptions</option>
          <option value="MARKETING">Marketing & Advertising</option>
          <option value="OFFICE">Office & Facilities</option>
          <option value="SALARY">Payroll / Contract Labor</option>
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Vendor / Payee</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Payment Method</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
                    <p className="text-sm">Loading expenses...</p>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-200">No operational expenses logged</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Log hardware purchases or cloud server subscriptions.</p>
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 dark:bg-slate-950/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                        {e.category}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white">{e.vendorName || 'General Payee'}</div>
                      {e.notes && <div className="text-slate-400 dark:text-slate-500 line-clamp-1">{e.notes}</div>}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600 text-slate-500 dark:text-slate-400">
                      {new Date(e.date).toLocaleDateString('en-IN')}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600 text-slate-500 dark:text-slate-400 font-medium">
                      {e.paymentMethod}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {e.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right font-bold text-red-600 text-sm">
                      -₹{e.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Expense Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Log Operational Expense</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900"
                  >
                    <option value="INFRASTRUCTURE">Cloud & Infrastructure</option>
                    <option value="HARDWARE">Hardware Procurement</option>
                    <option value="SOFTWARE_SUBSCRIPTIONS">Software Subscriptions</option>
                    <option value="MARKETING">Marketing & Advertising</option>
                    <option value="OFFICE">Office & Facilities</option>
                    <option value="SALARY">Payroll / Staffing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    value={form.vendorName}
                    onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="e.g. AWS, Dell, Google"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900"
                >
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="CARD">Corporate Credit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  placeholder="Monthly server billing..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-700 dark:text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
