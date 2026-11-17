'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Users,
  Trash2,
  Edit2,
  RefreshCw,
  ListFilter,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Database,
  Sparkles,
} from 'lucide-react';

interface SegmentItem {
  id: string;
  name: string;
  description?: string | null;
  rulesJson: string;
  contactCount: number;
  isDynamic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StaticListItem {
  id: string;
  name: string;
  description?: string | null;
  memberCount: number;
  createdAt: string;
}

export default function WhatsAppSegmentsPage() {
  const [tab, setTab] = useState<'smart' | 'static'>('smart');
  const [segments, setSegments] = useState<SegmentItem[]>([]);
  const [lists, setLists] = useState<StaticListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Segment Builder Modal
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [segmentDesc, setSegmentDesc] = useState('');
  const [groupLogic, setGroupLogic] = useState<'AND' | 'OR'>('AND');
  const [rules, setRules] = useState<any[]>([
    { id: '1', field: 'LEAD_STAGE', operator: 'EQUALS', value: 'QUALIFIED' },
  ]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [calculatingPreview, setCalculatingPreview] = useState(false);

  // Static List Modal
  const [showListModal, setShowListModal] = useState(false);
  const [listName, setListName] = useState('');
  const [listDesc, setListDesc] = useState('');

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/segments');
      const data = await res.json();
      if (data.success) {
        setSegments(data.segments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/whatsapp/lists');
      const data = await res.json();
      if (data.success) {
        setLists(data.lists || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'smart') fetchSegments();
    else fetchLists();
  }, [tab]);

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { id: String(Date.now()), field: 'TAG', operator: 'CONTAINS', value: '' },
    ]);
  };

