'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Phone,
  MessageSquare,
  Mail,
  Users,
  Plus,
  X,
  ChevronRight,
  Filter,
  ArrowRight,
  CalendarClock,
  Building,
  User,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface FollowUp {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  completedAt?: string | null;
  assignedToEmail?: string | null;
  notes?: string | null;
  outcome?: string | null;
  deal?: { id: string; title: string; value: number } | null;
  enquiry?: { id: string; name: string; email: string; phone?: string | null; company?: string | null } | null;
  customer?: { id: string; name: string; email: string } | null;
  assignedEmployee?: { id: string; name: string; employeeCode: string } | null;
}

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [metrics, setMetrics] = useState({ today: 0, overdue: 0, upcoming: 0, my: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'today' | 'overdue' | 'upcoming' | 'all' | 'my'>('today');

  // Complete Outcome Modal State
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [outcome, setOutcome] = useState('');
  const [updating, setUpdating] = useState(false);

  // New Follow-up Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('CALL');
  const [newDate, setNewDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/crm/followups', window.location.origin);
      if (activeFilter !== 'all') {
        url.searchParams.set('filter', activeFilter);
      }

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok) {
        setFollowUps(data.followUps || []);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [activeFilter]);

  // 1-Click Reschedule (+24h, +3d, +1w)
  const handleQuickReschedule = async (id: string, hoursToAdd: number) => {
    try {
      const newTime = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000).toISOString();
      const res = await fetch(`/api/crm/followups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: newTime,
          status: 'PENDING',
        }),
      });
      if (res.ok) {
        fetchFollowUps();
      }
    } catch (err) {
      console.error('Failed to reschedule follow-up:', err);
    }
  };

  const handleMarkComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUp) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/crm/followups/${selectedFollowUp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          outcome,
        }),
      });
      if (res.ok) {
        setSelectedFollowUp(null);
        setOutcome('');
        fetchFollowUps();
      }
    } catch (err) {
      console.error('Failed to complete follow-up:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/crm/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          scheduledAt: newDate,
          notes: newNotes,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewDate('');
        setNewNotes('');
        fetchFollowUps();
      }
    } catch (err) {
      console.error('Failed to create follow-up:', err);
    } finally {
      setCreating(false);
    }
  };

  const outcomeSuggestions = [
    'Call connected: Client interested in proposal',
    'No answer: Left voicemail and sent WhatsApp',
    'Proposal presented: Review scheduled for next week',
    'Negotiation on pricing: Revision needed',
    'Closed - Won deal confirmed',
    'Closed - Lead postponed project',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Follow-up Task Engine</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              Phase B
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Zero dropped leads: scheduled phone calls, meetings, WhatsApp follow-ups, and 1-click reschedule.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Schedule Follow-up
        </button>
      </div>

      {/* Overview Cards & Filter Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveFilter('today')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeFilter === 'today'
              ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400/20'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Today's Queue</span>
            <Clock className="w-4 h-4 opacity-80" />
          </div>
          <div className="text-2xl font-extrabold">{metrics.today}</div>
        </button>

        <button
          onClick={() => setActiveFilter('overdue')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeFilter === 'overdue'
              ? 'bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-400/20'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Overdue</span>
            <AlertCircle className="w-4 h-4 opacity-80" />
          </div>
          <div className="text-2xl font-extrabold">{metrics.overdue}</div>
        </button>

        <button
          onClick={() => setActiveFilter('upcoming')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeFilter === 'upcoming'
              ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400/20'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Upcoming</span>
            <Calendar className="w-4 h-4 opacity-80" />
          </div>
          <div className="text-2xl font-extrabold">{metrics.upcoming}</div>
        </button>

        <button
          onClick={() => setActiveFilter('my')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeFilter === 'my'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/20'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">My Tasks</span>
            <User className="w-4 h-4 opacity-80" />
          </div>
          <div className="text-2xl font-extrabold">{metrics.my ?? 0}</div>
        </button>

        <button
          onClick={() => setActiveFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeFilter === 'all'
              ? 'bg-violet-600 text-white border-violet-700 shadow-md ring-2 ring-violet-400/20'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">All Tasks</span>
            <CheckCircle2 className="w-4 h-4 opacity-80" />
          </div>
          <div className="text-2xl font-extrabold">{metrics.all ?? followUps.length}</div>
        </button>
      </div>

      {/* Follow-ups List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3">Follow-up Activity</th>
                <th className="px-5 py-3">Channel</th>
                <th className="px-5 py-3">Scheduled Time</th>
                <th className="px-5 py-3">Linked Account / Lead</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
                    <p className="text-sm">Loading follow-ups schedule...</p>
                  </td>
                </tr>
              ) : followUps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-200">All clear! No pending follow-ups in this view</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Schedule a follow-up from any lead or deal page.</p>
                  </td>
                </tr>
              ) : (
                followUps.map((f) => {
                  const isOverdue = new Date(f.scheduledAt) < new Date() && f.status === 'PENDING';
                  return (
                    <tr key={f.id} className="hover:bg-slate-50 dark:bg-slate-950/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{f.title}</div>
                        {f.notes && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{f.notes}</p>}
                        {f.outcome && (
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded mt-1 inline-block border border-emerald-100 dark:border-emerald-800">
                            Outcome: {f.outcome}
                          </div>
                        )}
                        {f.assignedEmployee && (
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            Assigned to: {f.assignedEmployee.name}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          {f.type === 'CALL' && <Phone className="w-3.5 h-3.5 text-blue-500" />}
                          {f.type === 'WHATSAPP' && <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />}
                          {f.type === 'EMAIL' && <Mail className="w-3.5 h-3.5 text-purple-500" />}
                          {f.type === 'MEETING' && <Users className="w-3.5 h-3.5 text-amber-500" />}
                          {f.type}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-xs font-medium">
                        <div className={isOverdue ? 'text-red-600 font-bold flex items-center gap-1' : 'text-slate-700 dark:text-slate-200'}>
                          {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                          {new Date(f.scheduledAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-xs">
                        {f.deal ? (
                          <Link
                            href="/admin/deals"
                            className="font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                          >
                            <Building className="w-3 h-3" />
                            {f.deal.title}
                          </Link>
                        ) : f.enquiry ? (
                          <Link
                            href="/admin/leads"
                            className="font-semibold text-slate-800 dark:text-slate-200 hover:text-violet-600 flex items-center gap-1"
                          >
                            <User className="w-3 h-3 text-slate-400" />
                            {f.enquiry.name} {f.enquiry.company ? `(${f.enquiry.company})` : ''}
                          </Link>
                        ) : f.customer ? (
                          <Link
                            href={`/admin/customers/${f.customer.id}`}
                            className="font-semibold text-slate-800 dark:text-slate-200 hover:text-violet-600 flex items-center gap-1"
                          >
                            <Building className="w-3 h-3 text-slate-400" />
                            {f.customer.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">General Follow-up</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            f.status === 'COMPLETED'
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                              : isOverdue
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                          }`}
                        >
                          {f.status === 'PENDING' && isOverdue ? 'OVERDUE' : f.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {f.status === 'PENDING' ? (
                          <div className="inline-flex items-center gap-1.5">
                            {/* 1-Click Quick Reschedule Buttons */}
                            <button
                              onClick={() => handleQuickReschedule(f.id, 24)}
                              title="Reschedule +24 Hours"
                              className="px-2 py-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
                            >
                              +24h
                            </button>
                            <button
                              onClick={() => handleQuickReschedule(f.id, 72)}
                              title="Reschedule +3 Days"
                              className="px-2 py-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
                            >
                              +3d
                            </button>
                            <button
                              onClick={() => handleQuickReschedule(f.id, 168)}
                              title="Reschedule +1 Week"
                              className="px-2 py-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
                            >
                              +1w
                            </button>
                            <button
                              onClick={() => setSelectedFollowUp(f)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                            >
                              Mark Done
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Follow-up Modal with Quick Outcome Chips */}
      {selectedFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Follow-up Outcome</h3>
              <button
                onClick={() => setSelectedFollowUp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMarkComplete} className="space-y-4 mt-4 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block mb-1">Follow-up Task</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedFollowUp.title}</p>
              </div>

              {/* Quick Outcome Suggestions */}
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1.5">
                  Quick Select Outcome:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {outcomeSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setOutcome(sug)}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-950 hover:text-violet-700 dark:hover:text-violet-300 transition-colors text-left"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">
                  Outcome & Call Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  placeholder="e.g. Client agreed on 15 Laptops rental. Requested contract copy for signing."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFollowUp(null)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || !outcome.trim()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Follow-up</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Check requirement update with client"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp Message</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Meeting / Demo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Notes / Agenda</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  placeholder="Preparation notes..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium shadow-xs disabled:opacity-50"
                >
                  {creating ? 'Scheduling...' : 'Save Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
