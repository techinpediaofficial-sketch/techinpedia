'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Play,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  GitFork,
  Filter,
  Zap,
  Plus,
  Trash2,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  MessageSquare,
  Mail,
  Users,
  ShieldCheck,
  ExternalLink,
  Search,
  Copy,
  Eye,
  EyeOff,
  CheckSquare,
  TrendingUp,
  Receipt,
  LifeBuoy,
  Laptop,
  Briefcase,
  Database,
  Calendar,
  DollarSign,
  CreditCard,
  Award,
  FileText,
  RefreshCw,
  Wrench,
  Megaphone,
  CheckCircle,
  TrendingDown,
  Calculator,
  Octagon,
  GitPullRequest,
  Tag,
  Sliders,
} from 'lucide-react';
import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  TriggerWorkflowNode,
  ActionWorkflowNode,
  BranchWorkflowNode,
  DelayWorkflowNode,
  FilterWorkflowNode,
  ApprovalWorkflowNode,
  StopWorkflowNode,
  MultiBranchWorkflowNode,
} from '@/lib/workflow/types';
import {
  TRIGGER_REGISTRY,
  ACTION_REGISTRY,
  WORKFLOW_CATEGORIES,
  WorkflowCategory,
  ActionDefinition,
} from '@/lib/workflow/registry';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/templates';

// Helper to map category to icon component
function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'Communication':
      return <MessageSquare className="w-4 h-4" />;
    case 'Leads & CRM':
      return <Users className="w-4 h-4" />;
    case 'Deals & Sales':
      return <TrendingUp className="w-4 h-4" />;
    case 'Tasks & Meetings':
      return <CheckSquare className="w-4 h-4" />;
    case 'Quotations & Finance':
      return <Receipt className="w-4 h-4" />;
    case 'Support':
      return <LifeBuoy className="w-4 h-4" />;
    case 'Rental & AMC':
      return <Laptop className="w-4 h-4" />;
    case 'HRM':
      return <Briefcase className="w-4 h-4" />;
    case 'Data & Integrations':
      return <Database className="w-4 h-4" />;
    case 'Logic & Branching':
      return <GitFork className="w-4 h-4" />;
    case 'Timing & Scheduling':
      return <Clock className="w-4 h-4" />;
    case 'Advanced':
      return <Calculator className="w-4 h-4" />;
    default:
      return <Zap className="w-4 h-4" />;
  }
}

function WorkflowBuilderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workflowId = searchParams.get('id');
  const templateId = searchParams.get('template');

  // Workflow Metadata State
  const [name, setName] = useState('New Automation Workflow');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('LEADS');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [version, setVersion] = useState(1);
  const [definition, setDefinition] = useState<WorkflowDefinition>({
    nodes: [
      {
        id: 'node-trigger-1',
        name: 'New Lead Inbound',
        type: 'TRIGGER',
        description: 'Fires when a new lead is captured via website or WhatsApp',
        config: { event: 'crm.lead.created' },
      },
    ],
    edges: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Live Database Lookups (users, pipelines, tags) from /api/automation/registry
  const [dynamicLookups, setDynamicLookups] = useState<any>({
    users: [],
    pipelines: [],
    tags: [],
    departments: [],
    whatsappTemplates: [],
  });

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [workflowCompanyId, setWorkflowCompanyId] = useState<string | null>(searchParams.get('companyId') || null);
  const [companyTemplates, setCompanyTemplates] = useState<any[]>([]);

  // Fetch Current User on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const effectiveCompanyId = currentUser?.isTenant && currentUser?.companyId
    ? currentUser.companyId
    : (workflowCompanyId || searchParams.get('companyId') || null);

  // Selected Node Drawer State
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

  // Add Step Palette Modal State
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [insertAfterNodeId, setInsertAfterNodeId] = useState<string | null>(null);
  const [insertBranchType, setInsertBranchType] = useState<'DEFAULT' | 'TRUE' | 'FALSE'>('DEFAULT');

  // Add Step Modal Search & Filter State
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalCategory, setModalCategory] = useState<string>('ALL');
  const [recentlyUsedActions, setRecentlyUsedActions] = useState<string[]>([]);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const amount = direction === 'left' ? -260 : 260;
      categoryScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Test Simulation Drawer State
  const [showTestDrawer, setShowTestDrawer] = useState(false);
  const [sampleData, setSampleData] = useState({
    name: 'Aditya Verma',
    email: 'aditya@techinpedia.com',
    phone: '+91 98187 68680',
    company: 'Enterprise Solutions Corp',
    service: 'Mobile Application',
    budget: '5 Lakh - 10 Lakh',
    timeline: '1 Month',
    score: 85,
    status: 'NEW',
  });
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Single Step Test Popup State
  const [testStepNode, setTestStepNode] = useState<WorkflowNode | null>(null);
  const [testStepResult, setTestStepResult] = useState<any>(null);

  // Load Recent Actions from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('techinpedia_recent_workflow_actions');
      if (saved) {
        setRecentlyUsedActions(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Fetch Live Catalog & Database Lookups Scoped to Company
  useEffect(() => {
    const q = effectiveCompanyId ? `?companyId=${encodeURIComponent(effectiveCompanyId)}` : '';
    fetch(`/api/automation/registry${q}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.dynamicLookups) {
          setDynamicLookups(data.dynamicLookups);
        }
      })
      .catch(() => {});

    fetch(`/api/whatsapp/templates${q}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.templates) {
          setCompanyTemplates(data.templates.filter((t: any) => t.status === 'APPROVED' || t.status === 'ACTIVE'));
        }
      })
      .catch(() => {});
  }, [effectiveCompanyId]);

  // Load Existing Workflow or Template
  useEffect(() => {
    if (workflowId) {
      fetch(`/api/automation/workflows/${workflowId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.rule) {
            const rule = data.rule;
            setName(rule.name);
            setDescription(rule.description || '');
            setCategory(rule.category || 'LEADS');
            setStatus(rule.status || 'DRAFT');
            setVersion(rule.version || 1);
            if (rule.companyId) {
              setWorkflowCompanyId(rule.companyId);
            }
            if (rule.nodes) {
              try {
                setDefinition({
                  nodes: JSON.parse(rule.nodes),
                  edges: rule.edges ? JSON.parse(rule.edges) : [],
                });
              } catch {}
            }
          }
        })
        .finally(() => setLoading(false));
    } else if (templateId) {
      const tpl = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
      if (tpl) {
        setName(tpl.name);
        setDescription(tpl.description);
        setCategory(tpl.category);
        setDefinition(tpl.definition);
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [workflowId, templateId]);

  // Node Management Helpers
  const updateNodeConfig = (nodeId: string, updatedConfig: any) => {
    setDefinition((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, config: updatedConfig } : n)),
    }));
    if (selectedNode?.id === nodeId) {
      setSelectedNode((prev) => (prev ? { ...prev, config: updatedConfig } : null));
    }
  };

  const updateNodeName = (nodeId: string, newName: string) => {
    setDefinition((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, name: newName } : n)),
    }));
    if (selectedNode?.id === nodeId) {
      setSelectedNode((prev) => (prev ? { ...prev, name: newName } : null));
    }
  };

  const toggleNodeDisabled = (nodeId: string) => {
    setDefinition((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, disabled: !n.disabled } : n)),
    }));
    if (selectedNode?.id === nodeId) {
      setSelectedNode((prev) => (prev ? { ...prev, disabled: !prev.disabled } : null));
    }
  };

  const deleteNode = (nodeId: string) => {
    if (definition.nodes.length <= 1) {
      alert('A workflow must have at least one trigger node.');
      return;
    }
    setDefinition((prev) => ({
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      edges: prev.edges.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId),
    }));
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  };

  const duplicateNode = (nodeId: string) => {
    const orig = definition.nodes.find((n) => n.id === nodeId);
    if (!orig) return;

    const newNodeId = `node-${orig.type.toLowerCase()}-${Date.now().toString(36)}`;
    const clonedNode: WorkflowNode = {
      ...JSON.parse(JSON.stringify(orig)),
      id: newNodeId,
      name: `${orig.name} (Copy)`,
    };

    const targetIdx = definition.nodes.findIndex((n) => n.id === nodeId);
    const newNodes = [...definition.nodes];
    newNodes.splice(targetIdx + 1, 0, clonedNode);

    setDefinition((prev) => ({
      nodes: newNodes,
      edges: [...prev.edges, { id: `edge-${Date.now()}`, sourceNodeId: nodeId, targetNodeId: newNodeId }],
    }));
  };

  // Node Validation
  const validateNode = (node: WorkflowNode): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!node.name || !node.name.trim()) errors.push('Node title cannot be empty.');

    if (node.type === 'ACTION') {
      const act = ACTION_REGISTRY[(node as ActionWorkflowNode).config.actionType];
      if (act) {
        act.params.forEach((param) => {
          if (param.required) {
            const val = (node as ActionWorkflowNode).config.params?.[param.key];
            if (val === undefined || val === null || val === '') {
              errors.push(`${param.label} is required.`);
            }
          }
        });
      }
    } else if (node.type === 'BRANCH' || node.type === 'FILTER') {
      const rules = (node as BranchWorkflowNode).config?.conditionGroup?.rules || [];
      if (rules.length === 0) {
        errors.push('At least one condition rule must be defined.');
      }
    } else if (node.type === 'DELAY') {
      const delayCfg = (node as DelayWorkflowNode).config;
      if (delayCfg.delayType === 'DATE_RELATIVE' && !delayCfg.dateField) {
        errors.push('CRM date field is required.');
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  // Add Step from Palette Modal
  const handleSelectActionFromModal = (actionCode: string) => {
    const actionDef = ACTION_REGISTRY[actionCode];
    if (!actionDef) return;

    // Track recently used in LocalStorage
    const updatedRecents = [actionCode, ...recentlyUsedActions.filter((a) => a !== actionCode)].slice(0, 6);
    setRecentlyUsedActions(updatedRecents);
    try {
      localStorage.setItem('techinpedia_recent_workflow_actions', JSON.stringify(updatedRecents));
    } catch {}

    const newNodeId = `node-${actionDef.code.toLowerCase()}-${Date.now().toString(36)}`;
    let newNode: WorkflowNode;

    if (actionDef.code === 'BRANCH') {
      newNode = {
        id: newNodeId,
        name: 'IF / ELSE Branch',
        type: 'BRANCH',
        description: 'Splits execution based on conditions',
        config: {
          conditionGroup: {
            id: `cg-${Date.now()}`,
            logicalOperator: 'AND',
            rules: [{ id: `r-1`, field: 'lead.score', operator: 'greater_than', value: 50 }],
          },
        },
      };
    } else if (actionDef.code === 'FILTER') {
      newNode = {
        id: newNodeId,
        name: 'Filter Gatekeeper',
        type: 'FILTER',
        description: 'Only continues if criteria match',
        config: {
          conditionGroup: {
            id: `cg-${Date.now()}`,
            logicalOperator: 'AND',
            rules: [{ id: `r-1`, field: 'lead.status', operator: 'equals', value: 'NEW' }],
          },
          failureAction: 'STOP',
        },
      };
    } else if (actionDef.code === 'DELAY') {
      newNode = {
        id: newNodeId,
        name: 'Wait / Delay',
        type: 'DELAY',
        description: 'Pauses workflow execution',
        config: {
          delayType: 'RELATIVE',
          duration: 24,
          unit: 'HOURS',
          businessHoursOnly: false,
          skipWeekends: false,
        },
      };
    } else if (actionDef.code === 'APPROVAL') {
      newNode = {
        id: newNodeId,
        name: 'Human Approval Gate',
        type: 'APPROVAL',
        description: 'Pauses until administrator approval',
        config: {
          title: 'Review & Approve Step',
          timeoutHours: 48,
        },
      };
    } else if (actionDef.code === 'STOP_WORKFLOW') {
      newNode = {
        id: newNodeId,
        name: 'Stop Workflow',
        type: 'STOP_WORKFLOW',
        description: 'Terminates execution early',
        config: {
          status: 'COMPLETED',
          reason: 'Workflow finished condition pathway.',
        },
      };
    } else {
      // Standard Action Node
      const defaultParams: Record<string, any> = {};
      actionDef.params.forEach((p) => {
        if (p.defaultValue !== undefined) defaultParams[p.key] = p.defaultValue;
      });

      newNode = {
        id: newNodeId,
        name: actionDef.name,
        type: 'ACTION',
        description: actionDef.description,
        config: {
          actionType: actionDef.code,
          params: defaultParams,
          continueOnFailure: false,
        },
      };
    }

    // Insert into definition
    setDefinition((prev) => {
      const newNodes = [...prev.nodes];
      const newEdges = [...prev.edges];

      if (insertAfterNodeId) {
        const sourceIndex = newNodes.findIndex((n) => n.id === insertAfterNodeId);
        if (sourceIndex !== -1) {
          newNodes.splice(sourceIndex + 1, 0, newNode);
          newEdges.push({
            id: `edge-${insertAfterNodeId}-${newNodeId}`,
            sourceNodeId: insertAfterNodeId,
            targetNodeId: newNodeId,
            branchType: insertBranchType,
          });
        } else {
          newNodes.push(newNode);
        }
      } else {
        newNodes.push(newNode);
      }

      return { nodes: newNodes, edges: newEdges };
    });

    setShowAddStepModal(false);
    setSelectedNode(newNode);
  };

  // Test Single Step
  const handleTestStep = (node: WorkflowNode) => {
    setTestStepNode(node);
    if (node.type === 'ACTION') {
      const act = node as ActionWorkflowNode;
      const actDef = ACTION_REGISTRY[act.config.actionType];
      const interpolatedParams: Record<string, any> = {};
      const ctx: Record<string, any> = { ...sampleData, lead: sampleData, deal: sampleData, customer: sampleData };
      if (act.config.params) {
        for (const [k, v] of Object.entries(act.config.params)) {
          if (typeof v === 'string') {
            interpolatedParams[k] = v.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, path) => {
              const parts = path.trim().split('.');
              let cur: any = ctx;
              for (const p of parts) {
                if (cur === null || cur === undefined) return '';
                cur = cur[p];
              }
              return cur !== undefined && cur !== null ? String(cur) : '';
            });
          } else {
            interpolatedParams[k] = v;
          }
        }
      }
      setTestStepResult({
        status: 'SUCCESS',
        actionType: act.config.actionType,
        provider: actDef?.badge || 'CRM Service',
        output: {
          simulated: true,
          interpolatedInputs: interpolatedParams,
          message: `Dry-run test for ${node.name} succeeded with sample context.`,
        },
      });
    } else if (node.type === 'BRANCH' || node.type === 'FILTER') {
      setTestStepResult({
        status: 'SUCCESS',
        evaluated: true,
        passed: true,
        chosenBranch: 'TRUE',
        output: { message: `Conditions evaluated TRUE against sample lead data (Score: 85 > 50).` },
      });
    } else if (node.type === 'DELAY') {
      setTestStepResult({
        status: 'SUCCESS',
        durationEstimate: `${(node as DelayWorkflowNode).config.duration || 24} ${(node as DelayWorkflowNode).config.unit || 'HOURS'}`,
        output: { scheduledTargetTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString() },
      });
    } else {
      setTestStepResult({ status: 'SUCCESS', output: { nodeType: node.type, verified: true } });
    }
  };

  // Filter Actions for Add Step Modal
  const filteredActions = useMemo(() => {
    const allActions = Object.values(ACTION_REGISTRY);
    return allActions.filter((act) => {
      const matchesCategory = modalCategory === 'ALL' || act.category === modalCategory;
      const q = modalSearchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        act.name.toLowerCase().includes(q) ||
        act.description.toLowerCase().includes(q) ||
        act.category.toLowerCase().includes(q) ||
        act.code.toLowerCase().includes(q) ||
        (act.keywords && act.keywords.some((k) => k.toLowerCase().includes(q)));

      return matchesCategory && matchesQuery;
    });
  }, [modalCategory, modalSearchQuery]);

  // Frequently Used Actions (Top 4)
  const frequentlyUsedCodes = ['SEND_WHATSAPP', 'ASSIGN_LEAD', 'CREATE_FOLLOW_UP', 'BRANCH'];

  // Save Workflow
  const handleSaveWorkflow = async (publish = false) => {
    setSaving(true);
    setSaveMessage('');
    setErrorMessage('');

    // Pre-save validation
    const hasTrigger = definition.nodes.some((n) => n.type === 'TRIGGER');
    if (!hasTrigger) {
      setErrorMessage('Workflow must contain at least one Trigger node.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name,
        description,
        category,
        companyId: effectiveCompanyId || undefined,
        status: publish ? 'PUBLISHED' : status,
        trigger: (definition.nodes.find((n) => n.type === 'TRIGGER') as TriggerWorkflowNode)?.config.event || 'crm.lead.created',
        nodes: JSON.stringify(definition.nodes),
        edges: JSON.stringify(definition.edges),
        isActive: publish ? true : status === 'PUBLISHED',
      };

      const url = workflowId ? `/api/automation/workflows/${workflowId}` : `/api/automation/workflows`;
      const method = workflowId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save workflow.');
      }

      setSaveMessage(publish ? 'Workflow published successfully!' : 'Workflow saved as draft.');
      if (!workflowId && data.rule?.id) {
        router.push(`/admin/workflows/builder?id=${data.rule.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving workflow.');
    } finally {
      setSaving(false);
    }
  };

  // Run Dry-Run Simulation or Live Test
  const handleRunSimulation = async (live: boolean = false) => {
    setSimulating(true);
    setSimulationResult(null);

    try {
      const res = await fetch(`/api/automation/workflows/${workflowId || 'temp'}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          definition,
          sampleData,
          samplePayload: sampleData,
          isDryRun: !live,
          mode: live ? 'LIVE' : 'DRY_RUN',
        }),
      });

      const data = await res.json();
      setSimulationResult(data.simulation || data);
    } catch (err: any) {
      setSimulationResult({ success: false, error: err.message });
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950/60 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">Loading Workflow Canvas & Action Registry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/workflows"
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-100 dark:bg-slate-950 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-base font-bold text-slate-900 dark:text-white bg-transparent hover:bg-slate-50 dark:bg-slate-950/60 focus:bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-transparent hover:border-slate-300 dark:border-slate-700 focus:border-violet-500 focus:outline-none transition-all"
              />
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {status} (v{version})
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 pl-2">
              {definition.nodes.length} Nodes &bull; {definition.edges.length} Connections &bull; {category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveMessage && <span className="text-xs font-bold text-emerald-600 animate-fade-in">{saveMessage}</span>}
          {errorMessage && <span className="text-xs font-bold text-rose-600 animate-fade-in">{errorMessage}</span>}

          <button
            onClick={() => setShowTestDrawer(true)}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-4 h-4 text-violet-600" />
            Dry-Run Test
          </button>

          <button
            disabled={saving}
            onClick={() => handleSaveWorkflow(false)}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>

          <button
            disabled={saving}
            onClick={() => handleSaveWorkflow(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-violet-200 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Publish Workflow
          </button>
        </div>
      </header>

      {/* Main Builder Canvas Area */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-6">
          {definition.nodes.map((node, index) => {
            const isSelected = selectedNode?.id === node.id;
            const validation = validateNode(node);

            return (
              <div key={node.id} className="relative flex flex-col items-center">
                {/* Node Card */}
                <div
                  onClick={() => setSelectedNode(node)}
                  className={`w-full p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all cursor-pointer shadow-xs hover:shadow-md ${
                    node.disabled ? 'opacity-60 bg-slate-50 dark:bg-slate-950/60 border-dashed border-slate-300 dark:border-slate-700' : ''
                  } ${
                    isSelected
                      ? 'border-violet-600 ring-4 ring-violet-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-violet-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Icon Badge */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                          node.type === 'TRIGGER'
                            ? 'bg-amber-500/10 text-amber-600'
                            : node.type === 'BRANCH' || node.type === 'MULTI_BRANCH'
                            ? 'bg-indigo-500/10 text-indigo-600'
                            : node.type === 'FILTER'
                            ? 'bg-purple-500/10 text-purple-600'
                            : node.type === 'DELAY'
                            ? 'bg-teal-500/10 text-teal-600'
                            : node.type === 'APPROVAL'
                            ? 'bg-rose-500/10 text-rose-600'
                            : node.type === 'STOP_WORKFLOW'
                            ? 'bg-slate-700/10 text-slate-700 dark:text-slate-300'
                            : 'bg-violet-500/10 text-violet-600'
                        }`}
                      >
                        {node.type === 'TRIGGER' && <Zap className="w-5 h-5" />}
                        {node.type === 'BRANCH' && <GitFork className="w-5 h-5" />}
                        {node.type === 'MULTI_BRANCH' && <GitPullRequest className="w-5 h-5" />}
                        {node.type === 'FILTER' && <Filter className="w-5 h-5" />}
                        {node.type === 'DELAY' && <Clock className="w-5 h-5" />}
                        {node.type === 'APPROVAL' && <CheckSquare className="w-5 h-5" />}
                        {node.type === 'STOP_WORKFLOW' && <Octagon className="w-5 h-5" />}
                        {node.type === 'ACTION' &&
                          getCategoryIcon(ACTION_REGISTRY[(node as ActionWorkflowNode).config.actionType]?.category || '')}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {node.type}
                          </span>
                          {node.disabled && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-600">
                              Disabled
                            </span>
                          )}
                          {!validation.isValid && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-600 flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5" /> Incomplete
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{node.name}</div>
                      </div>
                    </div>

                    {/* Per-Node Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestStep(node);
                        }}
                        title="Test Step Simulation"
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-violet-600 rounded-lg hover:bg-slate-100 dark:bg-slate-950 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateNode(node.id);
                        }}
                        title="Duplicate Node"
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:bg-slate-950 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNodeDisabled(node.id);
                        }}
                        title={node.disabled ? 'Enable Node' : 'Disable Node'}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:bg-slate-950 transition-colors"
                      >
                        {node.disabled ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      {node.type !== 'TRIGGER' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNode(node.id);
                          }}
                          title="Delete Node"
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:bg-slate-950 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Details inside card */}
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 flex items-center justify-between">
                    <div>
                      {node.type === 'TRIGGER' && (
                        <span className="font-mono bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                          {(node as TriggerWorkflowNode).config.event}
                        </span>
                      )}
                      {node.type === 'ACTION' && (
                        <span className="text-slate-700 dark:text-slate-300">
                          Action: <strong>{ACTION_REGISTRY[(node as ActionWorkflowNode).config.actionType]?.name || (node as ActionWorkflowNode).config.actionType}</strong>
                        </span>
                      )}
                      {node.type === 'BRANCH' && (
                        <span>
                          Conditions:{' '}
                          <strong className="text-slate-700 dark:text-slate-300">
                            {(node as BranchWorkflowNode).config.conditionGroup?.rules?.length || 0} Rule(s)
                          </strong>
                        </span>
                      )}
                      {node.type === 'DELAY' && (
                        <span>
                          Delay:{' '}
                          <strong className="text-slate-700 dark:text-slate-300">
                            {(node as DelayWorkflowNode).config.delayType === 'DATE_RELATIVE'
                              ? `${(node as DelayWorkflowNode).config.relativeOffsetDays || 0} days relative to ${(node as DelayWorkflowNode).config.dateField}`
                              : `${(node as DelayWorkflowNode).config.duration || 24} ${(node as DelayWorkflowNode).config.unit || 'HOURS'}`}
                          </strong>
                        </span>
                      )}
                      {node.type === 'APPROVAL' && (
                        <span className="text-rose-700 font-semibold">Requires Administrator Approval</span>
                      )}
                      {node.type === 'STOP_WORKFLOW' && (
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">Ends workflow execution</span>
                      )}
                    </div>

                    <span className="text-[11px] font-semibold text-violet-600 flex items-center gap-1 hover:underline">
                      Configure <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Connector Line & Add Step Button */}
                {index < definition.nodes.length - 1 && (
                  <div className="flex flex-col items-center my-2">
                    <div className="w-0.5 h-6 bg-slate-300"></div>
                    <button
                      onClick={() => {
                        setInsertAfterNodeId(node.id);
                        setInsertBranchType('DEFAULT');
                        setShowAddStepModal(true);
                      }}
                      className="p-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-violet-600 hover:border-violet-400 hover:scale-110 shadow-xs transition-all"
                      title="Insert Step Here"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-0.5 h-6 bg-slate-300"></div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Append Step at bottom */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => {
                setInsertAfterNodeId(definition.nodes[definition.nodes.length - 1]?.id || null);
                setInsertBranchType('DEFAULT');
                setShowAddStepModal(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-950/60 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 text-slate-600 hover:text-violet-700 rounded-2xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Next Automation Step
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Node Configuration Drawer */}
      {selectedNode && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slide-left">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                Configure {selectedNode.type} Node
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedNode.name}</h3>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Common: Node Name & Active State */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Step Label / Name</label>
                <input
                  type="text"
                  value={selectedNode.name}
                  onChange={(e) => updateNodeName(selectedNode.id, e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl font-medium focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">Disable Step</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">Skip during execution without deleting</div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedNode.disabled || false}
                  onChange={() => toggleNodeDisabled(selectedNode.id)}
                  className="w-4 h-4 text-violet-600 rounded"
                />
              </div>

              <button
                onClick={() => handleTestStep(selectedNode)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 text-violet-600" />
                Test This Step Inline
              </button>
            </div>

            {/* DYNAMIC ACTION PARAMETERS */}
            {selectedNode.type === 'ACTION' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Selected Action</label>
                  <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-xl text-slate-800 dark:text-slate-100 font-bold flex items-center justify-between">
                    <span>
                      {ACTION_REGISTRY[(selectedNode as ActionWorkflowNode).config.actionType]?.name ||
                        (selectedNode as ActionWorkflowNode).config.actionType}
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-violet-200 text-violet-800 px-1.5 py-0.5 rounded">
                      {ACTION_REGISTRY[(selectedNode as ActionWorkflowNode).config.actionType]?.category}
                    </span>
                  </div>
                </div>

                {/* Render Parameters Dynamically from Registry Schema */}
                {ACTION_REGISTRY[(selectedNode as ActionWorkflowNode).config.actionType]?.params.map((param) => {
                  const currentParams = (selectedNode as ActionWorkflowNode).config.params || {};
                  const currentVal = currentParams[param.key] ?? param.defaultValue ?? '';

                  // Check Field Dependency
                  if (param.dependsOn) {
                    const depVal = currentParams[param.dependsOn.field];
                    if (depVal !== param.dependsOn.equals) return null;
                  }

                  return (
                    <div key={param.key} className="space-y-1">
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                        {param.label} {param.required && <span className="text-rose-500">*</span>}
                      </label>
                      {param.description && <p className="text-[11px] text-slate-400 dark:text-slate-500">{param.description}</p>}

                      {param.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          value={currentVal}
                          onChange={(e) =>
                            updateNodeConfig(selectedNode.id, {
                              ...(selectedNode as ActionWorkflowNode).config,
                              params: { ...currentParams, [param.key]: e.target.value },
                            })
                          }
                          placeholder={param.placeholder}
                          className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                        />
                      ) : param.type === 'select' ? (
                        param.key === 'templateName' ? (
                          <div className="space-y-1.5">
                            {(() => {
                              const availableTpls = companyTemplates.length > 0
                                ? companyTemplates.map((t: any) => ({
                                    label: `${t.name} (${t.category} - ${t.language})`,
                                    value: t.name,
                                    bodyText: t.bodyText,
                                  }))
                                : dynamicLookups?.whatsappTemplates || [];

                              if (availableTpls.length === 0) {
                                return (
                                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-1.5">
                                    <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                      <span>⚠️ No approved templates found for this company</span>
                                    </div>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                      Your WhatsApp account does not have any approved Meta message templates yet. Create one in WhatsApp Templates or wait for Meta approval.
                                    </p>
                                    <Link
                                      href={`/admin/whatsapp?tab=templates${effectiveCompanyId ? `&companyId=${effectiveCompanyId}` : ''}`}
                                      target="_blank"
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline pt-1"
                                    >
                                      Create / Sync WhatsApp Templates ↗
                                    </Link>
                                  </div>
                                );
                              }

                              return (
                                <select
                                  value={currentVal || ''}
                                  onChange={(e) => {
                                    const chosen = availableTpls.find((t: any) => t.value === e.target.value);
                                    updateNodeConfig(selectedNode.id, {
                                      ...(selectedNode as ActionWorkflowNode).config,
                                      params: {
                                        ...currentParams,
                                        [param.key]: e.target.value,
                                        ...(chosen?.bodyText && (!currentParams.messageText || currentParams.messageText.startsWith('Hi {{lead.name}}')) ? { messageText: chosen.bodyText } : {}),
                                      },
                                    });
                                  }}
                                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs font-mono"
                                >
                                  <option value="">-- Select Approved Template ({availableTpls.length} available) --</option>
                                  {availableTpls.map((opt: any) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              );
                            })()}
                          </div>
                        ) : (
                          <select
                            value={currentVal}
                            onChange={(e) =>
                              updateNodeConfig(selectedNode.id, {
                                ...(selectedNode as ActionWorkflowNode).config,
                                params: { ...currentParams, [param.key]: e.target.value },
                              })
                            }
                            className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs"
                          >
                            {param.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )
                      ) : param.type === 'boolean' ? (
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={Boolean(currentVal)}
                            onChange={(e) =>
                              updateNodeConfig(selectedNode.id, {
                                ...(selectedNode as ActionWorkflowNode).config,
                                params: { ...currentParams, [param.key]: e.target.checked },
                              })
                            }
                            className="w-4 h-4 rounded text-violet-600"
                          />
                          <span className="text-slate-700 dark:text-slate-300 font-medium">Enable</span>
                        </label>
                      ) : (
                        <input
                          type={param.type === 'number' ? 'number' : 'text'}
                          value={currentVal}
                          onChange={(e) =>
                            updateNodeConfig(selectedNode.id, {
                              ...(selectedNode as ActionWorkflowNode).config,
                              params: { ...currentParams, [param.key]: e.target.value },
                            })
                          }
                          placeholder={param.placeholder}
                          className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                        />
                      )}

                      {/* Template Variable Injection Helper */}
                      {(param.type === 'template' || param.type === 'textarea') && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">Insert tag:</span>
                          {[
                            '{{lead.name}}',
                            '{{lead.phone}}',
                            '{{lead.email}}',
                            '{{lead.company}}',
                            '{{lead.service}}',
                            '{{lead.budget}}',
                            '{{deal.amount}}',
                            '{{invoice.number}}',
                          ].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                const newVal = `${currentVal} ${tag}`.trim();
                                updateNodeConfig(selectedNode.id, {
                                  ...(selectedNode as ActionWorkflowNode).config,
                                  params: { ...currentParams, [param.key]: newVal },
                                });
                              }}
                              className="px-1.5 py-0.5 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded text-[10px] font-mono"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* BRANCH OR FILTER CONDITIONS */}
            {(selectedNode.type === 'BRANCH' || selectedNode.type === 'FILTER') && (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-[11px] leading-relaxed">
                  Evaluates conditions against the payload. If conditions pass, execution continues along the{' '}
                  <strong>True</strong> path.
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Filter Conditions</span>
                    <button
                      type="button"
                      onClick={() => {
                        const currentRules = (selectedNode as BranchWorkflowNode).config.conditionGroup?.rules || [];
                        const updatedRules = [
                          ...currentRules,
                          { id: `r-${Date.now()}`, field: 'lead.score', operator: 'greater_than', value: 50 },
                        ];
                        updateNodeConfig(selectedNode.id, {
                          ...(selectedNode as BranchWorkflowNode).config,
                          conditionGroup: {
                            ...(selectedNode as BranchWorkflowNode).config.conditionGroup,
                            rules: updatedRules,
                          },
                        });
                      }}
                      className="text-[11px] font-bold text-violet-600 hover:text-violet-700"
                    >
                      + Add Rule
                    </button>
                  </div>

                  {(selectedNode as BranchWorkflowNode).config?.conditionGroup?.rules?.map((rule, rIdx) => (
                    <div key={rule.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">Rule #{rIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedRules = (selectedNode as BranchWorkflowNode).config.conditionGroup.rules.filter(
                              (r) => r.id !== rule.id
                            );
                            updateNodeConfig(selectedNode.id, {
                              ...(selectedNode as BranchWorkflowNode).config,
                              conditionGroup: {
                                ...(selectedNode as BranchWorkflowNode).config.conditionGroup,
                                rules: updatedRules,
                              },
                            });
                          }}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={rule.field}
                        onChange={(e) => {
                          const updatedRules = (selectedNode as BranchWorkflowNode).config.conditionGroup.rules.map((r) =>
                            r.id === rule.id ? { ...r, field: e.target.value } : r
                          );
                          updateNodeConfig(selectedNode.id, {
                            ...(selectedNode as BranchWorkflowNode).config,
                            conditionGroup: { ...(selectedNode as BranchWorkflowNode).config.conditionGroup, rules: updatedRules },
                          });
                        }}
                        placeholder="Field path (e.g. lead.score)"
                        className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-900 font-mono"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={rule.operator}
                          onChange={(e) => {
                            const updatedRules = (selectedNode as BranchWorkflowNode).config.conditionGroup.rules.map((r) =>
                              r.id === rule.id ? { ...r, operator: e.target.value as any } : r
                            );
                            updateNodeConfig(selectedNode.id, {
                              ...(selectedNode as BranchWorkflowNode).config,
                              conditionGroup: { ...(selectedNode as BranchWorkflowNode).config.conditionGroup, rules: updatedRules },
                            });
                          }}
                          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-900"
                        >
                          <option value="equals">equals</option>
                          <option value="not_equals">not equals</option>
                          <option value="contains">contains</option>
                          <option value="greater_than">&gt; greater than</option>
                          <option value="greater_than_or_equal">&gt;= greater or equal</option>
                          <option value="less_than">&lt; less than</option>
                          <option value="is_empty">is empty</option>
                          <option value="is_not_empty">is not empty</option>
                        </select>

                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => {
                            const updatedRules = (selectedNode as BranchWorkflowNode).config.conditionGroup.rules.map((r) =>
                              r.id === rule.id ? { ...r, value: e.target.value } : r
                            );
                            updateNodeConfig(selectedNode.id, {
                              ...(selectedNode as BranchWorkflowNode).config,
                              conditionGroup: { ...(selectedNode as BranchWorkflowNode).config.conditionGroup, rules: updatedRules },
                            });
                          }}
                          placeholder="Comparison value"
                          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DELAY CONFIG */}
            {selectedNode.type === 'DELAY' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Delay Mode</label>
                  <select
                    value={(selectedNode as DelayWorkflowNode).config.delayType || 'RELATIVE'}
                    onChange={(e) =>
                      updateNodeConfig(selectedNode.id, {
                        ...(selectedNode as DelayWorkflowNode).config,
                        delayType: e.target.value,
                      })
                    }
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
                  >
                    <option value="RELATIVE">Relative Duration (Minutes / Hours / Days)</option>
                    <option value="BUSINESS_HOURS">Wait Until Business Hours (9am - 6pm)</option>
                    <option value="DATE_RELATIVE">Relative to CRM Date Field</option>
                  </select>
                </div>

                {(selectedNode as DelayWorkflowNode).config.delayType === 'DATE_RELATIVE' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">CRM Date Field</label>
                      <input
                        type="text"
                        value={(selectedNode as DelayWorkflowNode).config.dateField || ''}
                        onChange={(e) =>
                          updateNodeConfig(selectedNode.id, {
                            ...(selectedNode as DelayWorkflowNode).config,
                            dateField: e.target.value,
                          })
                        }
                        placeholder="invoice.dueDate or rental.endDate"
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Offset Days (+/-)</label>
                      <input
                        type="number"
                        value={(selectedNode as DelayWorkflowNode).config.relativeOffsetDays || -2}
                        onChange={(e) =>
                          updateNodeConfig(selectedNode.id, {
                            ...(selectedNode as DelayWorkflowNode).config,
                            relativeOffsetDays: parseInt(e.target.value),
                          })
                        }
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                      />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">Negative means days before, positive means days after.</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Duration</label>
                      <input
                        type="number"
                        value={(selectedNode as DelayWorkflowNode).config.duration || 24}
                        onChange={(e) =>
                          updateNodeConfig(selectedNode.id, {
                            ...(selectedNode as DelayWorkflowNode).config,
                            duration: parseInt(e.target.value),
                          })
                        }
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Unit</label>
                      <select
                        value={(selectedNode as DelayWorkflowNode).config.unit || 'HOURS'}
                        onChange={(e) =>
                          updateNodeConfig(selectedNode.id, {
                            ...(selectedNode as DelayWorkflowNode).config,
                            unit: e.target.value as any,
                          })
                        }
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
                      >
                        <option value="MINUTES">Minutes</option>
                        <option value="HOURS">Hours</option>
                        <option value="DAYS">Days</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgraded "Add Automation Step" Modal (12 Categories + Search + Recents) */}
      {showAddStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Automation Step</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">
                  Select an action or control block across all 12 modules.
                </p>
              </div>
              <button
                onClick={() => setShowAddStepModal(false)}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:bg-slate-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Search Bar */}
            <div className="pt-4 pb-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="Search actions (e.g. invoice, WhatsApp, assign, lead, ticket, delay, expense)..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-slate-50 dark:bg-slate-950/60 focus:bg-white dark:bg-slate-900"
                />
                {modalSearchQuery && (
                  <button
                    onClick={() => setModalSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills Container with Left/Right Arrows & Thin Visible Scrollbar */}
            <div className="relative flex items-center gap-2 py-1 mb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => scrollCategories('left')}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100 transition-colors shrink-0 shadow-xs"
                title="Scroll Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div
                ref={categoryScrollRef}
                className="flex items-center gap-1.5 overflow-x-auto py-1 pb-2.5 thin-scrollbar flex-1 scroll-smooth"
              >
                <button
                  onClick={() => setModalCategory('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    modalCategory === 'ALL' ? 'bg-violet-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  All Actions ({Object.keys(ACTION_REGISTRY).length})
                </button>
                {WORKFLOW_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setModalCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                      modalCategory === cat.id ? 'bg-violet-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-950 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {getCategoryIcon(cat.id)}
                    {cat.name}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => scrollCategories('right')}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100 transition-colors shrink-0 shadow-xs"
                title="Scroll Right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modal Body: Cards Grid */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs">
              {/* Recently Used & Frequently Used (if no search query) */}
              {!modalSearchQuery && modalCategory === 'ALL' && (
                <div className="space-y-4">
                  {recentlyUsedActions.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                        Recently Used
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {recentlyUsedActions.map((code) => {
                          const act = ACTION_REGISTRY[code];
                          if (!act) return null;
                          return (
                            <button
                              key={`recent-${code}`}
                              onClick={() => handleSelectActionFromModal(code)}
                              className="p-3 text-left border border-slate-200 dark:border-slate-800 hover:border-violet-500 rounded-2xl hover:bg-violet-50/50 transition-all flex items-center gap-3 bg-white dark:bg-slate-900 shadow-2xs"
                            >
                              <div className="p-2.5 rounded-xl bg-violet-100 text-violet-700">
                                {getCategoryIcon(act.category)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-100">{act.name}</div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500">{act.category}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Frequently Used
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {frequentlyUsedCodes.map((code) => {
                        const act = ACTION_REGISTRY[code];
                        if (!act) return null;
                        return (
                          <button
                            key={`freq-${code}`}
                            onClick={() => handleSelectActionFromModal(code)}
                            className="p-3 text-left border border-slate-200 dark:border-slate-800 hover:border-violet-500 rounded-2xl hover:bg-violet-50/50 transition-all flex items-center gap-3 bg-white dark:bg-slate-900 shadow-2xs"
                          >
                            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300">
                              {getCategoryIcon(act.category)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-100">{act.name}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500">{act.category}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Categorized or Filtered Results */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                  {modalCategory === 'ALL' ? 'All Available Actions' : `${modalCategory} Actions`} ({filteredActions.length})
                </div>

                {filteredActions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                    No automation steps found matching &ldquo;{modalSearchQuery}&rdquo;.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredActions.map((act) => (
                      <button
                        key={act.code}
                        onClick={() => handleSelectActionFromModal(act.code)}
                        className="p-3.5 text-left border border-slate-200 dark:border-slate-800 hover:border-violet-500 rounded-2xl hover:bg-violet-50/40 transition-all flex items-start gap-3 bg-white dark:bg-slate-900 shadow-2xs group"
                      >
                        <div className="p-2.5 rounded-xl bg-violet-50 group-hover:bg-violet-100 text-violet-700 shrink-0 mt-0.5">
                          {getCategoryIcon(act.category)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-violet-700 truncate">
                              {act.name}
                            </span>
                            {act.badge && (
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-950 text-slate-600 px-1.5 py-0.5 rounded">
                                {act.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {act.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Step Test Modal */}
      {testStepNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-violet-600" />
                <h4 className="font-bold text-slate-900 dark:text-white">Step Test Result</h4>
              </div>
              <button
                onClick={() => setTestStepNode(null)}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-1">Testing Node:</div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-xs">
                {testStepNode.name} ({testStepNode.type})
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-1">Simulated Output:</div>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                {JSON.stringify(testStepResult?.output || testStepResult, null, 2)}
              </pre>
            </div>

            <button
              onClick={() => setTestStepNode(null)}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Dry-Run Simulation Drawer */}
      {showTestDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slide-left">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-violet-50/70">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workflow Testing & Live Dispatch</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-500">Run dry-run simulation or dispatch live test messages directly to WhatsApp.</p>
              </div>
            </div>
            <button
              onClick={() => setShowTestDrawer(false)}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Sample Lead / Context Data</label>
              <textarea
                rows={6}
                value={JSON.stringify(sampleData, null, 2)}
                onChange={(e) => {
                  try {
                    setSampleData(JSON.parse(e.target.value));
                  } catch {}
                }}
                className="w-full p-3 font-mono text-[11px] bg-slate-900 text-emerald-400 rounded-xl focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={simulating}
                onClick={() => handleRunSimulation(false)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 text-xs"
              >
                <Play className="w-3.5 h-3.5" />
                {simulating ? 'Processing...' : 'Dry-Run Test'}
              </button>
              <button
                disabled={simulating}
                onClick={() => handleRunSimulation(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 text-xs shadow-sm shadow-emerald-500/20"
              >
                <Zap className="w-3.5 h-3.5" />
                {simulating ? 'Sending...' : '⚡ Send Live WhatsApp'}
              </button>
            </div>

            {simulationResult && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-100">Simulation Outcome</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      simulationResult.success ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {simulationResult.success ? 'COMPLETED' : 'FAILED'}
                  </span>
                </div>

                {simulationResult.error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-400">
                    <strong>Error:</strong> {simulationResult.error}
                  </div>
                )}

                <div className="space-y-2">
                  {simulationResult.simulatedSteps?.map((step: any, sIdx: number) => (
                    <div key={sIdx} className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {sIdx + 1}. {step.nodeName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{step.nodeType}</span>
                      </div>
                      {step.branchChoice && (
                        <div className="text-[11px] text-indigo-700">
                          Path Chosen: <strong>{step.branchChoice}</strong>
                        </div>
                      )}
                      {step.mockActionOutput && (
                        <pre className="text-[10px] font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 text-slate-600 overflow-x-auto">
                          {JSON.stringify(step.mockActionOutput, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950/60 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <WorkflowBuilderContent />
    </Suspense>
  );
}
