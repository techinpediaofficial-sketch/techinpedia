'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Bot,
  Play,
  Pause,
  Plus,
  Trash2,
  Save,
  Send,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Tag,
  Clock,
  Brain,
  MessageSquare,
  HelpCircle,
  Sparkles,
  GitBranch,
  RefreshCw,
  Search,
  ChevronRight,
  Settings,
  Eye,
  Check,
} from 'lucide-react';

interface ChatbotNode {
  id: string;
  type: string;
  position?: { x: number; y: number };
  data: Record<string, any>;
}

interface ChatbotEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}

interface Chatbot {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerKeywords?: string;
  status: string;
  isDefault: boolean;
  draftVersion: number;
  publishedVersion: number;
  nodesJson: string;
  edgesJson?: string;
  totalSessions?: number;
  updatedAt: string;
}

import { CompanySwitcher } from '@/components/admin/CompanySwitcher';

function ChatbotBuilderContent() {
  const searchParams = useSearchParams();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'BOTS' | 'BUILDER' | 'SESSIONS'>('BOTS');
  const [selectedBot, setSelectedBot] = useState<Chatbot | null>(null);

  // Multi-Company / Tenant State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(searchParams.get('companyId') || '');
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);

  // Builder Canvas State
  const [nodes, setNodes] = useState<ChatbotNode[]>([]);
  const [edges, setEdges] = useState<ChatbotEdge[]>([]);
  const [editingNode, setEditingNode] = useState<ChatbotNode | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Create Bot Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotTrigger, setNewBotTrigger] = useState('KEYWORD');
  const [newBotKeywords, setNewBotKeywords] = useState('hi, hello, menu');

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
    fetchChatbots(newCompanyId);
  };

  // Fetch chatbots
  const fetchChatbots = async (targetCid = selectedCompanyId) => {
    try {
      setLoading(true);
      const url = targetCid ? `/api/whatsapp/chatbot?companyId=${encodeURIComponent(targetCid)}` : '/api/whatsapp/chatbot';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setChatbots(data.chatbots || []);
        if (data.availableCompanies) {
          setAvailableCompanies(data.availableCompanies);
        }
        if (data.companyId && !targetCid) {
          setSelectedCompanyId(data.companyId);
        }
      }
    } catch (err) {
      console.error('Failed to load chatbots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatbots();
  }, []);

  const openBuilder = (bot: Chatbot) => {
    setSelectedBot(bot);
    try {
      setNodes(JSON.parse(bot.nodesJson || '[]'));
      setEdges(JSON.parse(bot.edgesJson || '[]'));
    } catch {
      setNodes([]);
      setEdges([]);
    }
    setValidationErrors([]);
    setActiveTab('BUILDER');
  };

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;

    try {
      const keywords = newBotKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      const res = await fetch('/api/whatsapp/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId || undefined,
          name: newBotName,
          triggerType: newBotTrigger,
          triggerKeywords: keywords,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        setNewBotName('');
        await fetchChatbots();
        openBuilder(data.chatbot);
      }
    } catch (err) {
      console.error('Error creating chatbot:', err);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedBot) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/whatsapp/chatbot/${selectedBot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes,
          edges,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedBot(data.chatbot);
        setSuccessBanner('Draft flow saved successfully!');
        setTimeout(() => setSuccessBanner(null), 3000);
      }
    } catch (err) {
      console.error('Error saving draft:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedBot) return;
    setPublishing(true);
    setValidationErrors([]);
    try {
      // Save draft first
      await fetch(`/api/whatsapp/chatbot/${selectedBot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });

      // Call publish
      const res = await fetch(`/api/whatsapp/chatbot/${selectedBot.id}/publish`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setSelectedBot(data.chatbot);
        setSuccessBanner(`Published Version ${data.version} is now active on WhatsApp!`);
        setTimeout(() => setSuccessBanner(null), 4000);
        await fetchChatbots();
      } else if (data.validationErrors) {
        setValidationErrors(data.validationErrors);
      }
    } catch (err) {
      console.error('Error publishing chatbot:', err);
    } finally {
      setPublishing(false);
    }
  };

  const addNode = (type: string) => {
    const newId = `node-${Date.now().toString().slice(-4)}`;
    let defaultData: Record<string, any> = { label: type };

    if (type === 'send_message') {
      defaultData = { label: 'Send Message', messageType: 'text', text: 'Thank you for contacting us!' };
    } else if (type === 'question') {
      defaultData = { label: 'Ask Question', questionText: 'What is your query?', variableName: 'userQuery' };
    } else if (type === 'buttons') {
      defaultData = {
        label: 'Interactive Buttons',
        bodyText: 'Please select an option below:',
        buttons: [
          { id: 'btn_1', title: 'Pricing' },
          { id: 'btn_2', title: 'Support' },
          { id: 'btn_3', title: 'Talk to Agent' },
        ],
      };
    } else if (type === 'condition') {
      defaultData = { label: 'Check Condition', field: 'userQuery', operator: 'contains', value: 'pricing' };
    } else if (type === 'add_tag') {
      defaultData = { label: 'Add Tag', tagName: 'Bot-Engaged' };
    } else if (type === 'assign_employee') {
      defaultData = { label: 'Assign Employee', assignType: 'LEAST_LOADED' };
    } else if (type === 'ai_response') {
      defaultData = { label: 'AI Brain Response', prompt: 'Answer using verified company knowledge' };
    } else if (type === 'human_handoff') {
      defaultData = { label: 'Human Handoff', reason: 'Customer requested human agent' };
    } else if (type === 'end') {
      defaultData = { label: 'End Flow' };
    }

    const newNode: ChatbotNode = {
      id: newId,
      type,
      position: { x: 300, y: nodes.length * 120 + 100 },
      data: defaultData,
    };

    // Auto connect to previous node if available
    const lastNode = nodes[nodes.length - 1];
    let newEdges = [...edges];
    if (lastNode && lastNode.type !== 'end') {
      newEdges.push({
        id: `e-${lastNode.id}-${newId}`,
        source: lastNode.id,
        target: newId,
      });
    }

    setNodes([...nodes, newNode]);
    setEdges(newEdges);
    setEditingNode(newNode);
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (editingNode?.id === nodeId) setEditingNode(null);
  };

  const updateNodeData = (nodeId: string, dataUpdates: Record<string, any>) => {
    setNodes(nodes.map(n => (n.id === nodeId ? { ...n, data: { ...n.data, ...dataUpdates } } : n)));
    if (editingNode?.id === nodeId) {
      setEditingNode({ ...editingNode, data: { ...editingNode.data, ...dataUpdates } });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen">
      {/* Top Banner Notice */}
      {successBanner && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-emerald-300 text-xs">Dismiss</button>
        </div>
      )}

      {/* Validation Errors Modal / Alert */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
          <div className="flex items-center gap-2 font-semibold text-rose-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Flow Validation Errors ({validationErrors.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-rose-300">
            {validationErrors.map((err, i) => (
              <li key={i}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                WhatsApp Chatbot Builder
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Production</span>
              </h1>
              <p className="text-xs text-slate-400">Visual conversation flow editor, interactive nodes, and server-side execution</p>
            </div>
          </div>
        </div>

        {/* Tab Controls / Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <CompanySwitcher
            selectedCompanyId={selectedCompanyId}
            availableCompanies={availableCompanies}
            onCompanyChange={handleCompanyChange}
            accentColor="emerald"
          />

          {activeTab === 'BUILDER' ? (
            <>
              <button
                onClick={() => setActiveTab('BOTS')}
                className="px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-medium transition"
              >
                ← Back to Bots
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 text-xs font-medium transition flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {publishing ? 'Publishing...' : 'Publish Flow'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Chatbot
            </button>
          )}
        </div>
      </div>

      {/* VIEW: BOTS DIRECTORY */}
      {activeTab === 'BOTS' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Loading chatbots...</div>
          ) : chatbots.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
              <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white mb-1">No Chatbots Created Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                Automate your WhatsApp conversations by creating structured branching flows, answering customer queries, and assigning leads to your sales agents.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                Create Your First Bot
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {chatbots.map(bot => (
                <div
                  key={bot.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${bot.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-xs font-semibold tracking-wide text-slate-300 uppercase">{bot.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {bot.isDefault && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Default</span>
                        )}
                        <span className="text-[11px] text-slate-500">v{bot.publishedVersion || 0}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition mb-1">{bot.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">{bot.description || 'Automated WhatsApp conversation flow'}</p>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Trigger:</span>
                        <span className="text-white font-medium">{bot.triggerType}</span>
                      </div>
                      {bot.triggerKeywords && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Keywords:</span>
                          <span className="text-slate-300 font-mono text-[11px] truncate max-w-[150px]">{bot.triggerKeywords}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Sessions Handled:</span>
                        <span className="text-emerald-400 font-bold">{bot.totalSessions || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => openBuilder(bot)}
                      className="flex-1 py-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Open Flow Builder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: VISUAL CANVAS BUILDER */}
      {activeTab === 'BUILDER' && selectedBot && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Node Palette */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add Step Node</h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => addNode('send_message')}
                  className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left flex items-center gap-3 transition"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><MessageSquare className="w-4 h-4" /></div>
                  <div>
                    <div className="text-xs font-semibold text-white">Send Message</div>
                    <div className="text-[10px] text-slate-400">Text or pre-approved HSM template</div>
                  </div>
                </button>

                <button
                  onClick={() => addNode('question')}
                  className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left flex items-center gap-3 transition"
                >
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400"><HelpCircle className="w-4 h-4" /></div>
                  <div>
                    <div className="text-xs font-semibold text-white">Question / Input</div>
                    <div className="text-[10px] text-slate-400">Wait for user input & save to field</div>
                  </div>
                </button>

                <button
                  onClick={() => addNode('buttons')}
                  className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left flex items-center gap-3 transition"
                >
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400"><Layers className="w-4 h-4" /></div>
                  <div>
                    <div className="text-xs font-semibold text-white">Interactive Buttons</div>
                    <div className="text-[10px] text-slate-400">Up to 3 quick-reply options</div>
                  </div>
                </button>

                <button
                  onClick={() => addNode('condition')}
                  className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left flex items-center gap-3 transition"
                >
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400"><GitBranch className="w-4 h-4" /></div>
                  <div>
                    <div className="text-xs font-semibold text-white">Condition Rule</div>
                    <div className="text-[10px] text-slate-400">Branch based on response or tag</div>
                  </div>
                </button>

                <button
                  onClick={() => addNode('add_tag')}
                  className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left flex items-center gap-3 transition"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><Tag className="w-4 h-4" /></div>
                  <div>
                    <div className="text-xs font-semibold text-white">Add Tag</div>
                    <div className="text-[10px] text-slate-400">Attach tag to contact profile</div>
                  </div>
                </button>

                <button
                  onClick={() => addNode('assign_employee')}
                  className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left flex items-center gap-3 transition"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><UserCheck className="w-4 h-4" /></div>
                  <div>
                    <div className="text-xs font-semibold text-white">Assign Employee</div>
                    <div className="text-[10px] text-slate-400">Assign chat & initiate SLA timer</div>
                  </div>
                </button>

                <button
                  onClick={() => addNode('ai_response')}
                  className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left flex items-center gap-3 transition"
                >
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400"><Brain className="w-4 h-4" /></div>
                  <div>
                    <div className="text-xs font-semibold text-white">AI Response</div>
                    <div className="text-[10px] text-slate-400">Consult central AI Brain & KB</div>
                  </div>
                </button>

                <button
                  onClick={() => addNode('human_handoff')}
                  className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left flex items-center gap-3 transition"
                >
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400"><AlertTriangle className="w-4 h-4" /></div>
                  <div>
                    <div className="text-xs font-semibold text-white">Human Handoff</div>
                    <div className="text-[10px] text-slate-400">Pause bot & escalate to staff</div>
                  </div>
                </button>

                <button
                  onClick={() => addNode('end')}
                  className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left flex items-center gap-3 transition"
                >
                  <div className="p-2 rounded-lg bg-slate-600/10 text-slate-400"><CheckCircle2 className="w-4 h-4" /></div>
                  <div>
                    <div className="text-xs font-semibold text-white">End Flow</div>
                    <div className="text-[10px] text-slate-400">Mark session complete</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Center Flow Canvas */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 min-h-[500px]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flow Sequence ({nodes.length} Nodes)</div>
                <div className="text-xs text-slate-500">Click any node to configure</div>
              </div>

              <div className="space-y-3">
                {nodes.map((node, idx) => (
                  <div key={node.id} className="relative">
                    {/* Node Card */}
                    <div
                      onClick={() => setEditingNode(node)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        editingNode?.id === node.id
                          ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            {node.data?.label || node.type}
                            <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-400 uppercase font-mono">{node.type}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[280px]">
                            {node.type === 'send_message' && (node.data?.text || '[Template]')}
                            {node.type === 'question' && (node.data?.questionText || 'Input target')}
                            {node.type === 'buttons' && `${node.data?.buttons?.length || 0} buttons`}
                            {node.type === 'condition' && `${node.data?.field} ${node.data?.operator} ${node.data?.value}`}
                            {node.type === 'add_tag' && `Tag: ${node.data?.tagName}`}
                            {node.type === 'ai_response' && 'AI Brain Query'}
                            {node.type === 'human_handoff' && `Handoff: ${node.data?.reason}`}
                            {node.type === 'entry' && `Trigger: ${selectedBot.triggerType}`}
                            {node.type === 'end' && 'Completes Session'}
                          </div>
                        </div>
                      </div>

                      {node.type !== 'entry' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Step Connector Arrow */}
                    {idx < nodes.length - 1 && (
                      <div className="w-0.5 h-3 bg-slate-700 mx-auto my-0.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Inspector Drawer */}
          <div className="lg:col-span-4">
            {editingNode ? (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 sticky top-6">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Node Inspector</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{editingNode.id}</span>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Step Label</label>
                    <input
                      type="text"
                      value={editingNode.data?.label || ''}
                      onChange={(e) => updateNodeData(editingNode.id, { label: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {editingNode.type === 'send_message' && (
                    <>
                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Message Type</label>
                        <select
                          value={editingNode.data?.messageType || 'text'}
                          onChange={(e) => updateNodeData(editingNode.id, { messageType: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                        >
                          <option value="text">Freeform Text</option>
                          <option value="template">Pre-Approved Meta Template</option>
                        </select>
                      </div>

                      {editingNode.data?.messageType === 'template' ? (
                        <div>
                          <label className="block text-slate-400 font-medium mb-1">Template Name</label>
                          <input
                            type="text"
                            placeholder="e.g. hello_world"
                            value={editingNode.data?.templateName || ''}
                            onChange={(e) => updateNodeData(editingNode.id, { templateName: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-slate-400 font-medium mb-1">Message Body</label>
                          <textarea
                            rows={4}
                            value={editingNode.data?.text || ''}
                            onChange={(e) => updateNodeData(editingNode.id, { text: e.target.value })}
                            placeholder="Enter text message... Supports {{variableName}}"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {editingNode.type === 'question' && (
                    <>
                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Question Prompt</label>
                        <input
                          type="text"
                          value={editingNode.data?.questionText || ''}
                          onChange={(e) => updateNodeData(editingNode.id, { questionText: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Store in Session Variable</label>
                        <input
                          type="text"
                          placeholder="e.g. customerBudget"
                          value={editingNode.data?.variableName || ''}
                          onChange={(e) => updateNodeData(editingNode.id, { variableName: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-medium mb-1">Store in Contact Field (Optional)</label>
                        <select
                          value={editingNode.data?.contactField || ''}
                          onChange={(e) => updateNodeData(editingNode.id, { contactField: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                        >
                          <option value="">None (Temporary Variable Only)</option>
                          <option value="name">Contact Name</option>
                          <option value="email">Contact Email</option>
                          <option value="city">Custom Field: City</option>
                          <option value="serviceRequired">Custom Field: Service Required</option>
                        </select>
                      </div>
                    </>
                  )}

                  {editingNode.type === 'add_tag' && (
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Tag Name</label>
                      <input
                        type="text"
                        value={editingNode.data?.tagName || ''}
                        onChange={(e) => updateNodeData(editingNode.id, { tagName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                      />
                    </div>
                  )}

                  {editingNode.type === 'human_handoff' && (
                    <div>
                      <label className="block text-slate-400 font-medium mb-1">Handoff Escalation Reason</label>
                      <input
                        type="text"
                        value={editingNode.data?.reason || ''}
                        onChange={(e) => updateNodeData(editingNode.id, { reason: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
                Select any node from the canvas to edit its parameters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE BOT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-lg font-bold text-white mb-2">Create WhatsApp Chatbot</h3>
            <p className="text-xs text-slate-400 mb-4">Define a new automated conversation flow for incoming customer chats.</p>

            <form onSubmit={handleCreateBot} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Bot Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Qualification Bot"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Trigger Type</label>
                <select
                  value={newBotTrigger}
                  onChange={(e) => setNewBotTrigger(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                >
                  <option value="KEYWORD">Keyword Match (e.g. hi, price, menu)</option>
                  <option value="NEW_CONVERSATION">New WhatsApp Conversation</option>
                  <option value="MANUAL">Manual / API Trigger Only</option>
                </select>
              </div>

              {newBotTrigger === 'KEYWORD' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Trigger Keywords (comma separated)</label>
                  <input
                    type="text"
                    placeholder="hi, hello, start, quote"
                    value={newBotKeywords}
                    onChange={(e) => setNewBotKeywords(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
                >
                  Create & Open Builder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatbotBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Chatbot Suite...</div>}>
      <ChatbotBuilderContent />
    </Suspense>
  );
}
