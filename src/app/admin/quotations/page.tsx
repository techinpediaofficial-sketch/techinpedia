'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Plus, Search, Trash2, X, Mail, MessageSquare,
  Download, Copy, Eye, ChevronDown, ChevronRight, Check,
  Building, User, Phone, Calendar, IndianRupee, ClipboardList,
  ArrowLeft, Edit3, Send, RefreshCw, AlertCircle, ExternalLink,
  LayoutList, Printer
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
interface ProposalItem {
  id?: string;
  serviceName: string;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
  taxPercent: number;
  amount: number;
}

interface AdditionalCharge {
  id?: string;
  label: string;
  amount: number;
}

interface Proposal {
  id: string;
  proposalNumber: string;
  version: number;
  parentId?: string | null;
  proposalType: string;
  title: string;
  proposalDate: string;
  validUntil?: string | null;
  preparedBy?: string | null;
  branch?: string | null;
  clientName: string;
  contactPerson?: string | null;
  clientEmail: string;
  clientPhone?: string | null;
  clientWhatsApp?: string | null;
  billingAddress?: string | null;
  gstin?: string | null;
  enquiryId?: string | null;
  dealId?: string | null;
  salesExecutive?: string | null;
  leadSource?: string | null;
  projectName?: string | null;
  category?: string | null;
  requirement?: string | null;
  clientObjective?: string | null;
  proposedSolution?: string | null;
  executiveSummary?: string | null;
  techStack?: string | null;
  deliverables?: string | null;
  features?: string | null;
  includedServices?: string | null;
  excludedServices?: string | null;
  thirdPartyIntegrations?: string | null;
  startDate?: string | null;
  totalDuration?: string | null;
  milestones?: string | null;
  deliveryDate?: string | null;
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAdditionalCharges: number;
  grandTotal: number;
  advancePercent?: number | null;
  paymentMilestones?: string | null;
  finalPaymentPercent?: number | null;
  dueDays?: number | null;
  paymentMethod?: string | null;
  freeSupportPeriod?: string | null;
  amcCharges?: string | null;
  renewalCharges?: string | null;
  revisionLimit?: number | null;
  sourceCodeTerms?: string | null;
  termsConditions?: string | null;
  internalNotes?: string | null;
  clientNotes?: string | null;
  status: string;
  sentAt?: string | null;
  viewedAt?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
  items: ProposalItem[];
  additionalChargeItems: AdditionalCharge[];
}

