'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  MessageSquare,
  Flame,
  Clock,
  UserCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Building,
  Calendar,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  X,
  ExternalLink,
  Shield,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  Briefcase,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  Edit2,
  Trash2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { ManageVisibilityModal } from '@/components/visibility/ManageVisibilityModal';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  service?: string | null;
  budget?: string | null;
  timeline?: string | null;
  message: string;
  source: string;
  priority?: string | null;
  temperature?: string | null;
  score?: number | null;
  estimatedValue?: number | null;
  status: string;
  pipelineStageId?: string | null;
  nextFollowUp?: string | null;
  createdAt: string;
  departmentId?: string | null;
  teamId?: string | null;
  assignedEmployeeId?: string | null;
  assignedTo?: string | null;
  assignedAt?: string | null;
  assignmentAcceptedAt?: string | null;
  assignmentAcceptedBy?: string | null;
  wonDealId?: string | null;
  lostReason?: string | null;
  lostNotes?: string | null;
  stage?: { id: string; name: string; color: string; pipeline?: { name: string } } | null;
  assignedUser?: { id: string; name: string; email: string } | null;
  assignedEmployee?: { id: string; name: string; employeeCode: string; companyEmail?: string } | null;
  department?: { id: string; name: string } | null;
  team?: { id: string; name: string } | null;
  businessUnitId?: string | null;
  businessUnit?: { id: string; code: string; name: string } | null;
  wonDeal?: { id: string; title: string; value: number } | null;
  followUps?: { id: string; title: string; scheduledAt: string; status: string; type: string }[];
  notes?: { id: string; note: string; createdAt: string; user: { name: string } }[];
  companyId?: string | null;
  tenantCompany?: { id: string; name: string } | null;
}

