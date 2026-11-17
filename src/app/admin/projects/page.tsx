'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  DollarSign,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  UserCheck,
  ChevronRight,
  X,
} from 'lucide-react';

interface Project {
  id: string;
  code: string;
  name: string;
  budget: number;
  progress: number;
  status: string;
  deadline?: string | null;
  description?: string | null;
  customer?: { id: string; name: string } | null;
  _count: {
    tasks: number;
    milestones: number;
    timesheets: number;
  };
}

export default function ProjectsDeskPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: '',
    budget: '',
    deadline: '',
    description: '',
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/projects/internal', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (statusFilter) url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/projects/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setForm({ name: '', budget: '', deadline: '', description: '' });
        fetchProjects();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create project');
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setCreating(false);
    }
  };

  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Client Projects Delivery</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Execution tracking for custom software development, mobile apps, and IT infrastructure rollouts.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Active Projects</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">{projects.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Project Budget</span>
          <span className="text-2xl font-bold text-violet-700 mt-1 block">₹{totalBudget.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Associated Deliverables</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {projects.reduce((acc, p) => acc + p._count.tasks, 0)} Tasks
          </span>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3">Project & Code</th>
                <th className="px-5 py-3">Client Account</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Budget (₹)</th>
                <th className="px-5 py-3 text-right">Tasks / Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
                    <p className="text-sm">Loading projects...</p>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-200">No active engineering projects recorded</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Convert a won sales deal into a project or create one manually.</p>
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="hover:bg-violet-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <span className="font-mono text-[11px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">
                        {p.code}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      {p.customer ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{p.customer.name}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">Internal TechInPedia</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800">
                        {p.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-violet-600 h-2 rounded-full"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-700 dark:text-slate-200 text-[11px]">{p.progress}%</span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-xs font-bold text-slate-900 dark:text-white">
                      ₹{p.budget.toLocaleString('en-IN')}
                    </td>

                    <td className="px-5 py-3.5 text-right text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{p._count.tasks} Tasks</span>
                      <span className="text-slate-400 dark:text-slate-500 block text-[11px]">{p._count.milestones} Milestones</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Client Project</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  placeholder="e.g. Enterprise Logistics Mobile App"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="350000"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Description & Scope</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  placeholder="Key milestones, tech stack, deliverables..."
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
                  {creating ? 'Saving...' : 'Start Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
