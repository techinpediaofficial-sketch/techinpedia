'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Search, Calendar, CheckCircle2, AlertCircle, Building, Sparkles, X } from 'lucide-react';

interface SaaSPlan {
  id: string;
  name: string;
  price: number;
}

interface SaaSProduct {
  id: string;
  name: string;
  code: string;
  plans: SaaSPlan[];
}

interface CustomerOption {
  id: string;
  name: string;
  companyName?: string | null;
}

interface SaaSSubscription {
  id: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    companyName?: string | null;
    email: string;
  };
  productId: string;
  product: {
    id: string;
    name: string;
    code: string;
  };
  planId: string;
  plan: {
    id: string;
    name: string;
    billingCycle: string;
  };
  startDate: string;
  renewalDate: string;
  status: string;
  price: number;
  autoRenew: boolean;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SaaSSubscription[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, mrr: 0, renewalsDue: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [products, setProducts] = useState<SaaSProduct[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  const [formData, setFormData] = useState({
    customerId: '',
    productId: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    price: '2499',
    autoRenew: true,
  });

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/saas/subscriptions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        fetch('/api/saas/products'),
        fetch('/api/crm/customers'),
      ]);
      const prodData = await prodRes.json();
      const custData = await custRes.json();

      if (prodData.success && prodData.products?.length > 0) {
        setProducts(prodData.products);
        const firstProd = prodData.products[0];
        setFormData(prev => ({
          ...prev,
          productId: firstProd.id,
          planId: firstProd.plans?.[0]?.id || '',
          price: String(firstProd.plans?.[0]?.price || '2499'),
        }));
      }

      if (custData.success && custData.customers?.length > 0) {
        setCustomers(custData.customers);
        setFormData(prev => ({ ...prev, customerId: custData.customers[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [search, statusFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleProductChange = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    const plan = prod?.plans?.[0];
    setFormData(prev => ({
      ...prev,
      productId,
      planId: plan?.id || '',
      price: String(plan?.price || '0'),
    }));
  };

  const handlePlanChange = (planId: string) => {
    const prod = products.find(p => p.id === formData.productId);
    const plan = prod?.plans?.find(pl => pl.id === planId);
    setFormData(prev => ({
      ...prev,
      planId,
      price: String(plan?.price || prev.price),
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/saas/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchSubscriptions();
      } else {
        alert(data.error || 'Failed to create subscription');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenew = async (subId: string, currentRenewalDate: string) => {
    const nextMonth = new Date(new Date(currentRenewalDate).getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    if (!confirm(`Extend renewal date to ${nextMonth} and mark as Active?`)) return;

    try {
      const res = await fetch(`/api/saas/subscriptions/${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACTIVE',
          renewalDate: nextMonth,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSubscriptions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async (subId: string) => {
    if (!confirm('Cancel this subscription?')) return;
    try {
      const res = await fetch(`/api/saas/subscriptions/${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSubscriptions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedProduct = products.find(p => p.id === formData.productId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">SaaS Client Subscriptions</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Monitor recurring software licenses, MRR collections, and automated renewal cadences</p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchDependencies();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Subscription
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Accounts</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-emerald-400">Active Subscriptions</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.active}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-violet-400">Active Monthly MRR</p>
          <p className="text-2xl font-bold text-violet-400 mt-1">₹{metrics.mrr.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-amber-400">Renewals in 30 Days</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{metrics.renewalsDue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Search subscriptions by customer or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="TRIAL">Trial</option>
          <option value="PAST_DUE">Past Due</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">Loading subscriptions...</div>
        ) : subscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-12 h-12 text-slate-600 text-slate-500 dark:text-slate-400 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No subscriptions found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Activate software subscriptions for onboarding clients</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Customer / Organization</th>
                  <th className="px-6 py-3.5">Product & Plan</th>
                  <th className="px-6 py-3.5">Billing Rate</th>
                  <th className="px-6 py-3.5">Renewal Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/60">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{sub.customer?.name}</div>
                      {sub.customer?.companyName && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                          {sub.customer.companyName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        <span className="font-medium text-slate-900 dark:text-white">{sub.product?.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Tier: {sub.plan?.name} ({sub.plan?.billingCycle})
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">₹{sub.price.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {sub.autoRenew ? 'Auto-renew ON' : 'Manual invoice'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        {new Date(sub.renewalDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        sub.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : sub.status === 'TRIAL'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {sub.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleRenew(sub.id, sub.renewalDate)}
                              className="px-2.5 py-1 text-xs text-violet-400 hover:bg-violet-500/10 rounded-lg border border-violet-500/20 transition-all cursor-pointer"
                            >
                              Renew
                            </button>
                            <button
                              onClick={() => handleCancel(sub.id)}
                              className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {sub.status === 'CANCELLED' && (
                          <button
                            onClick={() => handleRenew(sub.id, new Date().toISOString())}
                            className="px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Activate SaaS Subscription</h2>
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
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">SaaS Product *</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Pricing Plan *</label>
                  <select
                    value={formData.planId}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                  >
                    {selectedProduct?.plans?.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name} (₹{pl.price})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Renewal Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.renewalDate}
                    onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Recurring Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
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
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-600/20"
                >
                  Activate Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
