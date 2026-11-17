'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  Phone,
  Building,
  MapPin,
  Users,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (meeting: any) => void;
  defaultCustomerId?: string;
  defaultCustomerName?: string;
  defaultCustomerEmail?: string;
  defaultEnquiryId?: string;
  defaultDealId?: string;
  defaultTitle?: string;
}

export default function ScheduleMeetingModal({
  isOpen,
  onClose,
  onSuccess,
  defaultCustomerId,
  defaultCustomerName,
  defaultCustomerEmail,
  defaultEnquiryId,
  defaultDealId,
  defaultTitle,
}: ScheduleMeetingModalProps) {
  const [title, setTitle] = useState(defaultTitle || '');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState('GOOGLE_MEET');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('11:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [location, setLocation] = useState('');

  // Attendee state
  const [clientName, setClientName] = useState(defaultCustomerName || '');
  const [clientEmail, setClientEmail] = useState(defaultCustomerEmail || '');
  const [additionalAttendees, setAdditionalAttendees] = useState('');

  // Host attribution
  const [employees, setEmployees] = useState<any[]>([]);
  const [hostEmployeeId, setHostEmployeeId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMeeting, setCreatedMeeting] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize date to tomorrow's date
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);

      if (defaultTitle) setTitle(defaultTitle);
      else if (defaultCustomerName) setTitle(`Consultation with ${defaultCustomerName}`);
      else setTitle('Product Demo & Technical Discovery');

      if (defaultCustomerName) setClientName(defaultCustomerName);
      if (defaultCustomerEmail) setClientEmail(defaultCustomerEmail);

      setCreatedMeeting(null);
      setError(null);
      setCopied(false);

      // Load active employees
      fetch('/api/hrm/employees?status=ACTIVE')
        .then((res) => res.json())
        .then((data) => {
          if (data?.employees) {
            setEmployees(data.employees);
            if (!hostEmployeeId && data.employees.length > 0) {
              setHostEmployeeId(data.employees[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, defaultTitle, defaultCustomerName, defaultCustomerEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !startTime) {
      setError('Please provide a meeting title, date, and start time.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate ISO start and end times
      const [hours, mins] = startTime.split(':').map(Number);
      const startDateTime = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      // Parse additional attendees
      const participants: any[] = [];
      if (clientEmail.trim()) {
        participants.push({
          email: clientEmail.trim(),
          name: clientName.trim() || undefined,
          role: 'ATTENDEE',
        });
      }

      if (additionalAttendees.trim()) {
        const extraEmails = additionalAttendees
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter((s) => s && s.includes('@'));
        for (const email of extraEmails) {
          if (email !== clientEmail.trim()) {
            participants.push({ email, role: 'ATTENDEE' });
          }
        }
      }

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          meetingType,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: meetingType !== 'GOOGLE_MEET' ? location : undefined,
          customerId: defaultCustomerId,
          enquiryId: defaultEnquiryId,
          dealId: defaultDealId,
          hostEmployeeId: hostEmployeeId || undefined,
          participants,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to schedule meeting');
      }

      setCreatedMeeting(data.meeting);
      if (onSuccess) onSuccess(data.meeting);
    } catch (err: any) {
      setError(err.message || 'Error occurred while scheduling');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (createdMeeting?.conferenceLink) {
      navigator.clipboard.writeText(createdMeeting.conferenceLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Schedule Meeting & Google Meet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated Google Meet provisioning & CRM timeline synchronization
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

        {/* Success View */}
        {createdMeeting ? (
          <div className="p-6 space-y-6">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500 text-white mt-0.5">
                <Check className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Meeting Successfully Scheduled!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  Google Calendar invitation created. Meet conferencing is live and synchronized with the CRM.
                </p>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Meeting Title
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {createdMeeting.title}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Date & Time
                </span>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {new Date(createdMeeting.startTime).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              {createdMeeting.conferenceLink && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-emerald-500" />
                    Google Meet Video Call Link
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdMeeting.conferenceLink}
                      className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <a
                      href={createdMeeting.conferenceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Join
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Scheduling Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Meeting Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Tech Discovery Call & Requirements Review"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Meeting Type Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Meeting Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'GOOGLE_MEET', label: 'Google Meet', icon: Video, color: 'text-emerald-500' },
                  { id: 'PHONE_CALL', label: 'Phone Call', icon: Phone, color: 'text-blue-500' },
                  { id: 'OFFICE_MEETING', label: 'Office Room', icon: Building, color: 'text-violet-500' },
                  { id: 'CLIENT_LOCATION', label: 'Client Site', icon: MapPin, color: 'text-amber-500' },
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = meetingType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setMeetingType(type.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/30 text-violet-900 dark:text-violet-200 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1.5 ${type.color}`} />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Start Time (IST) *
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Duration
                </label>
                <div className="flex items-center gap-1.5">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        durationMinutes === mins
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location (If not Google Meet) */}
            {meetingType !== 'GOOGLE_MEET' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Location / Room / Phone Number
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Conference Room B, or +91 98765 43210"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            )}

            {/* Attendees & Host Attribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Client / Lead Email
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Host Staff Member
                </label>
                <select
                  value={hostEmployeeId}
                  onChange={(e) => setHostEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">(Current Logged-in Staff)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Agenda / Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Agenda / Discussion Points
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key questions, requirements, or documents to review during the meeting..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>

            {/* Actions */}
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
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-violet-500/20 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Provisioning Meet...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Schedule & Generate Meet</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
