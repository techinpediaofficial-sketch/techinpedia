'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare, Plus, Search, Filter, Clock, AlertCircle,
  X, CheckCircle2, Edit2, Trash2, MessageSquare, Users,
  Send, RefreshCw, ChevronDown, Calendar, User, Repeat,
  AlertTriangle, ArrowRight, Loader2, Star, Zap, Target,
} from 'lucide-react';

/* ── Types ── */
interface TaskAssignee { id: string; employeeId: string | null; employeeName: string; employeeCode: string | null; }
interface TaskReply { id: string; authorName: string; authorRole: string; message: string; createdAt: string; }
interface StaffTask {
  id: string; title: string; description: string | null; priority: string; status: string;
  dueDate: string | null; completionNote: string | null; isRecurring: boolean; recurringTime: string | null;
  createdAt: string; assignees: TaskAssignee[]; replies?: TaskReply[]; _count?: { replies: number };
}
interface Employee { id: string; name: string; employeeCode: string; companyEmail?: string; }

/* ── Helpers ── */
const PRIORITY_META: Record<string, { label: string; color: string; icon: string }> = {
  LOW:    { label: 'Low',    color: 'bg-slate-100 text-slate-600 border-slate-200',         icon: '↓' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-50 text-blue-700 border-blue-200',             icon: '→' },
  HIGH:   { label: 'High',   color: 'bg-amber-50 text-amber-700 border-amber-200',          icon: '↑' },
  URGENT: { label: 'Urgent', color: 'bg-red-50 text-red-700 border-red-200',                icon: '⚡' },
};
const STATUS_META: Record<string, { label: string; color: string }> = {
  TODO:        { label: 'To Do',       color: 'bg-slate-100 text-slate-700 border-slate-200' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  REVIEW:      { label: 'In Review',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
  DONE:        { label: 'Done',        color: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED:   { label: 'Cancelled',   color: 'bg-red-50 text-red-500 border-red-200' },
};

/* ── Main Page ── */
export default function StaffTasksPage() {
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  /* Create modal */
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '',
    isRecurring: false, recurringTime: '09:00',
    selectedEmployees: [] as Employee[],
  });
  const [creating, setCreating] = useState(false);

  /* Edit modal */
  const [editTask, setEditTask] = useState<StaffTask | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSelectedEmployees, setEditSelectedEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);

  /* Detail/Reply modal */
  const [detailTask, setDetailTask] = useState<StaffTask | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [savingCompletion, setSavingCompletion] = useState(false);

  /* Delete modal */
  const [deleteTarget, setDeleteTarget] = useState<StaffTask | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  /* ── Fetch ── */
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL('/api/staff-tasks', window.location.origin);
      if (statusFilter) url.searchParams.set('status', statusFilter);
      if (priorityFilter) url.searchParams.set('priority', priorityFilter);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok) setTasks(data.tasks || []);
    } finally { setLoading(false); }
  }, [statusFilter, priorityFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    fetch('/api/hr/employees?status=ACTIVE&limit=200')
      .then(r => r.json())
      .then(d => { if (d.employees) setEmployees(d.employees); });
  }, []);

  /* ── Open Detail ── */
  const openDetail = async (task: StaffTask) => {
    setDetailTask(task);
    setCompletionNote(task.completionNote || '');
    setDetailLoading(true);
    const res = await fetch(`/api/staff-tasks/${task.id}`);
    const data = await res.json();
    if (res.ok) { setDetailTask(data.task); setCompletionNote(data.task.completionNote || ''); }
    setDetailLoading(false);
  };

  /* ── Create ── */
  const handleCreate = async () => {
    if (!createForm.title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/staff-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          priority: createForm.priority,
          status: createForm.status,
          dueDate: createForm.dueDate || null,
          isRecurring: createForm.isRecurring,
          recurringTime: createForm.isRecurring ? createForm.recurringTime : null,
          assignees: createForm.selectedEmployees.map(e => ({
            employeeId: e.id, employeeName: e.name, employeeCode: e.employeeCode,
          })),
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setCreateForm({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '', isRecurring: false, recurringTime: '09:00', selectedEmployees: [] });
        await fetchTasks();
      }
    } finally { setCreating(false); }
  };

  /* ── Edit ── */
  const openEdit = (task: StaffTask) => {
    setEditTask(task);
    setEditForm({
      title: task.title, description: task.description || '', priority: task.priority,
      status: task.status, dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      isRecurring: task.isRecurring, recurringTime: task.recurringTime || '09:00',
    });
    setEditSelectedEmployees(task.assignees.map(a => ({ id: a.employeeId || '', name: a.employeeName, employeeCode: a.employeeCode || '', })));
  };

  const handleEdit = async () => {
    if (!editTask) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/staff-tasks/${editTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          dueDate: editForm.dueDate || null,
          assignees: editSelectedEmployees.map(e => ({ employeeId: e.id, employeeName: e.name, employeeCode: e.employeeCode })),
        }),
      });
      if (res.ok) { setEditTask(null); await fetchTasks(); }
    } finally { setSaving(false); }
  };

  /* ── Quick Status Update ── */
  const updateStatus = async (taskId: string, status: string) => {
    await fetch(`/api/staff-tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await fetchTasks();
    if (detailTask?.id === taskId) {
      setDetailTask(prev => prev ? { ...prev, status } : null);
    }
  };

  /* ── Reply ── */
  const sendReply = async () => {
    if (!detailTask || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/staff-tasks/${detailTask.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText, authorRole: 'ADMIN' }),
      });
      if (res.ok) {
        setReplyText('');
        await openDetail(detailTask);
      }
    } finally { setSendingReply(false); }
  };

  /* ── Completion Note ── */
  const saveCompletionNote = async () => {
    if (!detailTask) return;
    setSavingCompletion(true);
    try {
      const res = await fetch(`/api/staff-tasks/${detailTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionNote }),
      });
      if (res.ok) {
        const data = await res.json();
        setDetailTask(data.task);
        await fetchTasks();
      }
    } finally { setSavingCompletion(false); }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError('');
    setDeleting(true);
    try {
      const res = await fetch(`/api/staff-tasks/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: deletePassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteTarget(null);
        setDeletePassword('');
        await fetchTasks();
      } else {
        setDeleteError(data.error || 'Failed to delete task.');
      }
    } finally { setDeleting(false); }
  };

  /* ── Employee Selector Helper ── */
  const [empSearch, setEmpSearch] = useState('');
  const filteredEmps = employees.filter(e =>
    e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.employeeCode?.toLowerCase().includes(empSearch.toLowerCase())
  ).slice(0, 10);

  const toggleEmployee = (emp: Employee, list: Employee[], setList: (l: Employee[]) => void) => {
    if (list.find(e => e.id === emp.id)) {
      setList(list.filter(e => e.id !== emp.id));
    } else {
      setList([...list, emp]);
    }
  };

  /* ── Filtered Tasks ── */
  const filteredTasks = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.assignees.some(a => a.employeeName.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: tasks.filter(t => t.status === 'DONE').length,
    recurring: tasks.filter(t => t.isRecurring).length,
  };

  /* ── Render ── */
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-violet-600" />
            Staff Task Manager
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Assign tasks to employees, track progress, manage daily recurring tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchTasks} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-300 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-md shadow-violet-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: CheckSquare, color: 'text-violet-600 bg-violet-50 border-violet-200' },
          { label: 'To Do', value: stats.todo, icon: Clock, color: 'text-slate-600 bg-slate-50 border-slate-200' },
          { label: 'In Progress', value: stats.inProgress, icon: Zap, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Done', value: stats.done, icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
          { label: 'Recurring', value: stats.recurring, icon: Repeat, color: 'text-amber-600 bg-amber-50 border-amber-200' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-2xl border ${s.color} flex items-center gap-3`}>
            <s.icon className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="text-xl font-black">{s.value}</div>
              <div className="text-xs font-medium opacity-75">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks or assignees..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-violet-400 focus:outline-none"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-violet-400 focus:outline-none bg-white">
          <option value="">All Status</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-violet-400 focus:outline-none bg-white">
          <option value="">All Priority</option>
          {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-violet-600 animate-spin" /></div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tasks found</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 text-sm text-violet-600 font-bold hover:underline">+ Create your first task</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const pm = PRIORITY_META[task.priority] || PRIORITY_META.MEDIUM;
            const sm = STATUS_META[task.status] || STATUS_META.TODO;
            return (
              <div key={task.id} className="bg-white rounded-2xl border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all p-5">
                <div className="flex items-start gap-4">
                  {/* Status Toggle */}
                  <button
                    onClick={() => updateStatus(task.id, task.status === 'DONE' ? 'TODO' : task.status === 'IN_PROGRESS' ? 'DONE' : task.status === 'TODO' ? 'IN_PROGRESS' : 'DONE')}
                    className={`mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${task.status === 'DONE' ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-violet-400'}`}
                  >
                    {task.status === 'DONE' && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-base font-bold text-slate-900 ${task.status === 'DONE' ? 'line-through text-slate-400' : ''}`}>{task.title}</span>
                          {task.isRecurring && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                              <Repeat className="w-3 h-3" /> Daily Recurring
                            </span>
                          )}
                        </div>
                        {task.description && <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>}

                        {/* Assignees */}
                        {task.assignees.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {task.assignees.map(a => (
                              <span key={a.id} className="px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-semibold">
                                {a.employeeName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Badges & Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${pm.color}`}>{pm.icon} {pm.label}</span>
                        <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${sm.color}`}>{sm.label}</span>

                        {/* Quick Status Select */}
                        <select
                          value={task.status}
                          onChange={e => updateStatus(task.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-violet-400 bg-white"
                          onClick={e => e.stopPropagation()}
                        >
                          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>

                        {/* Actions */}
                        <button onClick={() => openDetail(task)} className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all" title="View replies">
                          <MessageSquare className="w-4 h-4" />
                          {(task._count?.replies || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 text-[9px] bg-violet-600 text-white rounded-full w-4 h-4 flex items-center justify-center">{task._count!.replies}</span>
                          )}
                        </button>
                        <button onClick={() => openEdit(task)} className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Edit task">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setDeleteTarget(task); setDeletePassword(''); setDeleteError(''); }} className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete task">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Footer info */}
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {(task._count?.replies || 0) > 0 && (
                        <span className="flex items-center gap-1 text-violet-500 font-medium cursor-pointer hover:underline" onClick={() => openDetail(task)}>
                          <MessageSquare className="w-3 h-3" /> {task._count!.replies} {task._count!.replies === 1 ? 'reply' : 'replies'}
                        </span>
                      )}
                      {task.completionNote && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Has completion note
                        </span>
                      )}
                      <span className="ml-auto">{new Date(task.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── CREATE MODAL ─── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Plus className="w-5 h-5 text-violet-600" /> Create New Task</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5">Task Title *</label>
                <input value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Enter task title..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5">Description</label>
                <textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Task details, instructions..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Priority</label>
                  <select value={createForm.priority} onChange={e => setCreateForm(p => ({ ...p, priority: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm bg-white">
                    {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Initial Status</label>
                  <select value={createForm.status} onChange={e => setCreateForm(p => ({ ...p, status: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm bg-white">
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5">Due Date</label>
                <input type="date" value={createForm.dueDate} onChange={e => setCreateForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm" />
              </div>

              {/* Recurring */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={createForm.isRecurring} onChange={e => setCreateForm(p => ({ ...p, isRecurring: e.target.checked }))} className="w-4 h-4 rounded accent-amber-600" />
                  <span className="text-sm font-bold text-amber-800 flex items-center gap-1.5"><Repeat className="w-4 h-4" /> Daily Recurring Task (auto-resets every day)</span>
                </label>
                {createForm.isRecurring && (
                  <div>
                    <label className="text-xs font-bold text-amber-700 block mb-1">Reset Time</label>
                    <input type="time" value={createForm.recurringTime} onChange={e => setCreateForm(p => ({ ...p, recurringTime: e.target.value }))} className="px-3 py-2 rounded-xl border border-amber-300 text-sm focus:outline-none bg-white" />
                  </div>
                )}
              </div>

              {/* Employee Assignment */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2 flex items-center gap-1.5"><Users className="w-4 h-4 text-violet-500" /> Assign Employees (Multi-select)</label>
                <input value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Search employee..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm mb-2" />
                <div className="max-h-44 overflow-y-auto space-y-1 rounded-xl border border-slate-200 p-2 bg-slate-50">
                  {filteredEmps.map(emp => {
                    const selected = createForm.selectedEmployees.find(e => e.id === emp.id);
                    return (
                      <button key={emp.id} type="button" onClick={() => toggleEmployee(emp, createForm.selectedEmployees, (l) => setCreateForm(p => ({ ...p, selectedEmployees: l })))}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all ${selected ? 'bg-violet-600 text-white' : 'bg-white text-slate-700 hover:bg-violet-50 border border-slate-100'}`}>
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium">{emp.name}</span>
                        <span className="text-xs opacity-70 ml-auto">{emp.employeeCode}</span>
                        {selected && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
                      </button>
                    );
                  })}
                </div>
                {createForm.selectedEmployees.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {createForm.selectedEmployees.map(e => (
                      <span key={e.id} className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-100 border border-violet-300 text-violet-700 text-xs font-semibold">
                        {e.name}
                        <button onClick={() => setCreateForm(p => ({ ...p, selectedEmployees: p.selectedEmployees.filter(x => x.id !== e.id) }))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !createForm.title.trim()} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT MODAL ─── */}
      {editTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditTask(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Edit2 className="w-5 h-5 text-blue-600" /> Edit Task</h2>
              <button onClick={() => setEditTask(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5">Task Title *</label>
                <input value={editForm.title} onChange={e => setEditForm((p: any) => ({ ...p, title: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm((p: any) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Priority</label>
                  <select value={editForm.priority} onChange={e => setEditForm((p: any) => ({ ...p, priority: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm bg-white">
                    {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1.5">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm((p: any) => ({ ...p, status: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm bg-white">
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5">Due Date</label>
                <input type="date" value={editForm.dueDate} onChange={e => setEditForm((p: any) => ({ ...p, dueDate: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm" />
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={editForm.isRecurring} onChange={e => setEditForm((p: any) => ({ ...p, isRecurring: e.target.checked }))} className="w-4 h-4 rounded accent-amber-600" />
                  <span className="text-sm font-bold text-amber-800 flex items-center gap-1.5"><Repeat className="w-4 h-4" /> Daily Recurring Task</span>
                </label>
                {editForm.isRecurring && (
                  <div>
                    <label className="text-xs font-bold text-amber-700 block mb-1">Reset Time</label>
                    <input type="time" value={editForm.recurringTime} onChange={e => setEditForm((p: any) => ({ ...p, recurringTime: e.target.value }))} className="px-3 py-2 rounded-xl border border-amber-300 text-sm focus:outline-none bg-white" />
                  </div>
                )}
              </div>

              {/* Employee Assignment for Edit */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2 flex items-center gap-1.5"><Users className="w-4 h-4 text-violet-500" /> Assignees</label>
                <input value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Search employee..." className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm mb-2" />
                <div className="max-h-44 overflow-y-auto space-y-1 rounded-xl border border-slate-200 p-2 bg-slate-50">
                  {filteredEmps.map(emp => {
                    const selected = editSelectedEmployees.find(e => e.id === emp.id);
                    return (
                      <button key={emp.id} type="button" onClick={() => toggleEmployee(emp, editSelectedEmployees, setEditSelectedEmployees)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all ${selected ? 'bg-violet-600 text-white' : 'bg-white text-slate-700 hover:bg-violet-50 border border-slate-100'}`}>
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="font-medium">{emp.name}</span>
                        <span className="text-xs opacity-70 ml-auto">{emp.employeeCode}</span>
                        {selected && <CheckCircle2 className="w-3.5 h-3.5 ml-1" />}
                      </button>
                    );
                  })}
                </div>
                {editSelectedEmployees.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {editSelectedEmployees.map(e => (
                      <span key={e.id} className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-100 border border-violet-300 text-violet-700 text-xs font-semibold">
                        {e.name}
                        <button onClick={() => setEditSelectedEmployees(prev => prev.filter(x => x.id !== e.id))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditTask(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancel</button>
                <button onClick={handleEdit} disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-sm hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DETAIL / REPLIES MODAL ─── */}
      {detailTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetailTask(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">{detailTask.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${STATUS_META[detailTask.status]?.color}`}>{STATUS_META[detailTask.status]?.label}</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${PRIORITY_META[detailTask.priority]?.color}`}>{PRIORITY_META[detailTask.priority]?.label}</span>
                </div>
              </div>
              <button onClick={() => setDetailTask(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Task Info */}
              {detailTask.description && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-sm text-slate-700">{detailTask.description}</p>
                </div>
              )}
              {detailTask.assignees.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assigned To</p>
                  <div className="flex flex-wrap gap-2">
                    {detailTask.assignees.map(a => (
                      <span key={a.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-sm font-semibold">
                        <User className="w-3.5 h-3.5" /> {a.employeeName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Status Change */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_META).map(([k, v]) => (
                    <button key={k} onClick={() => updateStatus(detailTask.id, k)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${detailTask.status === k ? v.color + ' ring-2 ring-offset-1 ring-violet-400' : 'border-slate-200 text-slate-500 hover:' + v.color}`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Replies Thread */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Activity & Replies</p>
                {detailLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-violet-600 animate-spin" /></div>
                ) : (detailTask.replies || []).length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 rounded-2xl">No replies yet. Be the first to update!</div>
                ) : (
                  <div className="space-y-3">
                    {(detailTask.replies || []).map(reply => (
                      <div key={reply.id} className={`flex gap-3 ${reply.authorRole === 'ADMIN' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black ${reply.authorRole === 'ADMIN' ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                          {reply.authorName[0]?.toUpperCase()}
                        </div>
                        <div className={`max-w-[80%] ${reply.authorRole === 'ADMIN' ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="font-semibold text-slate-600">{reply.authorName}</span>
                            <span>{new Date(reply.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${reply.authorRole === 'ADMIN' ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                            {reply.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                <div className="mt-4 flex gap-3">
                  <textarea
                    value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder="Add a reply, update, or note..."
                    rows={2} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:outline-none text-sm resize-none"
                  />
                  <button onClick={sendReply} disabled={sendingReply || !replyText.trim()} className="px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center">
                    {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Completion Note */}
              <div className="p-4 rounded-2xl bg-green-50 border border-green-200 space-y-3">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Completion Note (written when task is done)</p>
                <textarea
                  value={completionNote} onChange={e => setCompletionNote(e.target.value)}
                  placeholder="Write what was accomplished, any notes for future reference..."
                  rows={3} className="w-full px-4 py-3 rounded-xl border border-green-200 focus:border-green-400 focus:outline-none text-sm resize-none bg-white"
                />
                <button onClick={saveCompletionNote} disabled={savingCompletion} className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                  {savingCompletion ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE MODAL ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-3"><Trash2 className="w-7 h-7 text-red-500" /></div>
                <h2 className="text-xl font-black text-slate-900">Delete Task</h2>
                <p className="text-sm text-slate-500 mt-1">This will permanently delete <span className="font-semibold text-slate-700">"{deleteTarget.title}"</span> and all its replies.</p>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5">Admin Password to Confirm</label>
                <input type="password" value={deletePassword} onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }} placeholder="Enter admin delete password..."
                  className="w-full px-4 py-3 rounded-xl border border-red-200 focus:border-red-400 focus:outline-none text-sm" />
                {deleteError && <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {deleteError}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">Cancel</button>
                <button onClick={handleDelete} disabled={deleting || !deletePassword} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
