'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Plus,
  Play,
  Pause,
  XCircle,
  Copy,
  RefreshCw,
  Layers,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  BarChart2,
  Eye,
  Sparkles,
} from 'lucide-react';

interface CampaignItem {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  templateId: string;
  totalAudience: number;
  validCount: number;
  suppressedCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  replyCount: number;
  deliveryRate: number;
  readRate: number;
  replyRate: number;
  scheduledAt?: string | null;
  createdAt: string;
}

export default function BroadcastManagerPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Wizard state
  const [campName, setCampName] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [audienceSource, setAudienceSource] = useState('ALL_CONTACTS');
  const [segments, setSegments] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [audiencePreview, setAudiencePreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Template state
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [varMapping, setVarMapping] = useState<{ [key: string]: string }>({});
  const [scheduleType, setScheduleType] = useState<'NOW' | 'SCHEDULE'>('NOW');
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/broadcasts');
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

  const fetchPrerequisites = async () => {
    try {
      const [segRes, listRes, tmplRes] = await Promise.all([
        fetch('/api/whatsapp/segments').then((r) => r.json()),
        fetch('/api/whatsapp/lists').then((r) => r.json()),
        fetch('/api/whatsapp/templates').then((r) => r.json()),
      ]);
      if (segRes.segments) setSegments(segRes.segments);
      if (listRes.lists) setLists(listRes.lists);
      if (tmplRes.templates) {
        const approved = tmplRes.templates.filter((t: any) => t.status === 'APPROVED');
        setTemplates(approved);
        if (approved.length > 0) setSelectedTemplateId(approved[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchPrerequisites();
  }, []);

  const calculateAudiencePreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/whatsapp/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'AUDIENCE_PREVIEW',
          audienceSource,
          segmentId: selectedSegmentId,
          listId: selectedListId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAudiencePreview(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (showWizard && currentStep === 2) {
      calculateAudiencePreview();
    }
  }, [currentStep, audienceSource, selectedSegmentId, selectedListId, showWizard]);

  const handleCreateCampaign = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/whatsapp/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: scheduleType === 'NOW' ? 'CREATE_AND_LAUNCH' : 'SCHEDULE',
          name: campName,
          description: campDesc,
          templateId: selectedTemplateId,
          variableMapping: varMapping,
          audienceSource,
          segmentId: selectedSegmentId,
          listId: selectedListId,
          scheduledAt: scheduleType === 'SCHEDULE' ? scheduleDateTime : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowWizard(false);
        setCurrentStep(1);
        setCampName('');
        setCampDesc('');
        fetchCampaigns();
      } else {
        alert(data.error || 'Failed to launch campaign');
      }
    } catch (err: any) {
      alert(err.message || 'Error launching campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCampaignAction = async (id: string, action: 'LAUNCH' | 'PAUSE' | 'CANCEL' | 'CLONE') => {
    try {
      const res = await fetch(`/api/whatsapp/broadcasts/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40 shadow-sm">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Broadcast Manager</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Queue-based mass WhatsApp broadcasts with audience segmentation, Meta template compliance, and rate analytics.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setShowWizard(true);
            setCurrentStep(1);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create Broadcast Campaign
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-neutral-800/60 border-b border-gray-200 dark:border-neutral-800 text-gray-500 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Campaign Name</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Audience & Reach</th>
                <th className="p-3.5">Delivery Progress</th>
                <th className="p-3.5">Rates (Delivered / Read)</th>
                <th className="p-3.5">Schedule / Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading broadcast campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <Send className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-neutral-700" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">No campaigns launched yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click Create Broadcast Campaign to build your first broadcast.</p>
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-gray-50/70 dark:hover:bg-neutral-800/40 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{camp.name}</div>
                      {camp.description && (
                        <div className="text-[11px] text-gray-400 truncate max-w-xs">{camp.description}</div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                          camp.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : camp.status === 'PROCESSING'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse'
                            : camp.status === 'SCHEDULED'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="font-medium text-gray-900 dark:text-white">
                        <b>{camp.validCount}</b> / {camp.totalAudience} eligible
                      </div>
                      <div className="text-[10px] text-red-500 mt-0.5">
                        {camp.suppressedCount} excluded (DND/Opt-out)
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-gray-700 dark:text-gray-300">
                        Sent: <b>{camp.sentCount}</b> • Delivered: <b>{camp.deliveredCount}</b>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Read: {camp.readCount} • Failed: {camp.failedCount}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">{camp.deliveryRate}% Del.</span>
                        <span className="text-blue-600 font-bold">{camp.readRate}% Read</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-gray-500 text-[11px]">
                      {camp.scheduledAt
                        ? `Scheduled: ${new Date(camp.scheduledAt).toLocaleString()}`
                        : new Date(camp.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {camp.status === 'DRAFT' || camp.status === 'SCHEDULED' ? (
                          <button
                            onClick={() => handleCampaignAction(camp.id, 'LAUNCH')}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition"
                            title="Launch Now"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        ) : null}

                        {camp.status === 'PROCESSING' ? (
                          <button
                            onClick={() => handleCampaignAction(camp.id, 'PAUSE')}
                            className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg transition"
                            title="Pause"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleCampaignAction(camp.id, 'CLONE')}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg transition"
                          title="Clone Campaign"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-5">
            {/* Wizard Step Bar */}
            <div className="border-b border-gray-100 dark:border-neutral-800 pb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Step {currentStep} of 5: {
                  currentStep === 1 ? 'Campaign Details' :
                  currentStep === 2 ? 'Select Audience & Eligibility' :
                  currentStep === 3 ? 'Choose Template & Variables' :
                  currentStep === 4 ? 'Schedule Execution' : 'Review & Confirm'
                }
              </h2>
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full ${
                      s <= currentStep ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-neutral-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step 1: Details */}
            {currentStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Campaign Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. October Festive Offer Announcement"
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Internal summary or goal of this campaign..."
                    value={campDesc}
                    onChange={(e) => setCampDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Audience */}
            {currentStep === 2 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Audience Source</label>
                  <select
                    value={audienceSource}
                    onChange={(e) => setAudienceSource(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                  >
                    <option value="ALL_CONTACTS">All Company Contacts</option>
                    <option value="SMART_SEGMENT">Smart Dynamic Segment</option>
                    <option value="STATIC_LIST">Static Contact List</option>
                  </select>
                </div>

                {audienceSource === 'SMART_SEGMENT' && (
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Choose Segment</label>
                    <select
                      value={selectedSegmentId}
                      onChange={(e) => setSelectedSegmentId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                    >
                      <option value="">Select a segment...</option>
                      {segments.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.contactCount} contacts)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {audienceSource === 'STATIC_LIST' && (
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Choose List</label>
                    <select
                      value={selectedListId}
                      onChange={(e) => setSelectedListId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                    >
                      <option value="">Select a list...</option>
                      {lists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.memberCount} members)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Audience Eligibility Breakdown */}
                <div className="p-4 bg-gray-50 dark:bg-neutral-800/60 rounded-xl space-y-2">
                  <span className="font-semibold text-gray-900 dark:text-white block">
                    Eligibility Breakdown (Anti-Spam Verification)
                  </span>

                  {previewLoading ? (
                    <div className="text-gray-400 py-2">Calculating audience eligibility...</div>
                  ) : audiencePreview ? (
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg border">
                        <div className="text-base font-bold text-gray-800 dark:text-gray-200">
                          {audiencePreview.totalSelected}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase">Selected</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg border border-emerald-300">
                        <div className="text-base font-bold text-emerald-600">
                          {audiencePreview.eligibleCount}
                        </div>
                        <div className="text-[10px] text-emerald-600 uppercase font-semibold">Eligible to Send</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg border border-red-300">
                        <div className="text-base font-bold text-red-500">
                          {audiencePreview.excludedCount}
                        </div>
                        <div className="text-[10px] text-red-500 uppercase font-semibold">Excluded (DND/Opt-Out)</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Step 3: Template */}
            {currentStep === 3 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    Meta Approved Message Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category} • {t.language})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTemplate && (
                  <div className="p-3.5 bg-gray-50 dark:bg-neutral-800/60 rounded-xl space-y-2">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Template Preview</span>
                    <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300 bg-white dark:bg-neutral-900 p-3 rounded-lg border">
                      {selectedTemplate.bodyText}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Schedule */}
            {currentStep === 4 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Dispatch Timing</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleType('NOW')}
                      className={`p-3 rounded-xl border text-left font-semibold ${
                        scheduleType === 'NOW'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950 dark:border-emerald-800'
                          : 'border-gray-200 dark:border-neutral-700'
                      }`}
                    >
                      Send Immediately
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleType('SCHEDULE')}
                      className={`p-3 rounded-xl border text-left font-semibold ${
                        scheduleType === 'SCHEDULE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950 dark:border-emerald-800'
                          : 'border-gray-200 dark:border-neutral-700'
                      }`}
                    >
                      Schedule for Later
                    </button>
                  </div>
                </div>

                {scheduleType === 'SCHEDULE' && (
                  <div>
                    <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                      Date & Time (Company Local Time)
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-gray-50 dark:bg-neutral-800/60 rounded-xl space-y-2">
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-neutral-700">
                    <span className="text-gray-500">Campaign Name:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{campName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-neutral-700">
                    <span className="text-gray-500">Eligible Recipients:</span>
                    <span className="font-bold text-emerald-600">{audiencePreview?.eligibleCount || 0}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-neutral-700">
                    <span className="text-gray-500">Selected Template:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{selectedTemplate?.name}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Execution Schedule:</span>
                    <span className="font-bold text-purple-600">
                      {scheduleType === 'NOW' ? 'Immediate Launch via Background Queue' : scheduleDateTime}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-3 border-t border-gray-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  if (currentStep > 1) setCurrentStep(currentStep - 1);
                  else setShowWizard(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300"
              >
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 1 && !campName.trim()) {
                      alert('Please provide a campaign name.');
                      return;
                    }
                    setCurrentStep(currentStep + 1);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCreateCampaign}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Dispatching...' : 'Confirm & Launch Campaign'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
