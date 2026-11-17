'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Plus, Layers, DollarSign, CheckCircle2, ShieldCheck, Tag, X } from 'lucide-react';

interface SaaSPlan {
  id: string;
  name: string;
  billingCycle: string;
  price: number;
  features?: string | null;
  status: string;
}

interface SaaSProduct {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  plans: SaaSPlan[];
  subscriptions: { id: string; status: string; price: number }[];
  licenses: { id: string; status: string }[];
}

export default function SaaSProductsPage() {
  const [products, setProducts] = useState<SaaSProduct[]>([]);
  const [metrics, setMetrics] = useState({ totalProducts: 0, activeSubscriptions: 0, totalMrr: 0 });
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  const [productForm, setProductForm] = useState({
    code: 'INVOICELY',
    name: 'Invoicely Cloud Suite',
    description: 'Cloud billing, GST invoicing, and recurring client subscriptions engine',
  });

  const [planForm, setPlanForm] = useState({
    planName: 'Professional',
    billingCycle: 'MONTHLY',
    price: '2499',
    features: 'Unlimited Invoices, WhatsApp Dispatches, 5 Team Seats, Multi-Currency',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/saas/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/saas/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowProductModal(false);
        fetchProducts();
      } else {
        alert(data.error || 'Failed to create product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/saas/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_PLAN',
          productId: selectedProductId,
          ...planForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPlanModal(false);
        fetchProducts();
      } else {
        alert(data.error || 'Failed to add plan');
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
          <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">SaaS Products & Tier Plans</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configure TechInPedia proprietary software apps, tier features, and subscription pricing</p>
          </div>
        </div>
        <button
          onClick={() => setShowProductModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New SaaS Product
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Published Products</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.totalProducts}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-emerald-400">Active Subscriptions</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.activeSubscriptions}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-violet-400">Realized MRR Runrate</p>
          <p className="text-2xl font-bold text-violet-400 mt-1">₹{metrics.totalMrr.toLocaleString()}/mo</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 dark:text-slate-400">Loading SaaS products...</div>
        ) : products.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Sparkles className="w-12 h-12 text-slate-600 text-slate-500 dark:text-slate-400 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No SaaS products registered</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Register a new software app or micro-SaaS service</p>
          </div>
        ) : (
          products.map((prod) => (
            <div key={prod.id} className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded">
                    {prod.code}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {prod.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{prod.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{prod.description}</p>
              </div>

              {/* Plans Section */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    Pricing Tiers ({prod.plans?.length || 0})
                  </span>
                  <button
                    onClick={() => {
                      setSelectedProductId(prod.id);
                      setShowPlanModal(true);
                    }}
                    className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Plan
                  </button>
                </div>

                {prod.plans?.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No plans added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {prod.plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">{plan.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{plan.billingCycle} billing</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">₹{plan.price.toLocaleString()}</div>
                          <div className="text-[10px] text-violet-400 font-mono">per {plan.billingCycle.toLowerCase()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Stats */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800/60">
                <span>Active Subs: {prod.subscriptions?.filter(s => s.status === 'ACTIVE').length || 0}</span>
                <span>Active Licenses: {prod.licenses?.filter(l => l.status === 'ACTIVE').length || 0}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create SaaS Product</h2>
              <button onClick={() => setShowProductModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Product Code (Unique) *</label>
                <input
                  type="text"
                  required
                  value={productForm.code}
                  onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
                  placeholder="e.g. WHATSAPP_CRM"
                  className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Omnichannel WhatsApp CRM"
                  className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Explain the product value proposition and scope..."
                  className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-600/20"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Pricing Tier Plan</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPlan} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={planForm.planName}
                  onChange={(e) => setPlanForm({ ...planForm, planName: e.target.value })}
                  placeholder="e.g. Starter, Pro, Enterprise"
                  className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Billing Cycle</label>
                  <select
                    value={planForm.billingCycle}
                    onChange={(e) => setPlanForm({ ...planForm, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="LIFETIME">Lifetime License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Included Features</label>
                <textarea
                  rows={3}
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  placeholder="Comma-separated or bullet list of tier features..."
                  className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-600/20"
                >
                  Add Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
