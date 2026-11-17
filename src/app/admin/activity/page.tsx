'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface ActivityLogItem {
  id: string;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: string | null;
  createdAt: string;
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/activity');
      const data = await res.json();
      if (res.ok) setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Audit Log</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Complete record of administrative actions, logins, and content updates.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 uppercase font-semibold text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-4">Timestamp</th>
              <th className="py-3.5 px-4">User</th>
              <th className="py-3.5 px-4">Action</th>
              <th className="py-3.5 px-4">Entity Type</th>
              <th className="py-3.5 px-4">Details / Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/60 font-mono text-[11px]">
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400 font-sans text-xs">Loading audit logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400 font-sans text-xs">No audit logs recorded yet.</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-100 dark:hover:bg-slate-800/40">
                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                  {log.userEmail || 'System'}
                </td>
                <td className="py-3.5 px-4 text-blue-400 font-bold">
                  {log.action}
                </td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200">
                  {log.entityType}
                </td>
                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={log.metadata || ''}>
                  {log.metadata || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
