'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  Phone,
  Mail,
  Building,
  Tag,
  MessageSquare,
  Send,
  Calendar,
  DollarSign,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Edit2,
  Trash2,
  UserCheck,
  FileText,
  AlertCircle,
  ChevronRight,
  Brain,
  Bot,
  Sparkles,
} from 'lucide-react';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'whatsapp' | 'crm' | 'marketing' | 'consent' | 'ai'>('profile');
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLeadStatus, setEditLeadStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const fetchContact = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/contacts/${id}`);
      const data = await res.json();
      if (data.success && data.contact) {
        setContact(data.contact);
        setEditName(data.contact.name || '');
        setEditPhone(data.contact.phone || '');
        setEditEmail(data.contact.email || '');
        setEditLeadStatus(data.contact.leadStatus || 'NEW');
        setEditNotes(data.contact.notes || '');
      } else {
        alert(data.error || 'Contact not found');
      }
    } catch (err) {
      console.error('Failed to load contact 360:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContact();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/whatsapp/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          email: editEmail,
          leadStatus: editLeadStatus,
          notes: editNotes,
        }),
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchContact();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update contact');
      }
    } catch (err: any) {
      alert(err.message || 'Update failed');
    }
  };

  const handleBlacklistToggle = async () => {
    if (!contact) return;
    const willBlacklist = !contact.isBlacklisted;
    if (!confirm(willBlacklist ? 'Blacklist this contact from all WhatsApp marketing?' : 'Remove from blacklist?')) return;

    try {
      const res = await fetch(`/api/whatsapp/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBlacklisted: willBlacklist,
          optInStatus: willBlacklist ? 'OPTED_OUT' : 'OPTED_IN',
        }),
      });
      if (res.ok) fetchContact();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs text-gray-500 font-medium">Loading Contact 360° Profile...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Contact not found.</p>
        <Link href="/admin/whatsapp/contacts" className="text-xs text-emerald-600 font-medium mt-2 inline-block">
          Return to contacts
        </Link>
      </div>
    );
  }

  let tagsArray: string[] = [];
  try {
    if (contact.tags) {
      const p = JSON.parse(contact.tags);
      if (Array.isArray(p)) tagsArray = p;
      else tagsArray = [String(contact.tags)];
    }
  } catch {
    tagsArray = contact.tags ? contact.tags.split(',') : [];
  }

  let customFieldsObj: any = {};
  try {
    if (contact.customFields) customFieldsObj = JSON.parse(contact.customFields);
  } catch {}

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Back and Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/whatsapp/contacts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/whatsapp?tab=inbox&conversationId=${contact.whatsappStats?.conversations?.[0]?.id || ''}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Open in Inbox
          </Link>

          <Link
            href={`/admin/whatsapp/single-send?phone=${encodeURIComponent(contact.phone || '')}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 transition"
          >
            <Send className="w-3.5 h-3.5" />
            Single Send
          </Link>

          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Profile
          </button>

          <button
            onClick={handleBlacklistToggle}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              contact.isBlacklisted
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {contact.isBlacklisted ? 'Blacklisted' : 'Blacklist'}
          </button>
        </div>
      </div>

      {/* Hero Contact Card */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {contact.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{contact.name || 'Unnamed Contact'}</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {contact.leadStatus || 'NEW'}
                </span>
                {contact.isBlacklisted ? (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Blacklisted
                  </span>
                ) : contact.optInStatus === 'OPTED_OUT' ? (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Opted Out
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> WhatsApp Opted-In
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span className="flex items-center gap-1 font-mono text-gray-800 dark:text-gray-200">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {contact.phone || 'No Phone'}
                </span>
                {contact.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {contact.email}
                  </span>
                )}
                {contact.company && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-gray-400" />
                    {contact.company.name}
                  </span>
                )}
                {contact.assignedUser && (
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                    Assigned: {contact.assignedUser.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-gray-200 dark:border-neutral-800 pt-4 md:pt-0 md:pl-6 text-center">
            <div className="p-2.5 bg-gray-50 dark:bg-neutral-800/60 rounded-xl">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {contact.whatsappStats?.total || 0}
              </div>
              <div className="text-[10px] text-gray-400 uppercase font-medium">Messages</div>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-neutral-800/60 rounded-xl">
              <div className="text-lg font-bold text-emerald-600">
                {contact.crm?.leads?.length || 0}
              </div>
              <div className="text-[10px] text-gray-400 uppercase font-medium">CRM Leads</div>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-neutral-800/60 rounded-xl">
              <div className="text-lg font-bold text-purple-600">
                {contact.marketing?.broadcasts?.length || 0}
              </div>
              <div className="text-[10px] text-gray-400 uppercase font-medium">Campaigns</div>
            </div>
          </div>
        </div>

        {/* Tags Row */}
        {tagsArray.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <span className="text-[11px] text-gray-400 mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags:
            </span>
            {tagsArray.map((t, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
              >
                {t.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-neutral-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          360° Profile Details
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
            activeTab === 'whatsapp'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp Telemetry ({contact.whatsappStats?.conversationsCount || 0})
        </button>

        <button
          onClick={() => setActiveTab('crm')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
            activeTab === 'crm'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          CRM Leads & Deals ({contact.crm?.leads?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('marketing')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
            activeTab === 'marketing'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          Marketing & Drips ({contact.marketing?.broadcasts?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('consent')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
            activeTab === 'consent'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Consent & Audit
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
            activeTab === 'ai'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4 text-violet-500" />
          AI Journey & Bot Telemetry
        </button>
      </div>

      {/* Tab 1: Profile Details */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" /> Personal & Professional Info
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block">Job Title</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{contact.jobTitle || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Department</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{contact.department || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Source</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{contact.source || 'MANUAL'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Created Date</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {contact.notes && (
              <div className="pt-3 border-t border-gray-100 dark:border-neutral-800">
                <span className="text-gray-400 text-xs block mb-1">Internal Notes</span>
                <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-neutral-800/60 p-3 rounded-lg">
                  {contact.notes}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-600" /> Custom Attributes & Metadata
            </h3>

            {Object.keys(customFieldsObj).length === 0 ? (
              <p className="text-xs text-gray-400 italic">No custom fields assigned to this contact.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(customFieldsObj).map(([k, v]: [string, any]) => (
                  <div key={k} className="p-2.5 bg-gray-50 dark:bg-neutral-800/60 rounded-lg">
                    <span className="text-gray-400 capitalize block text-[11px]">{k.replace(/_/g, ' ')}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: WhatsApp Telemetry */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">WhatsApp Conversation History</h3>
            <span className="text-xs text-gray-500">
              Total Messages: <b>{contact.whatsappStats?.total || 0}</b> (Sent: {contact.whatsappStats?.sent || 0} • Received: {contact.whatsappStats?.received || 0})
            </span>
          </div>

          {contact.whatsappStats?.conversations?.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">No active WhatsApp conversations recorded yet.</div>
          ) : (
            <div className="space-y-4">
              {contact.whatsappStats.conversations.map((conv: any) => (
                <div key={conv.id} className="border border-gray-200 dark:border-neutral-800 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-2 mb-3 text-xs">
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                      Chat with: <b>{conv.waNumber}</b>
                    </span>
                    <span className="text-gray-400">
                      Last Message: {new Date(conv.lastMessageAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {conv.messages?.map((m: any) => {
                      const isOutbound = m.direction === 'OUTBOUND';
                      return (
                        <div key={m.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[70%] p-2.5 rounded-xl text-xs ${
                              isOutbound
                                ? 'bg-emerald-600 text-white rounded-br-none'
                                : 'bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
                            }`}
                          >
                            <p>{m.textBody || `[${m.type}]`}</p>
                            <div className="text-[10px] opacity-70 text-right mt-1">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {m.status}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: CRM Leads */}
      {activeTab === 'crm' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Associated CRM Leads</h3>

          {contact.crm?.leads?.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">No CRM leads tied to this contact.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-neutral-800">
              {contact.crm.leads.map((lead: any) => (
                <div key={lead.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">{lead.name || 'CRM Lead'}</span>
                    <span className="ml-2 text-gray-400">{lead.service || 'General Service'}</span>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Created: {new Date(lead.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 uppercase">
                    {lead.stage || lead.status || 'NEW'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Marketing Campaigns & Drips */}
      {activeTab === 'marketing' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Broadcast Delivery History</h3>

            {contact.marketing?.broadcasts?.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">No broadcast campaigns received yet.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                {contact.marketing.broadcasts.map((b: any) => (
                  <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {b.campaign?.name || 'WhatsApp Broadcast'}
                      </span>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Sent: {b.sentAt ? new Date(b.sentAt).toLocaleString() : 'Queued'}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase ${
                        b.status === 'DELIVERED' || b.status === 'READ'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : b.status === 'FAILED'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Drip Campaign Enrollments</h3>

            {contact.marketing?.drips?.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">Not enrolled in any drip sequences.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                {contact.marketing.drips.map((d: any) => (
                  <div key={d.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {d.campaign?.name || 'Drip Sequence'}
                      </span>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Enrolled: {new Date(d.enrolledAt).toLocaleDateString()} • Next Action: {d.nextActionAt ? new Date(d.nextActionAt).toLocaleString() : 'None'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 uppercase">
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Consent & Compliance */}
      {activeTab === 'consent' && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> WhatsApp Consent & Anti-Spam Governance
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-neutral-800/60 rounded-xl">
              <span className="text-gray-400 block mb-1">WhatsApp Communication Opt-In</span>
              <span className="font-semibold text-gray-900 dark:text-white">{contact.optInStatus || 'OPTED_IN'}</span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-neutral-800/60 rounded-xl">
              <span className="text-gray-400 block mb-1">Promotional Marketing Eligible</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {contact.marketingOptIn ? 'YES (Eligible for Broadcasts & Drips)' : 'NO (Transactional Only)'}
              </span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-neutral-800/60 rounded-xl">
              <span className="text-gray-400 block mb-1">Consent Source</span>
              <span className="font-semibold text-gray-900 dark:text-white">{contact.consentSource || 'MANUAL_ENTRY'}</span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-neutral-800/60 rounded-xl">
              <span className="text-gray-400 block mb-1">Consent Timestamp</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {contact.consentTimestamp ? new Date(contact.consentTimestamp).toLocaleString() : '—'}
              </span>
            </div>
          </div>

          {contact.optOutReason && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 text-xs">
              <span className="text-red-800 dark:text-red-300 font-semibold block mb-0.5">Opt-Out / Blacklist Details:</span>
              <p className="text-red-600 dark:text-red-400">
                Reason: {contact.optOutReason} • Recorded: {contact.optOutTimestamp ? new Date(contact.optOutTimestamp).toLocaleString() : 'N/A'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: AI Journey & Bot Telemetry */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm">
              <span className="text-xs text-gray-500 block mb-1">AI Interactions</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Active</span>
              <span className="text-[11px] text-gray-400 block mt-1">Tenant isolated knowledge engine</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm">
              <span className="text-xs text-gray-500 block mb-1">Lead Lifecycle Stage</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{contact.leadStatus || 'NEW'}</span>
              <span className="text-[11px] text-gray-400 block mt-1">Qualified via WhatsApp interactions</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm">
              <span className="text-xs text-gray-500 block mb-1">Bot / Human Handoff State</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {contact.whatsappStats?.conversations?.[0]?.isAiPaused ? 'Paused (Human Staff Active)' : 'Active (AI Auto-Reply)'}
              </span>
              <span className="text-[11px] text-gray-400 block mt-1">
                {contact.whatsappStats?.conversations?.[0]?.lastAiHandoffReason || 'No handoffs recorded'}
              </span>
            </div>
          </div>

          {/* AI Extracted Qualification Profile */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              AI-Extracted Lead Qualification Fields
            </h3>

            {Object.keys(customFieldsObj).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                {Object.entries(customFieldsObj).map(([k, v]: any) => (
                  <div key={k} className="p-3 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
                    <span className="text-gray-400 uppercase font-mono text-[10px] block mb-0.5">{k}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                No custom qualification fields extracted yet. When the customer interacts with the AI Assistant or Chatbot, qualification fields (service required, budget, timeline) will automatically populate here.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Edit Contact</h2>
            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">WhatsApp Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 font-mono bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Lead Stage</label>
                <select
                  value={editLeadStatus}
                  onChange={(e) => setEditLeadStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                >
                  <option value="NEW">New</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="PROPOSAL">Proposal</option>
                  <option value="WON">Won (Customer)</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 font-semibold bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
