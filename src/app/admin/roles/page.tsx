'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Search,
  Users,
  KeyRound,
  Plus,
  Save,
  Trash2,
  AlertCircle,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface RoleData {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  employeeCount: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface PermissionDef {
  code: string;
  name: string;
  category: string;
  description: string;
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDef[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [activePermissions, setActivePermissions] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Role Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load roles');

      setRoles(data.roles || []);
      setAllPermissions(data.allPermissions || []);

      // If no selected role, default to first or SUPER_ADMIN
      if (data.roles && data.roles.length > 0) {
        const defaultRole = data.roles.find((r: RoleData) => r.name === 'SUPER_ADMIN') || data.roles[0];
        setSelectedRoleId(defaultRole.id);
        setActivePermissions(new Set(defaultRole.permissions));
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  const handleSelectRole = (role: RoleData) => {
    setSelectedRoleId(role.id);
    setActivePermissions(new Set(role.permissions));
    setSaveSuccess(false);
    setErrorMsg(null);
  };

  const handleTogglePermission = (code: string) => {
    if (selectedRole?.name === 'SUPER_ADMIN') return; // Cannot alter Super Admin root

    setActivePermissions((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
    setSaveSuccess(false);
  };

  const handleToggleCategory = (categoryPermissions: PermissionDef[]) => {
    if (selectedRole?.name === 'SUPER_ADMIN') return;

    const allActive = categoryPermissions.every((p) => activePermissions.has(p.code));
    setActivePermissions((prev) => {
      const next = new Set(prev);
      categoryPermissions.forEach((p) => {
        if (allActive) {
          next.delete(p.code);
        } else {
          next.add(p.code);
        }
      });
      return next;
    });
    setSaveSuccess(false);
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      setSaveSuccess(false);

      const res = await fetch(`/api/admin/roles/${selectedRoleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: Array.from(activePermissions),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save permissions');

      // Update local state
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRoleId ? { ...r, permissions: Array.from(activePermissions) } : r
        )
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newDisplayName.trim()) return;

    try {
      setCreating(true);
      setErrorMsg(null);
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoleName,
          displayName: newDisplayName,
          description: newDescription,
          permissions: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create role');

      setIsModalOpen(false);
      setNewRoleName('');
      setNewDisplayName('');
      setNewDescription('');
      await fetchRoles();
      setSelectedRoleId(data.role.id);
      setActivePermissions(new Set());
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) return;

    try {
      setErrorMsg(null);
      const res = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete role');

      await fetchRoles();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Group permissions by category
  const categories = Array.from(new Set(allPermissions.map((p) => p.category)));

  const filteredCategories = categories.map((cat) => {
    const items = allPermissions.filter((p) => {
      const matchesCat = p.category === cat;
      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
    return { title: cat, items };
  }).filter((cat) => cat.items.length > 0);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
        <p className="text-sm font-medium">Loading database roles & permissions...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Roles & Permissions
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Database
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise RBAC governing API-level access, record visibility, and operational approvals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Role
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => {
          const isSelected = selectedRoleId === role.id;
          return (
            <div
              key={role.id}
              onClick={() => handleSelectRole(role)}
              className={`relative cursor-pointer p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {role.isSystem ? (
                      <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <KeyRound className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    )}
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {role.displayName}
                    </h3>
                  </div>
                  {role.isSystem && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      System
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                  {role.description || 'Custom company role.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {role.userCount + role.employeeCount} staff
                  </span>
                  <span>{role.permissions.length} perms</span>
                </div>
                {!role.isSystem && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRole(role.id, role.displayName);
                    }}
                    className="p-1 hover:text-rose-500 transition-colors"
                    title="Delete custom role"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix Header */}
      {selectedRole && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-850">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedRole.displayName} Permissions
                </h2>
                {selectedRole.name === 'SUPER_ADMIN' ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    Bypass All
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    ({activePermissions.size} of {allPermissions.length} enabled)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Role identifier: <code className="font-mono text-emerald-600 dark:text-emerald-400">{selectedRole.name}</code>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter permissions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-64"
                />
              </div>

              {selectedRole.name !== 'SUPER_ADMIN' && (
                <button
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : saveSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {saveSuccess ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>

          {/* Super Admin Notice */}
          {selectedRole.name === 'SUPER_ADMIN' && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xs">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span>
                Super Administrator is a cryptographically protected root role with permanent bypass to all modules, APIs, and data. Permissions cannot be modified.
              </span>
            </div>
          )}

          {/* Permissions Matrix */}
          <div className="p-6 space-y-8">
            {filteredCategories.map((category) => {
              const allCategoryActive = category.items.every((p) => activePermissions.has(p.code));
              const someCategoryActive = category.items.some((p) => activePermissions.has(p.code));

              return (
                <div key={category.title} className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {category.title}
                    </h3>
                    {selectedRole.name !== 'SUPER_ADMIN' && (
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(category.items)}
                        className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        {allCategoryActive ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {category.items.map((perm) => {
                      const isSuperAdmin = selectedRole.name === 'SUPER_ADMIN';
                      const isEnabled = isSuperAdmin || activePermissions.has(perm.code);

                      return (
                        <div
                          key={perm.code}
                          onClick={() => handleTogglePermission(perm.code)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            isSuperAdmin
                              ? 'cursor-default border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                              : 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700'
                          } ${
                            isEnabled
                              ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                                {perm.name}
                              </span>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                {perm.description}
                              </p>
                              <code className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                                {perm.code}
                              </code>
                            </div>
                            <div className="flex-shrink-0 pt-0.5">
                              {isEnabled ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-500" />
                Create New Role
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Lead, Support Tier 2"
                  value={newDisplayName}
                  onChange={(e) => {
                    setNewDisplayName(e.target.value);
                    if (!newRoleName) {
                      setNewRoleName(
                        e.target.value.toUpperCase().replace(/\s+/g, '_')
                      );
                    }
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role Code / Identifier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SALES_LEAD"
                  value={newRoleName}
                  onChange={(e) =>
                    setNewRoleName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))
                  }
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe responsibility and access scope..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
