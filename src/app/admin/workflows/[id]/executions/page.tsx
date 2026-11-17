'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface ExecutionStep {
  id: string;
  nodeName: string;
  nodeType: string;
  actionType?: string;
  status: string;
  durationMs: number;
}

interface WorkflowExecution {
  id: string;
  status: string;
  triggerEvent: string;
  startedAt: string;
  durationMs?: number;
  steps: ExecutionStep[];
}

export default function WorkflowExecutionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [workflow, setWorkflow] = useState<any>(null);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const url = new URL(`/api/automation/workflows/${id}/executions`, window.location.origin);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setWorkflow(data.workflow);
        setExecutions(data.executions || []);
      }
    } catch (err) {
      console.error('Failed to load executions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, [id, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/workflows"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Execution Logs: {workflow?.name || 'Workflow'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Detailed step-by-step history, timing metrics, and error traces.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchExecutions}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-700 dark:text-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <Link
            href={`/admin/workflows/builder?id=${id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-xs transition-all"
          >
            Open Visual Builder
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs">
        {['ALL', 'COMPLETED', 'WAITING', 'FAILED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              statusFilter === st
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Executions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Trigger Event</th>
                <th className="px-5 py-3.5">Started At</th>
                <th className="px-5 py-3.5">Steps Executed</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
                    <p>Loading execution history...</p>
                  </td>
                </tr>
              ) : executions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Clock className="w-8 h-8 text-slate-700 dark:text-slate-200 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-200">No executions recorded yet</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">This workflow will log executions when its trigger fires.</p>
                  </td>
                </tr>
              ) : (
                executions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ex.status === 'COMPLETED'
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                            : ex.status === 'WAITING'
                            ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                            : ex.status === 'FAILED'
                            ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                            : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                        }`}
                      >
                        {ex.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                        {ex.status === 'WAITING' && <Clock className="w-3 h-3" />}
                        {ex.status === 'FAILED' && <AlertCircle className="w-3 h-3" />}
                        {ex.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-700 dark:text-slate-700 dark:text-slate-200">
                      {ex.triggerEvent}
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      {new Date(ex.startedAt).toLocaleString('en-IN')}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{ex.steps?.length || 0} Steps</span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono">
                      {ex.durationMs ? `${ex.durationMs}ms` : '—'}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/workflow-executions/${ex.id}`}
                        className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-800 font-bold hover:underline"
                      >
                        View Timeline
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
    </div>
  );
}
