'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Clock,
  Send,
  UserCheck,
  Tag,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowDown,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';

interface DripCampaignItem {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  triggerType: string;
  stepsJson: string;
  exitConditionsJson?: string | null;
  totalEnrolled: number;
  activeCount: number;
  completedCount: number;
  exitedCount: number;
  createdAt: string;
}

export default function DripCampaignsPage() {
  const [campaigns, setCampaigns] = useState<DripCampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<DripCampaignItem | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('CONTACT_ADDED');
  const [steps, setSteps] = useState<any[]>([
    { id: 'step_1', type: 'SEND_TEMPLATE', templateName: 'welcome_greeting' },
    { id: 'step_2', type: 'WAIT', duration: 1, unit: 'DAYS' },
    { id: 'step_3', type: 'SEND_TEMPLATE', templateName: 'product_catalog' },
    { id: 'step_4', type: 'WAIT', duration: 2, unit: 'DAYS' },
    { id: 'step_5', type: 'EXIT' },
  ]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/drip-campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async (campaignId: string) => {
    setLoadingEnrollments(true);
    try {
      const res = await fetch(`/api/whatsapp/drip-campaigns/${campaignId}/enrollments`);
      const data = await res.json();
      if (data.success) {
        setEnrollments(data.enrollments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSelectCampaign = (camp: DripCampaignItem) => {
    setSelectedCampaign(camp);
    fetchEnrollments(camp.id);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/whatsapp/drip-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          triggerType,
          steps,
          status: 'ACTIVE',
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setName('');
        setDescription('');
        fetchCampaigns();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create drip campaign');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating drip campaign');
    }
  };

  const handleDelete = async (id: string, campName: string) => {
    if (!confirm(`Delete drip campaign "${campName}"?`)) return;
    try {
      const res = await fetch(`/api/whatsapp/drip-campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedCampaign?.id === id) setSelectedCampaign(null);
        fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl border border-purple-200/50 dark:border-purple-800/40 shadow-sm">
              <Workflow className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Drip Sequences</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Automated multi-step nurturing flows with timed delay intervals, event triggers, and automatic reply exit conditions.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create Drip Sequence
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Campaigns List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-600" /> Active Drip Sequences ({campaigns.length})
          </h2>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
              Loading drip campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl">
              <Workflow className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="font-semibold text-xs text-gray-700 dark:text-gray-300">No Drip Sequences</p>
              <p className="text-[11px] text-gray-400 mt-1">Click Create Drip Sequence to design your first sequence.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => {
                const isSelected = selectedCampaign?.id === c.id;
                let parsedSteps: any[] = [];
                try {
                  parsedSteps = JSON.parse(c.stepsJson);
                } catch {}

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCampaign(c)}
                    className={`p-4 rounded-xl border transition cursor-pointer shadow-sm ${
                      isSelected
                        ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800'
                        : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{c.name}</h3>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                        {c.status}
                      </span>
                    </div>

                    {c.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{c.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-100 dark:border-neutral-800">
                      <span>Trigger: <b>{c.triggerType}</b></span>
                      <span>Steps: <b>{parsedSteps.length}</b></span>
                      <span>Enrolled: <b>{c.totalEnrolled}</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 2 Columns: Selected Sequence Visual Flow & Enrollments */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCampaign ? (
            <>
              {/* Sequence Visual Flow */}
              <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {selectedCampaign.name} — Sequence Journey
                    </h3>
                    <p className="text-xs text-gray-400">Trigger: {selectedCampaign.triggerType}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(selectedCampaign.id, selectedCampaign.name)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Steps Visual Chain */}
                <div className="space-y-3 py-2">
                  {(() => {
                    let stepsList: any[] = [];
                    try {
                      stepsList = JSON.parse(selectedCampaign.stepsJson);
                    } catch {}

                    return stepsList.map((st: any, idx: number) => (
                      <React.Fragment key={st.id || idx}>
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-gray-200 dark:border-neutral-700">
                          <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <div className="flex-1 text-xs">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {st.type === 'SEND_TEMPLATE'
                                ? `Send Template: ${st.templateName || 'Approved Meta Template'}`
                                : st.type === 'WAIT'
                                ? `Wait ${st.duration} ${st.unit || 'Hours'}`
                                : st.type === 'ADD_TAG'
                                ? `Add Tag "${st.tag}"`
                                : st.type === 'ASSIGN_EMPLOYEE'
                                ? `Assign to Representative`
                                : 'Exit Sequence'}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {st.type === 'SEND_TEMPLATE'
                                ? 'Dispatched via WhatsApp Cloud API'
                                : st.type === 'WAIT'
                                ? 'Durable scheduled sleep interval'
                                : 'Lifecycle state update'}
                            </div>
                          </div>
                        </div>

                        {idx < stepsList.length - 1 && (
                          <div className="flex justify-center -my-1">
                            <ArrowDown className="w-4 h-4 text-purple-400" />
                          </div>
                        )}
                      </React.Fragment>
                    ));
                  })()}
                </div>
              </div>

              {/* Enrollments & Contact Journeys */}
              <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                    Contact Enrollment Journeys ({enrollments.length})
                  </h3>
                  <button
                    onClick={() => fetchEnrollments(selectedCampaign.id)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingEnrollments ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingEnrollments ? (
                  <div className="p-6 text-center text-gray-400 text-xs">Loading contact journeys...</div>
                ) : enrollments.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    No contacts enrolled in this drip sequence yet. Contacts matching the trigger will enter automatically.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                    {enrollments.map((en) => (
                      <div key={en.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {en.contact?.name || 'Contact'} ({en.contact?.phone || 'No Phone'})
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            Enrolled: {new Date(en.enrolledAt).toLocaleString()} • Current: <b>{en.currentStepId}</b>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                            en.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : en.status === 'ACTIVE'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300'
                          }`}
                        >
                          {en.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-12 text-center text-gray-400 text-xs shadow-sm">
              <Workflow className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              Select a Drip Sequence on the left to inspect its visual steps and live contact journeys.
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Create Drip Sequence</h2>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Sequence Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5-Day Lead Nurturing Sequence"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Goals and audience of this drip flow..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Enrollment Trigger</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                >
                  <option value="CONTACT_ADDED">Contact Added</option>
                  <option value="LEAD_CREATED">CRM Lead Created</option>
                  <option value="TAG_ADDED">Tag Added to Contact</option>
                  <option value="SEGMENT_ENTERED">Smart Segment Entered</option>
                  <option value="MANUAL">Manual Enrollment Only</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  Create & Activate Sequence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
