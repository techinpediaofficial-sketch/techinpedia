'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Search, Calendar, AlertTriangle, User, Building, Clock, Wrench, X } from 'lucide-react';

interface AMCContract {
  id: string;
  amcNumber: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    companyName?: string | null;
    email: string;
    phone?: string | null;
  };
  contractTitle: string;
  coveredDevices: number;
  startDate: string;
  endDate: string;
  renewalDate: string;
  visitFrequency: string;
  replacementSLA: string;
  contractValue: number;
  status: string;
  engineerName?: string | null;
  notes?: string | null;
}

interface CustomerOption {
  id: string;
  name: string;
  companyName?: string | null;
}

export default function AMCPage() {
  const [contracts, setContracts] = useState<AMCContract[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, totalValue: 0, expiringSoon: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  const [formData, setFormData] = useState({
    customerId: '',
    contractTitle: 'Annual IT Maintenance & Workstation Support',
    coveredDevices: '25',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    visitFrequency: 'MONTHLY',
    replacementSLA: '24_HOURS',
    contractValue: '180000',
    engineerName: 'Senior Field Engineer',
    notes: 'Comprehensive coverage including bi-weekly preventive maintenance visits',
  });

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/hardware/amc?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setContracts(data.contracts || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/crm/customers');
      const data = await res.json();
      if (data.success && data.customers?.length > 0) {
        setCustomers(data.customers);
        if (!formData.customerId) {
          setFormData(prev => ({ ...prev, customerId: data.customers[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hardware/amc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchContracts();
      } else {
        alert(data.error || 'Failed to create AMC contract');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenew = async (id: string, currentEndDate: string) => {
    const current = new Date(currentEndDate);
    const newEnd = new Date(current.setFullYear(current.getFullYear() + 1)).toISOString().split('T')[0];
    if (!confirm(`Renew this contract for 1 additional year (until ${newEnd})?`)) return;

    try {
      const res = await fetch(`/api/hardware/amc/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renewalDate: newEnd,
          status: 'ACTIVE',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchContracts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isExpiringSoon = (renewalDate: string) => {
    const ren = new Date(renewalDate).getTime();
    const now = Date.now();
    const diffDays = (ren - now) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">AMC Contracts Management</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Annual Maintenance Contracts, preventive visit schedules, SLA guarantees, and automatic renewals</p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchCustomers();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New AMC Contract
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Contracts</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-emerald-400">Active AMC Contracts</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.active}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-teal-400">Total Contract Value</p>
          <p className="text-2xl font-bold text-teal-400 mt-1">₹{metrics.totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-amber-400">Renewals in Next 30 Days</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{metrics.expiringSoon}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Search by AMC number, title, customer or engineer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="RENEWED">Renewed</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Contracts Table */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading AMC contracts...</div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-600 text-slate-500 dark:text-slate-400 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No AMC contracts found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Set up hardware maintenance agreements for enterprise clients</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Contract Ref</th>
                  <th className="px-6 py-3.5">Customer & Title</th>
                  <th className="px-6 py-3.5">Covered Scope</th>
                  <th className="px-6 py-3.5">Service SLA</th>
                  <th className="px-6 py-3.5">Value (₹)</th>
                  <th className="px-6 py-3.5">Renewal Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/60">
                {contracts.map((c) => {
                  const urgentRenewal = isExpiringSoon(c.renewalDate);
                  return (
                    <tr key={c.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
                          {c.amcNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{c.contractTitle}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Building className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          {c.customer?.name} {c.customer?.companyName ? `(${c.customer.companyName})` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-700 dark:text-slate-200">{c.coveredDevices} Devices Covered</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.visitFrequency} Visits</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded font-mono">
                          {c.replacementSLA.replace('_', ' ')}
                        </span>
                        {c.engineerName && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Lead: {c.engineerName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        ₹{c.contractValue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-xs font-medium ${urgentRenewal ? 'text-amber-400 flex items-center gap-1' : 'text-slate-700 dark:text-slate-200'}`}>
                          {urgentRenewal && <AlertTriangle className="w-3.5 h-3.5" />}
                          {new Date(c.renewalDate).toLocaleDateString()}
                        </div>
                        {urgentRenewal && <span className="text-[10px] text-amber-500">Expiring Soon</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRenew(c.id, c.endDate)}
                          className="px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
                        >
                          Renew
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create AMC Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Register AMC Contract</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Customer / Organization *</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Contract Title *</label>
                <input
                  type="text"
                  required
                  value={formData.contractTitle}
                  onChange={(e) => setFormData({ ...formData, contractTitle: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Covered Devices Count</label>
                  <input
                    type="number"
                    value={formData.coveredDevices}
                    onChange={(e) => setFormData({ ...formData, coveredDevices: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Annual Contract Value (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.contractValue}
                    onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Contract Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Contract End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Visit Frequency</label>
                  <select
                    value={formData.visitFrequency}
                    onChange={(e) => setFormData({ ...formData, visitFrequency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MONTHLY">Monthly Preventive</option>
                    <option value="QUARTERLY">Quarterly Preventive</option>
                    <option value="ON_CALL">On-Call Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Replacement SLA</label>
                  <select
                    value={formData.replacementSLA}
                    onChange={(e) => setFormData({ ...formData, replacementSLA: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="4_HOURS">4 Hours (Critical)</option>
                    <option value="24_HOURS">24 Hours (Standard)</option>
                    <option value="NEXT_DAY">Next Business Day</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Assigned Support Engineer</label>
                <input
                  type="text"
                  value={formData.engineerName}
                  onChange={(e) => setFormData({ ...formData, engineerName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
