'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Target,
  Plus,
  CheckCircle2,
  Trash2,
  Edit,
  ArrowRight,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  TrendingUp,
  Clock,
  PhoneCall,
  Calendar,
} from 'lucide-react';
import { CompanySwitcher } from '@/components/admin/CompanySwitcher';

interface AiGoal {
  id: string;
  goalKey: string;
  name: string;
  description?: string;
  priority: number;
  handoffBehavior: string;
  isEnabled: boolean;
  updatedAt: string;
}

const PREDEFINED_GOAL_TEMPLATES = [
  {
    goalKey: 'CAPTURE_LEAD',
    name: 'Capture Lead Contact Information',
    description: 'Collect customer name, phone number, and primary requirement to create or update CRM contact profile.',
    priority: 10,
    handoffBehavior: 'CONTINUE',
  },
  {
    goalKey: 'QUALIFY_LEAD',
    name: 'Qualify Business Lead',
    description: 'Determine budget, timeline, project scope, and company size before booking a sales meeting.',
    priority: 8,
    handoffBehavior: 'CONTINUE',
  },
  {
    goalKey: 'BOOK_APPOINTMENT',
    name: 'Book Consultation / Meeting',
    description: 'Coordinate preferred date and time for sales or technical demonstration with staff.',
    priority: 9,
    handoffBehavior: 'HANDOFF_ON_SUCCESS',
  },
  {
    goalKey: 'SUPPORT_RESOLVE',
    name: 'Resolve Support FAQ',
    description: 'Provide instant, verified answers to common questions using company knowledge base.',
    priority: 7,
    handoffBehavior: 'CONTINUE',
  },
  {
    goalKey: 'ESCALATE_HUMAN',
    name: 'Human Agent Escalation',
    description: 'Immediately transition chat to human agent when complex negotiation or complaints arise.',
    priority: 10,
    handoffBehavior: 'STOP',
  },
];

function AiGoalsContent() {
  const searchParams = useSearchParams();
  const [goals, setGoals] = useState<AiGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<AiGoal | null>(null);

  // Multi-Company / Tenant State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(searchParams.get('companyId') || '');
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [goalKey, setGoalKey] = useState('CUSTOM_GOAL');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(5);
  const [handoffBehavior, setHandoffBehavior] = useState('CONTINUE');
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
    fetchGoals(newCompanyId);
  };

  const fetchGoals = async (targetCid = selectedCompanyId) => {
    try {
      setLoading(true);
      const url = targetCid ? `/api/ai/goals?companyId=${encodeURIComponent(targetCid)}` : '/api/ai/goals';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setGoals(data.goals);
      }
      if (data.availableCompanies) {
        setAvailableCompanies(data.availableCompanies);
      }
      if (data.companyId && !targetCid) {
        setSelectedCompanyId(data.companyId);
      }
    } catch (err) {
      console.error('Error fetching AI goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openAddModal = (template?: typeof PREDEFINED_GOAL_TEMPLATES[0]) => {
    setEditingGoal(null);
    if (template) {
      setName(template.name);
      setGoalKey(template.goalKey);
      setDescription(template.description);
      setPriority(template.priority);
      setHandoffBehavior(template.handoffBehavior);
    } else {
      setName('');
      setGoalKey('CUSTOM_GOAL');
      setDescription('');
      setPriority(5);
      setHandoffBehavior('CONTINUE');
    }
    setIsEnabled(true);
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingGoal) {
        await fetch(`/api/ai/goals/${editingGoal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, priority, handoffBehavior, isEnabled }),
        });
      } else {
        await fetch('/api/ai/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: selectedCompanyId || undefined, goalKey, name, description, priority, handoffBehavior, isEnabled }),
        });
      }
      setIsModalOpen(false);
      await fetchGoals();
    } catch (err) {
      console.error('Error saving goal:', err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI goal?')) return;
    try {
      await fetch(`/api/ai/goals/${id}`, { method: 'DELETE' });
      await fetchGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                AI Goals & Outcomes Engine
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">Deterministic</span>
              </h1>
              <p className="text-xs text-slate-400">Configure objective milestones for AI customer engagement and deterministic CRM actions</p>
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
            onClick={() => openAddModal()}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Custom Goal
          </button>
        </div>
      </div>

      {/* Predefined Templates Rail */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Predefined Goal Blueprints</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {PREDEFINED_GOAL_TEMPLATES.map((tpl, i) => (
            <div
              key={i}
              onClick={() => openAddModal(tpl)}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-900 transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <span className="text-[10px] font-mono text-violet-400 block mb-1">{tpl.goalKey}</span>
                <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition mb-1">{tpl.name}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">{tpl.description}</p>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                <span>Priority: {tpl.priority}</span>
                <span className="text-violet-400 group-hover:translate-x-0.5 transition font-semibold">+ Add</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Goals Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Configured Goals ({goals.length})</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No custom goals created yet. Click a blueprint above to quickly instantiate one.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 text-xs">
            {goals.map(goal => (
              <div key={goal.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${goal.isEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      {goal.name}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{goal.goalKey}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{goal.description || 'No description provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Priority</span>
                    <span className="font-bold text-white">{goal.priority}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Handoff Mode</span>
                    <span className="font-medium text-slate-300">{goal.handoffBehavior}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setName(goal.name);
                        setDescription(goal.description || '');
                        setPriority(goal.priority);
                        setHandoffBehavior(goal.handoffBehavior);
                        setIsEnabled(goal.isEnabled);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-white mb-1">{editingGoal ? 'Edit AI Goal' : 'Configure AI Goal'}</h3>
            <p className="text-xs text-slate-400 mb-4">Define success criteria and automated post-completion actions.</p>

            <form onSubmit={handleSaveGoal} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Handoff Behavior</label>
                  <select
                    value={handoffBehavior}
                    onChange={(e) => setHandoffBehavior(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="CONTINUE">Continue Bot Replies</option>
                    <option value="HANDOFF_ON_SUCCESS">Transfer to Agent on Success</option>
                    <option value="STOP">Stop All Automated Replies</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isEnabled"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-violet-600 focus:ring-0"
                />
                <label htmlFor="isEnabled" className="text-slate-300">Goal is Active</label>
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
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiGoalsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading AI Goals...</div>}>
      <AiGoalsContent />
    </Suspense>
  );
}
