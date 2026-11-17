'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Building2,
  Users,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  ShieldCheck,
  Package,
  Wrench,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Metrics {
  totalMarketplaceLeads: number;
  leadsToday: number;
  b2cCount: number;
  b2bCount: number;
  vendorsCount: number;
  convertedCount: number;
  conversionRate: string;
}

interface RecentLead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  service?: string | null;
  projectType?: string | null;
  status: string;
  score?: number | null;
  createdAt: string;
}

export default function MarketplaceOverviewPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/marketplace/metrics');
      const data = await res.json();
      if (res.ok && data.success) {
        setMetrics(data.metrics);
        setRecentLeads(data.recentLeads || []);
      } else {
        setError(data.error || 'Failed to load marketplace telemetry');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Urban Marketplace Cockpit
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Centralized operations, lead triage, and vendor verification for <strong>urban.techinpedia.com</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <a
            href="https://urban.techinpedia.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20"
          >
            <span>Open Public Marketplace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Marketplace Leads</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {loading ? '...' : metrics?.totalMarketplaceLeads ?? 0}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{metrics?.leadsToday ?? 0} Today</span>
            <span>•</span>
            <span>{metrics?.b2cCount ?? 0} B2C / {metrics?.b2bCount ?? 0} B2B</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">B2C Local Services</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-emerald-500" />
            <span>{loading ? '...' : metrics?.b2cCount ?? 0}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Home Repair & Tech Care</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">B2B Industrial RFQs</span>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" />
            <span>{loading ? '...' : metrics?.b2bCount ?? 0}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Wholesale & Factory RFQs</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Vendors</span>
          <div className="text-3xl font-black text-amber-500 mt-1 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-500" />
            <span>{loading ? '...' : metrics?.vendorsCount ?? 0}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Technicians & Suppliers</div>
        </div>
      </div>

      {/* Action Navigation Desks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/marketplace/leads"
          className="group p-6 rounded-3xl bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-sm hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Open Triage Hub</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            Marketplace Leads Triage Desk
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Manage incoming customer service requests, B2B wholesale enquiries, follow-up stages, and dispatch leads to eligible vendors.
          </p>
        </Link>

        <Link
          href="/admin/marketplace/vendors"
          className="group p-6 rounded-3xl bg-gradient-to-br from-white to-teal-50/40 dark:from-slate-900 dark:to-teal-950/20 border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 transition-all shadow-sm hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform">
              <span>Open KYC Desk</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            Vendors Directory & KYC Desk
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Verify onboarding applications, activate Gold Partner badges, adjust membership plans (Starter, Pro, Enterprise), and manage lead wallets.
          </p>
        </Link>
      </div>

      {/* Recent Inbound Marketplace Leads */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Marketplace Leads
            </h3>
          </div>
          <Link
            href="/admin/marketplace/leads"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All ({metrics?.totalMarketplaceLeads ?? 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No marketplace leads captured yet. Leads will appear automatically when buyers post on urban.techinpedia.com.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Ref ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category / Item</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-400">
                      {lead.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{lead.name}</div>
                      <div className="text-[11px] text-slate-400">{lead.phone || lead.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lead.projectType === 'B2B_RFQ'
                          ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {lead.projectType === 'B2B_RFQ' ? 'B2B RFQ' : 'B2C Service'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {lead.service || 'General'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {lead.city || 'India'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {lead.phone ? (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(lead.name)}%2C%20contacting%20you%20from%20Urban%20Market%20regarding%20your%20requirement%20for%20${encodeURIComponent(lead.service || 'Service')}.`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-semibold"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
