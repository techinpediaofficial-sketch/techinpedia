'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Calendar,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

interface Timesheet {
  id: string;
  hours: number;
  date: string;
  description?: string | null;
  isBillable: boolean;
  employeeName: string;
  project?: { id: string; name: string; code: string } | null;
  task?: { id: string; title: string } | null;
}

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  // Log Hours Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    projectId: '',
    hours: '4',
    date: new Date().toISOString().split('T')[0],
    description: '',
    isBillable: true,
  });
  const [creating, setCreating] = useState(false);

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects/timesheets');
      const data = await res.json();
      if (res.ok) {
        setTimesheets(data.timesheets || []);
        if (data.metrics) setTotalHours(data.metrics.totalHours);
      }
    } catch (err) {
      console.error('Failed to load timesheets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
    fetch('/api/projects/internal')
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) {
          setProjects(data.projects);
          if (data.projects.length > 0 && !form.projectId) {
            setForm((prev) => ({ ...prev, projectId: data.projects[0].id }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/projects/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setForm({
          projectId: projects[0]?.id || '',
          hours: '4',
          date: new Date().toISOString().split('T')[0],
          description: '',
          isBillable: true,
        });
        fetchTimesheets();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to log hours');
      }
    } catch (err) {
      console.error('Failed to log hours:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Team Workload & Timesheets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track daily billable engineering hours, employee utilization, and project burn rates.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Log Timesheet Hours
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Total Logged Engineering Hours
          </span>
          <span className="text-3xl font-extrabold text-violet-700 mt-1 block">
            {totalHours} hrs
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Timesheet Entries
          </span>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block">{timesheets.length}</span>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3">Team Member</th>
                <th className="px-5 py-3">Project & Deliverable</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Billing Status</th>
                <th className="px-5 py-3">Work Description</th>
                <th className="px-5 py-3 text-right">Logged Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
                    <p className="text-sm">Loading timesheet records...</p>
                  </td>
                </tr>
              ) : timesheets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-200">No timesheet records found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Log billable hours against active client projects.</p>
                  </td>
                </tr>
              ) : (
                timesheets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:bg-slate-950/80 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-bold text-slate-900 dark:text-white">
                      {t.employeeName}
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white">{t.project?.name || 'Client Project'}</div>
                      <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{t.project?.code}</span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600 text-slate-500 dark:text-slate-400">
                      {new Date(t.date).toLocaleDateString('en-IN')}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.isBillable ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {t.isBillable ? 'Billable' : 'Non-Billable'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {t.description || 'General engineering work'}
                    </td>

                    <td className="px-5 py-3.5 text-right font-bold text-violet-700 text-sm">
                      {t.hours}h
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Hours Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Log Timesheet Hours</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogHours} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Project *</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900 font-medium"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Hours Logged *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
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
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Work Description / Deliverables</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  placeholder="Implemented authentication middleware..."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isBillable"
                  checked={form.isBillable}
                  onChange={(e) => setForm({ ...form, isBillable: e.target.checked })}
                  className="rounded text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="isBillable" className="text-slate-700 dark:text-slate-700 dark:text-slate-200 font-medium">
                  Billable to client contract
                </label>
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
                  {creating ? 'Saving...' : 'Record Timesheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
