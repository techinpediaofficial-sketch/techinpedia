'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Calendar, User, Clock, Video, Briefcase, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Interview {
  id: string;
  interviewId: string;
  roundName: string;
  type: string;
  date: string;
  startTime: string;
  expectedDuration: number;
  mode: string;
  status: string;
  candidate: { fullName: string; candidateId: string };
  jobOpening?: { title: string };
  interviewers: { employee: { name: string } }[];
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (statusFilter) query.append('status', statusFilter);
      // Backend handles search, or we can filter locally.

      const res = await fetch(`/api/admin/hrm/interviews?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch interviews');
      const data = await res.json();
      setInterviews(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'RESCHEDULED': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'CANCELLED': 
      case 'NO_SHOW': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const filteredInterviews = interviews.filter(int => 
    !search || 
    int.candidate.fullName.toLowerCase().includes(search.toLowerCase()) ||
    int.interviewId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interviews</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage interview schedules and scorecards.</p>
        </div>
        <Link
          href="/admin/hr/interviews/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Schedule Interview
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by candidate name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              <option value="">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Interviews Found</h3>
          <p className="text-gray-500 dark:text-gray-400">There are no interviews matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInterviews.map((interview) => (
            <div key={interview.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                      {interview.interviewId} • {interview.roundName}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {interview.candidate.fullName}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
                    {interview.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  {interview.jobOpening?.title && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Briefcase className="w-4 h-4 mr-3 text-gray-400" />
                      {interview.jobOpening.title}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                    {new Date(interview.date).toLocaleDateString()} at {interview.startTime}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4 mr-3 text-gray-400" />
                    {interview.expectedDuration} minutes
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Video className="w-4 h-4 mr-3 text-gray-400" />
                    {interview.mode.replace('_', ' ')}
                  </div>
                  {interview.interviewers.length > 0 && (
                    <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                      <User className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                      <div>
                        <span className="font-medium">Interviewers:</span>
                        <div className="mt-1">
                          {interview.interviewers.map(i => i.employee.name).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex gap-2">
                <Link
                  href={`/admin/hr/interviews/${interview.id}`}
                  className="flex-1 text-center py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Manage
                </Link>
                <Link
                  href={`/admin/hr/interviews/${interview.id}/scorecard`}
                  className="flex-1 text-center py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Scorecard
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