  const removeRule = (idx: number) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRule = (idx: number, field: string, val: any) => {
    setRules((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r))
    );
  };

  const handleSaveSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const rulesDefinition = {
        groupLogic,
        groups: [{ logic: groupLogic, rules }],
      };

      const res = await fetch('/api/whatsapp/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: segmentName,
          description: segmentDesc,
          rules: rulesDefinition,
        }),
      });

      if (res.ok) {
        setShowSegmentModal(false);
        setSegmentName('');
        setSegmentDesc('');
        setRules([{ id: '1', field: 'LEAD_STAGE', operator: 'EQUALS', value: 'QUALIFIED' }]);
        fetchSegments();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create segment');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving segment');
    }
  };

  const handleSaveList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/whatsapp/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: listName,
          description: listDesc,
        }),
      });

      if (res.ok) {
        setShowListModal(false);
        setListName('');
        setListDesc('');
        fetchLists();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create list');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving list');
    }
  };

  const handleDeleteSegment = async (id: string, name: string) => {
    if (!confirm(`Delete smart segment "${name}"?`)) return;
    try {
      const res = await fetch(`/api/whatsapp/segments/${id}`, { method: 'DELETE' });
      if (res.ok) fetchSegments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteList = async (id: string, name: string) => {
    if (!confirm(`Delete static list "${name}"?`)) return;
    try {
      const res = await fetch(`/api/whatsapp/lists/${id}`, { method: 'DELETE' });
      if (res.ok) fetchLists();
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
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl border border-blue-200/50 dark:border-blue-800/40 shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Segments & Audiences</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Create dynamic rule-based segments and static lists for precision WhatsApp broadcasts and drips.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tab === 'smart' ? (
            <button
              onClick={() => setShowSegmentModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Build Smart Segment
            </button>
          ) : (
            <button
              onClick={() => setShowListModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Create Static List
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-neutral-800">
        <button
          onClick={() => setTab('smart')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            tab === 'smart'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Dynamic Smart Segments ({segments.length})
        </button>

        <button
          onClick={() => setTab('static')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
            tab === 'static'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          Static Contact Lists ({lists.length})
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'smart' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full p-10 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              Loading Smart Segments...
            </div>
          ) : segments.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-500 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl">
              <Layers className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-neutral-700" />
              <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">No Smart Segments defined</p>
              <p className="text-xs text-gray-400 mt-1">
                Create dynamic audiences based on tags, lead stage, location, and recency.
              </p>
            </div>
          ) : (
            segments.map((seg) => {
              let parsed: any = {};
              try {
                parsed = JSON.parse(seg.rulesJson);
              } catch {}
              const rulesList = parsed.groups?.[0]?.rules || [];

              return (
                <div
                  key={seg.id}
                  className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800/80 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{seg.name}</h3>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Dynamic
                      </span>
                    </div>

                    {seg.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                        {seg.description}
                      </p>
                    )}

                    <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-neutral-800">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">Conditions</span>
                      {rulesList.slice(0, 3).map((r: any, idx: number) => (
                        <div
                          key={idx}
                          className="text-[11px] font-mono bg-gray-50 dark:bg-neutral-800/60 px-2 py-1 rounded text-gray-700 dark:text-gray-300 truncate"
                        >
                          {r.field} {r.operator} "{r.value}"
                        </div>
                      ))}
                      {rulesList.length > 3 && (
                        <div className="text-[10px] text-gray-400">+ {rulesList.length - 3} more conditions</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-neutral-800 text-xs">
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      Audience: <b>{seg.contactCount}</b> contacts
                    </span>

                    <button
                      onClick={() => handleDeleteSegment(seg.id, seg.name)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                      title="Delete Segment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full p-10 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
              Loading Static Lists...
            </div>
          ) : lists.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-500 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl">
              <Database className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-neutral-700" />
              <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">No Static Lists created</p>
              <p className="text-xs text-gray-400 mt-1">
                Create static lists for manual event cohorts, expo contacts, or VIP accounts.
              </p>
            </div>
          ) : (
            lists.map((l) => (
              <div
                key={l.id}
                className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:border-blue-300 dark:hover:border-blue-800/80 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{l.name}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Static List
                    </span>
                  </div>

                  {l.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                      {l.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-neutral-800 text-xs">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    Members: <b>{l.memberCount}</b> contacts
                  </span>

                  <button
                    onClick={() => handleDeleteList(l.id, l.name)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                    title="Delete List"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Smart Segment Builder Modal */}
      {showSegmentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Build Smart Dynamic Segment</h2>
            <p className="text-xs text-gray-500 mb-4">
              Contacts automatically enter or exit this segment as their attributes and behaviors change.
            </p>

            <form onSubmit={handleSaveSegment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Segment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hot Lucknow Leads (7d)"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Qualified leads in Lucknow active in last 7 days"
                  value={segmentDesc}
                  onChange={(e) => setSegmentDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                />
              </div>

              {/* Rules Group */}
              <div className="p-4 bg-gray-50 dark:bg-neutral-800/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Matching Logic:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGroupLogic('AND')}
                      className={`px-3 py-1 rounded text-xs font-semibold border ${
                        groupLogic === 'AND'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-700'
                      }`}
                    >
                      Match ALL (AND)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupLogic('OR')}
                      className={`px-3 py-1 rounded text-xs font-semibold border ${
                        groupLogic === 'OR'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-700'
                      }`}
                    >
                      Match ANY (OR)
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {rules.map((r, idx) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <select
                        value={r.field}
                        onChange={(e) => updateRule(idx, 'field', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg"
                      >
                        <option value="TAG">Tag</option>
                        <option value="LEAD_STAGE">Lead Stage</option>
                        <option value="SOURCE">Source</option>
                        <option value="CITY">City</option>
                        <option value="LAST_INTERACTION_DAYS_AGO">Last Interaction (Days)</option>
                        <option value="OPT_IN_STATUS">Opt-In Status</option>
                        <option value="TOTAL_ORDER_VALUE">Total Order Value</option>
                      </select>

                      <select
                        value={r.operator}
                        onChange={(e) => updateRule(idx, 'operator', e.target.value)}
                        className="w-32 px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg"
                      >
                        <option value="EQUALS">equals</option>
                        <option value="NOT_EQUALS">not equals</option>
                        <option value="CONTAINS">contains</option>
                        <option value="GREATER_THAN">greater than</option>
                        <option value="LESS_THAN">less than</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Value"
                        value={r.value}
                        onChange={(e) => updateRule(idx, 'value', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg"
                      />

                      {rules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRule(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addRule}
                  className="mt-2 text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Condition
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSegmentModal(false)}
                  className="px-4 py-2 font-semibold bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                >
                  Save Segment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Static List Modal */}
      {showListModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Create Static Contact List</h2>
            <p className="text-xs text-gray-500 mb-4">
              A manual cohort of contacts that does not automatically recalculate unless you add/remove contacts.
            </p>

            <form onSubmit={handleSaveList} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">List Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. October Expo Leads"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Contacts gathered during Lucknow Trade Fair"
                  value={listDesc}
                  onChange={(e) => setListDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowListModal(false)}
                  className="px-4 py-2 font-semibold bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