// ── Constants ──────────────────────────────────────────────────
const PROPOSAL_TYPES = [
  'WEBSITE_DEVELOPMENT','MOBILE_APP','DIGITAL_MARKETING',
  'SEO','HARDWARE','AMC','CUSTOM_SOFTWARE','SAAS','OTHER'
];
const PROPOSAL_STATUSES = [
  { key:'DRAFT',           label:'Draft',            color:'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  { key:'INTERNAL_REVIEW', label:'Internal Review',  color:'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  { key:'SENT',            label:'Sent',             color:'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  { key:'VIEWED',          label:'Viewed',           color:'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  { key:'NEGOTIATION',     label:'Negotiation',      color:'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  { key:'ACCEPTED',        label:'Accepted ✓',       color:'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
  { key:'REJECTED',        label:'Rejected',         color:'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' },
  { key:'EXPIRED',         label:'Expired',          color:'bg-gray-100 dark:bg-gray-800 text-gray-500' },
  { key:'CONVERTED',       label:'Converted',        color:'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' },
];

const DEFAULT_TERMS = `1. Revision Policy: Up to 2 free revisions included. Additional revisions billed at ₹2,000/revision.
2. Source Code: Full source code ownership transferred upon final payment.
3. Content Responsibility: Client is responsible for providing all content (text, images, videos).
4. Delays: TechInPedia is not responsible for delays caused by client-side delays in feedback/approvals.
5. Cancellation: 50% of advance is non-refundable in case of project cancellation.
6. Third-party Dependencies: APIs, payment gateways, hosting services subject to third-party terms.
7. Maintenance: Bug fixes covered for 30 days post-delivery. Post that, AMC charges apply.
8. Confidentiality: Both parties agree to keep project details confidential.`;

const DEFAULT_FORM: Partial<Proposal> & { items: ProposalItem[]; additionalChargeItems: AdditionalCharge[] } = {
  proposalType: 'WEBSITE_DEVELOPMENT',
  title: '',
  proposalDate: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
  preparedBy: '',
  branch: 'TechInPedia',
  clientName: '',
  contactPerson: '',
  clientEmail: '',
  clientPhone: '',
  clientWhatsApp: '',
  billingAddress: '',
  gstin: '',
  salesExecutive: '',
  leadSource: '',
  projectName: '',
  category: '',
  requirement: '',
  clientObjective: '',
  proposedSolution: '',
  executiveSummary: '',
  techStack: 'Frontend: Next.js\nBackend: Node.js\nDatabase: MySQL\nMobile: Flutter\nHosting: VPS/Cloud',
  deliverables: '',
  features: '',
  includedServices: '',
  excludedServices: '',
  thirdPartyIntegrations: '',
  totalDuration: '',
  milestones: '',
  taxRate: 18,
  advancePercent: 40,
  finalPaymentPercent: 10,
  dueDays: 7,
  paymentMethod: 'Bank Transfer / UPI',
  freeSupportPeriod: '30 Days',
  revisionLimit: 2,
  termsConditions: DEFAULT_TERMS,
  internalNotes: '',
  clientNotes: '',
  status: 'DRAFT',
  items: [{ serviceName: '', description: '', quantity: 1, rate: 0, discount: 0, taxPercent: 18, amount: 0 }],
  additionalChargeItems: [],
};

function statusMeta(key: string) {
  return PROPOSAL_STATUSES.find(s => s.key === key) || PROPOSAL_STATUSES[0];
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Compute totals ─────────────────────────────────────────────
function computeTotals(items: ProposalItem[], additionalChargeItems: AdditionalCharge[], taxRate: number) {
  let subtotal = 0;
  let discountAmount = 0;
  let taxAmount = 0;
  const computedItems = items.map(item => {
    const base     = item.quantity * item.rate;
    const disc     = item.discount || 0;
    const afterDisc = base - disc;
    const tax      = afterDisc * (item.taxPercent / 100);
    const amount   = afterDisc + tax;
    subtotal      += base;
    discountAmount += disc;
    taxAmount      += tax;
    return { ...item, amount };
  });
  const totalAdditionalCharges = additionalChargeItems.reduce((s, c) => s + (c.amount || 0), 0);
  const grandTotal = subtotal - discountAmount + taxAmount + totalAdditionalCharges;
  return { computedItems, subtotal, discountAmount, taxAmount, totalAdditionalCharges, grandTotal };
}

// ── Reusable Form Components (Module Scope: prevents component recreation & focus loss on keystroke) ──
const inp = "w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-violet-500 transition-colors";
const ta  = inp + " resize-none";
const sel = inp + " cursor-pointer";

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
        <Icon className="w-4 h-4 text-violet-500" />
        <span className="font-bold text-slate-900 dark:text-white text-sm">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function ProposalsPage() {
  const [proposals, setProposals]   = useState<Proposal[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [view, setView]             = useState<'list' | 'form' | 'preview'>('list');
  const [editing, setEditing]       = useState<Proposal | null>(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({ ...DEFAULT_FORM });
  const [sendModal, setSendModal]   = useState<Proposal | null>(null);
  const [emailForm, setEmailForm]   = useState({ to: '', subject: '', message: '', cc: '' });
  const [sending, setSending]       = useState(false);
  const [previewData, setPreview]   = useState<Proposal | null>(null);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL('/api/proposals', window.location.origin);
      if (search)       url.searchParams.set('search', search);
      if (statusFilter) url.searchParams.set('status', statusFilter);
      url.searchParams.set('limit', '100');
      const res  = await fetch(url.toString());
      const data = await res.json();
      if (res.ok) setProposals(data.proposals || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchProposals(); }, [statusFilter]);

  // ── Update form item amounts ──────────────────────────────────
  const syncTotals = useCallback((f: typeof form) => {
    const { computedItems, subtotal, discountAmount, taxAmount, totalAdditionalCharges, grandTotal } =
      computeTotals(f.items, f.additionalChargeItems, f.taxRate || 18);
    return { ...f, items: computedItems, subtotal, discountAmount, taxAmount, totalAdditionalCharges, grandTotal };
  }, []);

  const setF = (patch: Partial<typeof form>) => {
    setForm(prev => syncTotals({ ...prev, ...patch }));
  };

  // ── Item helpers ──────────────────────────────────────────────
  const updateItem = (idx: number, patch: Partial<ProposalItem>) => {
    const items = form.items.map((it, i) => i === idx ? { ...it, ...patch } : it);
    setF({ items });
  };
  const addItem = () => setF({ items: [...form.items, { serviceName:'', description:'', quantity:1, rate:0, discount:0, taxPercent:18, amount:0 }] });
  const removeItem = (idx: number) => setF({ items: form.items.filter((_, i) => i !== idx) });

  // ── Additional charge helpers ─────────────────────────────────
  const updateCharge = (idx: number, patch: Partial<AdditionalCharge>) => {
    const additionalChargeItems = form.additionalChargeItems.map((c, i) => i === idx ? { ...c, ...patch } : c);
    setF({ additionalChargeItems });
  };
  const addCharge = (label = '', amount = 0) => setF({ additionalChargeItems: [...form.additionalChargeItems, { label, amount }] });
  const removeCharge = (idx: number) => setF({ additionalChargeItems: form.additionalChargeItems.filter((_, i) => i !== idx) });

  // ── Open new form ─────────────────────────────────────────────
  const openNew = () => {
    setEditing(null);
    setForm(syncTotals({ ...DEFAULT_FORM }));
    setView('form');
  };

  // ── Open edit ─────────────────────────────────────────────────
  const openEdit = (p: Proposal) => {
    setEditing(p);
    setForm(syncTotals({
      ...DEFAULT_FORM,
      ...p,
      proposalDate: p.proposalDate ? p.proposalDate.split('T')[0] : new Date().toISOString().split('T')[0],
      validUntil:   p.validUntil   ? p.validUntil.split('T')[0]   : '',
      startDate:    p.startDate    ? p.startDate.split('T')[0]     : '',
      deliveryDate: p.deliveryDate ? p.deliveryDate.split('T')[0]  : '',
      items: p.items || [],
      additionalChargeItems: p.additionalChargeItems || [],
    } as any));
    setView('form');
  };

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async (status?: string) => {
    setSaving(true);
    try {
      const payload = { ...form, status: status || form.status };
      const url     = editing ? `/api/proposals/${editing.id}` : '/api/proposals';
      const method  = editing ? 'PATCH' : 'POST';
      const res     = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data    = await res.json();
      if (res.ok) {
        await fetchProposals();
        setView('list');
      } else {
        alert('Save failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this proposal permanently?')) return;
    await fetch(`/api/proposals/${id}`, { method: 'DELETE' });
    setProposals(prev => prev.filter(p => p.id !== id));
  };

  // ── Duplicate ─────────────────────────────────────────────────
  const handleDuplicate = async (id: string) => {
    const res  = await fetch(`/api/proposals/${id}/duplicate`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) { await fetchProposals(); }
  };

  // ── Send email ────────────────────────────────────────────────
  const openSendModal = (p: Proposal) => {
    setEmailForm({
      to:      p.clientEmail,
      subject: `Proposal: ${p.title} — ${p.proposalNumber}`,
      message: `Dear ${p.contactPerson || p.clientName},\n\nPlease find our proposal for "${p.title}" attached. We look forward to your feedback.\n\nBest regards,\n${p.preparedBy || 'TechInPedia Team'}`,
      cc:      '',
    });
    setSendModal(p);
  };

  const handleSendEmail = async () => {
    if (!sendModal) return;
    setSending(true);
    try {
      const res = await fetch(`/api/proposals/${sendModal.id}/send-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(emailForm),
      });
      const data = await res.json();
      if (res.ok) { setSendModal(null); await fetchProposals(); }
      else alert('Email failed: ' + (data.error || 'Unknown error'));
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  // ── WhatsApp ──────────────────────────────────────────────────
  const sendWhatsApp = (p: Proposal) => {
    const phone = (p.clientWhatsApp || p.clientPhone || '91').replace(/[^0-9]/g, '');
    const msg   = encodeURIComponent(
      `Hello ${p.contactPerson || p.clientName},\n\n` +
      `I'm sharing our project proposal for *${p.title}*.\n` +
      `📋 Proposal No: ${p.proposalNumber}\n` +
      `💰 Total Value: ₹${p.grandTotal.toLocaleString('en-IN')}\n` +
      `📅 Valid Until: ${p.validUntil ? new Date(p.validUntil).toLocaleDateString('en-IN') : 'N/A'}\n\n` +
      `Please review and let us know your feedback.\n\nRegards,\nTechInPedia Team`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  // ── Status change ─────────────────────────────────────────────
  const changeStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/proposals/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    if (res.ok) setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  // ── Print PDF ─────────────────────────────────────────────────
  const printPDF = (p: Proposal) => {
    setPreview(p);
    setView('preview');
    setTimeout(() => window.print(), 800);
  };

  // ────────────────────────────────────────────────────────────
  // ── RENDER
  // ────────────────────────────────────────────────────────────

  // ── LIST VIEW ────────────────────────────────────────────────
  if (view === 'list') return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="TechInPedia" className="h-10 w-auto object-contain bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-800 shadow-xs" />
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Proposals & Quotations</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{proposals.length} proposals · TechInPedia CRM</p>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-violet-500/20">
          <Plus className="w-4 h-4" /> New Proposal
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text" placeholder="Search proposals..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchProposals()}
            className="pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:border-violet-500 focus:outline-none w-full"
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
        >
          <option value="">All Statuses</option>
          {PROPOSAL_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Proposal</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Value</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Valid Until</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">Loading...</td></tr>
              ) : proposals.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">No proposals yet. <button onClick={openNew} className="text-violet-600 font-semibold">Create one →</button></td></tr>
              ) : proposals.map(p => {
                const sm = statusMeta(p.status);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{p.proposalNumber}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[180px]">{p.title}</div>
                      {p.version > 1 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-bold">V{p.version}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{p.clientName}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-[11px]">{p.clientEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                        {p.proposalType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{fmt(p.grandTotal)}</td>
                    <td className="py-3 px-4">
                      <select
                        value={p.status}
                        onChange={e => changeStatus(p.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border-0 focus:outline-none cursor-pointer ${sm.color}`}
                      >
                        {PROPOSAL_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {p.validUntil ? new Date(p.validUntil).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setPreview(p); setView('preview'); }} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors cursor-pointer" title="Preview PDF">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer" title="Edit">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openSendModal(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer" title="Send Email">
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => sendWhatsApp(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors cursor-pointer" title="WhatsApp">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDuplicate(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer" title="Duplicate / New Version">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors cursor-pointer" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Modal */}
      {sendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Send Proposal via Email</h3>
              <button onClick={() => setSendModal(null)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'To', key: 'to', type: 'email' },
                { label: 'CC',      key: 'cc',      type: 'email' },
                { label: 'Subject', key: 'subject', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">{f.label}</label>
                  <input
                    type={f.type} value={(emailForm as any)[f.key]}
                    onChange={e => setEmailForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Message</label>
                <textarea rows={5} value={emailForm.message}
                  onChange={e => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setSendModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">Cancel</button>
              <button onClick={handleSendEmail} disabled={sending} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── PDF PREVIEW VIEW ─────────────────────────────────────────
  if (view === 'preview' && previewData) {
    const p = previewData;
    return (
      <div>
        {/* Screen-only controls */}
        <div className="print:hidden flex items-center gap-3 mb-6">
          <button onClick={() => setView('list')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm cursor-pointer shadow-lg shadow-violet-500/20">
            <Printer className="w-4 h-4" /> Download / Print PDF
          </button>
          <button onClick={() => openSendModal(p)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm cursor-pointer">
            <Mail className="w-4 h-4" /> Send Email
          </button>
          <button onClick={() => sendWhatsApp(p)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm cursor-pointer">
            <MessageSquare className="w-4 h-4" /> WhatsApp
          </button>
        </div>

        {/* PDF Content */}
        <div id="proposal-pdf" className="max-w-4xl mx-auto bg-white text-slate-900 shadow-2xl print:shadow-none">

          {/* Cover Page */}
          <div className="min-h-screen flex flex-col" style={{ pageBreakAfter: 'always' }}>
            {/* Header band */}
            <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }} className="p-8 text-white">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="TechInPedia Logo"
                    className="h-12 w-auto object-contain bg-white rounded-xl p-1.5 shadow-md"
                  />
                  <div>
                    <div className="text-2xl font-extrabold tracking-tight">TechInPedia</div>
                    <div className="text-violet-200 text-xs">Technology Solutions & Services</div>
                  </div>
                </div>
                <div className="text-right text-sm text-violet-200">
                  <div className="font-semibold text-white">techinpedia.com</div>
                  <div>info@techinpedia.com</div>
                  <div className="text-xs text-violet-300">+91 91702 33434</div>
                </div>
              </div>
              <div className="text-center py-10">
                <div className="text-violet-200 text-sm uppercase tracking-[4px] mb-3 font-semibold">PROJECT PROPOSAL</div>
                <h1 className="text-4xl font-extrabold leading-tight">{p.title}</h1>
              </div>
            </div>

            {/* Cover details */}
            <div className="flex-1 p-10">
              <div className="grid grid-cols-2 gap-8 mt-4">
                <div>
                  <div className="text-xs uppercase text-slate-400 font-semibold mb-2 tracking-wider">Prepared For</div>
                  <div className="text-xl font-bold text-slate-900">{p.clientName}</div>
                  {p.contactPerson && <div className="text-slate-600 text-sm mt-1">{p.contactPerson}</div>}
                  {p.billingAddress && <div className="text-slate-500 text-xs mt-2 leading-relaxed">{p.billingAddress}</div>}
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-400 font-semibold mb-2 tracking-wider">Prepared By</div>
                  <div className="text-xl font-bold text-slate-900">TechInPedia</div>
                  <div className="text-slate-600 text-sm mt-1">{p.preparedBy || 'Sales Team'}</div>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4">
                {[
                  ['Proposal No', p.proposalNumber],
                  ['Date', new Date(p.proposalDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })],
                  ['Valid Until', p.validUntil ? new Date(p.validUntil).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : 'N/A'],
                  ['Proposal Type', p.proposalType.replace(/_/g, ' ')],
                  ['Total Value', fmt(p.grandTotal)],
                  ['Version', `V${p.version}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3 py-2 border-b border-slate-100">
                    <span className="text-xs text-slate-400 w-28 shrink-0 font-medium">{k}</span>
                    <span className="text-sm font-bold text-slate-900">{v}</span>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
                This proposal is confidential and prepared exclusively for {p.clientName}
              </div>
            </div>
          </div>

          {/* Content pages */}
          <div className="p-10 space-y-10">
            {/* Header on content pages */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="TechInPedia" className="h-7 w-auto object-contain" />
                <span className="font-bold text-slate-800 text-sm tracking-tight">TechInPedia</span>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">{p.proposalNumber}</span> · {p.title}
              </div>
            </div>

            {/* Executive Summary */}
            {p.executiveSummary && (
              <section>
                <h2 className="text-lg font-extrabold text-violet-700 border-b-2 border-violet-200 pb-2 mb-4">1. Executive Summary</h2>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{p.executiveSummary}</p>
              </section>
            )}

            {/* Client Requirements */}
            {(p.requirement || p.clientObjective) && (
              <section>
                <h2 className="text-lg font-extrabold text-violet-700 border-b-2 border-violet-200 pb-2 mb-4">2. Client Requirements</h2>
                {p.requirement      && <p className="text-sm text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap">{p.requirement}</p>}
                {p.clientObjective  && <><div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Objective</div><p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{p.clientObjective}</p></>}
              </section>
            )}

            {/* Proposed Solution */}
            {p.proposedSolution && (
              <section>
                <h2 className="text-lg font-extrabold text-violet-700 border-b-2 border-violet-200 pb-2 mb-4">3. Proposed Solution</h2>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{p.proposedSolution}</p>
              </section>
            )}

            {/* Scope of Work */}
            {(p.deliverables || p.features || p.includedServices || p.excludedServices) && (
              <section>
                <h2 className="text-lg font-extrabold text-violet-700 border-b-2 border-violet-200 pb-2 mb-4">4. Scope of Work</h2>
                {p.deliverables && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deliverables</div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.deliverables}</p>
                  </div>
                )}
                {p.features && (
                  <div className="mb-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Features / Modules</div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.features}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-6 mt-4">
                  {p.includedServices && (
                    <div>
                      <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">✓ Included</div>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">{p.includedServices}</p>
                    </div>
                  )}
                  {p.excludedServices && (
                    <div>
                      <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">✗ Excluded</div>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap">{p.excludedServices}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Technology Stack */}
            {p.techStack && (
              <section>
                <h2 className="text-lg font-extrabold text-violet-700 border-b-2 border-violet-200 pb-2 mb-4">5. Technology Stack</h2>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono">{p.techStack}</p>
                </div>
              </section>
            )}

            {/* Timeline */}
            {(p.totalDuration || p.milestones) && (
              <section>
                <h2 className="text-lg font-extrabold text-violet-700 border-b-2 border-violet-200 pb-2 mb-4">6. Project Timeline</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {p.startDate    && <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400 font-semibold">Start Date</div><div className="font-bold text-slate-900">{new Date(p.startDate).toLocaleDateString('en-IN')}</div></div>}
                  {p.totalDuration && <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400 font-semibold">Total Duration</div><div className="font-bold text-slate-900">{p.totalDuration}</div></div>}
                  {p.deliveryDate && <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400 font-semibold">Expected Delivery</div><div className="font-bold text-slate-900">{new Date(p.deliveryDate).toLocaleDateString('en-IN')}</div></div>}
                </div>
                {p.milestones && <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.milestones}</p>}
              </section>
            )}

            {/* Pricing */}
            <section style={{ pageBreakBefore: 'always' }}>
              <h2 className="text-lg font-extrabold text-violet-700 border-b-2 border-violet-200 pb-2 mb-4">7. Commercial Proposal</h2>
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr style={{ background: '#7c3aed', color: 'white' }}>
                    <th className="py-2.5 px-4 text-left text-xs font-bold">Service / Product</th>
                    <th className="py-2.5 px-4 text-left text-xs font-bold">Description</th>
                    <th className="py-2.5 px-3 text-right text-xs font-bold">Qty</th>
                    <th className="py-2.5 px-3 text-right text-xs font-bold">Rate</th>
                    <th className="py-2.5 px-3 text-right text-xs font-bold">Discount</th>
                    <th className="py-2.5 px-3 text-right text-xs font-bold">GST</th>
                    <th className="py-2.5 px-4 text-right text-xs font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {p.items.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-2.5 px-4 text-sm font-semibold text-slate-900">{item.serviceName}</td>
                      <td className="py-2.5 px-4 text-xs text-slate-600">{item.description}</td>
                      <td className="py-2.5 px-3 text-right text-xs text-slate-700">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-xs text-slate-700">{fmt(item.rate)}</td>
                      <td className="py-2.5 px-3 text-right text-xs text-rose-600">{item.discount ? fmt(item.discount) : '—'}</td>
                      <td className="py-2.5 px-3 text-right text-xs text-slate-600">{item.taxPercent}%</td>
                      <td className="py-2.5 px-4 text-right text-sm font-bold text-slate-900">{fmt(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Additional charges */}
              {p.additionalChargeItems.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Additional Charges</div>
                  <table className="w-full">
                    <tbody>
                      {p.additionalChargeItems.map((c, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-1.5 px-4 text-sm text-slate-700">{c.label}</td>
                          <td className="py-1.5 px-4 text-right font-semibold text-slate-900">{fmt(c.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals */}
              <div className="flex justify-end mt-4">
                <div className="w-72 space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-semibold">{fmt(p.subtotal)}</span></div>
                  {p.discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-rose-500">Discount</span><span className="font-semibold text-rose-600">-{fmt(p.discountAmount)}</span></div>}
                  <div className="flex justify-between text-sm"><span className="text-slate-500">GST ({p.taxRate}%)</span><span className="font-semibold">{fmt(p.taxAmount)}</span></div>
                  {p.totalAdditionalCharges > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Additional Charges</span><span className="font-semibold">{fmt(p.totalAdditionalCharges)}</span></div>}
                  <div className="flex justify-between pt-2 border-t-2 border-violet-600 text-base">
                    <span className="font-extrabold text-slate-900">Grand Total</span>
                    <span className="font-extrabold text-violet-700">{fmt(p.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Schedule */}
            {(p.advancePercent || p.paymentMilestones) && (
              <section>
                <h2 className="text-lg font-extrabold text-violet-700 border-b-2 border-violet-200 pb-2 mb-4">8. Payment Schedule</h2>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {p.advancePercent && <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-violet-700">{p.advancePercent}%</div><div className="text-xs text-violet-600 font-semibold">Advance / Confirmation</div><div className="text-xs text-slate-500 mt-1">{fmt(p.grandTotal * p.advancePercent / 100)}</div></div>}
                  {p.finalPaymentPercent && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center"><div className="text-xl font-extrabold text-emerald-700">{p.finalPaymentPercent}%</div><div className="text-xs text-emerald-600 font-semibold">Final Delivery</div><div className="text-xs text-slate-500 mt-1">{fmt(p.grandTotal * p.finalPaymentPercent / 100)}</div></div>}
                </div>
                {p.paymentMilestones && <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.paymentMilestones}</p>}
                {p.paymentMethod && <p className="text-xs text-slate-500 mt-2">Payment Method: {p.paymentMethod}</p>}
              </section>
            )}

            {/* Maintenance */}
            {(p.freeSupportPeriod || p.amcCharges) && (
              <section>
                <h2 className="text-lg font-extrabold text-violet-700 border-b-2 border-violet-200 pb-2 mb-4">9. Support & Maintenance</h2>
                <div className="grid grid-cols-3 gap-3">
                  {p.freeSupportPeriod && <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400 font-semibold">Free Support</div><div className="font-bold text-slate-900 mt-1">{p.freeSupportPeriod}</div></div>}
                  {p.amcCharges        && <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400 font-semibold">AMC Charges</div><div className="font-bold text-slate-900 mt-1">{p.amcCharges}</div></div>}
                  {p.renewalCharges    && <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400 font-semibold">Renewal</div><div className="font-bold text-slate-900 mt-1">{p.renewalCharges}</div></div>}
                </div>
              </section>
            )}

            {/* Terms */}
            {p.termsConditions && (
              <section>
                <h2 className="text-lg font-extrabold text-violet-700 border-b-2 border-violet-200 pb-2 mb-4">10. Terms & Conditions</h2>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{p.termsConditions}</p>
              </section>
            )}

            {/* Client Notes */}
            {p.clientNotes && (
              <section>
                <h2 className="text-lg font-extrabold text-violet-700 border-b-2 border-violet-200 pb-2 mb-4">Notes</h2>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.clientNotes}</p>
              </section>
            )}

            {/* Acceptance */}
            <section style={{ pageBreakBefore: 'always' }}>
              <h2 className="text-lg font-extrabold text-violet-700 border-b-2 border-violet-200 pb-2 mb-6">11. Acceptance</h2>
              <p className="text-sm text-slate-600 mb-8">By signing below, the client agrees to the terms, scope, pricing, and payment schedule outlined in this proposal.</p>
              <div className="grid grid-cols-2 gap-10 mt-6">
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-4">Client / Company</div>
                  <div className="space-y-6">
                    {['Name','Designation','Company','Signature','Date'].map(label => (
                      <div key={label}>
                        <div className="text-xs text-slate-500 mb-1">{label}</div>
                        <div className="border-b border-slate-300 pb-1 h-8" />
                      </div>
                    ))}
                    <div className="mt-4">
                      <div className="text-xs text-slate-500 mb-2">Accepted Proposal Amount</div>
                      <div className="border border-slate-300 rounded-lg p-3 text-center text-lg font-extrabold text-violet-700">₹ ___________</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <img src="/logo.png" alt="TechInPedia" className="h-5 w-auto object-contain" />
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">TechInPedia</span>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Name</div>
                      <div className="border-b border-slate-300 pb-1 h-8 text-sm font-semibold text-slate-900">{p.preparedBy}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Designation</div>
                      <div className="border-b border-slate-300 pb-1 h-8 text-sm text-slate-700">Authorized Signatory</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Company</div>
                      <div className="border-b border-slate-300 pb-1 h-8 text-sm font-semibold text-slate-900">TechInPedia</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Signature</div>
                      <div className="border-b border-slate-300 pb-1 h-8" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Date</div>
                      <div className="border-b border-slate-300 pb-1 h-8" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-10 pt-6 border-t border-slate-200 text-center">
                <div className="text-xs text-slate-400">TechInPedia · techinpedia.com · info@techinpedia.com</div>
                <div className="text-xs text-slate-400 mt-1">Proposal {p.proposalNumber} | Valid Until: {p.validUntil ? new Date(p.validUntil).toLocaleDateString('en-IN') : 'N/A'}</div>
              </div>
            </section>
          </div>
        </div>

        {/* Print styles */}
        <style>{`
          @media print {
            .print\\:hidden { display: none !important; }
            body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            #proposal-pdf { box-shadow: none !important; max-width: 100% !important; }
            @page { margin: 10mm 12mm; size: A4; }
          }
        `}</style>
      </div>
    );
  }

  // ── FORM VIEW ────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-16">
      {/* Form header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {editing ? `Edit Proposal — ${editing.proposalNumber}` : 'New Proposal'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">All fields in one page · Auto-save on Submit</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSave('DRAFT')} disabled={saving} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-60">
            Save Draft
          </button>
          <button onClick={() => handleSave()} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold cursor-pointer disabled:opacity-60 shadow-lg shadow-violet-500/20">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Proposal'}
          </button>
        </div>
      </div>

      {/* Grand total bar */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg shadow-violet-500/20">
        <div className="text-sm font-semibold opacity-90">Grand Total</div>
        <div className="text-3xl font-extrabold">{fmt(form.grandTotal || 0)}</div>
        <div className="text-xs opacity-75 text-right">
          <div>Subtotal: {fmt(form.subtotal || 0)}</div>
          <div>Discount: -{fmt(form.discountAmount || 0)}</div>
          <div>GST: {fmt(form.taxAmount || 0)}</div>
        </div>
      </div>

      {/* ── Section 1: Proposal Info ── */}
      <Section icon={FileText} title="Proposal Info">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Proposal Type" required>
            <select value={form.proposalType} onChange={e => setF({ proposalType: e.target.value })} className={sel}>
              {PROPOSAL_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </Field>
          <Field label="Proposal Title" required>
            <input className={inp} value={form.title} onChange={e => setF({ title: e.target.value })} placeholder="e.g. Marketplace Web & Mobile Platform" />
          </Field>
          <Field label="Proposal Date">
            <input type="date" className={inp} value={form.proposalDate} onChange={e => setF({ proposalDate: e.target.value })} />
          </Field>
          <Field label="Valid Until">
            <input type="date" className={inp} value={form.validUntil || ''} onChange={e => setF({ validUntil: e.target.value })} />
          </Field>
          <Field label="Prepared By / Employee">
            <input className={inp} value={form.preparedBy || ''} onChange={e => setF({ preparedBy: e.target.value })} placeholder="Sales Executive Name" />
          </Field>
          <Field label="Branch / Company">
            <input className={inp} value={form.branch || ''} onChange={e => setF({ branch: e.target.value })} placeholder="TechInPedia" />
          </Field>
        </div>
      </Section>

      {/* ── Section 2: Client Details ── */}
      <Section icon={Building} title="Client Details">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Client / Company Name" required>
            <input className={inp} value={form.clientName} onChange={e => setF({ clientName: e.target.value })} placeholder="ABC Pvt. Ltd." />
          </Field>
          <Field label="Contact Person">
            <input className={inp} value={form.contactPerson || ''} onChange={e => setF({ contactPerson: e.target.value })} placeholder="Mr. Ramesh Kumar" />
          </Field>
          <Field label="Email" required>
            <input type="email" className={inp} value={form.clientEmail} onChange={e => setF({ clientEmail: e.target.value })} placeholder="client@company.com" />
          </Field>
          <Field label="Mobile">
            <input className={inp} value={form.clientPhone || ''} onChange={e => setF({ clientPhone: e.target.value })} placeholder="+91 98765 43210" />
          </Field>
          <Field label="WhatsApp">
            <input className={inp} value={form.clientWhatsApp || ''} onChange={e => setF({ clientWhatsApp: e.target.value })} placeholder="+91 98765 43210" />
          </Field>
          <Field label="GSTIN (optional)">
            <input className={inp} value={form.gstin || ''} onChange={e => setF({ gstin: e.target.value })} placeholder="27AABCU9603R1ZX" />
          </Field>
          <Field label="Billing Address">
            <textarea className={ta} rows={2} value={form.billingAddress || ''} onChange={e => setF({ billingAddress: e.target.value })} placeholder="Full billing address..." />
          </Field>
        </div>
      </Section>

      {/* ── Section 3: CRM Link ── */}
      <Section icon={ClipboardList} title="Lead / CRM Link">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Lead / Enquiry ID">
            <input className={inp} value={form.enquiryId || ''} onChange={e => setF({ enquiryId: e.target.value })} placeholder="Enquiry ID" />
          </Field>
          <Field label="Deal ID">
            <input className={inp} value={form.dealId || ''} onChange={e => setF({ dealId: e.target.value })} placeholder="Deal ID" />
          </Field>
          <Field label="Sales Executive">
            <input className={inp} value={form.salesExecutive || ''} onChange={e => setF({ salesExecutive: e.target.value })} placeholder="Executive Name" />
          </Field>
          <Field label="Lead Source">
            <input className={inp} value={form.leadSource || ''} onChange={e => setF({ leadSource: e.target.value })} placeholder="Google, Referral, etc." />
          </Field>
        </div>
      </Section>

      {/* ── Section 4: Project Details ── */}
      <Section icon={User} title="Project Details">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Project / Service Name">
            <input className={inp} value={form.projectName || ''} onChange={e => setF({ projectName: e.target.value })} placeholder="Marketplace Platform" />
          </Field>
          <Field label="Category">
            <input className={inp} value={form.category || ''} onChange={e => setF({ category: e.target.value })} placeholder="Web Development" />
          </Field>
          <div className="col-span-2">
            <Field label="Short Requirement">
              <textarea className={ta} rows={3} value={form.requirement || ''} onChange={e => setF({ requirement: e.target.value })} placeholder="Brief project requirement..." />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Executive Summary">
              <textarea className={ta} rows={4} value={form.executiveSummary || ''} onChange={e => setF({ executiveSummary: e.target.value })} placeholder="Executive summary for cover page — what problem are you solving and how?" />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Client Objective">
              <textarea className={ta} rows={3} value={form.clientObjective || ''} onChange={e => setF({ clientObjective: e.target.value })} placeholder="Client's business goals..." />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Proposed Solution">
              <textarea className={ta} rows={4} value={form.proposedSolution || ''} onChange={e => setF({ proposedSolution: e.target.value })} placeholder="Our solution approach..." />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Technology Stack">
              <textarea className={ta} rows={4} value={form.techStack || ''} onChange={e => setF({ techStack: e.target.value })} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 5: Scope of Work ── */}
      <Section icon={ClipboardList} title="Scope of Work">
        <div className="space-y-4">
          <Field label="Deliverables">
            <textarea className={ta} rows={4} value={form.deliverables || ''} onChange={e => setF({ deliverables: e.target.value })} placeholder="List of deliverables..." />
          </Field>
          <Field label="Features / Modules">
            <textarea className={ta} rows={4} value={form.features || ''} onChange={e => setF({ features: e.target.value })} placeholder="Module: Features&#10;User Website: Registration, Search&#10;Admin Panel: Dashboard, Users" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Included Services">
              <textarea className={ta} rows={4} value={form.includedServices || ''} onChange={e => setF({ includedServices: e.target.value })} placeholder="✓ Source code&#10;✓ Deployment..." />
            </Field>
            <Field label="Excluded Services">
              <textarea className={ta} rows={4} value={form.excludedServices || ''} onChange={e => setF({ excludedServices: e.target.value })} placeholder="✗ Content writing&#10;✗ Domain registration..." />
            </Field>
          </div>
          <Field label="Third-party Integrations">
            <textarea className={ta} rows={2} value={form.thirdPartyIntegrations || ''} onChange={e => setF({ thirdPartyIntegrations: e.target.value })} placeholder="Razorpay, WhatsApp API, Google Maps..." />
          </Field>
        </div>
      </Section>

      {/* ── Section 6: Timeline ── */}
      <Section icon={Calendar} title="Timeline">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Expected Start Date">
            <input type="date" className={inp} value={(form as any).startDate || ''} onChange={e => setF({ startDate: e.target.value } as any)} />
          </Field>
          <Field label="Total Duration">
            <input className={inp} value={form.totalDuration || ''} onChange={e => setF({ totalDuration: e.target.value })} placeholder="40 Days" />
          </Field>
          <Field label="Expected Delivery Date">
            <input type="date" className={inp} value={(form as any).deliveryDate || ''} onChange={e => setF({ deliveryDate: e.target.value } as any)} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Milestones">
            <textarea className={ta} rows={4} value={form.milestones || ''} onChange={e => setF({ milestones: e.target.value })} placeholder="Phase 1 — Requirement & Planning: 3 Days&#10;Phase 2 — UI/UX Design: 5 Days&#10;Phase 3 — Development: 25 Days&#10;Phase 4 — Testing: 5 Days&#10;Phase 5 — Deployment: 2 Days" />
          </Field>
        </div>
      </Section>

      {/* ── Section 7: Pricing Items ── */}
      <Section icon={IndianRupee} title="Pricing — Line Items">
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-2 pb-1">
            {['Service / Product','Description','Qty','Rate (₹)','Discount (₹)','GST %','Amount (₹)',''].map(h => (
              <div key={h} className={`text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${h === 'Service / Product' ? 'col-span-2' : h === 'Description' ? 'col-span-3' : h === '' ? 'col-span-1' : 'col-span-1'}`}>{h}</div>
            ))}
          </div>

          {form.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <input className={`${inp} col-span-2 !bg-white dark:!bg-slate-900`} value={item.serviceName} onChange={e => updateItem(idx, { serviceName: e.target.value })} placeholder="Website Dev" />
              <input className={`${inp} col-span-3 !bg-white dark:!bg-slate-900`} value={item.description} onChange={e => updateItem(idx, { description: e.target.value })} placeholder="Next.js website" />
              <input type="number" className={`${inp} col-span-1 !bg-white dark:!bg-slate-900`} value={item.quantity} onChange={e => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })} min="0" />
              <input type="number" className={`${inp} col-span-1 !bg-white dark:!bg-slate-900`} value={item.rate} onChange={e => updateItem(idx, { rate: parseFloat(e.target.value) || 0 })} min="0" />
              <input type="number" className={`${inp} col-span-1 !bg-white dark:!bg-slate-900`} value={item.discount} onChange={e => updateItem(idx, { discount: parseFloat(e.target.value) || 0 })} min="0" />
              <input type="number" className={`${inp} col-span-1 !bg-white dark:!bg-slate-900`} value={item.taxPercent} onChange={e => updateItem(idx, { taxPercent: parseFloat(e.target.value) || 0 })} min="0" />
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-sm font-bold text-violet-700 dark:text-violet-400">{fmt(item.amount)}</span>
                <button onClick={() => removeItem(idx)} className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}

          <button onClick={addItem} className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Add Line Item
          </button>
        </div>
      </Section>

      {/* ── Section 8: Additional Charges ── */}
      <Section icon={IndianRupee} title="Additional Charges">
        <div className="space-y-3">
          {/* Column Header */}
          {form.additionalChargeItems.length > 0 && (
            <div className="grid grid-cols-12 gap-3 px-2 pb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <div className="col-span-8">Description / Service Item</div>
              <div className="col-span-3 text-right">Amount (₹)</div>
              <div className="col-span-1 text-center">Action</div>
            </div>
          )}

          {/* List of Charges */}
          {form.additionalChargeItems.map((c, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 items-center p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700">
              <div className="col-span-8">
                <input
                  type="text"
                  className={inp}
                  value={c.label}
                  onChange={e => updateCharge(idx, { label: e.target.value })}
                  placeholder="e.g. Cloud VPS Hosting (1 Year), Custom Domain Registration, SSL Setup..."
                />
              </div>
              <div className="col-span-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold select-none">₹</span>
                  <input
                    type="number"
                    className={`${inp} pl-7 text-right font-medium`}
                    value={c.amount === 0 ? '' : c.amount}
                    onChange={e => updateCharge(idx, { amount: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => removeCharge(idx)}
                  title="Remove charge"
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Quick Presets & Add Button */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Add:</span>
              {[
                { label: 'Cloud VPS Hosting (1 Year)', amount: 6000 },
                { label: 'Domain Registration (.com)', amount: 1200 },
                { label: 'SSL Certificate & Setup', amount: 1500 },
                { label: 'WhatsApp Cloud API Setup', amount: 3500 },
                { label: 'Payment Gateway Integration', amount: 2500 }
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => addCharge(preset.label, preset.amount)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950/50 dark:hover:text-violet-300 rounded-lg border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-violet-500" />
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addCharge()}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/60 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Custom Charge
            </button>
          </div>
        </div>
      </Section>

      {/* ── Section 9: Payment Terms ── */}
      <Section icon={IndianRupee} title="Payment Terms">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Advance %">
            <input type="number" className={inp} value={form.advancePercent || ''} onChange={e => setF({ advancePercent: parseFloat(e.target.value) })} placeholder="40" min="0" max="100" />
          </Field>
          <Field label="Final Payment %">
            <input type="number" className={inp} value={form.finalPaymentPercent || ''} onChange={e => setF({ finalPaymentPercent: parseFloat(e.target.value) })} placeholder="10" min="0" max="100" />
          </Field>
          <Field label="Due Days">
            <input type="number" className={inp} value={form.dueDays || ''} onChange={e => setF({ dueDays: parseInt(e.target.value) })} placeholder="7" min="0" />
          </Field>
          <Field label="Payment Method">
            <input className={inp} value={form.paymentMethod || ''} onChange={e => setF({ paymentMethod: e.target.value })} placeholder="Bank Transfer / UPI" />
          </Field>
          <div className="col-span-2 md:col-span-3">
            <Field label="Milestone Payments (optional)">
              <textarea className={ta} rows={3} value={form.paymentMilestones || ''} onChange={e => setF({ paymentMilestones: e.target.value })} placeholder="40% — Project Confirmation&#10;30% — Development Milestone&#10;20% — Beta Delivery&#10;10% — Final Deployment" />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 10: Maintenance ── */}
      <Section icon={RefreshCw} title="Maintenance & Support">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Free Support Period">
            <input className={inp} value={form.freeSupportPeriod || ''} onChange={e => setF({ freeSupportPeriod: e.target.value })} placeholder="30 Days" />
          </Field>
          <Field label="AMC / Monthly Maintenance">
            <input className={inp} value={form.amcCharges || ''} onChange={e => setF({ amcCharges: e.target.value })} placeholder="₹5,000/month" />
          </Field>
          <Field label="Renewal Charges">
            <input className={inp} value={form.renewalCharges || ''} onChange={e => setF({ renewalCharges: e.target.value })} placeholder="₹10,000/year" />
          </Field>
        </div>
      </Section>

      {/* ── Section 11: Terms & Notes ── */}
      <Section icon={FileText} title="Terms & Notes">
        <div className="space-y-4">
          <Field label="Revision Limit">
            <input type="number" className={`${inp} w-24`} value={form.revisionLimit || ''} onChange={e => setF({ revisionLimit: parseInt(e.target.value) })} placeholder="2" min="0" />
          </Field>
          <Field label="Terms & Conditions">
            <textarea className={ta} rows={8} value={form.termsConditions || ''} onChange={e => setF({ termsConditions: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Internal Notes (not visible to client)">
              <textarea className={ta} rows={4} value={form.internalNotes || ''} onChange={e => setF({ internalNotes: e.target.value })} placeholder="Internal comments, margin notes..." />
            </Field>
            <Field label="Client-facing Notes">
              <textarea className={ta} rows={4} value={form.clientNotes || ''} onChange={e => setF({ clientNotes: e.target.value })} placeholder="Thank you note, next steps..." />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 12: Status ── */}
      <Section icon={Check} title="Status">
        <div className="flex flex-wrap gap-2">
          {PROPOSAL_STATUSES.map(s => (
            <button
              key={s.key}
              onClick={() => setF({ status: s.key })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${form.status === s.key ? s.color + ' border-transparent' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-400'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Save buttons (bottom) */}
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={() => setView('list')} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">Cancel</button>
        <button onClick={() => handleSave('DRAFT')} disabled={saving} className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-60">Save Draft</button>
        <button onClick={() => handleSave()} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold cursor-pointer disabled:opacity-60 shadow-lg shadow-violet-500/20">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Proposal'}
        </button>
      </div>
    </div>
  );
}
