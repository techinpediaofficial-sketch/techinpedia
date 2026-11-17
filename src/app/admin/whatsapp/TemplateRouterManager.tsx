'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  GitBranch,
  Sliders,
  Edit2,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  ExternalLink,
  Save,
  X,
  Check,
  Tag,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Info,
  Smartphone,
  BookOpen,
} from 'lucide-react';

interface TemplatePurpose {
  id: string;
  companyId: string;
  purposeKey: string;
  templateId: string;
  template?: any;
  isActive: boolean;
  configuration?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PackageConfig {
  id: string;
  companyId: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  servicesSummary?: string | null;
  freeService?: string | null;
  importantNote?: string | null;
  selectionKey: string;
  whatsappTemplateId: string;
  whatsappTemplate?: any;
  isActive: boolean;
  sortOrder: number;
  templateContentVersion?: string | null;
  packageContentVersion?: string | null;
  requiresMetaUpdate: boolean;
  currentCommercialHash?: string;
  createdAt: string;
  updatedAt: string;
}

interface ButtonAction {
  id: string;
  companyId: string;
  templateId: string;
  template?: any;
  buttonIndex: number;
  buttonLabel?: string | null;
  actionKey: string;
  actionConfig?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  companyId: string;
  actionType: string;
  detailsJson?: string | null;
  performedBy: string;
  createdAt: string;
}

interface Props {
  companyId: string | null;
  templates: any[];
  onRefreshTemplates?: () => void;
}

export function TemplateRouterManager({ companyId, templates, onRefreshTemplates }: Props) {
  const [loading, setLoading] = useState(false);
  const [purposes, setPurposes] = useState<TemplatePurpose[]>([]);
  const [packages, setPackages] = useState<PackageConfig[]>([]);
  const [buttonActions, setButtonActions] = useState<ButtonAction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState({ maxSelection: 3, fallbackStrategy: 'CARE_WINDOW_TEXT' });

  // Modals & form state
  const [activeSubTab, setActiveSubTab] = useState<'packages' | 'purposes' | 'buttons' | 'settings' | 'audit'>('packages');
  const [editingPackage, setEditingPackage] = useState<Partial<PackageConfig> | null>(null);
  const [editingPurpose, setEditingPurpose] = useState<Partial<TemplatePurpose> | null>(null);
  const [editingButton, setEditingButton] = useState<Partial<ButtonAction> | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchRouterData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/template-router?companyId=${encodeURIComponent(companyId)}`);
      const data = await res.json();
      if (data.success) {
        setPurposes(data.purposes || []);
        setPackages(data.packages || []);
        setButtonActions(data.buttonActions || []);
        setAuditLogs(data.auditLogs || []);
        if (data.settings) setSettings(data.settings);
      }
    } catch (err: any) {
      console.error('Failed to load router config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchRouterData();
    }
  }, [companyId]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 1. Save or Update Purpose
  const handleSavePurpose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurpose?.purposeKey || !editingPurpose?.templateId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/whatsapp/template-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PURPOSE',
          companyId,
          purposeKey: editingPurpose.purposeKey,
          templateId: editingPurpose.templateId,
          isActive: editingPurpose.isActive !== false,
          configuration: editingPurpose.configuration,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Purpose ${editingPurpose.purposeKey} updated successfully`);
        setEditingPurpose(null);
        fetchRouterData();
      } else {
        showToast(data.error || 'Failed to update purpose', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating purpose', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 2. Save or Update Package
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage?.packageId || !editingPackage?.packageName || !editingPackage?.selectionKey || !editingPackage?.whatsappTemplateId) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/whatsapp/template-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPSERT_PACKAGE',
          companyId,
          ...editingPackage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Package ${editingPackage.packageName} saved successfully`);
        setEditingPackage(null);
        fetchRouterData();
      } else {
        showToast(data.error || 'Failed to save package config', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving package', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 3. Reset Package Consistency (Admin confirms Meta template is updated)
  const handleResetConsistency = async (packageConfigId: string) => {
    if (!confirm('Confirm that the linked Meta WhatsApp template matches current price and details? This will clear the outdated alert.')) return;
    try {
      const res = await fetch('/api/whatsapp/template-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_PACKAGE_CONSISTENCY',
          companyId,
          packageConfigId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Package content marked synchronized with Meta template');
        fetchRouterData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error resetting package consistency', 'error');
    }
  };

  // 4. Toggle Package Active
  const handleTogglePackageActive = async (packageConfigId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/whatsapp/template-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_PACKAGE_ACTIVE',
          companyId,
          packageConfigId,
          isActive: !currentActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPackages((prev) =>
          prev.map((p) => (p.id === packageConfigId ? { ...p, isActive: !currentActive } : p))
        );
        showToast(`Package status updated`);
      }
    } catch (err: any) {
      showToast(err.message || 'Error toggling package', 'error');
    }
  };

  // 5. Delete Package
  const handleDeletePackage = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete mapping for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/whatsapp/template-router?id=${id}&type=PACKAGE&companyId=${encodeURIComponent(companyId || '')}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Package configuration deleted');
        fetchRouterData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting package', 'error');
    }
  };

  // 6. Save or Update Button Action
  const handleSaveButton = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingButton?.templateId || editingButton?.buttonIndex === undefined || !editingButton?.actionKey) return;
    setSaving(true);
    try {
      const res = await fetch('/api/whatsapp/template-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPSERT_BUTTON_ACTION',
          companyId,
          ...editingButton,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Button action routing saved');
        setEditingButton(null);
        fetchRouterData();
      } else {
        showToast(data.error || 'Failed to save button action', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving button action', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 7. Delete Button Action
  const handleDeleteButton = async (id: string) => {
    if (!confirm('Remove this button action mapping?')) return;
    try {
      const res = await fetch(`/api/whatsapp/template-router?id=${id}&type=BUTTON_ACTION&companyId=${encodeURIComponent(companyId || '')}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Button action removed');
        fetchRouterData();
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting button action', 'error');
    }
  };

  // 8. Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/whatsapp/template-router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_SETTINGS',
          companyId,
          maxSelection: settings.maxSelection,
          fallbackStrategy: settings.fallbackStrategy,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Router settings saved successfully');
      } else {
        showToast(data.error || 'Failed to save settings', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const outdatedCount = packages.filter((p) => p.requiresMetaUpdate).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Outdated Content Alert Banner (Requirement #10) */}
      {outdatedCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/60 rounded-xl text-amber-700 dark:text-amber-300 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {outdatedCount} Package{outdatedCount > 1 ? 's' : ''} Require Meta Template Update
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
                Commercial package data (price, name, services) has changed. Because WhatsApp templates contain static hardcoded text, the template in Meta may show outdated pricing until updated or reapproved.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveSubTab('packages')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-sm"
          >
            Review Outdated Packages
          </button>
        </div>
      )}

      {/* Header and Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 rounded-lg">
              <GitBranch className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              WhatsApp Dynamic Template & Package Router
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Database-driven template resolution, multi-number parser, and button action executor. No hardcoded names or IDs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchRouterData();
              if (onRefreshTemplates) onRefreshTemplates();
            }}
            disabled={loading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              setEditingPackage({
                packageId: `package_${packages.length + 1}`,
                packageName: '',
                packagePrice: 0,
                selectionKey: String(packages.length + 1),
                isActive: true,
                sortOrder: packages.length + 1,
              });
            }}
            className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Package Mapping
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('packages')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'packages'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Package Mappings ({packages.length})</span>
          {outdatedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
              {outdatedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('purposes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'purposes'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Purpose Mappings ({purposes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('buttons')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'buttons'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Button Actions ({buttonActions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Parser & Settings</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 1: PACKAGE MAPPINGS */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'packages' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Customer Package Reply Mappings</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customers replying with numbers (e.g. &quot;1&quot;, &quot;Reply 2&quot;, &quot;1, 2&quot;) resolve through this catalog.
              </p>
            </div>
            <span className="text-xs text-slate-400">Max Multi-Selection: {settings.maxSelection}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Key</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Linked Meta Template</th>
                  <th className="py-3 px-4">Meta Status</th>
                  <th className="py-3 px-4">Content Status</th>
                  <th className="py-3 px-4 text-center">Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No packages mapped yet. Click &quot;Add Package Mapping&quot; to configure.
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg) => {
                    const tpl = pkg.whatsappTemplate;
                    const isApproved = tpl?.status === 'APPROVED' || tpl?.status === 'ACTIVE';

                    return (
                      <tr key={pkg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 font-bold flex items-center justify-center text-xs">
                            {pkg.selectionKey}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{pkg.packageName}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {pkg.packageId}</div>
                          {pkg.freeService && (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                              🎁 {pkg.freeService}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          ₹{pkg.packagePrice.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {tpl ? (
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{tpl.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                Meta ID: {tpl.metaTemplateId || 'N/A'} • {tpl.language || 'en_US'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-rose-500 font-semibold">Missing Template</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {tpl ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : tpl.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {tpl.status || 'PENDING'}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {pkg.requiresMetaUpdate ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Outdated
                              </span>
                              <button
                                onClick={() => handleResetConsistency(pkg.id)}
                                title="Click to mark template synchronized once Meta template is updated"
                                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                              >
                                Sync
                              </button>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1 w-fit">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Synchronized
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleTogglePackageActive(pkg.id, pkg.isActive)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              pkg.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {pkg.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingPackage(pkg)}
                              className="p-1.5 text-slate-600 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-lg transition-all cursor-pointer"
                              title="Edit Package Configuration"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePackage(pkg.id, pkg.packageName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                              title="Delete Mapping"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 2: PURPOSE MAPPINGS */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'purposes' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">System Template Purposes</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Maps high-level business workflow stages (WELCOME, PACKAGE_MENU, BOOKING_DETAILS) to official Meta templates.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {purposes.map((purpose) => {
              const tpl = purpose.template;
              const isApproved = tpl?.status === 'APPROVED' || tpl?.status === 'ACTIVE';

              return (
                <div key={purpose.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300">
                        {purpose.purposeKey}
                      </span>
                      {purpose.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {purpose.purposeKey === 'WELCOME' && 'Dispatched on first user engagement or welcome flow.'}
                      {purpose.purposeKey === 'PACKAGE_MENU' && 'Dispatched when customer clicks "View Packages" or requests the menu.'}
                      {purpose.purposeKey === 'BOOKING_DETAILS' && 'Dispatched when customer clicks "Book Now" on a selected package.'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {tpl ? (
                      <div className="text-right">
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 justify-end">
                          <span>{tpl.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isApproved ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'
                            }`}
                          >
                            {tpl.status || 'PENDING'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Meta ID: {tpl.metaTemplateId || 'N/A'} • {tpl.language || 'en_US'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-rose-500 font-semibold">No template mapped</span>
                    )}

                    <button
                      onClick={() => setEditingPurpose(purpose)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-violet-50 hover:text-violet-700 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Remap
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 3: BUTTON ACTIONS */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'buttons' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Dynamic Button Action Routing</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Maps quick-reply and call-to-action buttons by button index to internal action keys (BOOK_NOW, OPEN_PACKAGE_MENU, OPEN_APP_URL).
              </p>
            </div>
            <button
              onClick={() => {
                setEditingButton({
                  templateId: templates[0]?.id || '',
                  buttonIndex: 0,
                  buttonLabel: '',
                  actionKey: 'BOOK_NOW',
                  isActive: true,
                });
              }}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Button Action
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Template</th>
                  <th className="py-3 px-4">Button Index</th>
                  <th className="py-3 px-4">Button Label</th>
                  <th className="py-3 px-4">Internal Action Key</th>
                  <th className="py-3 px-4">Action Target / Config</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {buttonActions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No button action mappings configured.
                    </td>
                  </tr>
                ) : (
                  buttonActions.map((ba) => (
                    <tr key={ba.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {ba.template?.name || ba.templateId}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-violet-600">
                        Index {ba.buttonIndex}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                          &quot;{ba.buttonLabel || 'N/A'}&quot;
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                          {ba.actionKey}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {ba.actionConfig || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ba.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {ba.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingButton(ba)}
                            className="p-1.5 text-slate-600 hover:text-violet-600 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteButton(ba.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 4: PARSER & SETTINGS */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Router & Reply Parser Settings</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure maximum package selections and fallback behavior when a Meta template is not approved.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Maximum Customer Package Selections (1–9)
              </label>
              <input
                type="number"
                min={1}
                max={9}
                value={settings.maxSelection}
                onChange={(e) => setSettings({ ...settings, maxSelection: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                When customer replies with &quot;1, 2, 4&quot; or &quot;1 2&quot;, this controls the maximum number of packages dispatched.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unapproved Template Fallback Strategy
              </label>
              <select
                value={settings.fallbackStrategy}
                onChange={(e) => setSettings({ ...settings, fallbackStrategy: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="CARE_WINDOW_TEXT">Send Clean Free-Form Text (Inside 24h Window)</option>
                <option value="LOG_AND_PAUSE">Do Not Send & Log Unapproved Alert</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                If an unapproved template is triggered, the system safely falls back rather than failing silently.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Router Settings'}
            </button>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 5: AUDIT LOGS */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeSubTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Router Activity & Audit Trail</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete audit history for template remappings, customer selections, button clicks, and status changes.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px] sticky top-0">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-sans">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-violet-600 dark:text-violet-400 whitespace-nowrap">
                        {log.actionType}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                        {log.performedBy}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 break-all font-sans">
                        {log.detailsJson || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: EDIT PACKAGE */}
      {/* ────────────────────────────────────────────────────────── */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingPackage.id ? 'Edit Package WhatsApp Config' : 'Create Package WhatsApp Mapping'}
              </h3>
              <button onClick={() => setEditingPackage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Selection Number / Key (1–9) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPackage.selectionKey || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, selectionKey: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g. 1"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Internal Package ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPackage.packageId || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, packageId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g. glam_special"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingPackage.packageName || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, packageName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g. Glam Special"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Commercial Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingPackage.packagePrice ?? ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, packagePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g. 1199"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Linked Official Meta WhatsApp Template *
                </label>
                <select
                  required
                  value={editingPackage.whatsappTemplateId || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, whatsappTemplateId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select a synced template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status || 'APPROVED'}) — Meta ID: {t.metaTemplateId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Services Summary
                </label>
                <textarea
                  rows={2}
                  value={editingPackage.servicesSummary || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, servicesSummary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g. Face Facial, Rica Waxing, Threading, Pedicure"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Free Service Inclusion
                  </label>
                  <input
                    type="text"
                    value={editingPackage.freeService || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, freeService: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g. Free Threading"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={editingPackage.sortOrder ?? 0}
                    onChange={(e) => setEditingPackage({ ...editingPackage, sortOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pkgActiveCheck"
                  checked={editingPackage.isActive !== false}
                  onChange={(e) => setEditingPackage({ ...editingPackage, isActive: e.target.checked })}
                  className="rounded text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="pkgActiveCheck" className="font-bold text-slate-700 dark:text-slate-300">
                  Active (Eligible for customer reply resolution)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPackage(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: EDIT PURPOSE */}
      {/* ────────────────────────────────────────────────────────── */}
      {editingPurpose && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Remap Purpose: {editingPurpose.purposeKey}
              </h3>
              <button onClick={() => setEditingPurpose(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePurpose} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Linked Official Meta Template *
                </label>
                <select
                  required
                  value={editingPurpose.templateId || ''}
                  onChange={(e) => setEditingPurpose({ ...editingPurpose, templateId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select a synced template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status || 'APPROVED'}) — Meta ID: {t.metaTemplateId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="purposeActive"
                  checked={editingPurpose.isActive !== false}
                  onChange={(e) => setEditingPurpose({ ...editingPurpose, isActive: e.target.checked })}
                  className="rounded text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="purposeActive" className="font-bold text-slate-700 dark:text-slate-300">
                  Active for automatic dispatch
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPurpose(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update Purpose'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: EDIT BUTTON ACTION */}
      {/* ────────────────────────────────────────────────────────── */}
      {editingButton && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingButton.id ? 'Edit Button Action' : 'Add Button Action'}
              </h3>
              <button onClick={() => setEditingButton(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveButton} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Source Template *
                </label>
                <select
                  required
                  value={editingButton.templateId || ''}
                  onChange={(e) => setEditingButton({ ...editingButton, templateId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Button Index (0, 1, 2) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    required
                    value={editingButton.buttonIndex ?? 0}
                    onChange={(e) => setEditingButton({ ...editingButton, buttonIndex: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Button Label Snapshot
                  </label>
                  <input
                    type="text"
                    value={editingButton.buttonLabel || ''}
                    onChange={(e) => setEditingButton({ ...editingButton, buttonLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g. Book Now"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Internal Action Key *
                </label>
                <select
                  required
                  value={editingButton.actionKey || 'BOOK_NOW'}
                  onChange={(e) => setEditingButton({ ...editingButton, actionKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="BOOK_NOW">BOOK_NOW (Persist package & send booking details)</option>
                  <option value="OPEN_PACKAGE_MENU">OPEN_PACKAGE_MENU (Send package selector template)</option>
                  <option value="OPEN_APP_URL">OPEN_APP_URL (Send mobile app download link)</option>
                  <option value="REQUEST_HELP">REQUEST_HELP (Human handoff / support)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Action Config / URL (Optional JSON or URL)
                </label>
                <input
                  type="text"
                  value={editingButton.actionConfig || ''}
                  onChange={(e) => setEditingButton({ ...editingButton, actionConfig: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder='e.g. https://hellomam.co.in or {"url":"..."}'
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="btnActiveCheck"
                  checked={editingButton.isActive !== false}
                  onChange={(e) => setEditingButton({ ...editingButton, isActive: e.target.checked })}
                  className="rounded text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="btnActiveCheck" className="font-bold text-slate-700 dark:text-slate-300">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingButton(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
