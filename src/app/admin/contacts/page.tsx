'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Mail,
  Phone,
  Building,
  UserCheck,
  MessageSquare,
  AlertCircle,
  X,
  Briefcase,
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  isPrimary: boolean;
  notes?: string | null;
  createdAt: string;
  company?: { id: string; name: string } | null;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    companyName: '',
    isPrimary: false,
    notes: '',
  });

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/crm/contacts', window.location.origin);
      if (search) url.searchParams.set('search', search);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok) {
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          jobTitle: '',
          department: '',
          companyName: '',
          isPrimary: false,
          notes: '',
        });
        fetchContacts();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create contact');
      }
    } catch (err) {
      console.error('Failed to create contact:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">CRM Contacts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Directory of corporate decision-makers, stakeholders, and point-of-contacts.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by contact name, email, phone, or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          />
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3">Contact Person</th>
                <th className="px-5 py-3">Designation & Role</th>
                <th className="px-5 py-3">Company Account</th>
                <th className="px-5 py-3">Contact Channels</th>
                <th className="px-5 py-3 text-right">Direct Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
                    <p className="text-sm">Loading contacts...</p>
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
                    <AlertCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-200">No contacts registered yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add your first stakeholder or sync from website leads.</p>
                  </td>
                </tr>
              ) : (
                contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-violet-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{c.name}</span>
                        {c.isPrimary && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                            Primary
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{c.email}</span>
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-700 dark:text-slate-200">
                      <div className="font-medium flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {c.jobTitle || 'Business Stakeholder'}
                      </div>
                      {c.department && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">Dept: {c.department}</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs">
                      {c.company ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                          <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          {c.company.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">Individual Contact</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-600 text-slate-500 dark:text-slate-400">
                      <div>{c.phone || 'No phone'}</div>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {c.phone && (
                          <a
                            href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        )}
                        <a
                          href={`mailto:${c.email}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Business Contact</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="e.g. Rahul"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="e.g. Malhotra"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="rahul@company.com"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Designation / Title</label>
                  <input
                    type="text"
                    value={form.jobTitle}
                    onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="e.g. CTO / IT Director"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    placeholder="e.g. Technology / Procurement"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={form.isPrimary}
                  onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
                  className="rounded text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="isPrimary" className="text-slate-700 dark:text-slate-700 dark:text-slate-200 font-medium">
                  Primary account decision maker
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md disabled:opacity-50"
                >
                  {creating ? 'Saving...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
