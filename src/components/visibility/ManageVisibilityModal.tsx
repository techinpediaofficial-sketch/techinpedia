'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Shield, Users, Lock, UserCheck, AlertTriangle, Check, X, Loader2 } from 'lucide-react';

interface ManageVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: 'LEAD' | 'WHATSAPP_CONVERSATION';
  resourceId: string;
  resourceTitle?: string;
  onUpdated?: () => void;
}

const VISIBILITY_OPTIONS = [
  {
    type: 'ASSIGNED_ONLY',
    label: 'Assigned Employee Only',
    description: 'Only the specifically assigned staff member can view this conversation/lead.',
    icon: UserCheck,
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    type: 'SELECTED_EMPLOYEES',
    label: 'Selected Employees',
    description: 'Permit only specific designated employees from your workforce.',
    icon: Users,
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    type: 'SELECTED_TEAM',
    label: 'Selected Team',
    description: 'Grant access to members belonging to a specific team.',
    icon: Users,
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  {
    type: 'MANAGERS_ONLY',
    label: 'Managers & Above Only',
    description: 'Accessible exclusively to Team Leaders, Managers, and Company Owners.',
    icon: Shield,
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    type: 'OWNER_ONLY',
    label: 'Company Owner Only',
    description: 'Highly confidential. Only the company account owner can view or access.',
    icon: Lock,
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  },
  {
    type: 'ALL_AUTHORIZED',
    label: 'All Authorized Employees',
    description: 'Standard access for all staff members who have module permission.',
    icon: Eye,
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    type: 'HIDDEN',
    label: 'Hidden from Employees',
    description: 'Concealed from staff & unauthorized managers. Accessible to Company Owner and authorized Admins.',
    icon: AlertTriangle,
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  {
    type: 'PLATFORM_RESTRICTED',
    label: 'Platform Restricted (Super Admin Only)',
    description: 'Quarantined resource. Completely hidden from all tenant staff including Company Owner.',
    icon: Lock,
    badgeColor: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  },
];

export function ManageVisibilityModal({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceTitle,
  onUpdated,
}: ManageVisibilityModalProps) {
  const [selectedType, setSelectedType] = useState<string>('ALL_AUTHORIZED');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    setError(null);
    setSuccess(false);

    Promise.all([
      // Fetch current policy
      fetch(`/api/admin/visibility?resourceType=${resourceType}&resourceId=${resourceId}`)
        .then((r) => r.json())
        .catch(() => ({ policy: null })),
      // Fetch candidates for selected employees list
      fetch('/api/admin/reassign/candidates')
        .then((r) => r.json())
        .catch(() => ({ candidates: [] })),
    ])
      .then(([visData, candData]) => {
        if (!mounted) return;
        if (visData.policy) {
          setSelectedType(visData.policy.visibilityType || 'ALL_AUTHORIZED');
          try {
            const empIds = JSON.parse(visData.policy.employeeIds || '[]');
            if (Array.isArray(empIds)) setSelectedEmployeeIds(empIds);
          } catch {}
        } else {
          setSelectedType('ALL_AUTHORIZED');
          setSelectedEmployeeIds([]);
        }
        if (candData.candidates) {
          setCandidates(candData.candidates);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, resourceType, resourceId]);

  if (!isOpen) return null;

  const handleToggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType,
          resourceId,
          visibilityType: selectedType,
          employeeIds: selectedType === 'SELECTED_EMPLOYEES' ? selectedEmployeeIds : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update visibility policy');

      setSuccess(true);
      if (onUpdated) onUpdated();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Error saving visibility setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Manage Visibility
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-xs sm:max-w-md">
                {resourceTitle ? `Controlling: ${resourceTitle}` : `Resource: ${resourceType}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Visibility policy saved successfully!</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <p className="text-xs">Loading access policies...</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Choose who can view, search, and access this {resourceType === 'LEAD' ? 'CRM lead' : 'WhatsApp conversation'}. Enforced on direct URLs, APIs, searches, and exports.
              </p>

              <div className="space-y-2">
                {VISIBILITY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedType === opt.type;
                  return (
                    <div
                      key={opt.type}
                      onClick={() => setSelectedType(opt.type)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mt-0.5 ${opt.badgeColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {opt.label}
                          </span>
                          <input
                            type="radio"
                            name="visibilityType"
                            checked={isSelected}
                            onChange={() => setSelectedType(opt.type)}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Employees Picker */}
              {selectedType === 'SELECTED_EMPLOYEES' && (
                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                      Select Permitted Employees ({selectedEmployeeIds.length} chosen)
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {candidates.length === 0 ? (
                      <p className="text-xs text-neutral-500 py-2">No other active employees found.</p>
                    ) : (
                      candidates.map((c) => {
                        const checked = selectedEmployeeIds.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                              checked
                                ? 'bg-purple-100/70 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700'
                                : 'bg-white dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700/60 hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-bold">
                                {c.name.charAt(0)}
                              </div>
                              <div className="truncate">
                                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {c.name}
                                </span>
                                <span className="text-neutral-500 ml-1.5 text-[11px]">
                                  ({c.designation || c.role})
                                </span>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleEmployee(c.id)}
                              className="rounded text-purple-600 focus:ring-purple-500 ml-2"
                            />
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition shadow-sm flex items-center gap-1.5"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save Policy
          </button>
        </div>
      </div>
    </div>
  );
}
