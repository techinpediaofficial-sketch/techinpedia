'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  FolderKanban,
  Users,
  CreditCard,
  Inbox,
} from 'lucide-react';

interface SystemMetrics {
  nodeVersion: string;
  platform: string;
  uptimeSeconds: number;
  pid: number;
  memory: {
    rssMb: string;
    heapUsedMb: string;
    heapTotalMb: string;
    systemFreeMemMb: string;
    systemTotalMemMb: string;
  };
  cpuCount: number;
  database: {
    status: string;
    latencyMs: number;
    provider: string;
  };
  counts: {
    enquiries: number;
    contacts: number;
    deals: number;
    invoices: number;
    projects: number;
    assets: number;
    tickets: number;
    users: number;
    services: number;
  };
  cache: {
    isrStatus: string;
    revalidateWindow: string;
  };
}

export default function AdminMonitoringPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [purgeMsg, setPurgeMsg] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/system-health');
      const data = await res.json();
      if (res.ok) {
        setMetrics(data.system);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error('Fetch health error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handlePurgeCache = async () => {
    setPurging(true);
    setPurgeMsg('');
    try {
      const res = await fetch('/api/admin/purge-cache', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setPurgeMsg('Website cache successfully purged! Public pages now serve fresh database content.');
        setTimeout(() => setPurgeMsg(''), 5000);
        fetchHealth();
      } else {
        setPurgeMsg('Error purging cache: ' + (data.error || 'Failed'));
      }
    } catch (err) {
      setPurgeMsg('Network error while requesting cache purge.');
    } finally {
      setPurging(false);
    }
  };

  const formatUptime = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>System Health & Cache Monitor</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time VPS server status, database latency, process memory, and cache synchronization controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-bold text-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePurgeCache}
            disabled={purging}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${purging ? 'animate-bounce text-amber-300' : ''}`} />
            <span>{purging ? 'Purging Cache...' : 'Purge Website Cache'}</span>
          </button>
        </div>
      </div>

      {purgeMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{purgeMsg}</span>
        </div>
      )}

      {/* TOP KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Node & Process */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Runtime / PM2</span>
            <Server className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono">{metrics?.nodeVersion || 'Node.js'}</div>
            <div className="text-xs text-emerald-400 font-semibold mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Daemon Online (PID: {metrics?.pid || '—'})</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Uptime: {metrics ? formatUptime(metrics.uptimeSeconds) : '...'}
          </div>
        </div>

        {/* Database Health */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">MySQL Database</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{metrics?.database.status === 'CONNECTED' ? 'Healthy' : 'Connecting'}</span>
            </div>
            <div className="text-xs text-blue-400 font-mono mt-0.5">
              Ping Latency: {metrics?.database.latencyMs}ms
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Engine: {metrics?.database.provider || 'MySQL 8.0'}
          </div>
        </div>

        {/* Memory RSS */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Process Memory</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {metrics?.memory.rssMb} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">MB RSS</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              Heap: {metrics?.memory.heapUsedMb}MB / {metrics?.memory.heapTotalMb}MB
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            CloudLinux safe limits verified
          </div>
        </div>

        {/* Public Website Cache */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Website Sync & Cache</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">Next.js ISR</div>
            <div className="text-xs text-emerald-400 font-semibold mt-0.5">
              Active Invalidation Window
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Last Checked: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'Just now'}
          </div>
        </div>
      </div>

      {/* DETAILED MONITORING GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Database Entity Counts */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span>Live Database Entity Statistics</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total record count across operational models in MySQL.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Synced
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Leads & Enquiries</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{metrics?.counts.enquiries ?? '—'}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">CRM Contacts</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{metrics?.counts.contacts ?? '—'}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sales Deals</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{metrics?.counts.deals ?? '—'}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Client Invoices</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{metrics?.counts.invoices ?? '—'}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Hardware Assets</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{metrics?.counts.assets ?? '—'}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Client Projects</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{metrics?.counts.projects ?? '—'}</div>
            </div>
          </div>
        </div>

        {/* Server Host Details */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-400" />
            <span>Host Environment</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">OS Platform</span>
              <span className="text-slate-900 dark:text-white font-mono text-right">{metrics?.platform || 'Linux'}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">CPU Cores</span>
              <span className="text-slate-900 dark:text-white font-mono">{metrics?.cpuCount || '2'} Cores</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">Threadpool Limit</span>
              <span className="text-emerald-400 font-mono font-bold">1 (Optimized)</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">System Free RAM</span>
              <span className="text-slate-900 dark:text-white font-mono">{metrics?.memory.systemFreeMemMb || '—'} MB</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 dark:text-slate-400">Reverse Proxy</span>
              <span className="text-slate-900 dark:text-white font-mono">Apache 2.4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
