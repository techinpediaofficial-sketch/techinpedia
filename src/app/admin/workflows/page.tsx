'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Workflow,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Search,
  Filter,
  Copy,
  Trash2,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { CompanySwitcher } from '@/components/admin/CompanySwitcher';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '@/lib/workflow/templates';

interface ExecutionSummary {
  id: string;
  status: string;
  startedAt: string;
  durationMs?: number;
  stepCount: number;
}

interface WorkflowRule {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
  trigger: string;
  isActive: boolean;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecutedAt?: string | null;
  updatedAt: string;
  executions: ExecutionSummary[];
}

function WorkflowsDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(searchParams.get('companyId') || '');
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);

  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [metrics, setMetrics] = useState({
    totalRules: 0,
    activeRules: 0,
    totalExecutions: 0,
    completedExecutions: 0,
    failedExecutions: 0,
    waitingJobs: 0,
    successRate: 100,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Templates Gallery Modal
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Fetch Current User on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
          if (!data.user.isTenant) {
            // Load available companies for Super Admin switcher
            fetch('/api/admin/companies')
              .then((cRes) => cRes.json())
              .then((cData) => {
                if (cData.companies) {
                  setAvailableCompanies([
                    { id: 'master', name: 'Platform Master (Abdiel Aircon)' },
                    ...cData.companies.map((c: any) => ({ id: c.id, name: c.name, isTenant: c.isTenant })),
                  ]);
                }
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, []);

  const isTenant = Boolean(currentUser?.isTenant);
  const effectiveCompanyId = isTenant && currentUser?.companyId
    ? currentUser.companyId
    : (selectedCompanyId || searchParams.get('companyId') || '');

  const handleCompanyChange = (newCid: string) => {
    setSelectedCompanyId(newCid);
    const params = new URLSearchParams(window.location.search);
    if (newCid) {
      params.set('companyId', newCid);
    } else {
      params.delete('companyId');
    }
    router.replace(`/admin/workflows?${params.toString()}`);
  };

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/automation/workflows', window.location.origin);
      if (effectiveCompanyId) url.searchParams.set('companyId', effectiveCompanyId);
      if (categoryFilter !== 'ALL') url.searchParams.set('category', categoryFilter);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim());

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setRules(data.rules || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [categoryFilter, statusFilter, effectiveCompanyId]);

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/automation/workflows/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_STATUS' }),
      });
      if (res.ok) {
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/automation/workflows/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DUPLICATE' }),
      });
      if (res.ok) {
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete workflow "${name}"?`)) return;
    try {
      const res = await fetch(`/api/automation/workflows/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const builderBaseUrl = effectiveCompanyId ? `/admin/workflows/builder?companyId=${encodeURIComponent(effectiveCompanyId)}` : '/admin/workflows/builder';

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 pb-24 text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Workflow className="w-6 h-6 text-violet-600" />
            Business Automation Engine
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Visual event-driven workflow automation across Leads, Deals, Billing, Hardware Rentals, and Support.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isTenant && availableCompanies.length > 0 && (
            <CompanySwitcher
              selectedCompanyId={effectiveCompanyId}
              availableCompanies={availableCompanies}
              onCompanyChange={handleCompanyChange}
              accentColor="violet"
            />
          )}

          <button
            onClick={() => setShowTemplatesModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/60 rounded-xl font-bold border border-violet-200 dark:border-violet-800 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Templates Gallery (10)
          </button>

          <Link
            href={builderBaseUrl}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Visual Workflow
          </Link>
        </div>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Workflows</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {metrics.activeRules} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ {metrics.totalRules} total</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">Published & Running</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Executions</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {metrics.totalExecutions}
          </div>
          <div className="text-[10px] text-violet-600 font-bold mt-1">{metrics.completedExecutions} completed</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Queue Health</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {metrics.waitingJobs}
          </div>
          <div className="text-[10px] text-amber-600 font-bold mt-1">Pending Delayed Jobs</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Success Rate</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {metrics.successRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{metrics.failedExecutions} failed runs</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search workflows by name, trigger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchWorkflows()}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchWorkflows}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="LEADS">Leads & CRM</option>
            <option value="DEALS">Deals & Pipeline</option>
            <option value="RENTALS">IT Hardware Rentals</option>
            <option value="FINANCE">Invoices & Finance</option>
            <option value="TICKETS">Support Tickets</option>
            <option value="COMMUNICATION">WhatsApp & Comms</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Drafts Only</option>
          </select>
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
            <p>Loading automation workflows...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Workflow className="w-10 h-10 text-slate-700 dark:text-slate-200 mx-auto mb-2" />
            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">No automation workflows found</p>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Get started with a pre-built template or create your own visual flow.</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setShowTemplatesModal(true)}
                className="px-4 py-2 bg-violet-50 text-violet-700 font-bold rounded-xl hover:bg-violet-100 cursor-pointer"
              >
                Browse Templates
              </button>
              <Link
                href={builderBaseUrl}
                className="px-4 py-2 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700"
              >
                Create Custom Flow
              </Link>
            </div>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 transition-all shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      rule.status === 'PUBLISHED'
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                        : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                    }`}
                  >
                    {rule.status}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[10px]">
                    {rule.category}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">v{rule.version}</span>
                </div>

                <div>
                  <Link
                    href={`/admin/workflows/builder?id=${rule.id}${effectiveCompanyId ? `&companyId=${encodeURIComponent(effectiveCompanyId)}` : ''}`}
                    className="text-base font-bold text-slate-900 dark:text-white hover:text-violet-600 transition-colors"
                  >
                    {rule.name}
                  </Link>
                  {rule.description && (
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 line-clamp-1">{rule.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1 font-mono bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                    <Zap className="w-3 h-3 text-amber-500" />
                    {rule.trigger}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{rule.totalExecutions}</strong> Runs ({rule.successfulExecutions} ok,{' '}
                    <span className="text-rose-500">{rule.failedExecutions} fail</span>)
                  </span>
                  {rule.lastExecutedAt && (
                    <>
                      <span>•</span>
                      <span>Last run {new Date(rule.lastExecutedAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions Button Bar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(rule.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                    rule.isActive
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {rule.isActive ? 'Active' : 'Paused'}
                </button>

                <Link
                  href={`/admin/workflows/${rule.id}/executions`}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors"
                >
                  Logs ({rule.executions?.length || 0})
                </Link>

                <Link
                  href={`/admin/workflows/builder?id=${rule.id}${effectiveCompanyId ? `&companyId=${encodeURIComponent(effectiveCompanyId)}` : ''}`}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-colors"
                >
                  Edit Canvas
                </Link>

                <button
                  onClick={() => handleDuplicate(rule.id)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer"
                  title="Clone Workflow"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(rule.id, rule.name)}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
                  title="Delete Workflow"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Templates Gallery Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  Pre-Built Automation Blueprints
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Ready-to-deploy multi-step workflows designed for TechInPedia operations. Click any template to inspect or customize in the Visual Builder.
                </p>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {WORKFLOW_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 hover:border-violet-500 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                        {tpl.category}
                      </span>
                      <span className="text-[10px] text-slate-400">{(tpl.definition?.nodes?.length || 0)} Steps</span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{tpl.name}</div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">{tpl.description}</p>
                  </div>

                  <Link
                    href={`/admin/workflows/builder?template=${tpl.id}${effectiveCompanyId ? `&companyId=${encodeURIComponent(effectiveCompanyId)}` : ''}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-white dark:bg-slate-900 hover:bg-violet-600 text-slate-700 dark:text-slate-200 hover:text-white border border-slate-200 dark:border-slate-800 hover:border-violet-600 rounded-xl font-bold shadow-xs transition-all text-xs"
                  >
                    Use This Template
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowsDashboardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading workflows...</div>}>
      <WorkflowsDashboardContent />
    </Suspense>
  );
}
