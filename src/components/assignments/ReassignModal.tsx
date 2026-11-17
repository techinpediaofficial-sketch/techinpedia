'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, AlertCircle, Clock, Check, X, Loader2, ArrowRight, UserPlus, Briefcase, MessageSquare } from 'lucide-react';

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: 'LEAD' | 'WHATSAPP_CONVERSATION';
  resourceId: string;
  resourceTitle: string;
  currentAssigneeName?: string;
  onSuccess: () => void;
}

const REASSIGN_REASONS = [
  { value: 'NO_RESPONSE', label: 'No Response / Unresponsive' },
  { value: 'SLA_BREACHED', label: 'SLA Breached' },
  { value: 'EMPLOYEE_OFFLINE', label: 'Employee Offline' },
  { value: 'EMPLOYEE_ON_LEAVE', label: 'Employee On Leave' },
  { value: 'WORKLOAD_TOO_HIGH', label: 'Workload Too High' },
  { value: 'MANAGER_DECISION', label: 'Manager Reassignment Decision' },
  { value: 'WRONG_ASSIGNMENT', label: 'Wrong Initial Assignment' },
  { value: 'CUSTOMER_REQUEST', label: 'Customer Requested Different Agent' },
  { value: 'OTHER', label: 'Other (specify in notes)' },
];

export function ReassignModal({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceTitle,
  currentAssigneeName,
  onSuccess,
}: ReassignModalProps) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [reason, setReason] = useState<string>('SLA_BREACHED');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    setError(null);
    setSelectedUserId(null);
    setReason('SLA_BREACHED');
    setNotes('');

    fetch('/api/admin/reassign/candidates')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data.candidates) {
          setCandidates(data.candidates);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to fetch candidate employees');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedUserId) {
      setError('Please select an employee to reassign to.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType,
          resourceId,
          toUserId: selectedUserId,
          reason,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reassign');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Reassignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCandidate = candidates.find((c) => c.id === selectedUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Reassign {resourceType === 'LEAD' ? 'CRM Lead' : 'WhatsApp Conversation'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm sm:max-w-md">
                Item: <span className="font-medium text-slate-700 dark:text-slate-300">{resourceTitle}</span>
                {currentAssigneeName && (
                  <span className="ml-2 text-rose-500">
                    (Currently: {currentAssigneeName})
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
              <p className="text-xs">Loading available employees & workloads...</p>
            </div>
          ) : (
            <>
              {/* Candidate Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Select New Assignee ({candidates.length} Staff Members)
                </label>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {candidates.map((c) => {
                    const isSelected = selectedUserId === c.id;
                    const isAvailable = c.isAvailable;

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedUserId(c.id)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/30 ring-1 ring-violet-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200">
                              {c.name.charAt(0)}
                            </div>
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                                isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {c.name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                                {c.designation}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {c.department} • {c.team}
                            </p>
                          </div>
                        </div>

                        {/* Workload badges */}
                        <div className="flex items-center gap-3 flex-shrink-0 text-right">
                          <div className="flex flex-col items-end text-xs">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              {c.workload} active
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {c.activeLeads} leads / {c.activeChats} chats
                            </span>
                          </div>

                          <input
                            type="radio"
                            name="assignee"
                            checked={isSelected}
                            onChange={() => setSelectedUserId(c.id)}
                            className="text-violet-600 focus:ring-violet-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reassignment Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Reason for Reassignment <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500"
                  >
                    {REASSIGN_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Notes / Manager Context
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional details for audit trail..."
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Informational banner */}
              <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 text-xs text-violet-700 dark:text-violet-300 flex items-start gap-2">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Reassignment will reset the acceptance SLA timer for the new assignee, record this action permanently in the audit history, and notify the new employee immediately.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedCandidate ? (
              <span>Reassigning to: <strong>{selectedCandidate.name}</strong></span>
            ) : (
              <span>Select an employee above</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedUserId || loading}
              className="px-5 py-2 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Confirm Reassignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