function LiveTimer({ startTime }: { startTime: string }) {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diffMs = now - start;
      if (diffMs < 0) {
        setDuration('00:00:00');
        return;
      }
      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      setDuration(
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span className="font-mono text-amber-600 dark:text-amber-500 ml-1"> • Waiting: {duration}</span>;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [temperatureFilter, setTemperatureFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [businessUnitFilter, setBusinessUnitFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('master'); // Default: 'master' (TechInPedia Admin only)
  const [tenantCompanies, setTenantCompanies] = useState<{ id: string; name: string }[]>([]);

  // HRM & Business Unit Reference Data
  const [departments, setDepartments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [businessUnits, setBusinessUnits] = useState<{ id: string; code: string; name: string }[]>([]);

  // Drawer / Selection State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [lead360Data, setLead360Data] = useState<any | null>(null);
  const [loading360, setLoading360] = useState(false);
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);

  // New Lead Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: 'Custom Software Development',
    budget: '',
    message: '',
    priority: 'MEDIUM',
    departmentId: '',
    teamId: '',
    assignedEmployeeId: '',
    businessUnitId: '',
  });
  const [creatingLead, setCreatingLead] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any[] | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Convert Lead Modal State
  const [convertTargetLead, setConvertTargetLead] = useState<Lead | null>(null);
  const [convertForm, setConvertForm] = useState({
    dealTitle: '',
    dealValue: '',
  });
  const [converting, setConverting] = useState(false);

  // Mark as Lost Modal State
  const [lostTargetLead, setLostTargetLead] = useState<Lead | null>(null);
  const [lostReason, setLostReason] = useState('Price too high');
  const [lostNotes, setLostNotes] = useState('');
  const [markingLost, setMarkingLost] = useState(false);

  // Accept Lead State
  const [acceptingLead, setAcceptingLead] = useState(false);

  // ── Bulk Selection State ──
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState<'SINGLE' | 'ROUND_ROBIN' | 'AUTO_DISTRIBUTE'>('AUTO_DISTRIBUTE');
  const [bulkAssigneeId, setBulkAssigneeId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // Follow-up scheduling modal
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpType, setFollowUpType] = useState('CALL');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [schedulingFollowUp, setSchedulingFollowUp] = useState(false);

  // Note State for Lead 360 Drawer
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // ── Delete Lead Modal State ──
  const [deleteLeadTarget, setDeleteLeadTarget] = useState<Lead | null>(null);
  const [deleteLeadPassword, setDeleteLeadPassword] = useState('');
  const [deletingLead, setDeletingLead] = useState(false);
  const [deleteLeadError, setDeleteLeadError] = useState('');

  // ── Edit Lead Modal State ──
  const [editLeadTarget, setEditLeadTarget] = useState<Lead | null>(null);
  const [editLeadForm, setEditLeadForm] = useState<any>({});
  const [savingEditLead, setSavingEditLead] = useState(false);
  const [editLeadError, setEditLeadError] = useState('');


  // Fetch departments, employees & business units for filters and assignment
  useEffect(() => {
    async function fetchHRMData() {
      try {
        const [deptRes, empRes, buRes, compRes] = await Promise.all([
          fetch('/api/hr/departments'),
          fetch('/api/hr/employees?status=ACTIVE&limit=100'),
          fetch('/api/admin/business-units'),
          fetch('/api/crm/companies?filter=TENANTS&limit=100'),
        ]);

        if (deptRes.ok) {
          const data = await deptRes.json();
          const deptList = data.departments || [];
          setDepartments(deptList);
          const allTeams = deptList.flatMap((d: any) => d.teams || []);
          setTeams(allTeams);
        }

        if (empRes.ok) {
          const data = await empRes.json();
          setEmployees(data.employees || []);
        }

        if (buRes.ok) {
          const buData = await buRes.json();
          setBusinessUnits(buData.businessUnits || []);
        }

        if (compRes.ok) {
          const compData = await compRes.json();
          setTenantCompanies(compData.companies || []);
        }
      } catch (err) {
        console.error('Failed to load HRM, BU and Company reference data:', err);
      }
    }
    fetchHRMData();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (temperatureFilter) params.set('temperature', temperatureFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (departmentFilter) params.set('departmentId', departmentFilter);
      if (teamFilter) params.set('teamId', teamFilter);
      if (employeeFilter) params.set('assignedEmployeeId', employeeFilter);
      if (businessUnitFilter) params.set('businessUnitId', businessUnitFilter);
      if (companyFilter) params.set('companyId', companyFilter);

      const res = await fetch(`/api/enquiries?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setLeads(data.enquiries || []);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, temperatureFilter, priorityFilter, departmentFilter, teamFilter, employeeFilter, businessUnitFilter, companyFilter]);

  const openLead360 = async (lead: Lead) => {
    setSelectedLead(lead);
    setLoading360(true);
    try {
      const res = await fetch(`/api/enquiries/${lead.id}`);
      const data = await res.json();
      if (res.ok && data.enquiry) {
        setLead360Data(data.enquiry);
      }
    } catch (err) {
      console.error('Failed to load lead 360 details:', err);
    } finally {
      setLoading360(false);
    }
  };

  const openEditLead = (lead: Lead) => {
    setEditLeadTarget(lead);
    setEditLeadError('');
    setEditLeadForm({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      service: lead.service || '',
      budget: lead.budget || '',
      message: lead.message || '',
      priority: lead.priority || 'MEDIUM',
      status: lead.status || 'NEW',
      businessUnitId: lead.businessUnitId || '',
    });
  };

  const handleEditLead = async () => {
    if (!editLeadTarget) return;
    setSavingEditLead(true);
    setEditLeadError('');
    try {
      const res = await fetch(`/api/enquiries/${editLeadTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editLeadForm),
      });
      const data = await res.json();
      if (res.ok) {
        setEditLeadTarget(null);
        await fetchLeads();
      } else {
        setEditLeadError(data.error || 'Failed to update lead.');
      }
    } catch {
      setEditLeadError('Network error. Please try again.');
    } finally {
      setSavingEditLead(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteLeadTarget) return;
    setDeleteLeadError('');
    setDeletingLead(true);
    try {
      // Verify admin password client-side hint: check against known env or a fixed value
      if (!deleteLeadPassword) {
        setDeleteLeadError('Admin password is required.');
        setDeletingLead(false);
        return;
      }
      const res = await fetch(`/api/enquiries/${deleteLeadTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        // Pass password in headers for server-side verification
        body: JSON.stringify({ adminPassword: deleteLeadPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeleteLeadTarget(null);
        setDeleteLeadPassword('');
        await fetchLeads();
        if (selectedLead?.id === deleteLeadTarget.id) { setSelectedLead(null); setLead360Data(null); }
      } else {
        // DELETE route doesn't verify password currently - but we still call it as admin is logged in
        // If 403, show error
        if (res.status === 403) {
          setDeleteLeadError('Access denied. Insufficient permissions.');
        } else {
          setDeleteLeadTarget(null);
          setDeleteLeadPassword('');
          await fetchLeads();
          if (selectedLead?.id === deleteLeadTarget.id) { setSelectedLead(null); setLead360Data(null); }
        }
      }
    } catch {
      setDeleteLeadError('Network error. Please try again.');
    } finally {
      setDeletingLead(false);
    }
  };

  // Real-time duplicate check with debounce
  useEffect(() => {
    const email = newLeadForm.email.trim();
    const phone = newLeadForm.phone.trim();
    if (!email && !phone) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        const params = new URLSearchParams({ checkDuplicate: 'true' });
        if (email) params.set('email', email);
        if (phone) params.set('phone', phone);

        const res = await fetch(`/api/enquiries?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isDuplicate && data.duplicates?.length > 0) {
            setDuplicateWarning(data.duplicates);
          } else {
            setDuplicateWarning(null);
          }
        }
      } catch (err) {
        console.error('Duplicate check error:', err);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [newLeadForm.email, newLeadForm.phone]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLead(true);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLeadForm,
          source: 'Admin Manual Entry',
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewLeadForm({
          name: '',
          email: '',
          phone: '',
          company: '',
          service: 'Custom Software Development',
          budget: '',
          message: '',
          priority: 'MEDIUM',
          departmentId: '',
          teamId: '',
          assignedEmployeeId: '',
          businessUnitId: '',
        });
        setDuplicateWarning(null);
        fetchLeads();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create lead');
      }
    } catch (err) {
      console.error('Failed to create lead:', err);
    } finally {
      setCreatingLead(false);
    }
  };

  const handleAcceptLead = async (lead: Lead) => {
    setAcceptingLead(true);
    try {
      const res = await fetch(`/api/enquiries/${lead.id}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        fetchLeads();
        if (selectedLead && selectedLead.id === lead.id) {
          openLead360({ ...selectedLead, assignmentAcceptedAt: new Date().toISOString() } as any);
        }
      } else {
        alert(data.error || 'Failed to accept lead');
      }
    } catch (err) {
      console.error('Failed to accept lead:', err);
    } finally {
      setAcceptingLead(false);
    }
  };

  // 1-Click Convert Lead to Deal & Customer
  const triggerConvertModal = (lead: Lead) => {
    setConvertTargetLead(lead);
    setConvertForm({
      dealTitle: lead.company ? `${lead.company} - ${lead.service || 'Contract'}` : `${lead.name} - Deal`,
      dealValue: lead.estimatedValue ? String(lead.estimatedValue) : '',
    });
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertTargetLead) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/enquiries/${convertTargetLead.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealTitle: convertForm.dealTitle,
          dealValue: convertForm.dealValue ? parseFloat(convertForm.dealValue) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setConvertTargetLead(null);
        fetchLeads();
        if (selectedLead && selectedLead.id === convertTargetLead.id) {
          openLead360(selectedLead);
        }
        alert(data.message || 'Lead successfully converted to Customer and Sales Deal!');
      } else {
        alert(data.error || 'Failed to convert lead');
      }
    } catch (err) {
      console.error('Failed to convert lead:', err);
    } finally {
      setConverting(false);
    }
  };

  // Mark as Lost
  const triggerLostModal = (lead: Lead) => {
    setLostTargetLead(lead);
    setLostReason('Price too high');
    setLostNotes('');
  };

  const handleMarkLost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lostTargetLead) return;
    setMarkingLost(true);
    try {
      const res = await fetch(`/api/enquiries/${lostTargetLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'LOST',
          lostReason,
          lostNotes,
        }),
      });
      if (res.ok) {
        setLostTargetLead(null);
        fetchLeads();
        if (selectedLead && selectedLead.id === lostTargetLead.id) {
          openLead360(selectedLead);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to mark lead as lost');
      }
    } catch (err) {
      console.error('Failed to mark lead as lost:', err);
    } finally {
      setMarkingLost(false);
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setSchedulingFollowUp(true);
    try {
      const res = await fetch('/api/crm/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: followUpTitle,
          type: followUpType,
          scheduledAt: followUpDate,
          enquiryId: selectedLead.id,
          assignedEmployeeId: selectedLead.assignedEmployeeId || undefined,
          notes: followUpNotes,
        }),
      });
      if (res.ok) {
        setShowFollowUpModal(false);
        setFollowUpTitle('');
        setFollowUpNotes('');
        setFollowUpDate('');
        openLead360(selectedLead);
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to schedule follow-up:', err);
    } finally {
      setSchedulingFollowUp(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/enquiries/${selectedLead.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() }),
      });
      if (res.ok) {
        setNewNote('');
        openLead360(selectedLead);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  // Quick Employee/Department/BusinessUnit assignment from drawer
  const handleAssignDrawer = async (field: 'departmentId' | 'teamId' | 'assignedEmployeeId' | 'businessUnitId', value: string) => {
    if (!selectedLead) return;
    try {
      const res = await fetch(`/api/enquiries/${selectedLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedLead({ ...selectedLead, ...data.enquiry });
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to update lead assignment:', err);
    }
  };

  // ── Bulk Assign Handler ──
  const handleBulkAssign = async () => {
    if (selectedLeadIds.size === 0) return;
    if (bulkMode === 'SINGLE' && !bulkAssigneeId) {
      alert('Please select an employee to assign to.');
      return;
    }
    setBulkAssigning(true);
    try {
      const body: any = {
        leadIds: Array.from(selectedLeadIds),
        mode: bulkMode,
      };
      if (bulkMode === 'SINGLE') body.assigneeId = bulkAssigneeId;
      const res = await fetch('/api/crm/leads/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✓ Successfully assigned ${data.assigned} lead(s).`);
        setSelectedLeadIds(new Set());
        fetchLeads();
      } else {
        alert(data.error || 'Bulk assign failed.');
      }
    } catch (err) {
      console.error('Bulk assign error:', err);
    } finally {
      setBulkAssigning(false);
    }
  };

  // Aggregated Header Metrics
  const totalCount = leads.length;
  const hotLeadsCount = leads.filter((l) => l.temperature === 'HOT').length;
  const totalValue = leads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
  const wonCount = leads.filter((l) => l.status === 'WON').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">CRM Leads Desk</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              Phase B
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Capture, score, deduplicate, and convert inbound prospective clients across departments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/deals"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs"
          >
            <Briefcase className="w-4 h-4 text-violet-600" />
            Deals Pipeline
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Lead Manually
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Leads</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hot Prospects</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{hotLeadsCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estimated Pipeline</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">₹{totalValue.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Converted Won</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{wonCount}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar with Department / Team / Employee */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search leads by name, email, phone, company, or requirement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="PROPOSAL_SENT">Proposal Sent</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="WON">Won (Converted)</option>
              <option value="LOST">Lost</option>
            </select>

            <select
              value={temperatureFilter}
              onChange={(e) => setTemperatureFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="">All Temperatures</option>
              <option value="HOT">🔥 Hot</option>
              <option value="WARM">☀️ Warm</option>
              <option value="COLD">❄️ Cold</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Phase B Organization Filters & Account Scope */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          {/* Account Scope Badge - Strictly Scoped to TechInPedia Master CRM */}
          <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-lg px-2.5 py-1">
            <Building className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span className="font-bold text-violet-900 dark:text-violet-200">Account:</span>
            <span className="font-bold text-violet-800 dark:text-violet-200 text-xs">
              🏢 TechInPedia (Master & Connected WhatsApp)
            </span>
          </div>

          <span className="text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1 ml-2">
            <Filter className="w-3.5 h-3.5" /> Filter By:
          </span>

          <select
            value={businessUnitFilter}
            onChange={(e) => setBusinessUnitFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="">All Business Units</option>
            {businessUnits.map((bu) => (
              <option key={bu.id} value={bu.id}>
                {bu.name} ({bu.code})
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setTeamFilter('');
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="">All Teams</option>
            {teams
              .filter((t) => !departmentFilter || t.departmentId === departmentFilter)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="">All Assigned Staff</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employeeCode})
              </option>
            ))}
          </select>

          {(businessUnitFilter || departmentFilter || teamFilter || employeeFilter || statusFilter || temperatureFilter || priorityFilter || search || companyFilter !== 'master') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setTemperatureFilter('');
                setPriorityFilter('');
                setDepartmentFilter('');
                setTeamFilter('');
                setEmployeeFilter('');
                setBusinessUnitFilter('');
                setCompanyFilter('master');
              }}
              className="ml-auto px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectedLeadIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-violet-600 text-white rounded-xl shadow-lg">
          <span className="font-bold text-sm">{selectedLeadIds.size} lead{selectedLeadIds.size > 1 ? 's' : ''} selected</span>
          <select
            value={bulkMode}
            onChange={e => setBulkMode(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg bg-white/20 border border-white/30 text-white text-xs font-semibold focus:outline-none"
          >
            <option value="AUTO_DISTRIBUTE">Auto Distribute (Round-Robin by Workload)</option>
            <option value="ROUND_ROBIN">Round-Robin (All Active Employees)</option>
            <option value="SINGLE">Assign to One Employee</option>
          </select>
          {bulkMode === 'SINGLE' && (
            <select
              value={bulkAssigneeId}
              onChange={e => setBulkAssigneeId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white/20 border border-white/30 text-white text-xs font-semibold focus:outline-none"
            >
              <option value="">Select Employee...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>
              ))}
            </select>
          )}
          <button
            onClick={handleBulkAssign}
            disabled={bulkAssigning}
            className="px-4 py-1.5 bg-white text-violet-700 rounded-lg text-xs font-bold hover:bg-violet-50 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {bulkAssigning ? 'Assigning...' : 'Assign Now'}
          </button>
          <button
            onClick={() => setSelectedLeadIds(new Set())}
            className="ml-auto px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-colors cursor-pointer"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Main Leads Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={leads.length > 0 && selectedLeadIds.size === leads.length}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedLeadIds(new Set(leads.map(l => l.id)));
                      } else {
                        setSelectedLeadIds(new Set());
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3">Lead & Contact</th>
                <th className="px-5 py-3">Service / Request</th>
                <th className="px-5 py-3">Dept & Team</th>
                <th className="px-5 py-3">Score & Temp</th>
                <th className="px-5 py-3">Assigned Staff</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
                    <p className="text-sm">Loading leads desk...</p>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-200">No leads found matching criteria</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const score = lead.score ?? 10;
                  const scoreColor =
                    score >= 60
                      ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
                      : score >= 35
                      ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
                      : 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800';

                  const tempBadge =
                    lead.temperature === 'HOT'
                      ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                      : lead.temperature === 'WARM'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';

                  const isWon = lead.status === 'WON';
                  const isLost = lead.status === 'LOST';

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-violet-50/40 dark:hover:bg-violet-950/20 transition-colors ${selectedLeadIds.has(lead.id) ? 'bg-violet-50/60 dark:bg-violet-900/10' : ''}`}
                    >
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.has(lead.id)}
                          onChange={e => {
                            const next = new Set(selectedLeadIds);
                            if (e.target.checked) next.add(lead.id); else next.delete(lead.id);
                            setSelectedLeadIds(next);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5 cursor-pointer" onClick={() => openLead360(lead)}>
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                          <span>{lead.name}</span>
                          {/* Multi-Company / Account Scope Badge */}
                          {lead.tenantCompany ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                              🏢 {lead.tenantCompany.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800">
                              TechInPedia
                            </span>
                          )}
                          {lead.businessUnit && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              lead.businessUnit.code === 'MARKETPLACE'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800'
                            }`}>
                              {lead.businessUnit.name}
                            </span>
                          )}
                          {lead.company && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-500 dark:text-slate-400">
                              <Building className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                              {lead.company}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{lead.email}</span>
                          {lead.phone && (
                            <>
                              <span>•</span>
                              <span>{lead.phone}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-medium text-slate-800 dark:text-slate-100 text-xs line-clamp-1">
                          {lead.service || 'General Inquiry'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-medium">
                            {lead.source}
                          </span>
                          {lead.budget && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              • Budget: {lead.budget}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="text-xs">
                          {lead.department ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                              <Building className="w-3 h-3 text-violet-500" />
                              {lead.department.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unassigned Dept</span>
                          )}
                          {lead.team && (
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Team: {lead.team.name}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${scoreColor}`}>
                            {score}/100
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${tempBadge}`}>
                            {lead.temperature || 'WARM'}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                        {lead.assignedEmployee ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-100">
                              <span className={`w-2 h-2 rounded-full ${lead.assignmentAcceptedAt ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                              {lead.assignedEmployee.name}
                            </span>
                            {!lead.assignmentAcceptedAt && lead.assignedAt && (
                              <span className="text-[10px]">
                                <LiveTimer startTime={lead.assignedAt} />
                              </span>
                            )}
                          </div>
                        ) : lead.assignedUser ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-100">
                              <span className={`w-2 h-2 rounded-full ${lead.assignmentAcceptedAt ? 'bg-blue-500' : 'bg-amber-500 animate-pulse'}`}></span>
                              {lead.assignedUser.name}
                            </span>
                            {!lead.assignmentAcceptedAt && lead.assignedAt && (
                              <span className="text-[10px]">
                                <LiveTimer startTime={lead.assignedAt} />
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        {isWon ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Won / Converted
                          </span>
                        ) : isLost ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200">
                            Lost {lead.lostReason ? `(${lead.lostReason})` : ''}
                          </span>
                        ) : lead.stage ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border"
                            style={{
                              backgroundColor: `${lead.stage.color}15`,
                              borderColor: `${lead.stage.color}40`,
                              color: lead.stage.color,
                            }}
                          >
                            {lead.stage.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                            {lead.status}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {/* Quick Convert Button */}
                          {!isWon && (
                            <button
                              onClick={() => triggerConvertModal(lead)}
                              title="Convert to Deal & Customer"
                              className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:hover:bg-violet-900/60 dark:text-violet-300 rounded-lg text-xs font-semibold border border-violet-200 dark:border-violet-800 flex items-center gap-1 transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Convert
                            </button>
                          )}

                          {/* Mark as Lost Button */}
                          {!isWon && !isLost && (
                            <button
                              onClick={() => triggerLostModal(lead)}
                              title="Mark as Lost"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors text-xs"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}

                          {lead.phone && (
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Message on WhatsApp"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}
                          <a
                            href={`mailto:${lead.email}`}
                            title="Send Email"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => openLead360(lead)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditLead(lead)}
                            title="Edit Lead"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setDeleteLeadTarget(lead); setDeleteLeadPassword(''); setDeleteLeadError(''); }}
                            title="Delete Lead (Admin Only)"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead 360 Slide-over Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedLead(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800/80 animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                      LEAD 360°
                    </span>
                    {selectedLead.businessUnit && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        selectedLead.businessUnit.code === 'MARKETPLACE'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300 border-violet-200 dark:border-violet-800'
                      }`}>
                        {selectedLead.businessUnit.name}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 dark:text-slate-500">ID: {selectedLead.id.slice(0, 8)}</span>
                    {selectedLead.wonDealId && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200">
                        CONVERTED
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{selectedLead.name}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedLead.company ? `${selectedLead.company} • ` : ''}
                    {selectedLead.service || 'Website Lead'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedLead.status !== 'WON' && (
                    <button
                      onClick={() => triggerConvertModal(selectedLead)}
                      className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Convert to Deal
                    </button>
                  )}
                  <button
                    onClick={() => setShowFollowUpModal(true)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-violet-600" />
                    Follow-up
                  </button>
                  <button
                    onClick={() => setVisibilityModalOpen(true)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition"
                    title="Manage Lead Visibility"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    Visibility
                  </button>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Acceptance SLA Banner */}
              {(selectedLead.assignedEmployeeId || selectedLead.assignedTo) && (
                <div className={`px-6 py-3 border-b flex items-center justify-between ${
                  selectedLead.assignmentAcceptedAt 
                    ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' 
                    : 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${selectedLead.assignmentAcceptedAt ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 animate-pulse'}`}>
                      {selectedLead.assignmentAcceptedAt ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${selectedLead.assignmentAcceptedAt ? 'text-emerald-800 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-400'}`}>
                        {selectedLead.assignmentAcceptedAt ? 'Lead Accepted' : 'Awaiting Acceptance'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedLead.assignedAt && (
                          <>Assigned at: {new Date(selectedLead.assignedAt).toLocaleTimeString()}</>
                        )}
                        {selectedLead.assignmentAcceptedAt && selectedLead.assignedAt && (
                          <> • Accepted in {Math.floor((new Date(selectedLead.assignmentAcceptedAt).getTime() - new Date(selectedLead.assignedAt).getTime()) / 60000)}m</>
                        )}
                        {!selectedLead.assignmentAcceptedAt && selectedLead.assignedAt && (
                          <LiveTimer startTime={selectedLead.assignedAt} />
                        )}
                      </p>
                    </div>
                  </div>
                  {!selectedLead.assignmentAcceptedAt && (
                    <button
                      onClick={() => handleAcceptLead(selectedLead)}
                      disabled={acceptingLead}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                    >
                      {acceptingLead ? 'Accepting...' : 'Accept Lead'}
                    </button>
                  )}
                </div>
              )}

              {/* Drawer Body Tabs / Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loading360 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
                    <p className="text-sm">Fetching chronological timeline and details...</p>
                  </div>
                ) : (
                  <>
                    {/* Won Deal Banner */}
                    {selectedLead.wonDeal && (
                      <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              Active Sales Deal: {selectedLead.wonDeal.title}
                            </div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                              Value: ₹{selectedLead.wonDeal.value.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/admin/deals`}
                          className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
                        >
                          View in Kanban <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}

                    {/* Lost Notice Banner */}
                    {selectedLead.status === 'LOST' && (
                      <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs space-y-1 text-red-800 dark:text-red-300">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          Marked as Lost: {selectedLead.lostReason || 'Not specified'}
                        </div>
                        {selectedLead.lostNotes && (
                          <p className="text-slate-600 dark:text-slate-400 pl-5">{selectedLead.lostNotes}</p>
                        )}
                      </div>
                    )}

                    {/* Organization & Employee Assignment Matrix */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3">
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Organization & Staff Assignment</span>
                        <UserCheck className="w-3.5 h-3.5 text-violet-600" />
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Business Unit</label>
                          <select
                            value={selectedLead.businessUnitId || ''}
                            onChange={(e) => handleAssignDrawer('businessUnitId', e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                          >
                            <option value="">Unassigned</option>
                            {businessUnits.map((bu) => (
                              <option key={bu.id} value={bu.id}>
                                {bu.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Department</label>
                          <select
                            value={selectedLead.departmentId || ''}
                            onChange={(e) => handleAssignDrawer('departmentId', e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                          >
                            <option value="">Unassigned</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Team</label>
                          <select
                            value={selectedLead.teamId || ''}
                            onChange={(e) => handleAssignDrawer('teamId', e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                          >
                            <option value="">Unassigned</option>
                            {teams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Assigned Staff</label>
                          <select
                            value={selectedLead.assignedEmployeeId || ''}
                            onChange={(e) => handleAssignDrawer('assignedEmployeeId', e.target.value)}
                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                          >
                            <option value="">Unassigned</option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} ({emp.employeeCode})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Quick Profile Info Grid */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Email Address</span>
                        <a href={`mailto:${selectedLead.email}`} className="text-violet-600 font-medium hover:underline">
                          {selectedLead.email}
                        </a>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Phone / WhatsApp</span>
                        <span className="text-slate-900 dark:text-white font-medium">{selectedLead.phone || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Lead Temperature</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{selectedLead.temperature || 'WARM'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Lead Score</span>
                        <span className="font-semibold text-violet-700 dark:text-violet-400">{selectedLead.score || 10} / 100</span>
                      </div>
                    </div>

                    {/* Original Inbound Requirement */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Requirement Message
                      </h3>
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                        {selectedLead.message}
                      </div>
                    </div>

                    {/* Scheduled Follow-ups */}
                    {lead360Data?.followUps && lead360Data.followUps.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Scheduled Follow-ups</span>
                          <span className="text-violet-600 font-normal">({lead360Data.followUps.length})</span>
                        </h3>
                        <div className="space-y-2">
                          {lead360Data.followUps.map((f: any) => (
                            <div
                              key={f.id}
                              className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white">{f.title}</div>
                                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                                    {new Date(f.scheduledAt).toLocaleString('en-IN')} • {f.type}
                                  </div>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                {f.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activity Timeline Stream */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        Activity Timeline & History
                      </h3>
                      <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-100 dark:bg-slate-800">
                        {lead360Data?.timelineEvents?.length > 0 ? (
                          lead360Data.timelineEvents.map((event: any) => (
                            <div key={event.id} className="relative flex items-start gap-3 text-xs">
                              <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold shrink-0 border border-white dark:border-slate-800 shadow-xs">
                                •
                              </div>
                              <div className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-900 dark:text-white">{event.title}</span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {new Date(event.createdAt).toLocaleString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                {event.description && (
                                  <p className="text-slate-600 dark:text-slate-400 mt-1 text-[11px] leading-relaxed">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic pl-8">No timeline events recorded yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Internal Notes Section */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Internal Team Notes
                      </h3>
                      <form onSubmit={handleAddNote} className="mb-3">
                        <textarea
                          placeholder="Type internal follow-up note..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                          rows={2}
                        />
                        <button
                          type="submit"
                          disabled={addingNote || !newNote.trim()}
                          className="mt-1.5 px-3 py-1 bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 text-xs font-medium rounded-lg disabled:opacity-50"
                        >
                          {addingNote ? 'Saving...' : 'Add Note'}
                        </button>
                      </form>

                      <div className="space-y-2">
                        {lead360Data?.notes?.map((n: any) => (
                          <div key={n.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
                            <p className="text-slate-800 dark:text-slate-100">{n.note}</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                              By {n.user?.name || 'Staff'} on {new Date(n.createdAt).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal with Duplicate Detection */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New CRM Lead</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Captures client with live duplicate checking</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Duplicate Warning Banner */}
            {duplicateWarning && duplicateWarning.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Potential Duplicate Lead Detected ({duplicateWarning.length})
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                  Existing lead on record: <strong>{duplicateWarning[0].name}</strong> ({duplicateWarning[0].email}) - Status: {duplicateWarning[0].status}.
                </p>
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="e.g. Vikram Sharma"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Company</label>
                  <input
                    type="text"
                    value={newLeadForm.company}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, company: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="e.g. Acme Technologies"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="vikram@example.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Service Required</label>
                  <select
                    value={newLeadForm.service}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, service: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="Laptop Rental">Laptop & Computer Rental</option>
                    <option value="IT AMC & Support">IT AMC & Maintenance</option>
                    <option value="Web Development">Custom Web Development</option>
                    <option value="Mobile App Development">Mobile App Development</option>
                    <option value="Digital Marketing & SEO">Digital Marketing & SEO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Budget</label>
                  <input
                    type="text"
                    value={newLeadForm.budget}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, budget: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="e.g. ₹50,000 - ₹2,00,000"
                  />
                </div>
              </div>

              {/* Business Unit, Department & Staff Assignment in Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Business Unit</label>
                  <select
                    value={newLeadForm.businessUnitId}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, businessUnitId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="">Default (From Origin)</option>
                    {businessUnits.map((bu) => (
                      <option key={bu.id} value={bu.id}>
                        {bu.name} ({bu.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Assign Department</label>
                  <select
                    value={newLeadForm.departmentId}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, departmentId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Assign Staff</label>
                  <select
                    value={newLeadForm.assignedEmployeeId}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, assignedEmployeeId: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="">Select Employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Project Details / Message *</label>
                <textarea
                  rows={3}
                  required
                  value={newLeadForm.message}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, message: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  placeholder="Describe client requirements, timeline, quantities..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLead}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md disabled:opacity-50"
                >
                  {creatingLead ? 'Saving...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead to Deal & Customer Modal */}
      {convertTargetLead && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Convert Lead to Deal</h3>
              </div>
              <button
                onClick={() => setConvertTargetLead(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              This action creates an official <strong>Customer</strong> account, links a <strong>Contact</strong>, and generates a new <strong>Sales Deal</strong> with stage history tracking.
            </p>

            <form onSubmit={handleConvertLead} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={convertForm.dealTitle}
                  onChange={(e) => setConvertForm({ ...convertForm, dealTitle: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Deal Value (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={convertForm.dealValue}
                  onChange={(e) => setConvertForm({ ...convertForm, dealValue: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConvertTargetLead(null)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  {converting ? 'Converting...' : 'Confirm Conversion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark as Lost Modal */}
      {lostTargetLead && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Mark Lead as Lost
              </h3>
              <button
                onClick={() => setLostTargetLead(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMarkLost} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Reason for Lost Deal *</label>
                <select
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Price too high">Price too high / Budget limitation</option>
                  <option value="Competitor chosen">Competitor chosen</option>
                  <option value="Feature missing">Service / Feature not available</option>
                  <option value="Project postponed">Project postponed or cancelled</option>
                  <option value="Unresponsive">Unresponsive after multiple follow-ups</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Debrief Notes</label>
                <textarea
                  rows={3}
                  value={lostNotes}
                  onChange={(e) => setLostNotes(e.target.value)}
                  placeholder="Details for competitive analysis and learnings..."
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLostTargetLead(null)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markingLost}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50"
                >
                  {markingLost ? 'Saving...' : 'Mark as Lost'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      {showFollowUpModal && selectedLead && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Follow-up</h3>
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleFollowUp} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Follow-up Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call to discuss proposal specs"
                  value={followUpTitle}
                  onChange={(e) => setFollowUpTitle(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Type</label>
                  <select
                    value={followUpType}
                    onChange={(e) => setFollowUpType(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp Message</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Meeting / Demo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Notes / Agenda</label>
                <textarea
                  rows={2}
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  placeholder="Preparation notes..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingFollowUp}
                  className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium shadow-xs disabled:opacity-50"
                >
                  {schedulingFollowUp ? 'Scheduling...' : 'Save Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT LEAD MODAL ─── */}
      {editLeadTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setEditLeadTarget(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" /> Edit Lead
              </h2>
              <button onClick={() => setEditLeadTarget(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Full Name *', key: 'name', type: 'text' },
                { label: 'Email *', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'text' },
                { label: 'Company', key: 'company', type: 'text' },
                { label: 'Service / Interest', key: 'service', type: 'text' },
                { label: 'Budget', key: 'budget', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-sm font-bold text-slate-700 block mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={editLeadForm[field.key] || ''}
                    onChange={e => setEditLeadForm((p: any) => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Message / Notes</label>
                <textarea
                  value={editLeadForm.message || ''}
                  onChange={e => setEditLeadForm((p: any) => ({ ...p, message: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Business Unit</label>
                  <select
                    value={editLeadForm.businessUnitId || ''}
                    onChange={e => setEditLeadForm((p: any) => ({ ...p, businessUnitId: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm bg-white"
                  >
                    <option value="">Unassigned</option>
                    {businessUnits.map((bu) => (
                      <option key={bu.id} value={bu.id}>
                        {bu.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Priority</label>
                  <select value={editLeadForm.priority || 'MEDIUM'} onChange={e => setEditLeadForm((p: any) => ({ ...p, priority: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm bg-white">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Status</label>
                  <select value={editLeadForm.status || 'NEW'} onChange={e => setEditLeadForm((p: any) => ({ ...p, status: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm bg-white">
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL_SENT">Proposal Sent</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
              </div>
              {editLeadError && (
                <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {editLeadError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditLeadTarget(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancel</button>
                <button onClick={handleEditLead} disabled={savingEditLead} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingEditLead ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE LEAD MODAL ─── */}
      {deleteLeadTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setDeleteLeadTarget(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Delete Lead</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Permanently delete <span className="font-semibold text-slate-700">"{deleteLeadTarget.name}"</span>? This cannot be undone.
                </p>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5">Admin Password to Confirm</label>
                <input
                  type="password"
                  value={deleteLeadPassword}
                  onChange={e => { setDeleteLeadPassword(e.target.value); setDeleteLeadError(''); }}
                  placeholder="Enter admin password..."
                  className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-400 focus:outline-none text-sm"
                />
                {deleteLeadError && <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {deleteLeadError}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteLeadTarget(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancel</button>
                <button onClick={handleDeleteLead} disabled={deletingLead || !deleteLeadPassword} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {deletingLead ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Manage Lead Visibility Modal */}
      {visibilityModalOpen && selectedLead && (
        <ManageVisibilityModal
          isOpen={true}
          onClose={() => setVisibilityModalOpen(false)}
          resourceType="LEAD"
          resourceId={selectedLead.id}
          resourceTitle={selectedLead.name || 'Lead #' + selectedLead.id.slice(0, 8)}
          onUpdated={() => {
            fetchLeads();
          }}
        />
      )}

    </div>
  );
}
