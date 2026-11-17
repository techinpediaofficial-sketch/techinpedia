'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  ShieldCheck,
  Lock,
  Mail,
  Key,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit3,
  X,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  Sparkles,
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  companyRole: string;
  status: string;
  createdAt: string;
}

interface CompanyInfo {
  id: string;
  name: string;
  maxEmployees: number;
  planName: string;
  usedSeats: number;
}

export default function CompanyEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Employee Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    companyRole: 'AGENT', // ADMIN, MANAGER, AGENT, INBOX_ONLY
  });

  // Edit Role Modal State
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editRole, setEditRole] = useState('AGENT');
  const [editStatus, setEditStatus] = useState('ACTIVE');

  // Delete State
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Status Alerts
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const [empRes, rolesRes] = await Promise.all([
        fetch('/api/admin/company/employees'),
        fetch('/api/admin/company/roles'),
      ]);
      const data = await empRes.json();
      if (empRes.ok) {
        setEmployees(data.employees || []);
        if (data.company) setCompanyInfo(data.company);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to fetch employees' });
      }

      try {
        const rolesData = await rolesRes.json();
        if (rolesRes.ok && rolesData.roles) {
          setAvailableRoles(rolesData.roles);
        }
      } catch {}
    } catch (err: any) {
      console.error('Fetch employees error:', err);
      setFeedback({ type: 'error', message: 'Network error while loading team roster.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/company/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setAddForm({ name: '', email: '', password: '', companyRole: 'AGENT' });
        setFeedback({ type: 'success', message: data.message || 'Team member added successfully.' });
        fetchEmployees();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to add employee.' });
      }
    } catch (err: any) {
      console.error('Add employee error:', err);
      setFeedback({ type: 'error', message: 'Network error while adding employee.' });
    } finally {
      setAdding(false);
    }
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditRole(emp.companyRole || 'AGENT');
    setEditStatus(emp.status || 'ACTIVE');
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setSavingEdit(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/company/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingEmployee.id,
          companyRole: editRole,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        setEditingEmployee(null);
        setFeedback({ type: 'success', message: 'Employee permissions updated successfully.' });
        fetchEmployees();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update employee.' });
      }
    } catch (err: any) {
      console.error('Edit employee error:', err);
      setFeedback({ type: 'error', message: 'Network error while saving changes.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;
    setDeleting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/company/employees?userId=${deletingEmployee.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setShowDeleteModal(false);
        setDeletingEmployee(null);
        setFeedback({ type: 'success', message: data.message || 'Employee removed successfully.' });
        fetchEmployees();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to remove employee.' });
      }
    } catch (err: any) {
      console.error('Delete employee error:', err);
      setFeedback({ type: 'error', message: 'Network error while removing employee.' });
    } finally {
      setDeleting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = search.toLowerCase();
    return emp.name.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q) || (emp.companyRole || '').toLowerCase().includes(q);
  });

  const usedSeats = companyInfo?.usedSeats || employees.length;
  const maxSeats = companyInfo?.maxEmployees || 5;
  const seatPercent = Math.min(100, Math.round((usedSeats / maxSeats) * 100));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Company Employees & Team
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {usedSeats} / {maxSeats} Seats Used
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create employee logins, allocate seats, and configure granular role access for {companyInfo?.name || 'your company'}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/company/roles"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>View Roles Matrix</span>
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={usedSeats >= maxSeats}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Seats Usage Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Plan Seats Quota</h3>
                <span className="text-xs text-slate-400 font-mono">({usedSeats} of {maxSeats} allocated)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {maxSeats - usedSeats > 0
                  ? `You have ${maxSeats - usedSeats} free seat(s) remaining on your plan.`
                  : 'All allocated seats are currently in use. Upgrade plan to expand your team.'}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
              <span>Seats Utilized</span>
              <span>{seatPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  seatPercent >= 100 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${seatPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team member..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={fetchEmployees}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Refresh Roster"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Name & Login Email</th>
                <th className="py-3 px-3">Company Role</th>
                <th className="py-3 px-3">Permissions Scope</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Registered On</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No employees matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isOwner = emp.companyRole === 'OWNER';
                  const isAdmin = emp.companyRole === 'ADMIN';
                  const isManager = emp.companyRole === 'MANAGER';
                  const isWhatsApp = emp.companyRole === 'WHATSAPP_CAMPAIGNS';
                  const isLeads = emp.companyRole === 'LEADS_MANAGER';
                  const isInboxOnly = emp.companyRole === 'INBOX_ONLY';
                  const isViewer = emp.companyRole === 'VIEWER';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {emp.name}
                              {isOwner && (
                                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-800">
                                  Owner
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">{emp.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {(() => {
                          const matchedRole = availableRoles.find((r) => r.id === emp.companyRole);
                          if (matchedRole) {
                            return (
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${matchedRole.badgeColor}`}>
                                {matchedRole.name.toUpperCase()}
                              </span>
                            );
                          }
                          return (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isOwner
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : isAdmin
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : isManager
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                  : isWhatsApp
                                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                  : isLeads
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                                  : isViewer
                                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                                  : isInboxOnly
                                  ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {emp.companyRole || 'AGENT'}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="py-3 px-3">
                        {isOwner || isAdmin ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Full Administrator (All APIs & Settings)
                          </span>
                        ) : isManager ? (
                          <span className="text-indigo-600 dark:text-indigo-400 text-[11px]">
                            Operations Lead (Campaigns, CRM Leads & Team Roster)
                          </span>
                        ) : isWhatsApp ? (
                          <span className="text-teal-600 dark:text-teal-400 text-[11px] font-semibold">
                            WhatsApp Marketing (Broadcasts, HSM Templates & Chat)
                          </span>
                        ) : isLeads ? (
                          <span className="text-orange-600 dark:text-orange-400 text-[11px]">
                            CRM Executive (Leads, Deals, Pipelines & Contacts)
                          </span>
                        ) : isViewer ? (
                          <span className="text-cyan-600 dark:text-cyan-400 text-[11px]">
                            Read-Only Auditor (View Chats, Leads & Logs)
                          </span>
                        ) : isInboxOnly ? (
                          <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                            <Lock className="w-3 h-3 text-slate-400" /> Restricted: Shared Inbox Only
                          </span>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 text-[11px]">
                            Support & Sales Agent (Live Chats & Assigned Leads)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            emp.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {new Date(emp.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {!isOwner && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(emp)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Edit Role & Status"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingEmployee(emp);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Remove Employee"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
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

      {/* MODAL 1: ADD TEAM MEMBER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Company Team Member</h3>
                  <p className="text-[11px] text-slate-400">Seat {usedSeats + 1} of {maxSeats}</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Login Email Address *</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="e.g. rahul@company.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Initial Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Create secure login password"
                    className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Assigned Company Role *</label>
                <select
                  value={addForm.companyRole}
                  onChange={(e) => setAddForm({ ...addForm, companyRole: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {availableRoles.length > 0 ? (
                    availableRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.id})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="ADMIN">👑 Administrator (Full access: WhatsApp API, Campaigns, CRM, Billing, Team)</option>
                      <option value="MANAGER">💼 Operations Manager (WhatsApp campaigns, templates, broadcast launches, CRM leads)</option>
                      <option value="WHATSAPP_CAMPAIGNS">📱 WhatsApp Marketing Specialist (Marketing broadcasts, HSM templates, contact lists)</option>
                      <option value="AGENT">💬 Support & Sales Agent (Live 2-way WhatsApp inbox chat, assigned CRM leads)</option>
                      <option value="LEADS_MANAGER">🎯 CRM & Leads Executive (Manage incoming leads, deals, contacts, pipeline)</option>
                      <option value="INBOX_ONLY">🔒 Restricted Inbox-Only (Frontline live customer chats only)</option>
                      <option value="VIEWER">👁️ Read-Only Auditor (View WhatsApp conversations and logs; cannot send)</option>
                    </>
                  )}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  You can change an employee&apos;s role at any time from this table.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {adding && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register Employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EMPLOYEE ROLE */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Edit {editingEmployee.name}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Company Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {availableRoles.length > 0 ? (
                    availableRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.id})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="ADMIN">👑 Administrator (Full access: WhatsApp API, Campaigns, CRM, Billing, Team)</option>
                      <option value="MANAGER">💼 Operations Manager (WhatsApp campaigns, templates, broadcast launches, CRM leads)</option>
                      <option value="WHATSAPP_CAMPAIGNS">📱 WhatsApp Marketing Specialist (Marketing broadcasts, HSM templates, contact lists)</option>
                      <option value="AGENT">💬 Support & Sales Agent (Live 2-way WhatsApp inbox chat, assigned CRM leads)</option>
                      <option value="LEADS_MANAGER">🎯 CRM & Leads Executive (Manage incoming leads, deals, contacts, pipeline)</option>
                      <option value="INBOX_ONLY">🔒 Restricted Inbox-Only (Frontline live customer chats only)</option>
                      <option value="VIEWER">👁️ Read-Only Auditor (View WhatsApp conversations and logs; cannot send)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Can log in and access allowed modules)</option>
                  <option value="SUSPENDED">SUSPENDED (Access temporarily blocked)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE EMPLOYEE CONFIRMATION */}
      {showDeleteModal && deletingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Remove Employee?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
              Are you sure you want to remove <span className="font-bold text-slate-800 dark:text-slate-200">{deletingEmployee.name}</span> ({deletingEmployee.email})? This seat will be freed up for other team members.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Yes, Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
