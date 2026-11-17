'use client';

import { useState, useEffect } from 'react';
import { AlertOctagon, AlertTriangle, Info, Plus, Search, CheckCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function WarningsPage() {
  const [warnings, setWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/hrm/warnings`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setWarnings(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load warnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, []);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'PIP_TRIGGER': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-600 text-white flex items-center gap-1 shadow-sm"><ShieldAlert className="w-3 h-3"/> PIP Action</span>;
      case 'HIGH': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1"><AlertOctagon className="w-3 h-3"/> High</span>;
      case 'MEDIUM': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Medium</span>;
      case 'LOW': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1"><Info className="w-3 h-3"/> Low</span>;
      default: return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{severity}</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
      case 'ACKNOWLEDGED': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'RESOLVED': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filtered = warnings.filter(w => 
    !search || 
    w.employee?.name.toLowerCase().includes(search.toLowerCase()) ||
    w.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Warnings & PIPs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage disciplinary actions and Performance Improvement Plans.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Issue Warning
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees or warnings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Incident / Title</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading warnings...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No active warnings found.</td>
                </tr>
              ) : (
                filtered.map((warn) => (
                  <tr key={warn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                          {warn.employee?.name?.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">{warn.employee?.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{warn.employee?.employeeCode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white line-clamp-1">{warn.title}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">By {warn.issuedBy?.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getSeverityBadge(warn.severity)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(warn.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(warn.status)}`}>
                        {warn.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
