'use client';

import { useState, useEffect } from 'react';
import { Webhook, Plus, Send, CheckCircle2, AlertTriangle, ShieldCheck, Copy, Check, Eye, EyeOff, X } from 'lucide-react';

interface WebhookDeliveryLog {
  id: string;
  event: string;
  status: string;
  responseCode?: number | null;
  deliveredAt: string;
}

interface WebhookSubscription {
  id: string;
  url: string;
  event: string;
  secretKey: string;
  isActive: boolean;
  createdAt: string;
  deliveries: WebhookDeliveryLog[];
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, deliveries: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<{ [id: string]: boolean }>({});
  const [sendingTestId, setSendingTestId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    url: 'https://api.external-crm.com/v1/techinpedia-leads',
    event: 'lead.created',
  });

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/webhooks');
      const data = await res.json();
      if (data.success) {
        setWebhooks(data.subscriptions || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchWebhooks();
      } else {
        alert(data.error || 'Failed to create webhook');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestPing = async (subscriptionId: string) => {
    setSendingTestId(subscriptionId);
    try {
      const res = await fetch('/api/settings/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TEST_DISPATCH', subscriptionId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchWebhooks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingTestId(null);
    }
  };

  const toggleKeyReveal = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
            <Webhook className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Webhooks & External Connectors</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Broadcast HMAC-SHA256 signed events to third-party endpoints and microservices</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Webhook Endpoint
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Registered Endpoints</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-emerald-400">Active Subscriptions</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.active}</p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <p className="text-xs font-medium text-violet-400">Deliveries Recorded</p>
          <p className="text-2xl font-bold text-violet-400 mt-1">{metrics.deliveries}</p>
        </div>
      </div>

      {/* Webhooks List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            Loading webhook endpoints...
          </div>
        ) : webhooks.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Webhook className="w-12 h-12 text-slate-600 text-slate-500 dark:text-slate-400 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">No webhooks registered</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure endpoints to receive instant CRM and sales lifecycle events</p>
          </div>
        ) : (
          webhooks.map((wh) => (
            <div
              key={wh.id}
              className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 hover:border-slate-200 dark:border-slate-700/80 transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded">
                      {wh.event}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      wh.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20'
                    }`}>
                      {wh.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="text-sm font-mono text-slate-900 dark:text-white mt-2 break-all">{wh.url}</div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTestPing(wh.id)}
                    disabled={sendingTestId === wh.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sendingTestId === wh.id ? 'Pinging...' : 'Send Test Ping'}
                  </button>
                </div>
              </div>

              {/* Secret Key Display */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">HMAC Secret:</span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-200 truncate">
                    {revealedKeys[wh.id] ? wh.secretKey : '••••••••••••••••••••••••••••••••••••'}
                  </span>
                </div>
                <button
                  onClick={() => toggleKeyReveal(wh.id)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
                  title="Toggle secret visibility"
                >
                  {revealedKeys[wh.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Delivery Logs */}
              {wh.deliveries?.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Recent Delivery Attempts ({wh.deliveries.length})
                  </div>
                  <div className="space-y-1.5">
                    {wh.deliveries.map((del) => (
                      <div
                        key={del.id}
                        className="flex items-center justify-between text-xs p-2 bg-slate-800/40 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${del.status === 'DELIVERED' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span className="font-mono text-slate-700 dark:text-slate-200">HTTP {del.responseCode || 200}</span>
                          <span className="text-slate-500 dark:text-slate-400">•</span>
                          <span className="text-slate-500 dark:text-slate-400">{del.status}</span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {new Date(del.deliveredAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Register Webhook Endpoint</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Target Endpoint URL (HTTPS) *</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://your-domain.com/webhooks"
                  className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">Subscribed Event *</label>
                <select
                  value={formData.event}
                  onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                >
                  <option value="lead.created">lead.created</option>
                  <option value="lead.updated">lead.updated</option>
                  <option value="deal.won">deal.won</option>
                  <option value="customer.created">customer.created</option>
                  <option value="invoice.created">invoice.created</option>
                  <option value="payment.received">payment.received</option>
                  <option value="ticket.created">ticket.created</option>
                  <option value="subscription.renewed">subscription.renewed</option>
                </select>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A cryptographically secure HMAC-SHA256 signature will automatically be sent in the <code className="text-violet-400 font-mono">X-TechInPedia-Signature</code> header.
              </p>
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
                  Create Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
