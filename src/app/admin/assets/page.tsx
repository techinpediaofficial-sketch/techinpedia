'use client';

import { useState, useEffect } from 'react';
import { Laptop, Plus, Search, Filter, CheckCircle2, Clock, AlertCircle, Wrench, Trash2, Box, X, ExternalLink } from 'lucide-react';

interface RentalAsset {
  id: string;
  assetCode: string;
  serialNumber: string;
  assetType: string;
  brand: string;
  model: string;
  specs: string;
  purchaseCost: number;
  status: string;
  location: string;
  notes?: string | null;
  orderItems?: {
    rentalOrder: {
      id: string;
      orderNumber: string;
      customer: { name: string; companyName?: string | null };
    };
  }[];
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<RentalAsset[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, available: 0, rented: 0, maintenance: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    serialNumber: '',
    assetType: 'LAPTOP',
    brand: 'Apple',
    model: 'MacBook Pro M3 (16GB/512GB)',
    specs: 'Apple Silicon M3, 16GB Unified Memory, 512GB SSD',
    purchaseCost: '149999',
    location: 'Main Warehouse, Delhi NCR',
    status: 'AVAILABLE',
  });

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('assetType', typeFilter);

      const res = await fetch(`/api/hardware/assets?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, statusFilter, typeFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hardware/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setFormData({
          serialNumber: '',
          assetType: 'LAPTOP',
          brand: 'Apple',
          model: 'MacBook Pro M3 (16GB/512GB)',
          specs: 'Apple Silicon M3, 16GB Unified Memory, 512GB SSD',
          purchaseCost: '149999',
          location: 'Main Warehouse, Delhi NCR',
          status: 'AVAILABLE',
        });
        fetchAssets();
      } else {
        alert(data.error || 'Failed to create asset');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/hardware/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAssets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Available</span>;
      case 'RENTED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Rented</span>;
      case 'MAINTENANCE':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Maintenance</span>;
      case 'RETIRED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Retired</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">IT Hardware Assets Fleet</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage rental inventory, serial numbers, hardware specifications, and live allocation</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Hardware Asset
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Fleet Assets</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-emerald-400">In Stock / Available</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.available}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-indigo-400">Currently Out on Rent</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{metrics.rented}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-amber-400">Under Service / RMA</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{metrics.maintenance}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset code, serial number, brand, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Asset Types</option>
          <option value="LAPTOP">Laptops</option>
          <option value="DESKTOP">Desktops & Towers</option>
          <option value="WORKSTATION">Workstations</option>
          <option value="MONITOR">Monitors</option>
          <option value="SERVER">Servers</option>
          <option value="ACCESSORY">Accessories</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="RENTED">Rented</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      {/* Assets Table */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="p-12 text-center">
            <Box className="w-12 h-12 text-slate-600 text-slate-500 dark:text-slate-400 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No hardware assets found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add devices to your rental inventory to begin dispatching orders</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Asset Code / Serial</th>
                  <th className="px-6 py-3.5">Device & Brand</th>
                  <th className="px-6 py-3.5">Hardware Specs</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Current Renter</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/60">
                {assets.map((a) => {
                  const currentRental = a.orderItems?.[0]?.rentalOrder;
                  return (
                    <tr key={a.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-indigo-400">{a.assetCode}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">S/N: {a.serialNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{a.brand} {a.model}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{a.assetType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-700 dark:text-slate-200 max-w-xs truncate">{a.specs}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Value: ₹{a.purchaseCost.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700 dark:text-slate-200">
                        {a.location}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(a.status)}
                      </td>
                      <td className="px-6 py-4">
                        {currentRental ? (
                          <div>
                            <span className="text-xs font-medium text-slate-900 dark:text-white">{currentRental.customer.name}</span>
                            {currentRental.customer.companyName && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">{currentRental.customer.companyName}</div>
                            )}
                            <div className="text-[11px] text-indigo-400 font-mono">{currentRental.orderNumber}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {a.status === 'AVAILABLE' && (
                            <button
                              onClick={() => handleStatusChange(a.id, 'MAINTENANCE')}
                              className="px-2.5 py-1 text-xs text-amber-400 hover:bg-amber-500/10 rounded-lg border border-amber-500/20"
                            >
                              Send RMA
                            </button>
                          )}
                          {a.status === 'MAINTENANCE' && (
                            <button
                              onClick={() => handleStatusChange(a.id, 'AVAILABLE')}
                              className="px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-emerald-500/20"
                            >
                              Mark Ready
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Hardware Rental Asset</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Asset Type *</label>
                  <select
                    value={formData.assetType}
                    onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LAPTOP">Laptop</option>
                    <option value="DESKTOP">Desktop / Tower</option>
                    <option value="WORKSTATION">Workstation</option>
                    <option value="MONITOR">Monitor</option>
                    <option value="SERVER">Server</option>
                    <option value="ACCESSORY">Accessory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Apple, Dell, Lenovo"
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Model Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g. MacBook Pro M3"
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Serial Number (Unique) *</label>
                  <input
                    type="text"
                    required
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="e.g. C02G901XMD6R"
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Hardware Specifications *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.specs}
                  onChange={(e) => setFormData({ ...formData, specs: e.target.value })}
                  placeholder="e.g. Intel Core i7-13700H, 32GB DDR5 RAM, 1TB NVMe SSD, RTX 4060 GPU"
                  className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Asset Value / Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
