'use client';

import { useState, useEffect } from 'react';
import { Wrench, Plus, Search, CheckCircle2, Clock, Laptop, AlertTriangle, X } from 'lucide-react';

interface AssetMaintenance {
  id: string;
  assetId: string;
  asset: {
    id: string;
    assetCode: string;
    brand: string;
    model: string;
    serialNumber: string;
  };
  issue: string;
  repairAction?: string | null;
  cost: number;
  technician?: string | null;
  status: string;
  loggedAt: string;
  resolvedAt?: string | null;
}

interface AssetOption {
  id: string;
  assetCode: string;
  brand: string;
  model: string;
}

export default function MaintenancePage() {
  const [records, setRecords] = useState<AssetMaintenance[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, totalRepairCost: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [resolveModalRecord, setResolveModalRecord] = useState<AssetMaintenance | null>(null);
  const [assets, setAssets] = useState<AssetOption[]>([]);

  const [formData, setFormData] = useState({
    assetId: '',
    issue: 'Display flickering / thermal throttling under high load',
    technician: 'Hardware Engineer',
    cost: '2500',
  });

  const [resolveData, setResolveData] = useState({
    repairAction: 'Cleaned heatsink fans, reapplied thermal paste, ran 24hr benchmark test.',
    cost: '2500',
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/hardware/maintenance?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/hardware/assets');
      const data = await res.json();
      if (data.success && data.assets?.length > 0) {
        setAssets(data.assets);
        if (!formData.assetId) {
          setFormData(prev => ({ ...prev, assetId: data.assets[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hardware/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchRecords();
      } else {
        alert(data.error || 'Failed to log maintenance');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModalRecord) return;
    try {
      const res = await fetch(`/api/hardware/maintenance/${resolveModalRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RESOLVED',
          repairAction: resolveData.repairAction,
          cost: resolveData.cost,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResolveModalRecord(null);
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Hardware Maintenance & RMA</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Track device repairs, warranty RMA, technician actions, and repair expenditures</p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchAssets();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Maintenance Job
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Repair Jobs</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-amber-400">Active Repairs in Progress</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{metrics.active}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-rose-400">Total Repair Expenses</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">₹{metrics.totalRepairCost.toLocaleString()}</p>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading maintenance records...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className="w-12 h-12 text-slate-600 text-slate-500 dark:text-slate-400 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No maintenance records</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">All hardware inventory is operational</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/60">
            {records.map((r) => (
              <div key={r.id} className="p-5 hover:bg-slate-100 dark:hover:bg-slate-800/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-xs">
                      {r.asset?.assetCode}
                    </span>
                    <span className="text-xs text-slate-900 dark:text-white font-medium">
                      {r.asset?.brand} {r.asset?.model}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      r.status === 'RESOLVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200"><span className="text-slate-500 dark:text-slate-400 font-medium">Issue:</span> {r.issue}</p>
                  {r.repairAction && (
                    <p className="text-xs text-emerald-400/90 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                      <span className="font-semibold">Resolution:</span> {r.repairAction}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span>Logged: {new Date(r.loggedAt).toLocaleDateString()}</span>
                    {r.technician && <span>Tech: {r.technician}</span>}
                    <span>Cost: ₹{r.cost.toLocaleString()}</span>
                  </div>
                </div>

                {r.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => {
                      setResolveModalRecord(r);
                      setResolveData({ repairAction: '', cost: String(r.cost) });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Complete & Release Asset
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Job Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Log Hardware Issue / RMA</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Select Hardware Device *</label>
                <select
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.assetCode} - {a.brand} {a.model}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Issue Description *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.issue}
                  onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Technician / Vendor</label>
                  <input
                    type="text"
                    value={formData.technician}
                    onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-amber-600/20"
                >
                  Start Maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModalRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Resolve Maintenance & Release Device</h2>
              <button onClick={() => setResolveModalRecord(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResolve} className="space-y-4">
              <p className="text-xs text-slate-700 dark:text-slate-200">
                Asset: <span className="font-mono text-amber-400 font-bold">{resolveModalRecord.asset?.assetCode}</span> ({resolveModalRecord.asset?.brand} {resolveModalRecord.asset?.model})
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Repair Actions Taken *</label>
                <textarea
                  rows={3}
                  required
                  value={resolveData.repairAction}
                  onChange={(e) => setResolveData({ ...resolveData, repairAction: e.target.value })}
                  placeholder="Describe parts replaced, tests passed, or services conducted..."
                  className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Final Repair Cost (₹) *</label>
                <input
                  type="number"
                  required
                  value={resolveData.cost}
                  onChange={(e) => setResolveData({ ...resolveData, cost: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-xs text-emerald-400">
                ✓ Completing this job will automatically mark this device as AVAILABLE in inventory.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModalRecord(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  Mark Repaired & In-Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
