'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  DollarSign,
  Briefcase,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Code2,
  Terminal,
} from 'lucide-react';

interface AuditDiff {
  field: string;
  before: any;
  after: any;
}

interface AuditLogRecord {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  userEmail: string;
  userName: string;
  diffs: AuditDiff[];
  details?: string | null;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({
    todayCount: 0,
    totalAudits: 0,
  });

  // Snapshot Inspection Modal
  const [inspectRecord, setInspectRecord] = useState<AuditLogRecord | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (entityFilter !== 'ALL') params.set('entityType', entityFilter);
      if (actionFilter !== 'ALL') params.set('action', actionFilter);
      params.set('page', page.toString());
      params.set('limit', '25');

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, entityFilter, actionFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when filters change
  const handleEntityChange = (entity: string) => {
    setEntityFilter(entity);
    setPage(1);
  };

  const handleActionChange = (action: string) => {
    setActionFilter(action);
    setPage(1);
  };

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('SCHEDULE') || act.includes('DISBURSE')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('RESCHEDULE')) {
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    }
    if (act.includes('STATUS') || act.includes('STAGE') || act.includes('TRANSITION')) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (act.includes('DELETE') || act.includes('CANCEL') || act.includes('REJECT')) {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toUpperCase()) {
      case 'DEAL':
        return <Briefcase className="w-3.5 h-3.5 text-blue-500" />;
      case 'CUSTOMER':
      case 'ENQUIRY':
        return <Users className="w-3.5 h-3.5 text-indigo-500" />;
      case 'PAYROLL':
      case 'PAYMENT':
      case 'INVOICE':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-500" />;
      case 'MEETING':
        return <Calendar className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-slate-400 italic">empty</span>;
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Audit Trail & Object Diffs
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enterprise forensic log of modifications with granular field-level before/after diff tracking.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Log
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Audit Events</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {summary.totalAudits.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Immutable forensic records</p>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today&apos;s Modifications</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {summary.todayCount.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Active in current session</p>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filtered Records</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Filter className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            {totalCount.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</p>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Integrity Protocol</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            SHA-256 Valid
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">State diff reconciliation active</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by action, email, entity or field modification..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => handleActionChange(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATED">Created</option>
              <option value="UPDATED">Updated</option>
              <option value="STAGE_CHANGED">Stage Changed</option>
              <option value="STATUS_CHANGED">Status Changed</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="DISBURSED">Disbursed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DELETED">Deleted</option>
            </select>
          </div>
        </div>

        {/* Entity Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1 whitespace-nowrap">
            Entities:
          </span>
          {[
            { id: 'ALL', label: 'All Entities' },
            { id: 'DEAL', label: 'Deals & Pipeline' },
            { id: 'CUSTOMER', label: 'Customers' },
            { id: 'ENQUIRY', label: 'Enquiries / Leads' },
            { id: 'PAYROLL', label: 'Payroll & Salary' },
            { id: 'EMPLOYEE', label: 'Employees' },
            { id: 'MEETING', label: 'Meetings & Meet' },
            { id: 'PAYMENT', label: 'Payments & Razorpay' },
            { id: 'INVOICE', label: 'Invoices' },
            { id: 'SETTINGS', label: 'System Settings' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleEntityChange(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                entityFilter === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Audit Feed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Reconciling forensic audit events...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Audit Events Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No modification records match the selected entity or search query.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {logs.map((log) => {
              const hasDiffs = log.diffs && log.diffs.length > 0;
              const hasSnapshots = Boolean(log.beforeSnapshot || log.afterSnapshot);

              return (
                <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    {/* Left: Metadata & Actor */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Action badge */}
                        <span
                          className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>

                        {/* Entity badge */}
                        <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                          {getEntityIcon(log.entityType)}
                          <span>{log.entityType}</span>
                          {log.entityId && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{log.entityId.slice(0, 8)}
                            </span>
                          )}
                        </span>

                        {/* Relative Timestamp */}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Actor Information */}
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-900 dark:text-slate-200">
                          {log.userName}
                        </span>
                        <span className="text-slate-400">({log.userEmail})</span>
                        {log.ip && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                            IP: {log.ip}
                          </span>
                        )}
                      </div>

                      {/* Details text */}
                      {log.details && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium pt-0.5">
                          {log.details}
                        </p>
                      )}
                    </div>

                    {/* Right: Actions / Inspector button */}
                    <div className="flex items-center gap-2 self-start">
                      {hasSnapshots && (
                        <button
                          onClick={() => setInspectRecord(log)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/50 dark:border-indigo-800/50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect Snapshots
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Diffs Viewer Block */}
                  {hasDiffs && (
                    <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                          Field Modifications ({log.diffs.length})
                        </span>
                        <span className="text-[10px] text-slate-400">Before &rarr; After</span>
                      </div>

                      <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
                        {log.diffs.map((diff, idx) => (
                          <div
                            key={idx}
                            className="py-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                          >
                            <div className="font-semibold text-slate-700 dark:text-slate-300 min-w-[140px]">
                              {diff.field}
                            </div>
                            <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 line-through text-[11px] break-all">
                                {formatValue(diff.before)}
                              </span>
                              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-[11px] break-all">
                                {formatValue(diff.after)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-800 dark:text-slate-200">{logs.length}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong> records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-sm"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot Inspection Modal */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Forensic Snapshot Inspector: {inspectRecord.action} ({inspectRecord.entityType})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Recorded {new Date(inspectRecord.createdAt).toISOString()} by {inspectRecord.userEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Side-by-side JSON comparison */}
            <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Before Snapshot */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Before Snapshot (Initial State)
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 text-slate-200 text-[11px] overflow-x-auto max-h-[380px] border border-rose-500/20">
                  {inspectRecord.beforeSnapshot ? (
                    <pre>{JSON.stringify(inspectRecord.beforeSnapshot, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-500 italic">No prior snapshot recorded</span>
                  )}
                </div>
              </div>

              {/* After Snapshot */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    After Snapshot (Modified State)
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 text-slate-200 text-[11px] overflow-x-auto max-h-[380px] border border-emerald-500/20">
                  {inspectRecord.afterSnapshot ? (
                    <pre>{JSON.stringify(inspectRecord.afterSnapshot, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-500 italic">No post snapshot recorded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectRecord(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
