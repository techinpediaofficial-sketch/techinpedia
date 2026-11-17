'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Mail, Phone, MessageSquare, Trash2, X,
  LayoutGrid, Table2, Plus, GripVertical, ArrowRight,
  Building, User, Calendar, Tag, ChevronRight, Copy, Check
} from 'lucide-react';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  alternatePhone?: string | null;
  company?: string | null;
  service?: string | null;
  budget?: string | null;
  timeline?: string | null;
  message: string;
  source: string;
  status: string;
  createdAt: string;
  assignedUser?: { name: string; email: string } | null;
  assignedEmployee?: { name: string; employeeCode: string } | null;
  notes?: { id: string; note: string; createdAt: string; user: { name: string } }[];
}

const STAGES = [
  { key: 'NEW',           label: 'New',           color: '#6366f1', bg: 'bg-indigo-500',  text: 'text-indigo-700 dark:text-indigo-300',  pill: 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300' },
  { key: 'CONTACTED',     label: 'Contacted',     color: '#f59e0b', bg: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-300',     pill: 'bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300' },
  { key: 'QUALIFIED',     label: 'Qualified',     color: '#a855f7', bg: 'bg-purple-500',  text: 'text-purple-700 dark:text-purple-300',   pill: 'bg-purple-50 dark:bg-purple-500/20 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300' },
  { key: 'PROPOSAL_SENT', label: 'Proposal Sent', color: '#06b6d4', bg: 'bg-cyan-500',    text: 'text-cyan-700 dark:text-cyan-300',       pill: 'bg-cyan-50 dark:bg-cyan-500/20 border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-300' },
  { key: 'NEGOTIATION',   label: 'Negotiation',   color: '#f97316', bg: 'bg-orange-500',  text: 'text-orange-700 dark:text-orange-300',   pill: 'bg-orange-50 dark:bg-orange-500/20 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-300' },
  { key: 'WON',           label: 'Won ✓',         color: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', pill: 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300' },
  { key: 'LOST',          label: 'Lost',          color: '#ef4444', bg: 'bg-rose-500',    text: 'text-rose-700 dark:text-rose-300',       pill: 'bg-rose-50 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300' },
];

function getStageMeta(key: string) {
  return STAGES.find(s => s.key === key) || STAGES[0];
}

export default function EnquiriesKanbanPage() {
  const [enquiries, setEnquiries]     = useState<Enquiry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [viewMode, setViewMode]       = useState<'kanban' | 'table'>('kanban');
  const [selected, setSelected]       = useState<Enquiry | null>(null);
  const [newNote, setNewNote]         = useState('');
  const [updatingId, setUpdatingId]   = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Drag state
  const dragId    = useRef<string | null>(null);
  const dragOver  = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL('/api/enquiries', window.location.origin);
      if (searchTerm) url.searchParams.set('search', searchTerm);
      url.searchParams.set('limit', '500');
      const res  = await fetch(url.toString());
      const data = await res.json();
      if (res.ok) setEnquiries(data.enquiries || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => { fetchEnquiries(); }, []);

  // ── Status update ──────────────────────────────────────────────
  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    // Optimistic UI
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    try {
      await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Add note ───────────────────────────────────────────────────
  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selected) return;
    try {
      const res  = await fetch(`/api/enquiries/${selected.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      });
      const data = await res.json();
      if (res.ok && data.note) {
        setSelected(prev => prev ? { ...prev, notes: [data.note, ...(prev.notes || [])] } : null);
        setNewNote('');
      }
    } catch (e) { console.error(e); }
  };

  // ── Delete ─────────────────────────────────────────────────────
  const deleteEnquiry = async (id: string) => {
    if (!confirm('Delete this lead permanently?')) return;
    try {
      const res = await fetch(`/api/enquiries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEnquiries(prev => prev.filter(e => e.id !== id));
        if (selected?.id === id) setSelected(null);
      }
    } catch (e) { console.error(e); }
  };

  // ── Drag & Drop ────────────────────────────────────────────────
  const onDragStart = (e: React.DragEvent, id: string) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOver.current !== col) {
      dragOver.current = col;
      setDragOverCol(col);
    }
  };

  const onDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const id = dragId.current;
    if (id) {
      const card = enquiries.find(en => en.id === id);
      if (card && card.status !== targetStatus) {
        updateStatus(id, targetStatus);
      }
    }
    dragId.current   = null;
    dragOver.current = null;
    setDragOverCol(null);
  };

  const onDragEnd = () => {
    dragId.current   = null;
    dragOver.current = null;
    setDragOverCol(null);
  };

  // ── Filtered ───────────────────────────────────────────────────
  const filtered = enquiries.filter(e =>
    !searchTerm ||
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.company || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Leads Kanban Board
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Drag &amp; drop leads across stages · <span className="font-semibold text-violet-600 dark:text-violet-400">{filtered.length}</span> leads
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchEnquiries()}
              className="pl-8 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:border-violet-500 focus:outline-none transition-colors shadow-xs w-52"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <Table2 className="w-3.5 h-3.5" /> Table
            </button>
          </div>
        </div>
      </div>

      {/* ── Stage summary pills ── */}
      <div className="flex flex-wrap gap-2">
        {STAGES.map(s => {
          const count = filtered.filter(e => e.status === s.key).length;
          return (
            <div key={s.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-[11px] font-semibold">
              <span className={`w-2 h-2 rounded-full ${s.bg}`} />
              <span className="text-slate-700 dark:text-slate-300">{s.label}</span>
              <span className={`font-bold ${s.text}`}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* ── KANBAN VIEW ── */}
      {viewMode === 'kanban' && (
        loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 dark:text-slate-500">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent mb-3" />
              <p className="text-sm font-medium">Loading kanban board...</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 overflow-x-auto pb-6 -mx-1 px-1">
            {STAGES.map(col => {
              const cards      = filtered.filter(e => e.status === col.key);
              const isTarget   = dragOverCol === col.key;

              return (
                <div
                  key={col.key}
                  className={`shrink-0 w-64 flex flex-col rounded-2xl border transition-all duration-150 ${
                    isTarget
                      ? 'border-violet-400 dark:border-violet-500 bg-violet-50/80 dark:bg-violet-900/20 ring-2 ring-violet-400/30 scale-[1.005]'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60'
                  }`}
                  onDragOver={e => onDragOver(e, col.key)}
                  onDrop={e => onDrop(e, col.key)}
                  onDragLeave={() => { dragOver.current = null; setDragOverCol(null); }}
                  style={{ maxHeight: 'calc(100vh - 260px)' }}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{col.label}</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      {cards.length}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 thin-scrollbar">
                    {cards.length === 0 ? (
                      <div className={`border-2 border-dashed rounded-xl p-5 text-center text-[11px] transition-colors ${
                        isTarget
                          ? 'border-violet-400 text-violet-500 dark:text-violet-400 bg-violet-50/40 dark:bg-violet-900/10'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600'
                      }`}>
                        {isTarget ? '📥 Drop here' : 'No leads'}
                      </div>
                    ) : (
                      cards.map(enq => {
                        const isDragging = false; // ref-based, no re-render
                        const stageMeta = getStageMeta(enq.status);
                        const nextIdx   = STAGES.findIndex(s => s.key === enq.status) + 1;
                        const nextStage = nextIdx < STAGES.length ? STAGES[nextIdx] : null;

                        return (
                          <div
                            key={enq.id}
                            draggable
                            onDragStart={e => onDragStart(e, enq.id)}
                            onDragEnd={onDragEnd}
                            onClick={() => setSelected(enq)}
                            className={`group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 cursor-grab active:cursor-grabbing shadow-xs hover:shadow-md hover:border-violet-300 dark:hover:border-violet-600 transition-all select-none ${updatingId === enq.id ? 'opacity-50 pointer-events-none' : ''}`}
                          >
                            {/* Drag handle row */}
                            <div className="flex items-start justify-between gap-1 mb-1.5">
                              <GripVertical className="w-3 h-3 text-slate-300 dark:text-slate-600 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white text-xs leading-tight truncate">
                                  {enq.name}
                                </p>
                                {enq.company && (
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                    <Building className="w-2.5 h-2.5" /> {enq.company}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Contact Info: Phone & Email */}
                            <div className="space-y-1 mb-2.5">
                              {enq.phone ? (
                                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold truncate">
                                  <Phone className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{enq.phone}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono italic truncate">
                                  <Phone className="w-2.5 h-2.5 shrink-0 opacity-40" />
                                  <span className="truncate">No phone</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                <Mail className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                                <span className="truncate">{enq.email}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-wrap mb-2">
                              {enq.service && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 truncate max-w-[100px]">
                                  {enq.service}
                                </span>
                              )}
                              {enq.budget && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                  {enq.budget}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-700 text-[9px] text-slate-400">
                              <span>{new Date(enq.createdAt).toLocaleDateString()}</span>
                              {enq.assignedEmployee && (
                                <span className="font-semibold text-indigo-500 dark:text-indigo-400 truncate max-w-[70px]">
                                  {enq.assignedEmployee.name}
                                </span>
                              )}
                            </div>

                            {/* Quick advance button */}
                            {nextStage && col.key !== 'WON' && col.key !== 'LOST' && (
                              <button
                                onClick={e => { e.stopPropagation(); updateStatus(enq.id, nextStage.key); }}
                                className="mt-2 w-full flex items-center justify-center gap-1 text-[9px] font-bold py-1 rounded-lg bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300 hover:border-violet-300 dark:hover:border-violet-600 transition-all cursor-pointer"
                              >
                                → {nextStage.label}
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Budget</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {loading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400">No leads found.</td></tr>
                ) : filtered.map(e => {
                  const s = getStageMeta(e.status);
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{e.name}</div>
                        {e.company && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{e.company}</span>
                          </div>
                        )}
                        {e.phone && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            <a href={`tel:${e.phone}`} className="hover:underline">{e.phone}</a>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-blue-500" />
                          <a href={`mailto:${e.email}`} className="hover:underline truncate max-w-[200px]">{e.email}</a>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">{e.service || 'General'}</td>
                      <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">{e.budget || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{e.source}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${s.pill}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {new Date(e.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => setSelected(e)}
                          className="px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 dark:bg-violet-600/20 dark:hover:bg-violet-600/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30 font-semibold text-xs transition-all cursor-pointer"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => deleteEnquiry(e.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DETAIL DRAWER ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-end"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-xl h-full p-6 overflow-y-auto space-y-5 shadow-2xl relative text-slate-900 dark:text-white flex flex-col">
            {/* Close */}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Name / status / quick metadata */}
            <div className="space-y-3 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${getStageMeta(selected.status).pill}`}>
                  {getStageMeta(selected.status).label}
                </span>
                {selected.source && (
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {selected.source}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white pt-1">{selected.name}</h2>
                {selected.company && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium">{selected.company}</span>
                  </p>
                )}
              </div>

              {/* Dedicated Contact Card (Phone & Email with One-Click Copy) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5 shadow-xs">
                {/* Phone row */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Phone Number</div>
                      {selected.phone ? (
                        <a href={`tel:${selected.phone}`} className="font-mono font-bold text-slate-900 dark:text-emerald-400 hover:underline text-xs block truncate">
                          {selected.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Not provided</span>
                      )}
                    </div>
                  </div>
                  {selected.phone && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selected.phone!);
                        setCopiedField('phone');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                      title="Copy phone number"
                    >
                      {copiedField === 'phone' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Email row */}
                <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Email Address</div>
                      {selected.email ? (
                        <a href={`mailto:${selected.email}`} className="font-medium text-slate-900 dark:text-blue-400 hover:underline text-xs block truncate">
                          {selected.email}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Not provided</span>
                      )}
                    </div>
                  </div>
                  {selected.email && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selected.email);
                        setCopiedField('email');
                        setTimeout(() => setCopiedField(null), 2000);
                      }}
                      className="px-2 py-1 rounded-md text-[10px] font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                      title="Copy email address"
                    >
                      {copiedField === 'email' ? (
                        <>
                          <Check className="w-3 h-3 text-blue-500" />
                          <span className="text-blue-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Alternate phone if available */}
                {selected.alternatePhone && (
                  <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                        <Phone className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Alternate Phone</div>
                        <a href={`tel:${selected.alternatePhone}`} className="font-mono font-bold text-slate-900 dark:text-teal-400 hover:underline text-xs block truncate">
                          {selected.alternatePhone}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-2">
              <a href={`mailto:${selected.email}`} className="py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                <Mail className="w-4 h-4" /> Email
              </a>
              {selected.phone ? (
                <a href={`tel:${selected.phone}`} className="py-2.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-600/20 dark:hover:bg-purple-600/30 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                  <Phone className="w-4 h-4" /> Call
                </a>
              ) : (
                <button disabled className="py-2.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 opacity-50">
                  <Phone className="w-4 h-4" /> No Phone
                </button>
              )}
              <a
                href={`https://wa.me/${(selected.phone || '91').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selected.name}, regarding your enquiry with TechInPedia...`)}`}
                target="_blank" rel="noopener noreferrer"
                className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </a>
            </div>

            {/* Stage move */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">Move to stage</p>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map(s => (
                  <button
                    key={s.key}
                    onClick={() => updateStatus(selected.id, s.key)}
                    disabled={s.key === selected.status}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${s.key === selected.status ? s.pill : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-violet-400 hover:text-violet-700 dark:hover:text-violet-300'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <span className="text-slate-500 dark:text-slate-400">Phone Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selected.phone || '—'}</span>
                <span className="text-slate-500 dark:text-slate-400">Email Address</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{selected.email || '—'}</span>
                <span className="text-slate-500 dark:text-slate-400">Service</span>
                <span className="font-semibold">{selected.service || 'General'}</span>
                <span className="text-slate-500 dark:text-slate-400">Budget</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selected.budget || 'Unspecified'}</span>
                <span className="text-slate-500 dark:text-slate-400">Timeline</span>
                <span className="text-amber-600 dark:text-amber-400">{selected.timeline || 'Unspecified'}</span>
                <span className="text-slate-500 dark:text-slate-400">Source</span>
                <span>{selected.source}</span>
                {selected.assignedEmployee && (
                  <>
                    <span className="text-slate-500 dark:text-slate-400">Assigned To</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selected.assignedEmployee.name}</span>
                  </>
                )}
              </div>
              {selected.message && (
                <div className="mt-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400 font-semibold mb-1">Message</p>
                  <div className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    {selected.message}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-3 flex-1">
              <h3 className="text-sm font-bold">Internal Notes</h3>
              <form onSubmit={addNote} className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Add internal note..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:border-violet-500 focus:outline-none transition-colors resize-none"
                />
                <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors cursor-pointer">
                  Add Note
                </button>
              </form>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(selected.notes || []).map(n => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-violet-600 dark:text-violet-400">{n.user?.name || 'Admin'}</span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-200">{n.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delete */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => deleteEnquiry(selected.id)}
                className="px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
