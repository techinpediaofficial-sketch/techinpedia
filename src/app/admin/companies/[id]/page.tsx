'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  Key,
  Webhook,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Radio,
  Send,
  ArrowLeft,
  Settings,
  Layers,
  BarChart3,
  TrendingUp,
  Inbox,
  UserCheck,
  Lock,
  Edit3,
  X,
} from 'lucide-react';

interface CompanyData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  domain: string | null;
  industry: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  gstNumber: string | null;
  notes: string | null;
  isTenant: boolean;
  tenantStatus: string;
  planName: string;
  monthlyMessageLimit: number;
  maxEmployees: number;
  allowedModules: string[];
  webhookSecret: string | null;
  webhookUrl: string;
  createdAt: string;
}

interface ConnectionData {
  id: string;
  wabaId: string | null;
  phoneNumberId: string;
  businessPhoneNumber: string | null;
  displayName: string | null;
  qualityRating: string;
  status: string;
  connectionHealth: string;
  apiVersion: string;
  verifyToken: string;
  lastSuccessfulApiCall: string | null;
  lastWebhookReceivedAt: string | null;
}

interface EmployeeData {
  id: string;
  name: string;
  email: string;
  role: string;
  companyRole: string | null;
  status: string;
  createdAt: string;
}

interface TelemetryData {
  messagesToday: number;
  messagesThisMonth: number;
  monthlyLimit: number;
  quotaUsedPercent: number;
  totalConversations: number;
  openConversations: number;
  totalTemplates: number;
  totalCampaigns: number;
  totalEmployees: number;
  maxEmployees: number;
}

const AVAILABLE_MODULES = [
  { id: 'whatsapp', name: 'WhatsApp Business CRM & Inbox', desc: 'Team inbox, message dispatch, approved templates, and marketing campaigns', default: true },
  { id: 'crm.leads', name: 'CRM Leads & Kanban Pipeline', desc: 'Inbound lead tracking, stages, follow-up scheduler, and timeline audit stream' },
  { id: 'crm.deals', name: 'Sales Deals & Pipelines', desc: 'Revenue pipeline management, stage forecasting, and deal closure tracking' },
  { id: 'crm.contacts', name: 'Contacts Directory', desc: 'Directory of individual contact profiles linked to conversations and companies' },
  { id: 'sales.proposals', name: 'Proposals & Quotations', desc: 'Generate multi-section proposal PDFs, cost estimations, and quotes' },
  { id: 'support.tickets', name: 'Support Tickets & Helpdesk', desc: 'Customer support ticketing, priority queues, and resolution SLAs' },
];

