'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  Building,
  MapPin,
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  CalendarCheck,
  Filter,
  ArrowRight,
  Sparkles,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import ScheduleMeetingModal from '@/components/admin/ScheduleMeetingModal';
import MeetingOutcomeModal from '@/components/admin/MeetingOutcomeModal';

export default function MeetingsDeskPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [rangeFilter, setRangeFilter] = useState('upcoming'); // today, upcoming, past, all
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Summary Metrics
  const [summary, setSummary] = useState({
    todayCount: 0,
    upcomingCount: 0,
    completedCount: 0,
    meetCount: 0,
    pendingOutcomeCount: 0,
  });

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [outcomeMeeting, setOutcomeMeeting] = useState<any | null>(null);

  // Quick Reschedule Modal State
  const [rescheduleMeeting, setRescheduleMeeting] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('11:00');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Copy Link notification
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (rangeFilter !== 'all') params.set('range', rangeFilter);
      if (typeFilter !== 'ALL') params.set('meetingType', typeFilter);
      if (search.trim()) params.set('search', search.trim());

      const [resMeetings, resSummary] = await Promise.all([
        fetch(`/api/meetings?${params.toString()}`),
        fetch('/api/meetings/summary'),
      ]);

      const dataMeetings = await resMeetings.json();
      const dataSummary = await resSummary.json();

      if (dataMeetings?.meetings) setMeetings(dataMeetings.meetings);
      if (dataSummary?.summary) setSummary(dataSummary.summary);
    } catch (err) {
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, rangeFilter, typeFilter, search]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleCopyLink = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to cancel this meeting? Calendar invites will be updated.')) {
      return;
    }

    try {
      const res = await fetch(`/api/meetings/${meetingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by staff member' }),
      });
      if (res.ok) fetchMeetings();
    } catch (err) {
      console.error('Error cancelling meeting:', err);
    }
  };

  const handleExecuteReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleMeeting || !rescheduleDate || !rescheduleTime) return;

    setRescheduleLoading(true);
    try {
      const [h, m] = rescheduleTime.split(':').map(Number);
      const startDateTime = new Date(`${rescheduleDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      const originalDuration =
        new Date(rescheduleMeeting.endTime).getTime() - new Date(rescheduleMeeting.startTime).getTime();
      const endDateTime = new Date(startDateTime.getTime() + (originalDuration || 1800000));

      const res = await fetch(`/api/meetings/${rescheduleMeeting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      if (res.ok) {
        setRescheduleMeeting(null);
        fetchMeetings();
      }
    } catch (err) {
      console.error('Error rescheduling meeting:', err);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'RESCHEDULED':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'NO_SHOW':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'GOOGLE_MEET':
        return <Video className="w-3.5 h-3.5 text-emerald-500" />;
      case 'PHONE_CALL':
        return <Phone className="w-3.5 h-3.5 text-blue-500" />;
      case 'OFFICE_MEETING':
        return <Building className="w-3.5 h-3.5 text-violet-500" />;
      case 'CLIENT_LOCATION':
        return <MapPin className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Calendar className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Meetings & Google Calendar Desk
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Automated Google Meet provisioning, attendee tracking, and CRM outcome synchronization
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchMeetings()}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Refresh Meetings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-violet-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Today&apos;s Meetings
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.todayCount}
            </span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            This Week
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {summary.upcomingCount}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Google Meet Video
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {summary.meetCount}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Video className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Completed
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {summary.completedCount}
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Pending Outcome
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {summary.pendingOutcomeCount}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Range Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 w-fit">
            {[
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'today', label: 'Today' },
              { id: 'past', label: 'Past & Done' },
              { id: 'all', label: 'All' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRangeFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  rangeFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meetings by title, client, email..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="GOOGLE_MEET">Google Meet</option>
              <option value="PHONE_CALL">Phone Call</option>
              <option value="OFFICE_MEETING">Office Room</option>
              <option value="CLIENT_LOCATION">Client Site</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading scheduled meetings...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No meetings found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              There are no meetings matching your current filter criteria. Schedule your next client discovery or team session.
            </p>
          </div>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule First Meeting</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {meetings.map((m) => {
            const startDate = new Date(m.startTime);
            const endDate = new Date(m.endTime);
            const isToday =
              new Date().toDateString() === startDate.toDateString();
            const isMeet = m.meetingType === 'GOOGLE_MEET' && Boolean(m.conferenceLink);
            const isPast = endDate < new Date();
            const needsOutcome = isPast && m.status !== 'CANCELLED' && !m.outcome;

            return (
              <div
                key={m.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
              >
                {/* Top Row: Meta Badges & Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(
                        m.status
                      )}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {m.status}
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                      {getTypeIcon(m.meetingType)}
                      <span>{m.meetingType.replace(/_/g, ' ')}</span>
                    </span>

                    {isToday && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-violet-600 text-white animate-pulse">
                        Today
                      </span>
                    )}

                    {needsOutcome && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Action: Outcome Required
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {startDate.toLocaleDateString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' • '}
                      {startDate.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {endDate.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {m.title}
                    </h3>
                    {m.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-2xl">
                        {m.description}
                      </p>
                    )}

                    {/* Associated Entity Links */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {m.customer && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                          Client: {m.customer.name}
                        </span>
                      )}
                      {m.enquiry && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/50">
                          Lead: {m.enquiry.name}
                        </span>
                      )}
                      {m.deal && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                          Deal: {m.deal.title}
                        </span>
                      )}
                      {m.hostEmployee && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          Host: <strong className="text-slate-700 dark:text-slate-200">{m.hostEmployee.name}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {isMeet && m.status !== 'CANCELLED' && (
                      <>
                        <a
                          href={m.conferenceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meet</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                        <button
                          onClick={() => handleCopyLink(m.id, m.conferenceLink)}
                          className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy Google Meet Link"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </>
                    )}

                    {m.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setOutcomeMeeting(m)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                          m.outcome
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                        }`}
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>{m.outcome ? 'Update Outcome' : 'Log Outcome'}</span>
                      </button>
                    )}

                    {m.status !== 'CANCELLED' && m.status !== 'COMPLETED' && (
                      <>
                        <button
                          onClick={() => {
                            setRescheduleMeeting(m);
                            const nextDate = new Date(m.startTime);
                            const yyyy = nextDate.getFullYear();
                            const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
                            const dd = String(nextDate.getDate()).padStart(2, '0');
                            setRescheduleDate(`${yyyy}-${mm}-${dd}`);
                            setRescheduleTime(
                              `${String(nextDate.getHours()).padStart(2, '0')}:${String(
                                nextDate.getMinutes()
                              ).padStart(2, '0')}`
                            );
                          }}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Reschedule
                        </button>

                        <button
                          onClick={() => handleCancelMeeting(m.id)}
                          className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Cancel Meeting"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Outcome Display (if logged) */}
                {m.outcome && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                          Outcome: {m.outcome.replace(/_/g, ' ')}
                        </strong>
                      </div>
                      {m.outcomeNotes && (
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                          {m.outcomeNotes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={() => fetchMeetings()}
      />

      {/* Outcome Modal */}
      <MeetingOutcomeModal
        isOpen={Boolean(outcomeMeeting)}
        meeting={outcomeMeeting}
        onClose={() => setOutcomeMeeting(null)}
        onSuccess={() => fetchMeetings()}
      />

      {/* Reschedule Dialog Modal */}
      {rescheduleMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reschedule Meeting
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {rescheduleMeeting.title}
            </p>

            <form onSubmit={handleExecuteReschedule} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Start Time (IST)
                </label>
                <input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRescheduleMeeting(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduleLoading}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20"
                >
                  {rescheduleLoading ? 'Syncing...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
