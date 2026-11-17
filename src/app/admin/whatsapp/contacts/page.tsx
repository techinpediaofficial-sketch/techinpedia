'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Tag,
  ShieldAlert,
  UserCheck,
  Phone,
  Mail,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  MessageSquare,
  Building,
} from 'lucide-react';

interface ContactItem {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  leadStatus?: string | null;
  source?: string | null;
  tags?: string | null;
  optInStatus?: string;
  marketingOptIn?: boolean;
  isBlacklisted?: boolean;
  createdAt: string;
  lastInteractionAt?: string | null;
  company?: { id: string; name: string } | null;
  conversation?: {
    status: string;
    unreadCount: number;
    lastMessageAt: string;
    lastMessageText: string;
  } | null;
}

export default function WhatsAppContactsPage() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedLeadStatus, setSelectedLeadStatus] = useState('');
  const [selectedOptIn, setSelectedOptIn] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formLeadStatus, setFormLeadStatus] = useState('NEW');
  const [formTags, setFormTags] = useState('');
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [bulkTagAction, setBulkTagAction] = useState<'ADD' | 'REMOVE'>('ADD');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const fetchContacts = async (page = 1) => {
    setLoading(true);
    try {
      const url = new URL('/api/whatsapp/contacts', window.location.origin);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', '20');
      if (search) url.searchParams.set('search', search);
      if (selectedTag) url.searchParams.set('tag', selectedTag);
      if (selectedLeadStatus) url.searchParams.set('leadStatus', selectedLeadStatus);
      if (selectedOptIn) url.searchParams.set('optInStatus', selectedOptIn);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts || []);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(1);
  }, [search, selectedTag, selectedLeadStatus, selectedOptIn]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedContactIds(contacts.map((c) => c.id));
    } else {
      setSelectedContactIds([]);
    }
  };

  const handleSelectContact = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = formTags.split(',').map((t) => t.trim()).filter(Boolean);
      const payload = {
        name: formName,
        phone: formPhone,
        email: formEmail,
        leadStatus: formLeadStatus,
        tags: tagsArray,
      };

      if (editingContact) {
        const res = await fetch(`/api/whatsapp/contacts/${editingContact.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setShowAddModal(false);
          setEditingContact(null);
          fetchContacts(pagination.page);
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to update contact');
        }
      } else {
        const res = await fetch('/api/whatsapp/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setShowAddModal(false);
          setFormName('');
          setFormPhone('');
          setFormEmail('');
          setFormTags('');
          fetchContacts(1);
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to create contact');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error saving contact');
    }
  };

  const handleBulkTag = async () => {
    if (!bulkTagInput.trim()) return;
    try {
      const res = await fetch('/api/whatsapp/tags/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactIds: selectedContactIds,
          tag: bulkTagInput.trim(),
          action: bulkTagAction,
        }),
      });
      if (res.ok) {
        setShowTagModal(false);
        setBulkTagInput('');
        setSelectedContactIds([]);
        fetchContacts(pagination.page);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to apply tags');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to apply tags');
    }
  };

  const handleExport = () => {
    window.location.href = '/api/whatsapp/contacts/export';
  };

  const handleBlacklistToggle = async (contact: ContactItem) => {
    const willBlacklist = !contact.isBlacklisted;
    const confirmMsg = willBlacklist
      ? `Are you sure you want to blacklist ${contact.name || contact.phone}? This will block all marketing broadcasts and automated drips.`
      : `Remove ${contact.name || contact.phone} from blacklist?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/whatsapp/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBlacklisted: willBlacklist,
          optInStatus: willBlacklist ? 'OPTED_OUT' : 'OPTED_IN',
          optOutReason: willBlacklist ? 'Manual Blacklist' : undefined,
        }),
      });
      if (res.ok) {
        fetchContacts(pagination.page);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setImporting(true);
    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        alert('CSV must contain a header row and at least one data row.');
        setImporting(false);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        const obj: any = {};
        headers.forEach((h, idx) => {
          obj[h] = vals[idx] || '';
        });
        rows.push(obj);
      }

      // Detect common column names
      const nameKey = headers.find((h) => /name|full/i.test(h)) || 'name';
      const phoneKey = headers.find((h) => /phone|mobile|whatsapp|number/i.test(h)) || 'phone';
      const emailKey = headers.find((h) => /email|mail/i.test(h)) || 'email';
      const tagsKey = headers.find((h) => /tag|label/i.test(h)) || 'tags';

      const res = await fetch('/api/whatsapp/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows,
          mapping: { name: nameKey, phone: phoneKey, email: emailKey, tags: tagsKey },
          mergeStrategy: 'UPDATE_EXISTING',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportResult(data.summary);
        fetchContacts(1);
      } else {
        alert(data.error || 'Import failed');
      }
    } catch (err: any) {
      alert(err.message || 'CSV Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Contacts</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Centralized multi-tenant directory with WhatsApp 360° telemetry, tags, and consent governance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedContactIds.length > 0 && (
            <button
              onClick={() => setShowTagModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition"
            >
              <Tag className="w-3.5 h-3.5" />
              Tag ({selectedContactIds.length})
            </button>
          )}

          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <button
            onClick={() => {
              setEditingContact(null);
              setFormName('');
              setFormPhone('');
              setFormEmail('');
              setFormTags('');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-neutral-900 p-3.5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={selectedLeadStatus}
          onChange={(e) => setSelectedLeadStatus(e.target.value)}
          className="py-2 px-3 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 dark:text-gray-300"
        >
          <option value="">All Lead Stages</option>
          <option value="NEW">New</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="PROPOSAL">Proposal</option>
          <option value="WON">Won (Customer)</option>
          <option value="LOST">Lost</option>
        </select>

        <select
          value={selectedOptIn}
          onChange={(e) => setSelectedOptIn(e.target.value)}
          className="py-2 px-3 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 dark:text-gray-300"
        >
          <option value="">All Consent Statuses</option>
          <option value="OPTED_IN">Opted In (Eligible)</option>
          <option value="OPTED_OUT">Opted Out (Unsubscribed)</option>
          <option value="UNCONFIRMED">Unconfirmed</option>
        </select>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
          <span>Total Contacts: <b>{pagination.total}</b></span>
          <button
            onClick={() => fetchContacts(pagination.page)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg text-gray-500 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-neutral-800/60 border-b border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={contacts.length > 0 && selectedContactIds.length === contacts.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">WhatsApp / Phone</th>
                <th className="p-3.5">Tags</th>
                <th className="p-3.5">Stage & Source</th>
                <th className="p-3.5">Consent Status</th>
                <th className="p-3.5">Last Activity</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {loading && contacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading contacts directory...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-neutral-700" />
                    <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">No contacts found</p>
                    <p className="text-xs text-gray-400 mt-1">Add contacts or import a CSV file to get started.</p>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => {
                  let parsedTags: string[] = [];
                  try {
                    if (contact.tags) {
                      const p = JSON.parse(contact.tags);
                      if (Array.isArray(p)) parsedTags = p;
                      else parsedTags = [String(contact.tags)];
                    }
                  } catch {
                    parsedTags = contact.tags ? contact.tags.split(',') : [];
                  }

                  const isOptedOut = contact.optInStatus === 'OPTED_OUT' || contact.isBlacklisted;

                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-gray-50/70 dark:hover:bg-neutral-800/40 transition ${
                        selectedContactIds.includes(contact.id) ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact.id)}
                          onChange={() => handleSelectContact(contact.id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>

                      <td className="p-3.5">
                        <Link
                          href={`/admin/whatsapp/contacts/${contact.id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5"
                        >
                          {contact.name || 'Unnamed Contact'}
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        </Link>
                        {contact.email && (
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {contact.email}
                          </div>
                        )}
                        {contact.company && (
                          <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Building className="w-2.5 h-2.5" />
                            {contact.company.name}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono text-gray-800 dark:text-gray-200 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {contact.phone || '—'}
                        </div>
                        {contact.conversation && (
                          <div className="text-[10px] text-gray-400 truncate max-w-[180px] mt-0.5">
                            Last: "{contact.conversation.lastMessageText || 'Chat active'}"
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {parsedTags.length > 0 ? (
                            parsedTags.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              >
                                {t.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-[11px]">No tags</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
                          {contact.leadStatus || 'NEW'}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-1">Source: {contact.source || 'MANUAL'}</div>
                      </td>

                      <td className="p-3.5">
                        {contact.isBlacklisted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800">
                            <ShieldAlert className="w-3 h-3" />
                            Blacklisted
                          </span>
                        ) : contact.optInStatus === 'OPTED_OUT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <XCircle className="w-3 h-3" />
                            Opted Out
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Opted In
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-gray-500 text-[11px]">
                        {contact.lastInteractionAt
                          ? new Date(contact.lastInteractionAt).toLocaleDateString()
                          : new Date(contact.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/whatsapp/contacts/${contact.id}`}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition"
                            title="360° Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => {
                              setEditingContact(contact);
                              setFormName(contact.name || '');
                              setFormPhone(contact.phone || '');
                              setFormEmail(contact.email || '');
                              setFormLeadStatus(contact.leadStatus || 'NEW');
                              setFormTags(parsedTags.join(', '));
                              setShowAddModal(true);
                            }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg text-gray-600 dark:text-gray-400 hover:text-blue-600 transition"
                            title="Edit Contact"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleBlacklistToggle(contact)}
                            className={`p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition ${
                              contact.isBlacklisted ? 'text-red-600' : 'text-gray-400 hover:text-red-500'
                            }`}
                            title={contact.isBlacklisted ? 'Remove Blacklist' : 'Blacklist Number'}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-3.5 border-t border-gray-200 dark:border-neutral-800 text-xs">
            <span className="text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} contacts)
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchContacts(pagination.page - 1)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-md disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchContacts(pagination.page + 1)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-md disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingContact ? 'Edit WhatsApp Contact' : 'Create New Contact'}
            </h2>

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  WhatsApp Number (with Country Code)
                </label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. +91 98187 68680"
                  className="w-full px-3 py-2 text-xs font-mono bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="ramesh@company.com"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Lead Stage
                </label>
                <select
                  value={formLeadStatus}
                  onChange={(e) => setFormLeadStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="NEW">New</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="PROPOSAL">Proposal</option>
                  <option value="WON">Won (Customer)</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Hot Lead, Lucknow, VIP"
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {editingContact ? 'Save Changes' : 'Create Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              Bulk Tag Contacts ({selectedContactIds.length} selected)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Apply or remove a tag from all currently selected contacts simultaneously.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkTagAction('ADD')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border ${
                      bulkTagAction === 'ADD'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-800'
                        : 'border-gray-200 dark:border-neutral-700 text-gray-600'
                    }`}
                  >
                    Add Tag
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkTagAction('REMOVE')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border ${
                      bulkTagAction === 'REMOVE'
                        ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:border-red-800'
                        : 'border-gray-200 dark:border-neutral-700 text-gray-600'
                    }`}
                  >
                    Remove Tag
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tag Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Client"
                  value={bulkTagInput}
                  onChange={(e) => setBulkTagInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-5">
              <button
                type="button"
                onClick={() => setShowTagModal(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkTag}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Import Contacts from CSV</h3>
            <p className="text-xs text-gray-500 mb-4">
              Upload a CSV file containing columns for Name, Phone, and Email. Duplicates in your company will be updated safely.
            </p>

            <form onSubmit={handleCsvImport} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setCsvFile(e.target.files[0]);
                  }}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 mt-2">
                  Sample columns: <code>Name, Phone, Email, Tags, LeadStatus</code>
                </p>
              </div>

              {importResult && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300">Import Complete!</div>
                  <div className="text-gray-600 dark:text-gray-300">
                    Imported: <b>{importResult.imported}</b> • Updated: <b>{importResult.updated}</b> • Skipped: <b>{importResult.skipped}</b>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                    setCsvFile(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!csvFile || importing}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  {importing ? 'Processing Import...' : 'Start Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