export default function Company360Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const companyId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [connection, setConnection] = useState<ConnectionData | null>(null);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [crmStats, setCrmStats] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'meta' | 'modules' | 'team' | 'messages'>('overview');

  // Meta Form State
  const [metaForm, setMetaForm] = useState({
    phoneNumberId: '',
    wabaId: '',
    accessToken: '',
    verifyToken: '',
    appSecret: '',
  });
  const [showToken, setShowToken] = useState(false);
  const [testingMeta, setTestingMeta] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaFeedback, setMetaFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modules State
  const [selectedModules, setSelectedModules] = useState<string[]>(['whatsapp']);
  const [savingModules, setSavingModules] = useState(false);

  // New Employee Modal State
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    password: '',
    companyRole: 'INBOX_ONLY',
  });
  const [addingEmployee, setAddingEmployee] = useState(false);

  // Edit Company State
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    industry: 'Information Technology',
    website: '',
    domain: '',
    phone: '',
    email: '',
    address: '',
    city: 'Delhi NCR',
    state: '',
    country: 'India',
    postalCode: '',
    gstNumber: '',
    notes: '',
    isTenant: true,
    tenantStatus: 'ACTIVE',
    planName: 'WhatsApp SaaS Starter',
    monthlyMessageLimit: 10000,
    maxEmployees: 5,
    allowedModules: ['whatsapp'],
  });

  // Delete Company State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState(false);

  // Copy Feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Live Test WhatsApp Dispatch State
  const [testRecipient, setTestRecipient] = useState('');
  const [testText, setTestText] = useState('Hello! Live test message from our WhatsApp Business Cloud API.');
  const [sendingTestMessage, setSendingTestMessage] = useState(false);
  const [testDispatchResult, setTestDispatchResult] = useState<any | null>(null);

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) return;
    setSendingTestMessage(true);
    setTestDispatchResult(null);
    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testRecipient.trim(),
          message: testText.trim() || `Hello from ${company?.name || 'Company'}!`,
          companyId: companyId,
        }),
      });
      const data = await res.json();
      setTestDispatchResult(data);
    } catch (err: any) {
      setTestDispatchResult({ success: false, error: err.message || 'Network error' });
    } finally {
      setSendingTestMessage(false);
    }
  };

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/companies/${companyId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCompany(data.company);
        setConnection(data.connection);
        setEmployees(data.employees || []);
        setTelemetry(data.telemetry);
        setCrmStats(data.crmStats || {});
        setRecentMessages(data.recentMessages || []);
        setSelectedModules(data.company.allowedModules || ['whatsapp']);

        if (data.connection) {
          setMetaForm({
            phoneNumberId: data.connection.phoneNumberId || '',
            wabaId: data.connection.wabaId || '',
            accessToken: '',
            verifyToken: data.connection.verifyToken || '',
            appSecret: '',
          });
        } else {
          setMetaForm((prev) => ({
            ...prev,
            verifyToken: data.company.webhookSecret || 'techinpedia_verify_token_2026',
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load company 360 data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Test Meta Connection
  const handleTestMeta = async () => {
    if (!metaForm.phoneNumberId || !metaForm.accessToken) {
      setMetaFeedback({ type: 'error', message: 'Phone Number ID and Access Token are required for testing.' });
      return;
    }
    setTestingMeta(true);
    setMetaFeedback(null);
    try {
      const res = await fetch('/api/whatsapp/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST',
          phoneNumberId: metaForm.phoneNumberId.trim(),
          accessToken: metaForm.accessToken.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMetaFeedback({
          type: 'success',
          message: `Connected successfully to Meta! Verified Name: "${data.data?.verified_name || 'N/A'}", Phone: "${data.data?.display_phone_number || 'N/A'}"`,
        });
      } else {
        setMetaFeedback({
          type: 'error',
          message: data.error || 'Meta test failed. Check credentials.',
        });
      }
    } catch (e: any) {
      setMetaFeedback({ type: 'error', message: e.message || 'Network error during test.' });
    } finally {
      setTestingMeta(false);
    }
  };

  // Save Meta Configuration
  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaForm.phoneNumberId || !metaForm.accessToken) {
      setMetaFeedback({ type: 'error', message: 'Phone Number ID and Access Token are required.' });
      return;
    }
    setSavingMeta(true);
    setMetaFeedback(null);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/whatsapp-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMetaFeedback({
          type: 'success',
          message: 'Meta WhatsApp Business Cloud API successfully configured and saved!',
        });
        fetchCompanyData();
      } else {
        setMetaFeedback({
          type: 'error',
          message: data.error || 'Failed to save connection.',
        });
      }
    } catch (e: any) {
      setMetaFeedback({ type: 'error', message: e.message || 'Save error' });
    } finally {
      setSavingMeta(false);
    }
  };

  // Toggle Module Selection
  const handleToggleModule = (modId: string) => {
    if (modId === 'whatsapp') return; // Cannot disable primary product
    setSelectedModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  // Save Module Entitlements
  const handleSaveModules = async () => {
    setSavingModules(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedModules: selectedModules }),
      });
      if (res.ok) {
        alert('CRM Module Entitlements updated successfully!');
        fetchCompanyData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update modules.');
      }
    } catch (e) {
      alert('Network error saving modules.');
    } finally {
      setSavingModules(false);
    }
  };

  // Toggle Tenant Status (Active / Suspended)
  const handleToggleStatus = async (newStatus: 'ACTIVE' | 'SUSPENDED') => {
    if (!confirm(`Are you sure you want to change company status to ${newStatus}?`)) return;
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantStatus: newStatus }),
      });
      if (res.ok) {
        fetchCompanyData();
      }
    } catch (e) {
      console.error('Status change error:', e);
    }
  };

  // Add Employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEmployee(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddEmployeeModal(false);
        setEmployeeForm({ name: '', email: '', password: '', companyRole: 'INBOX_ONLY' });
        fetchCompanyData();
      } else {
        alert(data.error || 'Failed to add employee');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating employee account');
    } finally {
      setAddingEmployee(false);
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (userId: string, email: string) => {
    if (!confirm(`Remove access for ${email}?`)) return;
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/employees?userId=${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCompanyData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove employee');
      }
    } catch (e) {
      alert('Delete request failed');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!company) return;
    let modules = ['whatsapp'];
    if (Array.isArray(company.allowedModules)) {
      modules = company.allowedModules;
    } else if (typeof company.allowedModules === 'string') {
      try {
        const parsed = JSON.parse(company.allowedModules);
        if (Array.isArray(parsed)) modules = parsed;
      } catch {}
    }
    setEditForm({
      name: company.name || '',
      industry: company.industry || 'Information Technology',
      website: company.website || '',
      domain: company.domain || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || '',
      city: company.city || 'Delhi NCR',
      state: company.state || '',
      country: company.country || 'India',
      postalCode: company.postalCode || '',
      gstNumber: company.gstNumber || '',
      notes: company.notes || '',
      isTenant: Boolean(company.isTenant),
      tenantStatus: company.tenantStatus || 'ACTIVE',
      planName: company.planName || 'WhatsApp SaaS Starter',
      monthlyMessageLimit: company.monthlyMessageLimit || 10000,
      maxEmployees: company.maxEmployees || 5,
      allowedModules: modules,
    });
    setShowEditModal(true);
  };

  const toggleEditModule = (mod: string) => {
    if (mod === 'whatsapp') return;
    setEditForm((prev) => ({
      ...prev,
      allowedModules: prev.allowedModules.includes(mod)
        ? prev.allowedModules.filter((m) => m !== mod)
        : [...prev.allowedModules, mod],
    }));
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchCompanyData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update company');
      }
    } catch (err) {
      console.error('Failed to update company:', err);
      alert('Network error while updating company');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDeleteCompany = async () => {
    setDeletingCompany(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setShowDeleteModal(false);
        router.push('/admin/companies');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete company');
      }
    } catch (err) {
      console.error('Failed to delete company:', err);
      alert('Network error while deleting company');
    } finally {
      setDeletingCompany(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading Company 360 Hub...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Company Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">The requested company record does not exist or has been removed.</p>
        <Link href="/admin/companies" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">
          Back to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/companies"
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {company.name}
              </h1>
              {company.isTenant && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  WhatsApp SaaS
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                  company.tenantStatus === 'ACTIVE'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 border-rose-200'
                }`}
              >
                {company.tenantStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Plan: <span className="font-semibold text-slate-700 dark:text-slate-300">{company.planName}</span> • Created {new Date(company.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Edit Company</span>
          </button>

          {company.tenantStatus === 'ACTIVE' ? (
            <button
              onClick={() => handleToggleStatus('SUSPENDED')}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 transition cursor-pointer"
            >
              Suspend Account
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus('ACTIVE')}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm cursor-pointer"
            >
              Activate Account
            </button>
          )}

          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-900/50 transition cursor-pointer"
            title="Delete Company"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <Link
            href={`/admin/whatsapp?tab=inbox&companyId=${company.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
          >
            <Send className="w-3.5 h-3.5" />
            Launch WhatsApp CRM ↗
          </Link>
        </div>
      </div>

      {/* 4-Card Telemetry Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Messages Quota */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Monthly Message Quota</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {telemetry?.messagesThisMonth.toLocaleString() || 0}
            </span>
            <span className="text-xs text-slate-400">/ {(telemetry?.monthlyLimit || 10000).toLocaleString()}</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (telemetry?.quotaUsedPercent || 0) > 85 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, telemetry?.quotaUsedPercent || 0)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {telemetry?.messagesToday || 0} messages dispatched today
          </p>
        </div>

        {/* Meta Connection */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Meta API Status</span>
            <Radio className={`w-4 h-4 ${connection ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${connection ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {connection?.displayName || (connection ? 'Meta Connected' : 'Not Connected')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono truncate">
            {connection?.businessPhoneNumber || 'No active phone attached'}
          </p>
        </div>

        {/* Team Members */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Team Staff Accounts</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {telemetry?.totalEmployees || 0}
            </span>
            <span className="text-xs text-slate-400">/ {telemetry?.maxEmployees || 5} allowed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {employees.filter((e) => e.companyRole === 'INBOX_ONLY').length} Inbox-Only Agents
          </p>
        </div>

        {/* Active Conversations */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Conversations</span>
            <Inbox className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {telemetry?.totalConversations || 0}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">({telemetry?.openConversations || 0} open)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {telemetry?.totalTemplates || 0} Templates • {telemetry?.totalCampaigns || 0} Campaigns
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Company Overview & 360', icon: Building2 },
          { id: 'meta', label: 'Meta API & Webhook Setup', icon: Key },
          { id: 'modules', label: 'CRM Module Entitlements', icon: Layers },
          { id: 'team', label: 'Team & Sub-Accounts', icon: Users },
          { id: 'messages', label: 'WhatsApp Activity Feed', icon: Send },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & 360 PROFILE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  Company Profile & Commercial Information
                </h3>
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Details</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Official Company Name</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{company.name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Primary Email Address</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{company.email || 'Not configured'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Phone Number</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{company.phone || 'Not configured'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Website URL</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {company.website ? (
                      <a href={company.website} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">
                        {company.website} ↗
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Industry / Domain</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{company.industry || 'Information Technology'}</p>
                </div>
                <div>
                  <span className="text-slate-400">GST Registration Number</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">{company.gstNumber || 'Not configured'}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400">Physical Address</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {[company.address, company.city, company.state, company.country, company.postalCode].filter(Boolean).join(', ') || 'Not provided'}
                  </p>
                </div>
                {company.notes && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Internal Operational Notes</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{company.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                CRM Entities Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs text-slate-600 dark:text-slate-300">Contacts</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{crmStats.contactsCount || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs text-slate-600 dark:text-slate-300">Active Deals</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{crmStats.dealsCount || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-xs text-slate-600 dark:text-slate-300">Converted Customers</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{crmStats.customersCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: META CLOUD API & WEBHOOK SETUP */}
      {activeTab === 'meta' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveMeta} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-500" />
                  Attach Meta Cloud API Credentials for {company.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Credentials configured here are strictly isolated to this company account. They will never collide with Platform Admin or other tenants.
                </p>
              </div>

              {metaFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
                    metaFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }`}
                >
                  {metaFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  )}
                  <span>{metaFeedback.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Meta Phone Number ID *
                  </label>
                  <input
                    type="text"
                    value={metaForm.phoneNumberId}
                    onChange={(e) => setMetaForm({ ...metaForm, phoneNumberId: e.target.value })}
                    placeholder="e.g. 109283746591029"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">From Meta App Dashboard → WhatsApp → API Setup</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    WhatsApp Business Account ID (WABA ID)
                  </label>
                  <input
                    type="text"
                    value={metaForm.wabaId}
                    onChange={(e) => setMetaForm({ ...metaForm, wabaId: e.target.value })}
                    placeholder="e.g. 1827200818434980"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Required to sync and submit HSM templates</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  System User Permanent Access Token *
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={metaForm.accessToken}
                    onChange={(e) => setMetaForm({ ...metaForm, accessToken: e.target.value })}
                    placeholder={connection ? '•••••••••••••••••••••••• (Leave blank to keep existing token)' : 'EAAG...'}
                    required={!connection}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Generate in Meta Business Settings → System Users with <code className="text-emerald-600 font-semibold">whatsapp_business_messaging</code> & <code className="text-emerald-600 font-semibold">whatsapp_business_management</code>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Webhook Verify Token
                  </label>
                  <input
                    type="text"
                    value={metaForm.verifyToken}
                    onChange={(e) => setMetaForm({ ...metaForm, verifyToken: e.target.value })}
                    placeholder="Enter verify token or use auto-generated"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Meta App Secret (Optional for HMAC signature check)
                  </label>
                  <input
                    type="password"
                    value={metaForm.appSecret}
                    onChange={(e) => setMetaForm({ ...metaForm, appSecret: e.target.value })}
                    placeholder="Meta App Secret"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestMeta}
                  disabled={testingMeta}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-2"
                >
                  {testingMeta && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Test Meta Connection
                </button>

                <button
                  type="submit"
                  disabled={savingMeta}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  {savingMeta && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save & Connect API
                </button>
              </div>
            </form>
          </div>

          {/* Webhook Instructions Card */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border border-emerald-800/40 text-white shadow-lg relative overflow-hidden">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
                <Webhook className="w-4 h-4" />
                Dedicated Tenant Webhook
              </div>
              <p className="text-xs text-slate-300 mb-4">
                In Meta Developers Console, configure this company's webhook callback URL and verify token:
              </p>

              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400">Callback URL:</span>
                  <div className="mt-1 flex items-center justify-between p-2.5 rounded-xl bg-black/50 border border-emerald-900/50 font-mono text-[11px] text-emerald-300 break-all">
                    <span>{company.webhookUrl}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(company.webhookUrl, 'webhookUrl')}
                      className="ml-2 p-1.5 hover:bg-emerald-900/50 rounded text-emerald-400 shrink-0"
                    >
                      {copiedField === 'webhookUrl' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400">Verify Token:</span>
                  <div className="mt-1 flex items-center justify-between p-2.5 rounded-xl bg-black/50 border border-emerald-900/50 font-mono text-[11px] text-emerald-300">
                    <span>{connection?.verifyToken || company.webhookSecret || 'techinpedia_verify_token_2026'}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(connection?.verifyToken || company.webhookSecret || 'techinpedia_verify_token_2026', 'verifyToken')}
                      className="ml-2 p-1.5 hover:bg-emerald-900/50 rounded text-emerald-400 shrink-0"
                    >
                      {copiedField === 'verifyToken' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-900/60 text-[11px] text-slate-300 space-y-1">
                <span className="font-semibold text-emerald-400">Subscribed Webhook Fields:</span>
                <p>✓ <code className="text-white">messages</code> (Inbound customer messages & media)</p>
                <p>✓ <code className="text-white">message_template_status_update</code> (Approval notifications)</p>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                WhatsApp Workspace for {company.name}
              </span>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/admin/whatsapp?tab=dashboard&companyId=${company.id}`}
                  className="px-4 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 text-xs font-bold flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-violet-600" />
                    Open Company WhatsApp Dashboard
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href={`/admin/whatsapp?tab=inbox&companyId=${company.id}`}
                  className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-emerald-600" />
                    Shared Team Inbox for {company.name}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Live WhatsApp Test Dispatch Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  Send Live Test Message for {company.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Verify that {company.name}&apos;s isolated Meta Cloud API credentials send messages properly.
                </p>
              </div>

              {testDispatchResult && (
                <div
                  className={`p-3 rounded-xl text-xs space-y-1 ${
                    testDispatchResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{testDispatchResult.success ? '✓ Delivered via Meta API!' : '✗ Dispatch Failed'}</span>
                    {testDispatchResult.sender && (
                      <span className="font-mono text-[10px] bg-white/70 dark:bg-slate-900/70 px-1.5 py-0.5 rounded">
                        From: {testDispatchResult.sender.displayName || testDispatchResult.sender.phone || company.name}
                      </span>
                    )}
                  </div>
                  {testDispatchResult.messageId && (
                    <div className="font-mono text-[10px] truncate text-slate-600 dark:text-slate-300">
                      Meta Msg ID: {testDispatchResult.messageId}
                    </div>
                  )}
                  {testDispatchResult.error && (
                    <div className="text-[11px] font-sans text-rose-700 dark:text-rose-300">
                      {testDispatchResult.error}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSendTestMessage} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Phone Number (with Country Code)
                  </label>
                  <input
                    type="text"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="+919818768680"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Message Content
                  </label>
                  <textarea
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    rows={2}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingTestMessage || !connection?.phoneNumberId}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingTestMessage ? `Sending from ${company.name}...` : `Send Test Message from ${company.name}`}
                </button>
                {!connection?.phoneNumberId && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center font-medium">
                    ⚠️ Configure and save Meta credentials on the left before sending test messages.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CRM MODULE ENTITLEMENTS */}
      {activeTab === 'modules' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              Configure CRM Permissions & Module Entitlements
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select which portal modules are activated for {company.name}. When employees of this company log in, they will only see and access the modules enabled here.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_MODULES.map((mod) => {
              const isSelected = selectedModules.includes(mod.id);
              const isLocked = mod.id === 'whatsapp';
              return (
                <div
                  key={mod.id}
                  onClick={() => !isLocked && handleToggleModule(mod.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  } ${isLocked ? 'cursor-default' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{mod.name}</span>
                        {isLocked && (
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                            Core Product
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{mod.desc}</p>
                    </div>

                    <div className="pt-0.5">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveModules}
              disabled={savingModules}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              {savingModules && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Save Module Entitlements
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: TEAM & SUB-ACCOUNTS */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  Team Accounts & Sub-Permissions ({employees.length} / {company.maxEmployees} Seats)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage login accounts for {company.name}. Distribute granular permissions (e.g. restrict an employee strictly to Shared Inbox).
                </p>
              </div>

              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Team Member
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Name & Email</th>
                    <th className="py-3 px-3">Company Role</th>
                    <th className="py-3 px-3">Effective Scope</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Created</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {employees.map((emp) => {
                    const isOwner = emp.companyRole === 'OWNER';
                    const isInboxOnly = emp.companyRole === 'INBOX_ONLY';
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900 dark:text-white">{emp.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{emp.email}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isOwner
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : isInboxOnly
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {emp.companyRole || 'STAFF'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {isInboxOnly ? (
                            <span className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                              <Lock className="w-3 h-3 text-blue-500" />
                              Restricted: Inbox View & Reply Only
                            </span>
                          ) : isOwner ? (
                            <span className="text-emerald-600 font-semibold text-[11px]">
                              Full Company Administrator
                            </span>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                              Manager (Inbox + Campaigns + Templates)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            {emp.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {new Date(emp.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {!isOwner && (
                            <button
                              onClick={() => handleDeleteEmployee(emp.id, emp.email)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Remove Employee"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WHATSAPP ACTIVITY FEED */}
      {activeTab === 'messages' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-500" />
              Live WhatsApp Telemetry & Recent Messages
            </h3>
            <Link
              href={`/admin/whatsapp?tab=inbox&companyId=${company.id}`}
              className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
            >
              Open Full Team Inbox ↗
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No recent WhatsApp messages recorded for this company.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {recentMessages.map((msg: any) => (
                <div key={msg.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        msg.direction === 'INBOUND'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {msg.direction}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-md">
                        {msg.textBody || `[${msg.type}]`}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {msg.conversation?.customerName || msg.conversation?.waNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    <p>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <span className="font-mono uppercase text-[10px] text-emerald-600">{msg.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Employee for {company.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Create user login credentials and assign CRM access tier.</p>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Email Address</label>
                <input
                  type="email"
                  required
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  placeholder="e.g. rahul@company.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={employeeForm.password}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                  placeholder="Create secure password"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Access Role & Sub-Permissions</label>
                <select
                  value={employeeForm.companyRole}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, companyRole: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="INBOX_ONLY">Inbox Agent (Only WhatsApp Shared Inbox - Restricted)</option>
                  <option value="AGENT">CRM Agent (Inbox + Contact Management)</option>
                  <option value="MANAGER">Sales Manager (Inbox + Campaigns + Templates + Deals)</option>
                  <option value="ADMIN">Company Administrator (Full Access to all allowed modules)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Inbox Agents cannot modify Meta API keys, delete templates, or launch marketing broadcasts.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingEmployee}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {addingEmployee && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Register Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Edit Company & Subscription</h3>
                  <p className="text-xs text-slate-400">Update company credentials, location, and SaaS settings</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCompany} className="space-y-4">
              {/* Tenant Enable Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <div>
                  <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block">
                    WhatsApp Multi-Tenant SaaS Workspace
                  </label>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                    Enable dedicated Meta Cloud API, isolated team inbox, and custom quotas
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.isTenant}
                  onChange={(e) => setEditForm({ ...editForm, isTenant: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Section 1: Basic Company Info */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 dark:text-white text-xs block pb-1 border-b border-slate-100 dark:border-slate-800">
                  Company Identity & Communication
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g. Acme Tech Solutions"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Industry</label>
                    <input
                      type="text"
                      value={editForm.industry}
                      onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                      placeholder="e.g. Information Technology"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Website URL</label>
                    <input
                      type="text"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="https://company.com"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Domain</label>
                    <input
                      type="text"
                      value={editForm.domain}
                      onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                      placeholder="company.com"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Official Phone</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Official Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="info@company.com"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Address & Tax Details */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white text-xs block pb-1 border-b border-slate-100 dark:border-slate-800">
                  Address & Tax Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Floor 4, Tower B, Business Park"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="Delhi NCR"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">State / Province</label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      placeholder="Delhi / Haryana"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Postal / ZIP Code</label>
                    <input
                      type="text"
                      value={editForm.postalCode}
                      onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                      placeholder="110001"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">GSTIN / Tax ID</label>
                    <input
                      type="text"
                      value={editForm.gstNumber}
                      onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                      placeholder="07AAAAA0000A1Z5"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Multi-Tenant WhatsApp SaaS Plan */}
              {editForm.isTenant && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                    SaaS Subscription, Plan & Quota Limits
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Account Status</label>
                      <select
                        value={editForm.tenantStatus}
                        onChange={(e) => setEditForm({ ...editForm, tenantStatus: e.target.value })}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="TRIAL">TRIAL</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Plan Name</label>
                      <input
                        type="text"
                        value={editForm.planName}
                        onChange={(e) => setEditForm({ ...editForm, planName: e.target.value })}
                        placeholder="WhatsApp Starter"
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Monthly Message Limit</label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        value={editForm.monthlyMessageLimit}
                        onChange={(e) => setEditForm({ ...editForm, monthlyMessageLimit: parseInt(e.target.value) || 10000 })}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Staff Seats Limit</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={editForm.maxEmployees}
                        onChange={(e) => setEditForm({ ...editForm, maxEmployees: parseInt(e.target.value) || 5 })}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Module Entitlements */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-2">
                      Allowed CRM & Communication Modules
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'whatsapp', name: 'WhatsApp Business CRM', locked: true },
                        { id: 'crm.leads', name: 'CRM Leads & Pipeline', locked: false },
                        { id: 'crm.deals', name: 'Sales Deals & Tracking', locked: false },
                        { id: 'crm.contacts', name: 'Contacts Directory', locked: false },
                        { id: 'sales.proposals', name: 'Quotations & Proposals', locked: false },
                        { id: 'support.tickets', name: 'Helpdesk & Support Tickets', locked: false },
                      ].map((mod) => (
                        <label
                          key={mod.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                            editForm.allowedModules.includes(mod.id)
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-semibold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={mod.locked}
                            checked={editForm.allowedModules.includes(mod.id)}
                            onChange={() => toggleEditModule(mod.id)}
                            className="rounded text-emerald-600"
                          />
                          <span>{mod.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Internal Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Billing terms, customer requirements, account history..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {savingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Delete Company</h3>
                <p className="text-xs text-slate-400">Irreversible operational action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Are you sure you want to permanently delete <span className="font-bold text-slate-900 dark:text-white">"{company.name}"</span>?
              {company.isTenant && (
                <span className="block mt-2 text-rose-600 dark:text-rose-400 font-medium">
                  ⚠️ This tenant account has isolated Meta Cloud API credentials, message templates, conversations, and staff logins that will be removed.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingCompany}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCompany}
                disabled={deletingCompany}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition disabled:opacity-50 cursor-pointer"
              >
                {deletingCompany ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
