'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Edit2, Power, PowerOff, Trash2, Users, BarChart2, X, Shield } from 'lucide-react';

interface BusinessUnit {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  _count: { enquiries: number; employees: number };
}

const SYSTEM_CODES = ['COMPANY_SERVICES', 'MARKETPLACE'];

export default function BusinessUnitsPage() {
  const [units, setUnits] = useState<BusinessUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessUnit | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/business-units');
      const data = await res.json();
      if (res.ok) setUnits(data.businessUnits || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', name: '', description: '' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (u: BusinessUnit) => {
    setEditing(u);
    setForm({ code: u.code, name: u.name, description: u.description || '' });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const res = await fetch(`/api/admin/business-units/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, description: form.description }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Update failed.'); return; }
      } else {
        const res = await fetch('/api/admin/business-units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Create failed.'); return; }
      }
      setModalOpen(false);
      fetchUnits();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const toggleActive = async (u: BusinessUnit) => {
    const res = await fetch(`/api/admin/business-units/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (res.ok) fetchUnits();
  };

  const handleDelete = async (u: BusinessUnit) => {
    if (!confirm(`Delete Business Unit "${u.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/business-units/${u.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    fetchUnits();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-7 h-7 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Business Units</h1>
              <p className="text-sm text-slate-400">Manage platform business units and data isolation boundaries</p>
            </div>
          </div>
          <button
            id="btn-create-bu"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Business Unit
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : (
          <div className="space-y-3">
            {units.map(u => (
              <div key={u.id} className={`rounded-xl border p-5 flex items-center justify-between gap-4 ${
                u.isActive ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'
              }`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    u.isActive ? 'bg-blue-600/20' : 'bg-slate-700'
                  }`}>
                    <Building2 className={`w-5 h-5 ${u.isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{u.name}</span>
                      <code className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{u.code}</code>
                      {u.isSystem && (
                        <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                          <Shield className="w-3 h-3" /> System
                        </span>
                      )}
                      {!u.isActive && (
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    {u.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{u.description}</p>}
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <BarChart2 className="w-3 h-3" /> {u._count.enquiries} leads
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Users className="w-3 h-3" /> {u._count.employees} employees
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    id={`btn-edit-bu-${u.id}`}
                    onClick={() => openEdit(u)}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    id={`btn-toggle-bu-${u.id}`}
                    onClick={() => toggleActive(u)}
                    className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                    title={u.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {u.isActive
                      ? <PowerOff className="w-4 h-4 text-amber-400" />
                      : <Power className="w-4 h-4 text-emerald-400" />
                    }
                  </button>
                  {!u.isSystem && (
                    <button
                      id={`btn-delete-bu-${u.id}`}
                      onClick={() => handleDelete(u)}
                      className="p-2 rounded-lg hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {units.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                No Business Units configured yet. Click "New Business Unit" to create one.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? 'Edit Business Unit' : 'New Business Unit'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</div>}

            {!editing && (
              <div>
                <label className="text-sm text-slate-300 block mb-1">Code <span className="text-red-400">*</span></label>
                <input
                  id="input-bu-code"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. LOGISTICS"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono"
                />
              </div>
            )}
            {editing && (
              <div>
                <label className="text-sm text-slate-400 block mb-1">Code (cannot change)</label>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400 font-mono">{editing.code}</div>
              </div>
            )}

            <div>
              <label className="text-sm text-slate-300 block mb-1">Name <span className="text-red-400">*</span></label>
              <input
                id="input-bu-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Logistics Division"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 block mb-1">Description</label>
              <textarea
                id="input-bu-description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Optional description..."
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg text-sm hover:border-slate-400 transition-colors">
                Cancel
              </button>
              <button
                id="btn-save-bu"
                onClick={handleSave}
                disabled={saving || !form.name}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
