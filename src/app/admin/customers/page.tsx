'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Building,
  UserCheck,
  CreditCard,
  Briefcase,
  Monitor,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  X,
  ExternalLink,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  lifetimeValue: number;
  createdAt: string;
  company?: { id: string; name: string } | null;
  contact?: { id: string; firstName: string; lastName: string } | null;
  _count: {
    deals: number;
    invoices: number;
    rentalOrders: number;
    projects: number;
    tickets: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'ACTIVE',
    notes: '',
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/crm/customers', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (statusFilter) url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setForm({
          name: '',
          email: '',
          phone: '',
          status: 'ACTIVE',
          notes: '',
        });
        fetchCustomers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create customer');
      }
    } catch (err) {
      console.error('Failed to create customer:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Customer Accounts & 360° Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Centralized accounts managing ongoing contracts, hardware rentals, SaaS seats, and projects.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Search & Status Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search customers by corporate name, primary email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 w-full sm:w-auto"
        >
          <option value="">All Customer Statuses</option>
          <option value="ACTIVE">Active Account</option>
          <option value="INACTIVE">Inactive / Paused</option>
          <option value="CHURNED">Churned</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3">Customer Account</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Corporate Entity</th>
                <th className="px-5 py-3">Active Services & Engagements</th>
                <th className="px-5 py-3 text-right">View 360°</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
                    <p className="text-sm">Loading customer accounts...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-200">No customer accounts recorded</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Convert a won deal or create a client account directly.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-violet-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="font-semibold text-slate-900 dark:text-white hover:text-violet-600 transition-colors block"
                      >
                        {c.name}
                      </Link>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{c.email}</span>
                        {c.phone && (
                          <>
                            <span>•</span>
                            <span>{c.phone}</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : c.status === 'CHURNED'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      {c.company ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-100">
                          <Building className="w-3.5 h-3.5 text-violet-600" />
                          {c.company.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">Individual Account</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600 text-slate-500 dark:text-slate-400">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {c._count.rentalOrders > 0 && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-medium flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {c._count.rentalOrders} Rentals
                          </span>
                        )}
                        {c._count.projects > 0 && (
                          <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100 text-[10px] font-medium flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {c._count.projects} Projects
                          </span>
                        )}
                        {c._count.invoices > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-medium flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {c._count.invoices} Invoices
                          </span>
                        )}
                        {c._count.rentalOrders === 0 && c._count.projects === 0 && c._count.invoices === 0 && (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">No active contracts yet</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-violet-600 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-medium text-slate-700 dark:text-slate-700 dark:text-slate-200 transition-all"
                      >
                        <span>Customer 360</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Customer Account</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Customer / Account Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  placeholder="e.g. Acme Corporation or Rajesh Patel"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Billing Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="billing@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  placeholder="Billing instructions, key requirements..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
