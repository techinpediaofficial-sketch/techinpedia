'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  DollarSign,
  TrendingUp,
  Building,
  Calendar,
  X,
  AlertCircle,
  CheckCircle2,
  Filter,
  Sparkles,
  Clock,
  Trash2,
  ArrowRight,
  Briefcase,
  AlertTriangle,
  User,
  Check,
  ExternalLink,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

interface DealItem {
  id?: string;
  title: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discount?: number | null;
  total: number;
}

interface DealStageHistory {
  id: string;
  stageName: string;
  durationHours?: number | null;
  enteredAt: string;
  leftAt?: string | null;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
  deals?: Deal[];
}

interface Pipeline {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
  stages: Stage[];
}

interface Deal {
  id: string;
  title: string;
  value: number;
  probability: number;
  stageId: string;
  expectedCloseDate?: string | null;
  lostReason?: string | null;
  lostNotes?: string | null;
  assignedEmployeeId?: string | null;
  customer?: { id: string; name: string; email: string } | null;
  company?: { id: string; name: string } | null;
  assignedEmployee?: { id: string; name: string; employeeCode: string } | null;
  stage?: Stage | null;
  items?: DealItem[];
  stageHistories?: DealStageHistory[];
}

export default function DealsKanbanPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);

  // Active Deal Drawer State
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loadingDealDetails, setLoadingDealDetails] = useState(false);

  // Create Deal Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dealForm, setDealForm] = useState({
    title: '',
    value: '',
    stageId: '',
    expectedCloseDate: '',
    notes: '',
  });
  const [creating, setCreating] = useState(false);

  // Line Items Drawer Mode State
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [savingItem, setSavingItem] = useState(false);

  // Mandatory Lost Reason Modal
  const [pendingLostTransition, setPendingLostTransition] = useState<{
    dealId: string;
    targetStageId: string;
  } | null>(null);
  const [lostReason, setLostReason] = useState('Price too high');
  const [lostNotes, setLostNotes] = useState('');
  const [submittingLost, setSubmittingLost] = useState(false);

  // Project Conversion State
  const [convertingToProject, setConvertingToProject] = useState(false);
  const [convertedProject, setConvertedProject] = useState<any | null>(null);

  const fetchPipelines = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/pipelines');
      const data = await res.json();
      if (res.ok && data.pipelines) {
        setPipelines(data.pipelines);
        if (data.pipelines.length > 0 && !selectedPipelineId) {
          const defaultPipe = data.pipelines.find((p: Pipeline) => p.isDefault) || data.pipelines[0];
          setSelectedPipelineId(defaultPipe.id);
        }
      }
    } catch (err) {
      console.error('Failed to load pipelines:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    if (!selectedPipelineId) return;
    try {
      const res = await fetch(`/api/crm/deals?pipelineId=${selectedPipelineId}`);
      const data = await res.json();
      if (res.ok) {
        setDeals(data.deals || []);
      }
    } catch (err) {
      console.error('Failed to load deals:', err);
    }
  };

  const fetchSingleDeal = async (dealId: string) => {
    setLoadingDealDetails(true);
    try {
      const res = await fetch(`/api/crm/deals/${dealId}`);
      const data = await res.json();
      if (res.ok && data.deal) {
        setSelectedDeal(data.deal);
      }
    } catch (err) {
      console.error('Failed to fetch deal details:', err);
    } finally {
      setLoadingDealDetails(false);
    }
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  useEffect(() => {
    if (selectedPipelineId) {
      fetchDeals();
    }
  }, [selectedPipelineId]);

  const activePipeline = pipelines.find((p) => p.id === selectedPipelineId);

  // Stage transition trigger with mandatory lost check
  const handleStageTransition = (deal: Deal, targetStageId: string) => {
    const targetStage = activePipeline?.stages.find((s) => s.id === targetStageId);
    if (targetStage?.isLost) {
      setPendingLostTransition({ dealId: deal.id, targetStageId });
      setLostReason('Price too high');
      setLostNotes('');
      return;
    }

    executeStageMove(deal.id, targetStageId);
  };

  const executeStageMove = async (dealId: string, newStageId: string, lostPayload?: { lostReason: string; lostNotes?: string }) => {
    try {
      const body: any = { stageId: newStageId };
      if (lostPayload) {
        body.lostReason = lostPayload.lostReason;
        body.lostNotes = lostPayload.lostNotes;
      }

      const res = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        fetchDeals();
        if (selectedDeal && selectedDeal.id === dealId) {
          fetchSingleDeal(dealId);
        }
      }
    } catch (err) {
      console.error('Failed to update deal stage:', err);
    }
  };

  const handleConfirmLost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingLostTransition) return;
    setSubmittingLost(true);
    try {
      await executeStageMove(pendingLostTransition.dealId, pendingLostTransition.targetStageId, {
        lostReason,
        lostNotes,
      });
      setPendingLostTransition(null);
    } finally {
      setSubmittingLost(false);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPipelineId || !dealForm.stageId) return;
    setCreating(true);
    try {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dealForm.title,
          value: parseFloat(dealForm.value) || 0,
          pipelineId: selectedPipelineId,
          stageId: dealForm.stageId,
          expectedCloseDate: dealForm.expectedCloseDate || null,
          notes: dealForm.notes,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setDealForm({
          title: '',
          value: '',
          stageId: activePipeline?.stages[0]?.id || '',
          expectedCloseDate: '',
          notes: '',
        });
        fetchDeals();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create deal');
      }
    } catch (err) {
      console.error('Failed to create deal:', err);
    } finally {
      setCreating(false);
    }
  };

  // Add line item to selected deal
  const handleAddLineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !newItemTitle.trim()) return;
    setSavingItem(true);
    try {
      const itemTotal = newItemQty * newItemPrice;
      const currentItems = selectedDeal.items || [];
      const updatedItems = [
        ...currentItems,
        {
          title: newItemTitle.trim(),
          quantity: newItemQty,
          unitPrice: newItemPrice,
          total: itemTotal,
        },
      ];

      const newDealValue = updatedItems.reduce((acc, it) => acc + it.total, 0);

      const res = await fetch(`/api/crm/deals/${selectedDeal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedItems,
          value: newDealValue,
        }),
      });

      if (res.ok) {
        setNewItemTitle('');
        setNewItemQty(1);
        setNewItemPrice(0);
        fetchSingleDeal(selectedDeal.id);
        fetchDeals();
      }
    } catch (err) {
      console.error('Failed to add deal item:', err);
    } finally {
      setSavingItem(false);
    }
  };

  // Delete line item from selected deal
  const handleDeleteLineItem = async (index: number) => {
    if (!selectedDeal || !selectedDeal.items) return;
    const updatedItems = selectedDeal.items.filter((_, idx) => idx !== index);
    const newDealValue = updatedItems.reduce((acc, it) => acc + it.total, 0);

    try {
      const res = await fetch(`/api/crm/deals/${selectedDeal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedItems,
          value: newDealValue,
        }),
      });
      if (res.ok) {
        fetchSingleDeal(selectedDeal.id);
        fetchDeals();
      }
    } catch (err) {
      console.error('Failed to delete deal item:', err);
    }
  };

  // 1-Click Convert Won Deal to Project
  const handleConvertToProject = async () => {
    if (!selectedDeal) return;
    setConvertingToProject(true);
    try {
      const res = await fetch(`/api/crm/deals/${selectedDeal.id}/convert-to-project`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.project) {
        setConvertedProject(data.project);
        alert(`Success! Created Project: ${data.project.name} (${data.project.code})`);
      } else {
        alert(data.error || 'Failed to convert deal to project');
      }
    } catch (err) {
      console.error('Convert deal to project error:', err);
    } finally {
      setConvertingToProject(false);
    }
  };

  // Pipeline Metrics
  const totalPipelineValue = deals.reduce((acc, d) => acc + d.value, 0);
  const weightedPipelineValue = deals.reduce((acc, d) => acc + (d.value * (d.probability / 100)), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Pipeline Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Sales Pipeline & Kanban</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              Phase B
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visual stage progression, stage velocity metrics, line-item pricing, and 1-click project conversion.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
          >
            <Building className="w-4 h-4 text-violet-600" />
            Leads Desk
          </Link>
          <button
            onClick={() => {
              setDealForm((prev) => ({ ...prev, stageId: activePipeline?.stages[0]?.id || '' }));
              setShowCreateModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Deal
          </button>
        </div>
      </div>

      {/* Pipeline Selector Tabs & Metrics Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {pipelines.map((pipe) => (
            <button
              key={pipe.id}
              onClick={() => setSelectedPipelineId(pipe.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedPipelineId === pipe.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {pipe.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6 divide-x divide-slate-200 dark:divide-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div className="pl-2">
            <span className="text-slate-400 dark:text-slate-500 block font-medium">Deals in Pipeline</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{deals.length}</span>
          </div>
          <div className="pl-6">
            <span className="text-slate-400 dark:text-slate-500 block font-medium">Pipeline Value</span>
            <span className="text-base font-bold text-emerald-600">
              ₹{totalPipelineValue.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="pl-6">
            <span className="text-slate-400 dark:text-slate-500 block font-medium">Weighted Value</span>
            <span className="text-base font-bold text-violet-600">
              ₹{Math.round(weightedPipelineValue).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* ─── DEALS TABLE VIEW ─── */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 dark:text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2" />
          <p className="text-sm">Loading deals...</p>
        </div>
      ) : !activePipeline ? (
        <div className="p-8 bg-white dark:bg-slate-900 rounded-xl text-center text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
          <AlertCircle className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="font-semibold">No pipeline configured</p>
        </div>
      ) : deals.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-sm">No deals in this pipeline yet</p>
          <p className="text-xs mt-1">Create your first deal using the button above.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Deal</th>
                  <th className="py-3.5 px-4">Client / Company</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Value</th>
                  <th className="py-3.5 px-4">Probability</th>
                  <th className="py-3.5 px-4">Assigned</th>
                  <th className="py-3.5 px-4">Close Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
                {deals.map(deal => {
                  const stage = activePipeline.stages.find(s => s.id === deal.stageId);
                  return (
                    <tr key={deal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{deal.title}</div>
                        {deal.items && deal.items.length > 0 && (
                          <div className="text-[10px] text-violet-600 dark:text-violet-400 mt-0.5">{deal.items.length} line item{deal.items.length > 1 ? 's' : ''}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {deal.customer && <div className="font-medium text-slate-800 dark:text-slate-200">{deal.customer.name}</div>}
                        {deal.company && <div className="text-[11px] text-slate-500 dark:text-slate-400">{deal.company.name}</div>}
                        {!deal.customer && !deal.company && <span className="text-slate-400 dark:text-slate-500">—</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        {stage ? (
                          <span
                            className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${stage.isWon ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' : stage.isLost ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30' : 'bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30'}`}
                          >
                            {stage.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ₹{deal.value.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                          <span className="text-slate-600 dark:text-slate-400 text-[11px]">{deal.probability}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {deal.assignedEmployee ? deal.assignedEmployee.name : <span className="text-slate-400">Unassigned</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => { setSelectedDeal(deal); fetchSingleDeal(deal.id); }}
                          className="px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 dark:bg-violet-600/20 dark:hover:bg-violet-600/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30 font-semibold text-xs transition-all cursor-pointer"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deal Detail & Line Items Drawer */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedDeal(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800/80 animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200">
                      DEAL DESK
                    </span>
                    <span className="text-xs text-slate-400">ID: {selectedDeal.id.slice(0, 8)}</span>
                    {selectedDeal.stage?.isWon && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300">
                        WON
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{selectedDeal.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedDeal.customer && (
                      <span>Client: {selectedDeal.customer.name}</span>
                    )}
                    <span className="font-bold text-emerald-600 text-sm">
                      Total: ₹{selectedDeal.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* 1-Click Convert to Project for Won Deals */}
                  {selectedDeal.stage?.isWon && (
                    <button
                      onClick={handleConvertToProject}
                      disabled={convertingToProject}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      {convertingToProject ? 'Converting...' : 'Convert to Project'}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedDeal(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Converted Project Success Banner */}
                {convertedProject && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-800 dark:text-emerald-300">
                        Project Successfully Initialized!
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        Code: {convertedProject.code} • Budget: ₹{convertedProject.budget.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <Link
                      href={`/admin/projects`}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 flex items-center gap-1"
                    >
                      Go to Projects <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {/* Stage Progress Bar / Selector */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Pipeline Progression
                  </h3>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {activePipeline?.stages.map((st) => {
                      const isCurrent = selectedDeal.stageId === st.id;
                      return (
                        <button
                          key={st.id}
                          onClick={() => handleStageTransition(selectedDeal, st.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border whitespace-nowrap transition-all flex items-center gap-1.5 ${
                            isCurrent
                              ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                              : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {isCurrent && <Check className="w-3 h-3" />}
                          {st.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Line Items Pricing Table */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-violet-600" />
                        Deal Line Items & Scope
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Itemized service deliverables with automatic total calculation.</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {selectedDeal.items?.length || 0} Items
                    </span>
                  </div>

                  {/* Existing Items List */}
                  {selectedDeal.items && selectedDeal.items.length > 0 ? (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                      {selectedDeal.items.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <span className="font-semibold text-slate-900 dark:text-white">{item.title}</span>
                            <div className="text-[11px] text-slate-400">
                              Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            ₹{item.total.toLocaleString('en-IN')}
                          </div>
                          <button
                            onClick={() => handleDeleteLineItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Remove line item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No line items added yet. Add items below to calculate deal pricing.</p>
                  )}

                  {/* Add New Line Item Form */}
                  <form onSubmit={handleAddLineItem} className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 text-xs">
                    <input
                      type="text"
                      required
                      placeholder="Item description (e.g. 15 Dell i7 Laptops)"
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      className="flex-1 min-w-[160px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                    />
                    <input
                      type="number"
                      min={1}
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                      className="w-16 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                      placeholder="Qty"
                    />
                    <input
                      type="number"
                      min={0}
                      value={newItemPrice || ''}
                      onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                      className="w-28 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                      placeholder="Unit Price ₹"
                    />
                    <button
                      type="submit"
                      disabled={savingItem || !newItemTitle.trim()}
                      className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold disabled:opacity-50"
                    >
                      {savingItem ? 'Adding...' : 'Add Item'}
                    </button>
                  </form>
                </div>

                {/* Stage History & Duration Hours Timeline */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-violet-600" />
                    Stage History & Duration Analysis
                  </h3>
                  {selectedDeal.stageHistories && selectedDeal.stageHistories.length > 0 ? (
                    <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                      {selectedDeal.stageHistories.map((hist) => (
                        <div key={hist.id} className="relative flex items-start gap-3 text-xs">
                          <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold shrink-0 border border-white dark:border-slate-800 shadow-xs">
                            •
                          </div>
                          <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white">{hist.stageName}</span>
                              <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                                {hist.durationHours !== null && hist.durationHours !== undefined
                                  ? `${hist.durationHours} hrs duration`
                                  : 'Active stage'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              Entered: {new Date(hist.enteredAt).toLocaleString('en-IN')}
                              {hist.leftAt && ` • Left: ${new Date(hist.leftAt).toLocaleString('en-IN')}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No historical stage transitions logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Lost Reason Modal */}
      {pendingLostTransition && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Specify Reason for Lost Deal
              </h3>
              <button
                onClick={() => setPendingLostTransition(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              To close this deal as Lost, please record the primary driver to assist sales analytics and pipeline improvement.
            </p>

            <form onSubmit={handleConfirmLost} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Lost Reason *</label>
                <select
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Price too high">Price too high / Competitor undercut</option>
                  <option value="Competitor chosen">Competitor chosen (Brand/Tech)</option>
                  <option value="Feature missing">Missing service / hardware spec</option>
                  <option value="Project postponed">Client budget froze / postponed</option>
                  <option value="Unresponsive">Client ghosted after quotation</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Debrief Notes</label>
                <textarea
                  rows={3}
                  value={lostNotes}
                  onChange={(e) => setLostNotes(e.target.value)}
                  placeholder="Notes from meeting or client feedback..."
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingLostTransition(null)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLost}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  {submittingLost ? 'Saving...' : 'Confirm Lost Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Deal Modal */}
      {showCreateModal && activePipeline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Deal</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={dealForm.title}
                  onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  placeholder="e.g. 25 MacBook Pro M3 Rental Contract"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Deal Value (₹) *</label>
                  <input
                    type="number"
                    required
                    value={dealForm.value}
                    onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="250000"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Pipeline Stage *</label>
                  <select
                    value={dealForm.stageId}
                    onChange={(e) => setDealForm({ ...dealForm, stageId: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  >
                    {activePipeline.stages.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.probability}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Expected Close Date</label>
                <input
                  type="date"
                  value={dealForm.expectedCloseDate}
                  onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Scope & Notes</label>
                <textarea
                  rows={2}
                  value={dealForm.notes}
                  onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  placeholder="Key milestones, pricing terms..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
