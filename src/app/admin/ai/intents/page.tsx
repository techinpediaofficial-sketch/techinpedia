'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Route,
  Plus,
  Zap,
  CheckCircle2,
  Trash2,
  Edit,
  ArrowRight,
  Shield,
  Layers,
  HelpCircle,
  MessageSquare,
  AlertTriangle,
  Bot,
} from 'lucide-react';
import { CompanySwitcher } from '@/components/admin/CompanySwitcher';

interface AiIntent {
  id: string;
  name: string;
  description?: string;
  exampleUtterancesJson: string;
  priority: number;
  actionType: string;
  isEnabled: boolean;
  updatedAt: string;
}

interface DefaultIntent {
  name: string;
  keywords: string[];
  priority: number;
  actionType: string;
}

function AiIntentsContent() {
  const searchParams = useSearchParams();
  const [customIntents, setCustomIntents] = useState<AiIntent[]>([]);
  const [defaultIntents, setDefaultIntents] = useState<DefaultIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntent, setEditingIntent] = useState<AiIntent | null>(null);

  // Multi-Company / Tenant State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(searchParams.get('companyId') || '');
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [utterances, setUtterances] = useState('');
  const [priority, setPriority] = useState(5);
  const [actionType, setActionType] = useState('AI_RESPONSE');
  const [isEnabled, setIsEnabled] = useState(true);

  const handleCompanyChange = (newCompanyId: string) => {
    setSelectedCompanyId(newCompanyId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newCompanyId) {
        url.searchParams.set('companyId', newCompanyId);
      } else {
        url.searchParams.delete('companyId');
      }
      window.history.replaceState({}, '', url.toString());
    }
    fetchIntents(newCompanyId);
  };

  const fetchIntents = async (targetCid = selectedCompanyId) => {
    try {
      setLoading(true);
      const url = targetCid ? `/api/ai/intents?companyId=${encodeURIComponent(targetCid)}` : '/api/ai/intents';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCustomIntents(data.customIntents);
        setDefaultIntents(data.defaultIntents);
      }
      if (data.availableCompanies) {
        setAvailableCompanies(data.availableCompanies);
      }
      if (data.companyId && !targetCid) {
        setSelectedCompanyId(data.companyId);
      }
    } catch (err) {
      console.error('Error fetching intents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntents();
  }, []);

  const handleSaveIntent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const exampleUtterances = utterances.split('\n').map(u => u.trim()).filter(Boolean);
      if (editingIntent) {
        await fetch(`/api/ai/intents/${editingIntent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, exampleUtterances, priority, actionType, isEnabled }),
        });
      } else {
        await fetch('/api/ai/intents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: selectedCompanyId || undefined, name, description, exampleUtterances, priority, actionType, isEnabled }),
        });
      }
      setIsModalOpen(false);
      setEditingIntent(null);
      await fetchIntents();
    } catch (err) {
      console.error('Error saving intent:', err);
    }
  };

  const handleDeleteIntent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom intent?')) return;
    try {
      await fetch(`/api/ai/intents/${id}`, { method: 'DELETE' });
      await fetchIntents();
    } catch (err) {
      console.error('Error deleting intent:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400">
              <Route className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Intent Routing Studio
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">Deterministic Dispatch</span>
              </h1>
              <p className="text-xs text-slate-400">Map customer questions to automated chatbot flows, predefined replies, or immediate human handoffs</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CompanySwitcher
            selectedCompanyId={selectedCompanyId}
            availableCompanies={availableCompanies}
            onCompanyChange={handleCompanyChange}
          />
          <button
            onClick={() => {
              setEditingIntent(null);
              setName('');
              setDescription('');
              setUtterances('');
              setPriority(5);
              setActionType('AI_RESPONSE');
              setIsEnabled(true);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Custom Intent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Custom Intents (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Company Custom Intent Rules ({customIntents.length})</h3>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">Loading intents...</div>
            ) : customIntents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No custom intent rules created yet. Click "Create Custom Intent" above to map specific phrases to workflows.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 text-xs">
                {customIntents.map(intent => {
                  let examples: string[] = [];
                  try { examples = JSON.parse(intent.exampleUtterancesJson || '[]'); } catch {}
                  return (
                    <div key={intent.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition">
                      <div className="space-y-1 max-w-md">
                        <div className="font-bold text-white flex items-center gap-2">
                          {intent.name}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            intent.actionType === 'HUMAN_HANDOFF'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : intent.actionType === 'TRIGGER_CHATBOT'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                          }`}>
                            {intent.actionType}
                          </span>
                        </div>
                        {intent.description && <p className="text-slate-400 text-[11px]">{intent.description}</p>}
                        <div className="text-[11px] text-slate-500 truncate">
                          Examples: {examples.slice(0, 3).join(', ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Priority</span>
                          <span className="font-bold text-white">{intent.priority}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingIntent(intent);
                              setName(intent.name);
                              setDescription(intent.description || '');
                              setUtterances(examples.join('\n'));
                              setPriority(intent.priority);
                              setActionType(intent.actionType);
                              setIsEnabled(intent.isEnabled);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteIntent(intent.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Default Intents Catalog (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Core Default Intents ({defaultIntents.length})</h3>
            <p className="text-xs text-slate-400 mb-4">
              Pre-built system intents automatically evaluated for standard WhatsApp interactions.
            </p>

            <div className="space-y-2 text-xs">
              {defaultIntents.map((def, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      {def.name}
                      <span className="text-[10px] text-slate-500">P:{def.priority}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[240px]">
                      Keywords: {def.keywords.slice(0, 4).join(', ')}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    def.actionType === 'HUMAN_HANDOFF' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {def.actionType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-white mb-1">{editingIntent ? 'Edit Custom Intent' : 'Create Custom Intent'}</h3>
            <p className="text-xs text-slate-400 mb-4">Train the intent classifier with sample customer utterances.</p>

            <form onSubmit={handleSaveIntent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Intent Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. bulk_order_query"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="When customer asks for wholesale discount"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Sample Utterances (one per line)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="I want to buy 100 units&#10;What is wholesale pricing?&#10;Do you offer bulk corporate discounts?"
                  value={utterances}
                  onChange={(e) => setUtterances(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Action</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="AI_RESPONSE">Central AI Reply</option>
                    <option value="HUMAN_HANDOFF">Escalate to Human Agent</option>
                    <option value="TRIGGER_CHATBOT">Trigger WhatsApp Chatbot</option>
                    <option value="SEND_REPLY">Send Predefined Reply</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority (1-100)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition"
                >
                  Save Intent Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiIntentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Intent Studio...</div>}>
      <AiIntentsContent />
    </Suspense>
  );
}
