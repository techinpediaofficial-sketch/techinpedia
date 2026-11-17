'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  X,
  User,
  Package,
  Wrench,
  AlertCircle
} from 'lucide-react';

interface MarketplaceLead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  address?: string | null;
  service?: string | null;
  budget?: string | null;
  message: string;
  source: string;
  projectType?: string | null;
  status: string;
  score?: number | null;
  priority?: string | null;
  leadSubSource?: string | null;
  notes?: any[];
  createdAt: string;
  assignedEmployee?: {
    id: string;
    name?: string | null;
    companyEmail?: string | null;
  } | null;
}

export default function MarketplaceLeadsPage() {
  const [leads, setLeads] = useState<MarketplaceLead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'B2C' | 'B2B'>('ALL');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState<MarketplaceLead | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        mode: modeFilter,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(cityFilter ? { city: cityFilter } : {}),
      });

      const res = await fetch(`/api/admin/marketplace/leads?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads(data.leads || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching marketplace leads:', err);
    } finally {
      setLoading(false);
    }
  }, [page, modeFilter, search, statusFilter, cityFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/enquiries/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
        if (selectedLead?.id === leadId) {
          setSelectedLead((prev) => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      console.error('Status change error:', err);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/marketplace"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Marketplace Cockpit
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Leads Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Marketplace Inbound Leads Triage
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time customer service requirements & B2B wholesale RFQs from Urban Market ({total} total leads).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <a
            href="https://urban.techinpedia.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Mode Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              onClick={() => { setModeFilter('ALL'); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all ${
                modeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Marketplace Leads
            </button>
            <button
              onClick={() => { setModeFilter('B2C'); setPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-all ${
                modeFilter === 'B2C'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>B2C Local Services</span>
            </button>
            <button
              onClick={() => { setModeFilter('B2B'); setPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold transition-all ${
                modeFilter === 'B2B'
                  ? 'bg-blue-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>B2B Industrial RFQs</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing {leads.length} of {total} leads
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, phone, item, or city..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="QUALIFIED">QUALIFIED</option>
            <option value="PROPOSAL_SENT">PROPOSAL_SENT</option>
            <option value="WON">WON (Closed)</option>
            <option value="LOST">LOST</option>
          </select>

          <input
            type="text"
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
            placeholder="Filter city (e.g. Noida, Delhi)..."
            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
            Loading marketplace leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No marketplace leads found matching current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Ref / Created</th>
                  <th className="py-3.5 px-4">Buyer / Customer</th>
                  <th className="py-3.5 px-4">Mode / Category</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Requirement Details</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-500 font-bold">{lead.id.slice(0, 8)}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{lead.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{lead.phone || lead.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          lead.projectType === 'B2B_RFQ'
                            ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {lead.projectType === 'B2B_RFQ' ? 'B2B' : 'B2C'}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                          {lead.service || 'Service'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {lead.budget && (
                          <span className="text-[10px] text-slate-400">Vol: {lead.budget}</span>
                        )}
                        {lead.leadSubSource?.startsWith('FANNED_OUT') && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            ⚡ Distributed
                          </span>
                        )}
                        {lead.notes?.some((n: any) => n.note.includes('[URBAN_UNLOCKED')) && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            🔓 Unlocked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{lead.city || 'India'}</span>
                      </div>
                      {lead.address && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{lead.address}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs">
                      <p className="line-clamp-2 text-xs">
                        {lead.message || '—'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="QUALIFIED">QUALIFIED</option>
                        <option value="WON">WON</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {lead.phone ? (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(lead.name)}%2C%20contacting%20you%20from%20Urban%20Market%20regarding%20your%20requirement%20for%20${encodeURIComponent(lead.service || 'Service')}.`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>Page {page} of {totalPages}</div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Detail Drawer / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl">
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                selectedLead.projectType === 'B2B_RFQ'
                  ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              }`}>
                {selectedLead.projectType === 'B2B_RFQ' ? 'B2B Industrial RFQ' : 'B2C Service Requirement'}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                {selectedLead.service || 'Service Requirement'}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Ref: {selectedLead.id}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <strong className="text-slate-900 dark:text-white">{selectedLead.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mobile Phone:</span>
                <strong className="font-mono text-emerald-600 dark:text-emerald-400">{selectedLead.phone || 'N/A'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Address:</span>
                <strong className="text-slate-900 dark:text-white">{selectedLead.email}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <strong className="text-slate-900 dark:text-white">{selectedLead.address ? `${selectedLead.address}, ` : ''}{selectedLead.city || 'India'}</strong>
              </div>
              {selectedLead.budget && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Budget / Order Size:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedLead.budget}</strong>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Full Message & Details
              </label>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">
                {selectedLead.message}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {selectedLead.phone && (
                <a
                  href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(selectedLead.name)}%2C%20contacting%20you%20from%20Urban%20Market%20regarding%20your%20requirement%20for%20${encodeURIComponent(selectedLead.service || 'Service')}.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message on WhatsApp</span>
                </a>
              )}
              {selectedLead.phone && (
                <a
                  href={`tel:${selectedLead.phone.replace(/[^0-9+]/g, '')}`}
                  className="py-3 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
