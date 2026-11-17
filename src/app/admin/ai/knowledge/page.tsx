'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  Layers,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { CompanySwitcher } from '@/components/admin/CompanySwitcher';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  sourceType: string;
  category?: string;
  status: string;
  syncStatus: string;
  totalChunks: number;
  priority: number;
  updatedAt: string;
}

interface KnowledgeSuggestion {
  id: string;
  question: string;
  proposedAnswer: string;
  frequency: number;
  status: string;
  createdAt: string;
}

function AiKnowledgeContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'KNOWLEDGE' | 'SUGGESTIONS'>('KNOWLEDGE');
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [suggestions, setSuggestions] = useState<KnowledgeSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');

  // Multi-Company / Tenant State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(searchParams.get('companyId') || '');
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [selectedItemChunks, setSelectedItemChunks] = useState<any[] | null>(null);
  const [isChunkDrawerOpen, setIsChunkDrawerOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceType, setSourceType] = useState('FAQ');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState(10);

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
    fetchKnowledge(newCompanyId);
    fetchSuggestions(newCompanyId);
  };

  const fetchKnowledge = async (targetCid = selectedCompanyId) => {
    try {
      setLoading(true);
      const url = targetCid ? `/api/ai/knowledge?companyId=${encodeURIComponent(targetCid)}` : '/api/ai/knowledge';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
      if (data.availableCompanies) {
        setAvailableCompanies(data.availableCompanies);
      }
      if (data.companyId && !targetCid) {
        setSelectedCompanyId(data.companyId);
      }
    } catch (err) {
      console.error('Error fetching knowledge:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (targetCid = selectedCompanyId) => {
    try {
      const url = targetCid ? `/api/ai/knowledge/suggestions?companyId=${encodeURIComponent(targetCid)}` : '/api/ai/knowledge/suggestions';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  useEffect(() => {
    fetchKnowledge();
    fetchSuggestions();
  }, []);

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      const url = selectedCompanyId ? `/api/ai/knowledge/sync?companyId=${encodeURIComponent(selectedCompanyId)}` : '/api/ai/knowledge/sync';
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchKnowledge();
      }
    } catch (err) {
      console.error('Error syncing knowledge:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      if (editingItem) {
        await fetch(`/api/ai/knowledge/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, category, priority }),
        });
      } else {
        await fetch('/api/ai/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: selectedCompanyId || undefined, title, content, sourceType, category, priority }),
        });
      }
      setIsAddModalOpen(false);
      setEditingItem(null);
      await fetchKnowledge();
    } catch (err) {
      console.error('Error saving item:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge source?')) return;
    try {
      await fetch(`/api/ai/knowledge/${id}`, { method: 'DELETE' });
      await fetchKnowledge();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const viewChunks = async (id: string) => {
    try {
      const res = await fetch(`/api/ai/knowledge/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedItemChunks(data.item.chunks);
        setIsChunkDrawerOpen(true);
      }
    } catch (err) {
      console.error('Error fetching chunks:', err);
    }
  };

  const handleReviewSuggestion = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await fetch(`/api/ai/knowledge/suggestions/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await fetchSuggestions();
      if (action === 'APPROVE') await fetchKnowledge();
    } catch (err) {
      console.error('Error reviewing suggestion:', err);
    }
  };

  const filteredItems = items.filter(
    it => it.title.toLowerCase().includes(search.toLowerCase()) || it.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                AI Knowledge Base & RAG Index
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">Tenant Isolated</span>
              </h1>
              <p className="text-xs text-slate-400">Company-specific verified Q&A, documents, and policies indexed for high accuracy customer assistance</p>
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
            onClick={handleSyncAll}
            disabled={syncing}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Re-index All Chunks'}
          </button>
          <button
            onClick={() => {
              setEditingItem(null);
              setTitle('');
              setContent('');
              setCategory('General');
              setPriority(10);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Knowledge
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('KNOWLEDGE')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeTab === 'KNOWLEDGE' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Knowledge Sources ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('SUGGESTIONS')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 ${
            activeTab === 'SUGGESTIONS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Unanswered Question Suggestions ({suggestions.filter(s => s.status === 'PENDING').length})
        </button>
      </div>

      {activeTab === 'KNOWLEDGE' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search knowledge by keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading knowledge base...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
              No knowledge entries found. Add frequently asked questions or service documents to train your AI assistant.
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800 text-xs">
                {filteredItems.map(item => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition">
                    <div className="flex items-start gap-3 max-w-3xl">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {item.title}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{item.category || 'General'}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.syncStatus === 'READY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400'}`}>
                            {item.syncStatus}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-2 mt-1 whitespace-pre-wrap">{item.content}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <button
                        onClick={() => viewChunks(item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1.5 transition"
                      >
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        <span>{item.totalChunks || 1} Chunks</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setTitle(item.title);
                            setContent(item.content);
                            setCategory(item.category || 'General');
                            setPriority(item.priority);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SUGGESTIONS VIEW */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              These questions were repeatedly asked by customers on WhatsApp where no direct knowledge match existed. Approving a suggestion instantly indexes it into your active knowledge base.
            </span>
          </div>

          {suggestions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
              No unanswered question suggestions currently pending.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map(s => (
                <div key={s.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                      <span className="text-amber-400 font-semibold">Asked {s.frequency} times</span>
                      <span className="uppercase font-mono">{s.status}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-2">Q: "{s.question}"</h4>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap mb-4">
                      {s.proposedAnswer}
                    </div>
                  </div>

                  {s.status === 'PENDING' && (
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => handleReviewSuggestion(s.id, 'APPROVE')}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve & Index
                      </button>
                      <button
                        onClick={() => handleReviewSuggestion(s.id, 'REJECT')}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHUNK VIEWER DRAWER */}
      {isChunkDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full p-6 overflow-y-auto shadow-2xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Indexed Knowledge Chunks ({selectedItemChunks?.length || 0})
              </h3>
              <button onClick={() => setIsChunkDrawerOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              {selectedItemChunks?.map((chunk, idx) => (
                <div key={chunk.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-[10px]">
                    <span className="font-mono">Chunk #{idx + 1}</span>
                    <span>~{chunk.tokenCount} tokens</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{chunk.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT KNOWLEDGE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-white mb-1">{editingItem ? 'Edit Knowledge' : 'Add Knowledge Source'}</h3>
            <p className="text-xs text-slate-400 mb-4">Content will be automatically chunked and strictly isolated to your company.</p>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Title / Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. What is your refund policy?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Pricing, Technical, Company Policy"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Knowledge Content / Answer</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Detailed, verified company information..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
                >
                  {editingItem ? 'Save & Re-index' : 'Index Knowledge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiKnowledgePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Knowledge Base...</div>}>
      <AiKnowledgeContent />
    </Suspense>
  );
}
