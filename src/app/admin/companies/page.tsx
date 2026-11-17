'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Building,
  Globe,
  Mail,
  Phone,
  Briefcase,
  Users,
  AlertCircle,
  X,
  ExternalLink,
  Sparkles,
  Send,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Layers,
  ChevronRight,
  Edit3,
  Trash2,
  AlertTriangle,
  MapPin,
  FileText,
  CreditCard,
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  industry?: string | null;
  domain?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  gstNumber?: string | null;
  notes?: string | null;
  isTenant?: boolean;
  tenantStatus?: string;
  planName?: string;
  monthlyMessageLimit?: number;
  maxEmployees?: number;
  allowedModules?: string;
  whatsappConnections?: Array<{
    id: string;
    businessPhoneNumber?: string | null;
    displayName?: string | null;
    status: string;
    qualityRating: string;
  }>;
  createdAt: string;
  _count: {
    contacts: number;
    deals: number;
    customers: number;
    users?: number;
    whatsappConversations?: number;
  };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'TENANTS' | 'CRM'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit State
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    industry: 'Information Technology',
    website: '',
    domain: '',
    phone: '',
    email: '',
    address: '',
    city: 'Delhi NCR',
    state: '',
    country: 'India',
    postalCode: '',
    gstNumber: '',
    notes: '',
    isTenant: true,
    tenantStatus: 'ACTIVE',
    planName: 'WhatsApp SaaS Starter',
    monthlyMessageLimit: 10000,
    maxEmployees: 5,
    allowedModules: ['whatsapp'],
  });

  // Delete State
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    industry: 'Information Technology',
    website: '',
    phone: '',
    email: '',
    city: 'Delhi NCR',
    gstNumber: '',
    notes: '',
    isTenant: true,
    planName: 'WhatsApp SaaS Starter',
    monthlyMessageLimit: 10000,
    maxEmployees: 5,
    allowedModules: ['whatsapp'],
    adminEmail: '',
    adminPassword: '',
    adminName: '',
  });

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/crm/companies', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (filterTab !== 'ALL') url.searchParams.set('filter', filterTab);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok) {
        setCompanies(data.companies || []);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [search, filterTab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/crm/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreateModal(false);
        setForm({
          name: '',
          industry: 'Information Technology',
          website: '',
          phone: '',
          email: '',
          city: 'Delhi NCR',
          gstNumber: '',
          notes: '',
          isTenant: true,
          planName: 'WhatsApp SaaS Starter',
          monthlyMessageLimit: 10000,
          maxEmployees: 5,
          allowedModules: ['whatsapp'],
          adminEmail: '',
          adminPassword: '',
          adminName: '',
        });
        fetchCompanies();
        if (data.company?.id) {
          window.location.href = `/admin/companies/${data.company.id}`;
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create company');
      }
    } catch (err) {
      console.error('Failed to create company:', err);
    } finally {
      setCreating(false);
    }
  };

  const toggleModule = (mod: string) => {
    if (mod === 'whatsapp') return;
    setForm((prev) => ({
      ...prev,
      allowedModules: prev.allowedModules.includes(mod)
        ? prev.allowedModules.filter((m) => m !== mod)
        : [...prev.allowedModules, mod],
    }));
  };

  const handleOpenEdit = (c: Company) => {
    setEditingCompany(c);
    let modules = ['whatsapp'];
    if (c.allowedModules) {
      try {
        const parsed = JSON.parse(c.allowedModules);
        if (Array.isArray(parsed)) modules = parsed;
      } catch {}
    }
    setEditForm({
      name: c.name || '',
      industry: c.industry || 'Information Technology',
      website: c.website || '',
      domain: c.domain || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      city: c.city || 'Delhi NCR',
      state: c.state || '',
      country: c.country || 'India',
      postalCode: c.postalCode || '',
      gstNumber: c.gstNumber || '',
      notes: c.notes || '',
      isTenant: Boolean(c.isTenant),
      tenantStatus: c.tenantStatus || 'ACTIVE',
      planName: c.planName || 'WhatsApp SaaS Starter',
      monthlyMessageLimit: c.monthlyMessageLimit || 10000,
      maxEmployees: c.maxEmployees || 5,
      allowedModules: modules,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/companies/${editingCompany.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingCompany(null);
        fetchCompanies();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update company');
      }
    } catch (err) {
      console.error('Failed to update company:', err);
      alert('Network error while updating company');
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleEditModule = (mod: string) => {
    if (mod === 'whatsapp') return;
    setEditForm((prev) => ({
      ...prev,
      allowedModules: prev.allowedModules.includes(mod)
        ? prev.allowedModules.filter((m) => m !== mod)
        : [...prev.allowedModules, mod],
    }));
  };

  const handleOpenDelete = (c: Company) => {
    setDeletingCompany(c);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCompany) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/companies/${deletingCompany.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setDeletingCompany(null);
        fetchCompanies();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete company');
      }
    } catch (err) {
      console.error('Failed to delete company:', err);
      alert('Network error while deleting company');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Companies & SaaS Client Accounts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage corporate CRM clients and multi-tenant WhatsApp CRM SaaS subscriptions with dedicated Meta API configuration.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Add Company / SaaS Tenant
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {[
              { id: 'ALL', label: 'All Accounts' },
              { id: 'TENANTS', label: 'WhatsApp SaaS Tenants' },
              { id: 'CRM', label: 'Standard CRM Accounts' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterTab === t.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company name, plan, GST, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Company & Subscription</th>
                <th className="px-5 py-3.5">Meta API Status</th>
                <th className="px-5 py-3.5">Team & Quota</th>
                <th className="px-5 py-3.5">CRM Entities</th>
                <th className="px-5 py-3.5">GSTIN</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <p className="text-xs">Loading company accounts...</p>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-200">No companies found</p>
                    <p className="text-xs text-slate-400 mt-1">Create an account to start selling WhatsApp CRM or managing enterprise clients.</p>
                  </td>
                </tr>
              ) : (
                companies.map((c) => {
                  const activeConn = c.whatsappConnections?.[0];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/companies/${c.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition"
                          >
                            {c.name}
                          </Link>
                          {c.isTenant && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              WhatsApp SaaS
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          {c.email && <span>{c.email}</span>}
                          {c.phone && <span>• {c.phone}</span>}
                          {c.planName && <span className="font-semibold text-slate-600 dark:text-slate-300">• {c.planName}</span>}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {activeConn ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {activeConn.displayName || 'Connected'}
                            </span>
                            <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                              {activeConn.businessPhoneNumber || 'No number'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            API Not Setup
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                          {c._count.users || 0} / {c.maxEmployees || 5} Staff Seats
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Limit: {(c.monthlyMessageLimit || 10000).toLocaleString()} msgs/mo
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] text-slate-700 dark:text-slate-300">
                            {c._count.contacts} Contacts
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] text-slate-700 dark:text-slate-300">
                            {c._count.whatsappConversations || 0} Chats
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                        {c.gstNumber || '—'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/companies/${c.id}?tab=team`}
                            title="Manage Team & Employees"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/admin/companies/${c.id}?tab=modules`}
                            title="Configure Roles & Permissions"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/admin/companies/${c.id}`}
                            title="Company 360 View"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900 transition"
                          >
                            <span>360 Hub</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Full Edit Company"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(c)}
                            title="Delete Company"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Company / SaaS Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Create Company & SaaS Account</h3>
                <p className="text-xs text-slate-400">Provision a new isolated client workspace on your platform.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              {/* SaaS Tenant Toggle Card */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Register as Multi-Tenant WhatsApp CRM Customer
                  </span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Enables isolated Meta Cloud API configuration, webhook routing, and staff permissions.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isTenant}
                  onChange={(e) => setForm({ ...form, isTenant: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Company / Brand Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. ABC Solutions Pvt Ltd"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Industry</label>
                  <input
                    type="text"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Retail, HVAC, Healthcare"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Website URL</label>
                  <input
                    type="text"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="https://company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Official Company Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    placeholder="info@company.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="+91 98123 45678"
                  />
                </div>
              </div>

              {/* SaaS Subscription Options */}
              {form.isTenant && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                    SaaS Subscription & Module Entitlements
                  </span>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Plan Package</label>
                      <select
                        value={form.planName}
                        onChange={(e) => setForm({ ...form, planName: e.target.value })}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="WhatsApp SaaS Starter">WhatsApp Starter</option>
                        <option value="WhatsApp CRM Pro">WhatsApp + CRM Pro</option>
                        <option value="WhatsApp Enterprise">Enterprise Suite</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Monthly Msgs Limit</label>
                      <input
                        type="number"
                        value={form.monthlyMessageLimit}
                        onChange={(e) => setForm({ ...form, monthlyMessageLimit: parseInt(e.target.value) || 10000 })}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Max Staff Seats</label>
                      <input
                        type="number"
                        value={form.maxEmployees}
                        onChange={(e) => setForm({ ...form, maxEmployees: parseInt(e.target.value) || 5 })}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Activated CRM Modules:</label>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {[
                        { id: 'whatsapp', name: 'WhatsApp Business CRM' },
                        { id: 'crm.leads', name: 'CRM Leads & Kanban' },
                        { id: 'crm.deals', name: 'Sales Deals & Pipelines' },
                        { id: 'crm.contacts', name: 'Contacts Directory' },
                        { id: 'sales.proposals', name: 'Proposals & Quotes' },
                      ].map((mod) => (
                        <label key={mod.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={mod.id === 'whatsapp'}
                            checked={form.allowedModules.includes(mod.id)}
                            onChange={() => toggleModule(mod.id)}
                            className="rounded text-emerald-600"
                          />
                          <span>{mod.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Initial Tenant Owner User Credentials */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                      Initial Company Admin Login (Owner)
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Admin Email *</label>
                        <input
                          type="email"
                          required={form.isTenant}
                          value={form.adminEmail}
                          onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                          placeholder="e.g. abc@company.com"
                          className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Admin Password *</label>
                        <input
                          type="password"
                          required={form.isTenant}
                          value={form.adminPassword}
                          onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                          placeholder="Create login password"
                          className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {form.isTenant ? 'Provision SaaS Tenant' : 'Add Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company & SaaS Subscription Modal */}
      {showEditModal && editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Edit Company: {editingCompany.name}
                  </h3>
                  <p className="text-xs text-slate-400">Update corporate identity, address, SaaS entitlements, and quotas.</p>
                </div>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setEditingCompany(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 mt-4 text-xs">
              {/* SaaS Tenant Toggle Card */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Multi-Tenant WhatsApp CRM SaaS Customer
                  </span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Enables isolated Meta Cloud API configuration, dedicated webhooks, and team seat provisioning.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.isTenant}
                  onChange={(e) => setEditForm({ ...editForm, isTenant: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Section 1: Basic Company Info */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 dark:text-white text-xs block pb-1 border-b border-slate-100 dark:border-slate-800">
                  Company Identity & Communication
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g. Acme Tech Solutions"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Industry</label>
                    <input
                      type="text"
                      value={editForm.industry}
                      onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                      placeholder="e.g. Information Technology"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Website URL</label>
                    <input
                      type="text"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="https://company.com"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Domain</label>
                    <input
                      type="text"
                      value={editForm.domain}
                      onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                      placeholder="company.com"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Official Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Official Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="info@company.com"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Address & Tax Details */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white text-xs block pb-1 border-b border-slate-100 dark:border-slate-800">
                  Address & Tax Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Floor 4, Tower B, Business Park"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="Delhi NCR"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">State / Province</label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      placeholder="Delhi / Haryana"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Postal / ZIP Code</label>
                    <input
                      type="text"
                      value={editForm.postalCode}
                      onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                      placeholder="110001"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">GSTIN / Tax ID</label>
                    <input
                      type="text"
                      value={editForm.gstNumber}
                      onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                      placeholder="07AAAAA0000A1Z5"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Multi-Tenant WhatsApp SaaS Plan */}
              {editForm.isTenant && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                    SaaS Subscription, Plan & Quota Limits
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Account Status</label>
                      <select
                        value={editForm.tenantStatus}
                        onChange={(e) => setEditForm({ ...editForm, tenantStatus: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="TRIAL">TRIAL</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Plan Name</label>
                      <input
                        type="text"
                        value={editForm.planName}
                        onChange={(e) => setEditForm({ ...editForm, planName: e.target.value })}
                        placeholder="WhatsApp Starter"
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      >
                      </input>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Monthly Message Limit</label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        value={editForm.monthlyMessageLimit}
                        onChange={(e) => setEditForm({ ...editForm, monthlyMessageLimit: parseInt(e.target.value) || 10000 })}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Staff Seats Limit</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={editForm.maxEmployees}
                        onChange={(e) => setEditForm({ ...editForm, maxEmployees: parseInt(e.target.value) || 5 })}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Module Entitlements */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-2">
                      Allowed CRM & Communication Modules
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'whatsapp', name: 'WhatsApp Business CRM', locked: true },
                        { id: 'crm.leads', name: 'CRM Leads & Pipeline', locked: false },
                        { id: 'crm.deals', name: 'Sales Deals & Tracking', locked: false },
                        { id: 'crm.contacts', name: 'Contacts Directory', locked: false },
                        { id: 'sales.proposals', name: 'Quotations & Proposals', locked: false },
                        { id: 'support.tickets', name: 'Helpdesk & Support Tickets', locked: false },
                      ].map((mod) => (
                        <label
                          key={mod.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                            editForm.allowedModules.includes(mod.id)
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-semibold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={mod.locked}
                            checked={editForm.allowedModules.includes(mod.id)}
                            onChange={() => toggleEditModule(mod.id)}
                            className="rounded text-emerald-600"
                          />
                          <span>{mod.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Internal Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Billing terms, customer requirements, account history..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingCompany(null); }}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {savingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Company</h3>
                <p className="text-xs text-slate-400">Irreversible operational action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Are you sure you want to permanently delete <span className="font-bold text-slate-900 dark:text-white">"{deletingCompany.name}"</span>?
              {deletingCompany.isTenant && (
                <span className="block mt-2 text-rose-600 dark:text-rose-400 font-medium">
                  ⚠️ This tenant account has isolated Meta Cloud API credentials, message templates, conversations, and staff logins that will be removed.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeletingCompany(null); }}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition disabled:opacity-50 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
