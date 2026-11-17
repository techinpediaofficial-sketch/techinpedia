'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Play,
  Terminal,
  Database,
  Search,
} from 'lucide-react';

export default function SystemJobsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedQueue, setSelectedQueue] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/system/jobs?queue=${selectedQueue}&status=${selectedStatus}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load jobs data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [selectedQueue, selectedStatus]);

  const handleRetryJob = async (jobId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/system/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RETRY_JOB', jobId }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage(json.message);
        fetchJobs();
      }
    } catch (err: any) {
      alert(err.message || 'Retry failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryAllFailed = async () => {
    if (!confirm('Are you sure you want to retry all failed jobs?')) return;
    try {
      setActionLoading(true);
      const res = await fetch('/api/system/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RETRY_ALL_FAILED', queue: selectedQueue }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage(`Successfully re-queued ${json.retriedCount} failed jobs.`);
        fetchJobs();
      }
    } catch (err: any) {
      alert(err.message || 'Retry all failed');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredJobs = (data?.jobs || []).filter((job: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      job.id.toLowerCase().includes(q) ||
      job.queue.toLowerCase().includes(q) ||
      (job.lastError && job.lastError.toLowerCase().includes(q))
    );
  });

  const workers = data?.workers || [];
  const isWorkerOnline = workers.length > 0;
  const metrics = data?.metrics || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Background Job Queues & Worker Health</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isWorkerOnline
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isWorkerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {isWorkerOnline ? `WORKER ONLINE (${workers.length} active)` : 'WORKER OFFLINE'}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Durable background processing engine with crash recovery, exponential backoff, and scheduled dispatchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRetryAllFailed}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry All Failed
          </button>
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 border border-gray-300 dark:border-gray-700 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="font-bold">&times;</button>
        </div>
      )}

      {/* Worker Instances Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {workers.length === 0 ? (
          <div className="col-span-3 p-4 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-300">No active background worker process detected.</p>
              <p className="text-xs text-rose-700 dark:text-rose-400">
                Jobs are safely queued in the database. Start the daemon with <code className="bg-rose-100 dark:bg-rose-900/50 px-1 py-0.5 rounded">pm2 start worker.js --name techinpedia-worker</code>.
              </p>
            </div>
          </div>
        ) : (
          workers.map((w: any) => (
            <div
              key={w.id}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{w.id}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  PID: <span className="font-mono">{w.pid}</span> • Host: {w.hostname}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Heartbeat: {new Date(w.lastHeartbeatAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  {w.activeJobsCount} Active
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Queue Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { key: 'whatsapp-campaign', name: 'WhatsApp Campaigns', icon: Activity, iconColor: 'text-blue-500' },
          { key: 'whatsapp-message', name: 'WhatsApp Messages', icon: Terminal, iconColor: 'text-emerald-500' },
          { key: 'google-sheet-sync', name: 'Google Sheet Sync', icon: Database, iconColor: 'text-amber-500' },
          { key: 'workflow-delayed-actions', name: 'Workflow Delays', icon: Clock, iconColor: 'text-purple-500' },
        ].map((q) => {
          const qMetrics = metrics[q.key] || { waiting: 0, active: 0, completed: 0, failed: 0, retrying: 0 };
          return (
            <div
              key={q.key}
              onClick={() => setSelectedQueue(q.key === selectedQueue ? 'ALL' : q.key)}
              className={`p-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-gray-900 ${
                selectedQueue === q.key
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {q.name}
                </span>
                <q.icon className={`w-4 h-4 ${q.iconColor}`} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500">Waiting</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{qMetrics.waiting}</p>
                </div>
                <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Active</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{qMetrics.active}</p>
                </div>
                <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/30">
                  <p className="text-xs text-rose-600 dark:text-rose-400">Failed</p>
                  <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{qMetrics.failed}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Job ID or error..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedQueue}
            onChange={(e) => setSelectedQueue(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="ALL">All Queues</option>
            <option value="whatsapp-campaign">whatsapp-campaign</option>
            <option value="whatsapp-message">whatsapp-message</option>
            <option value="google-sheet-sync">google-sheet-sync</option>
            <option value="workflow-delayed-actions">workflow-delayed-actions</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="QUEUED">QUEUED / PENDING</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
            <option value="RETRYING">RETRYING</option>
            <option value="DELAYED">DELAYED</option>
          </select>
        </div>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          Showing {filteredJobs.length} jobs
        </span>
      </div>

      {/* Jobs Table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3">Job ID</th>
                <th className="px-4 py-3">Queue</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Scheduled / Started</th>
                <th className="px-4 py-3">Error / Result</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No background jobs found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                      {job.id}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {job.queue}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          job.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : job.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 animate-pulse'
                            : job.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                            : job.status === 'RETRYING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {job.attemptCount} / {job.maxAttempts}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {job.scheduledAt ? (
                        <span>Scheduled: {new Date(job.scheduledAt).toLocaleTimeString()}</span>
                      ) : (
                        <span>Created: {new Date(job.createdAt).toLocaleTimeString()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      {job.lastError ? (
                        <span className="text-xs text-rose-600 dark:text-rose-400 truncate block" title={job.lastError}>
                          {job.lastError}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {job.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetryJob(job.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-900 transition-colors"
                        >
                          Retry
                        </button>
                      )}
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
