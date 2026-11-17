'use client';

import { useState } from 'react';
import {
  X,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  FileText,
  Clock,
  Phone,
  Send,
  Mail,
  Video,
  ListTodo,
} from 'lucide-react';

interface MeetingOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: any | null;
  onSuccess?: (updatedMeeting: any) => void;
}

export default function MeetingOutcomeModal({
  isOpen,
  onClose,
  meeting,
  onSuccess,
}: MeetingOutcomeModalProps) {
  const [outcome, setOutcome] = useState('INTERESTED_PROPOSAL_REQUIRED');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [createFollowUp, setCreateFollowUp] = useState(true);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpType, setFollowUpType] = useState('CALL');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !meeting) return null;

  // Initialize follow-up date to 2 days from now if not set
  if (!followUpDate) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 2);
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dd = String(nextDate.getDate()).padStart(2, '0');
    setFollowUpDate(`${yyyy}-${mm}-${dd}`);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/meetings/${meeting.id}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome,
          outcomeNotes: outcomeNotes.trim() || undefined,
          createFollowUp,
          followUpDate: createFollowUp && followUpDate ? new Date(`${followUpDate}T11:00:00`).toISOString() : undefined,
          followUpType,
          followUpNotes: followUpNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record meeting outcome');
      }

      if (onSuccess) onSuccess(data.meeting);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving outcome');
    } finally {
      setLoading(false);
    }
  };

  const outcomes = [
    {
      id: 'INTERESTED_PROPOSAL_REQUIRED',
      label: 'Interested — Proposal Required',
      desc: 'Client is keen; prepare commercial quotation or proposal',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'QUALIFIED_OPPORTUNITY',
      label: 'Qualified Sales Opportunity',
      desc: 'High budget & decision timeline verified',
      badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30',
    },
    {
      id: 'FOLLOW_UP_NEEDED',
      label: 'Follow-Up Needed',
      desc: 'Additional discussion or stakeholder alignment required',
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    },
    {
      id: 'DEAL_WON',
      label: 'Deal Won / Ready for Onboarding',
      desc: 'Commercial agreement reached; proceed to contract/payment',
      badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'NOT_INTERESTED',
      label: 'Not Interested / Disqualified',
      desc: 'Budget mismatch, timing delay, or competitor chosen',
      badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
    },
    {
      id: 'NO_SHOW',
      label: 'Client No-Show',
      desc: 'Client failed to join; reschedule required',
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Log Meeting Outcome & Notes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {meeting.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Outcome Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Meeting Result / Outcome *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {outcomes.map((item) => {
                const isSelected = outcome === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOutcome(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/30 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.label}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-violet-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meeting Minutes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Discussion Minutes & Key Takeaways
            </label>
            <textarea
              rows={3}
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              placeholder="Summary of client's requirements, objections addressed, or promised deliverables..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          {/* Auto Follow-up Task Creation */}
          {outcome !== 'NOT_INTERESTED' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createFollowUp}
                  onChange={(e) => setCreateFollowUp(e.target.checked)}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Automatically Schedule Follow-Up Task in CRM
                </span>
              </label>

              {createFollowUp && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Communication Channel
                    </label>
                    <select
                      value={followUpType}
                      onChange={(e) => setFollowUpType(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="CALL">Phone Call</option>
                      <option value="WHATSAPP">WhatsApp Message</option>
                      <option value="EMAIL">Email</option>
                      <option value="MEETING">Follow-up Meeting</option>
                      <option value="TASK">Internal Task</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Outcome...</span>
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4" />
                  <span>Complete & Record Outcome</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
