'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  CreditCard,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface CompanyProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  domain: string | null;
  industry: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  gstNumber: string | null;
  notes: string | null;
  isTenant: boolean;
  tenantStatus: string;
  planName: string;
  monthlyMessageLimit: number;
  maxEmployees: number;
  allowedModules: string[];
  createdAt: string;
  stats?: {
    totalUsers: number;
    totalContacts: number;
    totalDeals: number;
    totalConversations: number;
  };
}

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    domain: '',
    industry: 'Information Technology',
    address: '',
    city: 'Delhi NCR',
    state: '',
    country: 'India',
    postalCode: '',
    gstNumber: '',
    notes: '',
  });

  const [companyMeta, setCompanyMeta] = useState<CompanyProfile | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/company/profile');
      const data = await res.json();
      if (res.ok && data.company) {
        setCompanyMeta(data.company);
        setForm({
          name: data.company.name || '',
          email: data.company.email || '',
          phone: data.company.phone || '',
          website: data.company.website || '',
          domain: data.company.domain || '',
          industry: data.company.industry || 'Information Technology',
          address: data.company.address || '',
          city: data.company.city || 'Delhi NCR',
          state: data.company.state || '',
          country: data.company.country || 'India',
          postalCode: data.company.postalCode || '',
          gstNumber: data.company.gstNumber || '',
          notes: data.company.notes || '',
        });
      } else {
        setErrorMsg(data.error || 'Failed to load company profile.');
      }
    } catch (err: any) {
      console.error('Fetch profile failed:', err);
      setErrorMsg('Network error while connecting to company profile service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/company/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Company profile updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchProfile();
      } else {
        setErrorMsg(data.error || 'Failed to update company profile.');
      }
    } catch (err: any) {
      console.error('Save profile failed:', err);
      setErrorMsg('Network error while saving changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading Company Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Company Profile & Settings
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {companyMeta?.planName || 'Active SaaS'}
            </span>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border border-emerald-200">
              {companyMeta?.tenantStatus || 'ACTIVE'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your company identity, registered address, GST tax details, and commercial contact information.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/company/employees"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs transition"
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Manage Employees ({companyMeta?.stats?.totalUsers || 1} / {companyMeta?.maxEmployees || 5})</span>
          </Link>
          <Link
            href="/admin/whatsapp?tab=inbox"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Launch Inbox ↗</span>
          </Link>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Edit Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Identity & Contact */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <Building2 className="w-4 h-4 text-emerald-500" />
                Primary Company Identity
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Company / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Hello Mam Enterprises"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Industry / Sector</label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Information Technology">Information Technology</option>
                    <option value="HVAC & Air Conditioning">HVAC & Air Conditioning</option>
                    <option value="Consumer Electronics & Appliances">Consumer Electronics & Appliances</option>
                    <option value="Healthcare & Wellness">Healthcare & Wellness</option>
                    <option value="Real Estate & Infrastructure">Real Estate & Infrastructure</option>
                    <option value="Education & EdTech">Education & EdTech</option>
                    <option value="Retail & E-commerce">Retail & E-commerce</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                    <option value="Other Commercial Services">Other Commercial Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Official Support Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. info@company.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Official Contact Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. +91 98186 28880"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Public Website URL</label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="https://company.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Email / Web Domain</label>
                  <input
                    type="text"
                    value={form.domain}
                    onChange={(e) => setForm({ ...form, domain: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. company.com"
                  />
                </div>
              </div>
            </div>

            {/* 2. Registered Address & Location */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <MapPin className="w-4 h-4 text-indigo-500" />
                Office Address & Operating Location
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Street Address / Office Premises</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Suite 402, Signature Tower, Sector 30"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Delhi NCR"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">State / Province</label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Delhi"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="110001"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Country</label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="India"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Commercial & Tax Details */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <FileText className="w-4 h-4 text-amber-500" />
                Tax Identification & Description
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">GSTIN / Tax Number</label>
                  <input
                    type="text"
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="07AAAAA0000A1Z5"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your 15-character Goods and Services Tax Identification Number for invoicing and commercial transparency.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">About Company / Internal Notes</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Brief description of operations, customer support guidelines, or internal account notes..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Company Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Rail: SaaS Plan & Subscription Badges */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Active SaaS Plan
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {companyMeta?.tenantStatus}
                </span>
              </div>

              <h4 className="text-xl font-black text-white">{companyMeta?.planName}</h4>
              <p className="text-xs text-slate-400 mt-1">Multi-Tenant Isolated Enterprise License</p>

              <div className="mt-6 space-y-3 pt-4 border-t border-slate-800/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Monthly Message Quota:</span>
                  <span className="font-bold text-white font-mono">
                    {(companyMeta?.monthlyMessageLimit || 10000).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Team Staff Seats:</span>
                  <span className="font-bold text-white font-mono">
                    {companyMeta?.stats?.totalUsers || 1} / {companyMeta?.maxEmployees || 5}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">CRM Contacts:</span>
                  <span className="font-bold text-white font-mono">
                    {companyMeta?.stats?.totalContacts || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Conversations:</span>
                  <span className="font-bold text-white font-mono">
                    {companyMeta?.stats?.totalConversations || 0}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <Link
                  href="/admin/company/employees"
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-2 transition"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Manage Team Accounts</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </Link>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Company Workspaces
              </h4>
              <div className="space-y-2">
                <Link
                  href="/admin/company/employees"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Employees & Seats</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/admin/company/roles"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Roles & Permissions</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/admin/whatsapp?tab=status"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition"
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Meta WhatsApp Health</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
