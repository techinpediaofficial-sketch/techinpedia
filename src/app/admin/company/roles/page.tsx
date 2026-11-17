'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  Send,
  Building2,
  RefreshCw,
  AlertCircle,
  Check,
  Plus,
  Edit2,
  Trash2,
  X,
  Shield,
  CheckSquare,
  Square,
  HelpCircle,
} from 'lucide-react';

interface RoleDefinition {
  id: string;
  name: string;
  badgeColor: string;
  description: string;
  capabilities: string[];
  permissions?: string[];
  isSystem?: boolean;
  isCustom?: boolean;
}

interface PermissionItem {
  code: string;
  label: string;
}

interface PermissionCategory {
  category: string;
  items: PermissionItem[];
}

interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  core: boolean;
}

interface CompanyMeta {
  id: string;
  name: string;
  planName: string;
  maxEmployees: number;
}

const COLOR_PRESETS = [
  { label: 'Emerald', value: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  { label: 'Indigo', value: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
  { label: 'Teal', value: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' },
  { label: 'Blue', value: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  { label: 'Orange', value: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' },
  { label: 'Violet', value: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300' },
  { label: 'Rose', value: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
  { label: 'Cyan', value: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300' },
  { label: 'Slate', value: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
];

export default function CompanyRolesPage() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionCategory[]>([]);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [company, setCompany] = useState<CompanyMeta | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [formRoleId, setFormRoleId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBadgeColor, setFormBadgeColor] = useState(COLOR_PRESETS[0].value);
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [formCapabilities, setFormCapabilities] = useState<string[]>([]);
  const [newCapInput, setNewCapInput] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/company/roles');
      const data = await res.json();
      if (res.ok) {
        setRoles(data.roles || []);
        setAvailablePermissions(data.availablePermissions || []);
        setModules(data.modules || []);
        setCompany(data.company || null);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setFormRoleId('');
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormBadgeColor(COLOR_PRESETS[5].value); // Violet default for custom
    setFormPermissions(['whatsapp.view', 'whatsapp.inbox.view', 'whatsapp.send']);
    setFormCapabilities([
      'Access Shared Team Inbox for real-time customer chats',
      'Send and reply to WhatsApp messages within 24h window',
    ]);
    setNewCapInput('');
    setErrorMsg(null);
    setShowModal(true);
  };

  const openEditModal = (role: RoleDefinition) => {
    setModalMode('edit');
    setFormRoleId(role.id);
    setFormName(role.name);
    setFormCode(role.id);
    setFormDescription(role.description || '');
    setFormBadgeColor(role.badgeColor || COLOR_PRESETS[0].value);
    setFormPermissions(role.permissions || []);
    setFormCapabilities([...(role.capabilities || [])]);
    setNewCapInput('');
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleTogglePermission = (permCode: string) => {
    setFormPermissions((prev) =>
      prev.includes(permCode) ? prev.filter((p) => p !== permCode) : [...prev, permCode]
    );
  };

  const handleAddCapability = () => {
    if (!newCapInput.trim()) return;
    setFormCapabilities((prev) => [...prev, newCapInput.trim()]);
    setNewCapInput('');
  };

  const handleRemoveCapability = (index: number) => {
    setFormCapabilities((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('Role name is required.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/admin/company/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            code: formCode.trim() || undefined,
            description: formDescription.trim(),
            badgeColor: formBadgeColor,
            permissions: formPermissions,
            capabilities: formCapabilities,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create role');
        setRoles(data.roles);
        setSuccessMsg(data.message || 'Custom role created successfully!');
        setShowModal(false);
      } else {
        const res = await fetch('/api/admin/company/roles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roleId: formRoleId,
            name: formName.trim(),
            description: formDescription.trim(),
            badgeColor: formBadgeColor,
            permissions: formPermissions,
            capabilities: formCapabilities,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update role');
        setRoles(data.roles);
        setSuccessMsg(data.message || 'Role updated successfully!');
        setShowModal(false);
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete role "${roleName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(roleId);
    try {
      const res = await fetch(`/api/admin/company/roles?roleId=${encodeURIComponent(roleId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete role');
      setRoles(data.roles);
      setSuccessMsg(data.message || 'Role removed successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading Roles & Permissions Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Roles & Permissions Studio
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {company?.planName || 'Enterprise Tier'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, customize, and configure roles and granular capabilities for {company?.name || 'your company'}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Custom Role</span>
          </button>

          <Link
            href="/admin/company/employees"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs transition"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Members ↗</span>
          </Link>
        </div>
      </div>

      {/* Grid of Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition relative group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${role.badgeColor}`}>
                    {role.name}
                  </span>
                  {role.isCustom && (
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                      Custom
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(role)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Edit Role & Permissions"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {role.isCustom && (
                    <button
                      onClick={() => handleDeleteRole(role.id, role.name)}
                      disabled={deletingId === role.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete Custom Role"
                    >
                      {deletingId === role.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                Identifier: <strong className="text-slate-600 dark:text-slate-300">{role.id}</strong>
              </span>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                {role.description}
              </p>

              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Granted Capabilities:
                </p>
                {role.capabilities && role.capabilities.length > 0 ? (
                  role.capabilities.map((cap, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No specific capabilities listed.</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <Link
                href="/admin/company/employees"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Assign to team member</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                onClick={() => openEditModal(role)}
                className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Edit Permissions</span>
                <span>✏️</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Active Modules Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              SaaS Module Entitlements for {company?.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              These are the functional modules enabled on your current subscription plan.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            Plan: {company?.planName}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <div
              key={mod.id}
              className={`p-4 rounded-2xl border transition-all ${
                mod.enabled
                  ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50 dark:bg-slate-900/40'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{mod.name}</span>
                {mod.enabled ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Not In Plan
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{mod.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE & EDIT ROLE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {modalMode === 'create' ? 'Create New Custom Role' : `Edit Role: ${formName}`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure role identity, badge styling, permissions, and visible capabilities.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveRole} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Role Display Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (modalMode === 'create' && !formCode) {
                        setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]+/g, '_'));
                      }
                    }}
                    placeholder="e.g. Telecaller Specialist"
                    required
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Role Code / ID {modalMode === 'edit' && '(Permanent)'}
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                    disabled={modalMode === 'edit'}
                    placeholder="e.g. TELECALLER_SPECIALIST"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-violet-500/20 focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the primary responsibilities and scope of this role..."
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              {/* Badge Color Picker */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Badge Color Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.label}
                      type="button"
                      onClick={() => setFormBadgeColor(color.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${color.value} ${
                        formBadgeColor === color.value ? 'ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions Matrix Checklist */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-100">
                      Module Access & Permissions
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Select which capabilities this role is authorized to perform.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
                    {formPermissions.length} selected
                  </span>
                </div>

                <div className="space-y-4 max-h-56 overflow-y-auto p-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50">
                  {availablePermissions.map((group) => (
                    <div key={group.category} className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                        {group.category}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.items.map((perm) => {
                          const isChecked = formPermissions.includes(perm.code);
                          return (
                            <label
                              key={perm.code}
                              onClick={() => handleTogglePermission(perm.code)}
                              className={`flex items-start gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition ${
                                isChecked
                                  ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700 text-violet-900 dark:text-violet-100 font-semibold'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {isChecked ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </div>
                              <div className="leading-tight">
                                <span>{perm.label}</span>
                                <span className="block text-[9px] font-mono text-slate-400">{perm.code}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Granted Capabilities Bullet Points */}
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <label className="block font-bold text-slate-800 dark:text-slate-100">
                  Visible Capability Bullet Points
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Summary bullets displayed on the role card for team members.
                </p>

                <div className="space-y-1.5">
                  {formCapabilities.map((cap, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-xs text-slate-700 dark:text-slate-300">{cap}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCapability(idx)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newCapInput}
                    onChange={(e) => setNewCapInput(e.target.value)}
                    placeholder="Add a bullet point, e.g. 'Can access leads pipeline'..."
                    className="flex-1 p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCapability();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCapability}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalMode === 'create' ? 'Create Role' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

