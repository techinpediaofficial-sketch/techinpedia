'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Clock, AlertCircle, RefreshCw, MessageSquare, Target } from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';
import { ReassignModal } from '@/components/assignments/ReassignModal';

function LiveTimer({ startTime }: { startTime: string }) {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diffMs = now - start;
      if (diffMs < 0) {
        setDuration('00:00:00');
        return;
      }
      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      setDuration(
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span className="font-mono">{duration}</span>;
}

export default function AssignmentMonitorPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<{
    resourceType: 'LEAD' | 'WHATSAPP_CONVERSATION';
    resourceId: string;
    resourceTitle: string;
    currentAssigneeName?: string;
  } | null>(null);

  const fetchMonitorData = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/assignments/monitor');
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch monitor data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitorData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b18] text-slate-900 dark:text-white pb-20">
      <AdminHeader title="Assignment Monitor" />

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-violet-600" />
              SLA Assignment Monitor
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live oversight of unaccepted leads and WhatsApp conversations.
            </p>
          </div>
          <button
            onClick={fetchMonitorData}
            disabled={refreshing}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:shadow flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500 animate-pulse">Loading Live Metrics...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.map((member) => {
              const totalUnaccepted = member.stats.unacceptedLeads + member.stats.unacceptedChats;
              const hasAlert = totalUnaccepted > 0;

              return (
                <div key={member.user.id} className={`p-5 rounded-2xl border transition-colors ${hasAlert ? 'bg-amber-50/30 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50' : 'bg-white dark:bg-[#0c1427] border-slate-200 dark:border-slate-800'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${hasAlert ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'}`}>
                        {member.user.name.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/admin/company/employees/${member.user.id}/activity`}
                          className="font-bold text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition hover:underline text-sm leading-tight block"
                        >
                          {member.user.name}
                        </Link>
                        <p className="text-xs text-slate-500 font-medium">{member.user.role || 'Member'}</p>
                      </div>
                    </div>
                    {hasAlert && (
                      <div className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                        <AlertCircle className="w-3 h-3" />
                        {totalUnaccepted} Pending
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-violet-500" />
                        CRM Leads
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-xl font-black text-slate-800 dark:text-slate-200">{member.stats.totalLeads}</span>
                        {member.stats.unacceptedLeads > 0 && (
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{member.stats.unacceptedLeads} Waiting</span>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                        WhatsApp
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-xl font-black text-slate-800 dark:text-slate-200">{member.stats.totalChats}</span>
                        {member.stats.unacceptedChats > 0 && (
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{member.stats.unacceptedChats} Waiting</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Active SLA Countdowns */}
                  {hasAlert && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/50">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Awaiting Acceptance</h4>
                      
                      {member.unacceptedDetails.leads.map((l: any) => (
                        <div key={`lead-${l.id}`} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="truncate flex-1 font-medium text-slate-700 dark:text-slate-300">
                            🎯 {l.name || 'Lead'}
                          </span>
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <LiveTimer startTime={l.assignedAt} />
                          </span>
                          <button
                            onClick={() =>
                              setReassignTarget({
                                resourceType: 'LEAD',
                                resourceId: l.id,
                                resourceTitle: l.name || 'Lead #' + l.id.slice(0, 8),
                                currentAssigneeName: member.name,
                              })
                            }
                            className="ml-3 text-violet-600 hover:text-violet-700 font-medium hover:underline text-xs"
                          >
                            Reassign
                          </button>
                        </div>
                      ))}

                      {member.unacceptedDetails.chats.map((c: any) => (
                        <div key={`chat-${c.id}`} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="truncate flex-1 font-medium text-slate-700 dark:text-slate-300">
                            💬 {c.customerName || c.waNumber}
                          </span>
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <LiveTimer startTime={c.assignedAt} />
                          </span>
                          <button
                            onClick={() =>
                              setReassignTarget({
                                resourceType: 'WHATSAPP_CONVERSATION',
                                resourceId: c.id,
                                resourceTitle: c.customerName || c.waNumber || 'Chat #' + c.id.slice(0, 8),
                                currentAssigneeName: member.name,
                              })
                            }
                            className="ml-3 text-violet-600 hover:text-violet-700 font-medium hover:underline text-xs"
                          >
                            Reassign
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}

            {data.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500 font-medium">
                No users found in this company.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Reassign Modal */}
      {reassignTarget && (
        <ReassignModal
          isOpen={true}
          onClose={() => setReassignTarget(null)}
          resourceType={reassignTarget.resourceType}
          resourceId={reassignTarget.resourceId}
          resourceTitle={reassignTarget.resourceTitle}
          currentAssigneeName={reassignTarget.currentAssigneeName}
          onSuccess={() => {
            fetchMonitorData();
          }}
        />
      )}
    </div>
  );
}
