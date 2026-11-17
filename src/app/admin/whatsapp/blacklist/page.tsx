'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Phone,
  UserX,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface BlacklistItem {
  id: string;
  phone: string;
  reason?: string | null;
  source?: string | null;
  optedOutAt: string;
  notes?: string | null;
}

export default function WhatsAppBlacklistPage() {
  const [items, setItems] = useState<BlacklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('USER_REQUEST');
  const [notes, setNotes] = useState('');

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/whatsapp/blacklist', window.location.origin);
      if (search) url.searchParams.set('search', search);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, [search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/whatsapp/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, reason, notes }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setPhone('');
        setNotes('');
        fetchBlacklist();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add number');
      }
    } catch (err: any) {
      alert(err.message || 'Error adding number');
    }
  };

  const handleRemove = async (phoneNum: string) => {
    if (!confirm(`Remove ${phoneNum} from blacklist? This will re-enable outbound messaging if contact has opted in.`)) return;
    try {
      const res = await fetch(`/api/whatsapp/blacklist?phone=${encodeURIComponent(phoneNum)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchBlacklist();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-xl border border-red-200/50 dark:border-red-800/40 shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blacklist & DND Governance</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Central suppression repository. All outbound broadcasts, drips, and automated sends strictly block blacklisted recipients.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add to Blacklist
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
        <div>
          <b>Centralized Enforcement Guarantee:</b> Every outbound marketing send calls the central <code>canSendWhatsAppMessage</code> service before dispatching. Blacklisted numbers are automatically excluded during campaign audience resolution and cannot be messaged.
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-gray-200 dark:border-neutral-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="text-xs text-gray-500">
          Total Suppressed: <b>{items.length}</b>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 dark:bg-neutral-800/60 border-b border-gray-200 dark:border-neutral-800 text-gray-500 uppercase font-semibold">
            <tr>
              <th className="p-3.5">Suppressed Number</th>
              <th className="p-3.5">Reason</th>
              <th className="p-3.5">Source</th>
              <th className="p-3.5">Added Date</th>
              <th className="p-3.5">Notes</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600" />
                  Loading blacklist...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-500">
                  <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Blacklist is empty</p>
                  <p className="text-xs text-gray-400 mt-1">No phone numbers have been blacklisted or suppressed.</p>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-neutral-800/40 transition">
                  <td className="p-3.5 font-mono font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-red-600" />
                    {item.phone}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                      {item.reason || 'USER_REQUEST'}
                    </span>
                  </td>
                  <td className="p-3.5 text-gray-600 dark:text-gray-400">
                    {item.source || 'ADMIN_MANUAL'}
                  </td>
                  <td className="p-3.5 text-gray-500 text-[11px]">
                    {new Date(item.optedOutAt).toLocaleString()}
                  </td>
                  <td className="p-3.5 text-gray-500 max-w-xs truncate">
                    {item.notes || '—'}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleRemove(item.phone)}
                      className="px-2.5 py-1 text-xs font-semibold rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Add Phone Number to Blacklist</h2>
            <p className="text-xs text-gray-500 mb-4">
              The recipient will be blocked from receiving all marketing broadcasts and automated drips.
            </p>

            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Phone Number (with Country Code)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98187 68680"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 font-mono bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                >
                  <option value="USER_REQUEST">User Requested DND / Unsubscribe</option>
                  <option value="STOP_REPLY">Sent 'STOP' keyword reply</option>
                  <option value="INVALID_NUMBER">Invalid / Undeliverable Number</option>
                  <option value="COMPLAINT">Spam Complaint</option>
                  <option value="ADMIN_MANUAL">Admin Discretion</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional details regarding this blacklist entry..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Confirm Blacklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
