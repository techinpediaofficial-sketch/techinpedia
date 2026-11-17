'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  CreditCard,
  Briefcase,
  Monitor,
  Headphones,
  FileText,
  Clock,
  Plus,
  DollarSign,
  Calendar,
  CheckCircle2,
  X,
  AlertCircle,
  Users,
  ShieldCheck,
  MessageSquare,
  Send,
  Sparkles,
  Layers,
  Activity,
  User,
  ArrowUpRight,
  Check,
  ChevronRight,
  Tag,
  Laptop,
  Video,
} from 'lucide-react';
import GeneratePaymentLinkModal from '@/components/admin/GeneratePaymentLinkModal';
import ScheduleMeetingModal from '@/components/admin/ScheduleMeetingModal';

export default function Customer360Page() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<any | null>(null);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'deals'
    | 'followups'
    | 'meetings'
    | 'timeline'
    | 'projects'
    | 'invoices'
    | 'rentals'
    | 'subscriptions'
    | 'tickets'
    | 'whatsapp'
  >('overview');
  const [customerMeetings, setCustomerMeetings] = useState<any[]>([]);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [whatsappConversation, setWhatsappConversation] = useState<any | null>(null);
  const [outboundMessage, setOutboundMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Quick Follow-up Modal State
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpType, setFollowUpType] = useState('CALL');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [schedulingFollowUp, setSchedulingFollowUp] = useState(false);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);

  const fetchCustomer360 = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const [res, resMeetings] = await Promise.all([
        fetch(`/api/crm/customers/${customerId}`),
        fetch(`/api/meetings?customerId=${customerId}`),
      ]);
      const data = await res.json();
      const dataMeetings = await resMeetings.json();

      if (res.ok && data.customer) {
        setCustomer(data.customer);
        setMetrics(data.metrics);
        if (data.whatsappConversation) {
          setWhatsappConversation(data.whatsappConversation);
        }
      } else {
        router.push('/admin/customers');
      }

      if (dataMeetings?.meetings) {
        setCustomerMeetings(dataMeetings.meetings);
      }
    } catch (err) {
      console.error('Failed to load customer 360:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer360();
  }, [customerId]);

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedulingFollowUp(true);
    try {
      const res = await fetch('/api/crm/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: followUpTitle,
          type: followUpType,
          scheduledAt: followUpDate,
          customerId,
          notes: followUpNotes,
        }),
      });
      if (res.ok) {
        setShowFollowUpModal(false);
        setFollowUpTitle('');
        setFollowUpNotes('');
        setFollowUpDate('');
        fetchCustomer360();
      }
    } catch (err) {
      console.error('Failed to schedule follow-up:', err);
    } finally {
      setSchedulingFollowUp(false);
    }
  };

  const handleQuickReschedule = async (followUpId: string, hoursToAdd: number) => {
    try {
      const newTime = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000).toISOString();
      const res = await fetch(`/api/crm/followups/${followUpId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: newTime,
          status: 'PENDING',
        }),
      });
      if (res.ok) {
        fetchCustomer360();
      }
    } catch (err) {
      console.error('Failed to reschedule follow-up:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 dark:text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent mb-2"></div>
        <p className="text-sm font-medium">Loading Customer 360° Profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20 text-slate-500 dark:text-slate-400">
        <AlertCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
        <p className="font-semibold text-slate-800 dark:text-slate-100">Customer record not found</p>
        <Link href="/admin/customers" className="text-xs text-violet-600 mt-2 inline-block">
          Return to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Back Link & Identity Header */}
      <div>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers Directory</span>
        </Link>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{customer.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {customer.status}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200">
                  Customer 360°
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {customer.email}
                </span>
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {customer.phone}
                  </span>
                )}
                {customer.company && (
                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-medium">
                    <Building className="w-3.5 h-3.5 text-violet-600" />
                    {customer.company.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-4 divide-x divide-slate-200 dark:divide-slate-800 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800/80">
            <div className="px-3">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Total Paid
              </span>
              <span className="text-xl font-bold text-emerald-600">
                ₹{(metrics?.totalPaid || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="px-3">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Outstanding Due
              </span>
              <span className="text-xl font-bold text-red-600">
                ₹{(metrics?.outstanding || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="px-3">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Active Rentals
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{metrics?.activeRentals || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-semibold text-slate-600 dark:text-slate-400 pb-0.5">
        {[
          { key: 'overview', label: 'Overview 360°' },
          { key: 'deals', label: `Sales Deals (${customer.deals?.length || 0})` },
          { key: 'followups', label: `Follow-ups (${customer.followUps?.length || 0})` },
          { key: 'meetings', label: `Meetings & Meet (${customerMeetings?.length || 0})` },
          { key: 'timeline', label: `Activity Timeline (${customer.timelineEvents?.length || 0})` },
          { key: 'rentals', label: `Hardware Rentals (${customer.rentalOrders?.length || 0})` },
          { key: 'projects', label: `Projects (${customer.projects?.length || 0})` },
          { key: 'invoices', label: `Invoices & Billing (${customer.invoices?.length || 0})` },
          { key: 'subscriptions', label: `SaaS Subscriptions (${customer.subscriptions?.length || 0})` },
          { key: 'tickets', label: `Support Tickets (${customer.tickets?.length || 0})` },
          { key: 'whatsapp', label: `WhatsApp Desk (${whatsappConversation?.messages?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3.5 py-2.5 rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
              activeTab === tab.key
                ? 'border-violet-600 text-violet-700 dark:text-violet-400 bg-white dark:bg-slate-900 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-950'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Account Profile & Notes */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account Information</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Customer ID</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{customer.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Joined Since</span>
                  <span className="text-slate-800 dark:text-slate-100 font-medium">
                    {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Internal Account Notes</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-1 italic bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                    {customer.notes || 'No specific notes on file for this account.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Associated Contacts */}
            {customer.company?.contacts && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Authorized Contacts</span>
                  <span className="text-violet-600">({customer.company.contacts.length})</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {customer.company.contacts.map((c: any) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                      <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">{c.jobTitle || 'Executive'}</div>
                      <div className="text-violet-600 mt-1">{c.email}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Active Engagements Stream */}
          <div className="md:col-span-2 space-y-6">
            {/* Deals Summary Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-violet-600" />
                  Active Sales Deals & Pipeline
                </h3>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {customer.deals?.length || 0} Deals
                </span>
              </div>
              {customer.deals && customer.deals.length > 0 ? (
                <div className="space-y-2.5">
                  {customer.deals.map((deal: any) => (
                    <div
                      key={deal.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{deal.title}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          Stage: {deal.stage?.name || 'General'} • Probability: {deal.probability}%
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600 text-sm">
                          ₹{deal.value.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {deal.items?.length || 0} line items
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No sales deals associated with this customer.</p>
              )}
            </div>

            {/* Hardware Rentals Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-600" />
                  Active IT Hardware Rentals
                </h3>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {customer.rentalOrders?.length || 0} Orders
                </span>
              </div>
              {customer.rentalOrders && customer.rentalOrders.length > 0 ? (
                <div className="space-y-3">
                  {customer.rentalOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="p-3.5 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{order.orderNumber}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          {order.items?.length || 0} Assets Allocated • Billing: {order.billingCycle}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-700 dark:text-blue-400">
                          ₹{order.monthlyRate.toLocaleString('en-IN')}/mo
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No active hardware rentals under this account.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. DEALS TAB */}
      {activeTab === 'deals' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Customer Sales Deals & Line Items</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">All proposals, negotiations, and closed contracts.</p>
            </div>
            <Link
              href="/admin/deals"
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Open Deals Kanban
            </Link>
          </div>

          {customer.deals && customer.deals.length > 0 ? (
            <div className="space-y-4">
              {customer.deals.map((deal: any) => (
                <div key={deal.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{deal.title}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Created: {new Date(deal.createdAt).toLocaleDateString('en-IN')} • Pipeline: {deal.pipeline?.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 text-base">
                        ₹{deal.value.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[11px] font-semibold text-slate-500">
                        Stage: {deal.stage?.name || 'Active'} ({deal.probability}%)
                      </span>
                    </div>
                  </div>

                  {/* Line Items Details */}
                  {deal.items && deal.items.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-2">Itemized Deliverables:</span>
                      <div className="space-y-1.5">
                        {deal.items.map((it: any) => (
                          <div key={it.id} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-800 dark:text-slate-200">{it.title} (Qty: {it.quantity})</span>
                            <span className="font-bold text-slate-900 dark:text-white">₹{it.total.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No sales deals logged for this customer.</p>
          )}
        </div>
      )}

      {/* 3. FOLLOW-UPS TAB */}
      {activeTab === 'followups' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Customer Follow-up Tasks</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled phone calls, meetings, WhatsApp check-ins, and demonstrations.</p>
            </div>
            <button
              onClick={() => setShowFollowUpModal(true)}
              className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Schedule Follow-up
            </button>
          </div>

          {customer.followUps && customer.followUps.length > 0 ? (
            <div className="space-y-3">
              {customer.followUps.map((f: any) => {
                const isOverdue = new Date(f.scheduledAt) < new Date() && f.status === 'PENDING';
                return (
                  <div
                    key={f.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{f.title}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        Scheduled: {new Date(f.scheduledAt).toLocaleString('en-IN')} • Type: {f.type}
                      </div>
                      {f.notes && <p className="text-slate-600 dark:text-slate-400 mt-1 italic">{f.notes}</p>}
                      {f.outcome && (
                        <div className="text-[11px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded mt-1 inline-block border border-emerald-200">
                          Outcome: {f.outcome}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          f.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isOverdue
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {f.status}
                      </span>
                      {f.status === 'PENDING' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQuickReschedule(f.id, 24)}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-[10px] font-semibold"
                            title="Reschedule +24h"
                          >
                            +24h
                          </button>
                          <button
                            onClick={() => handleQuickReschedule(f.id, 72)}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded text-[10px] font-semibold"
                            title="Reschedule +3d"
                          >
                            +3d
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No scheduled follow-up tasks for this customer.</p>
          )}
        </div>
      )}

      {/* MEETINGS TAB */}
      {activeTab === 'meetings' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-500" />
                Customer Meetings & Google Meet Sessions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled discovery calls, product demonstrations, and technical reviews.
              </p>
            </div>
            <button
              onClick={() => setShowMeetingModal(true)}
              className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Meeting</span>
            </button>
          </div>

          {customerMeetings && customerMeetings.length > 0 ? (
            <div className="space-y-3">
              {customerMeetings.map((m: any) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {m.status}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {m.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>
                        {new Date(m.startTime).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      {m.hostEmployee && (
                        <span>• Host: <strong>{m.hostEmployee.name}</strong></span>
                      )}
                    </p>
                    {m.outcome && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        Outcome: {m.outcome.replace(/_/g, ' ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {m.conferenceLink && m.status !== 'CANCELLED' && (
                      <a
                        href={m.conferenceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Meet</span>
                      </a>
                    )}
                    <Link
                      href="/admin/meetings"
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Desk View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No meetings scheduled with this customer yet.
              </p>
              <button
                onClick={() => setShowMeetingModal(true)}
                className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
              >
                + Schedule a Google Meet now
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. TIMELINE TAB */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Unified Activity Timeline & Audit Stream</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">All inbound queries, deal stage moves, follow-up outcomes, and milestone records.</p>
          </div>

          {customer.timelineEvents && customer.timelineEvents.length > 0 ? (
            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {customer.timelineEvents.map((evt: any) => (
                <div key={evt.id} className="relative flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold shrink-0 border border-white dark:border-slate-900 shadow-xs">
                    •
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{evt.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(evt.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {evt.description && (
                      <p className="text-slate-600 dark:text-slate-400 mt-1 text-[11px] leading-relaxed">
                        {evt.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No timeline events recorded yet.</p>
          )}
        </div>
      )}

      {/* 5. RENTALS TAB */}
      {activeTab === 'rentals' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Rental Orders & Provisioned Assets</h2>
          {customer.rentalOrders && customer.rentalOrders.length > 0 ? (
            <div className="space-y-4">
              {customer.rentalOrders.map((order: any) => (
                <div key={order.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80 text-xs">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{order.orderNumber}</span>
                      <span className="text-slate-400 ml-2">
                        {new Date(order.startDate).toLocaleDateString('en-IN')} -{' '}
                        {new Date(order.endDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      {order.status}
                    </span>
                  </div>
                  <div className="mt-3 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-2">Allocated Equipment:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800/80 text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">{item.asset?.model || 'Laptop Asset'}</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">S/N: {item.asset?.serialNumber || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No hardware rentals found for this account.</p>
          )}
        </div>
      )}

      {/* 6. PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Custom Client Projects</h2>
          {customer.projects && customer.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.projects.map((p: any) => (
                <div key={p.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">{p.description || 'No description provided.'}</p>
                  <div className="mt-3 flex items-center justify-between text-slate-700 dark:text-slate-200 font-medium">
                    <span>Budget: ₹{p.budget.toLocaleString('en-IN')}</span>
                    <span>Progress: {p.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No engineering projects found for this account.</p>
          )}
        </div>
      )}

      {/* 7. INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Billing Invoices & Payment Receipts</h2>
            <button
              onClick={() => setShowPaymentLinkModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-all flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Generate Payment Link</span>
            </button>
          </div>
          {customer.invoices && customer.invoices.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold pb-2">
                  <th className="py-2">Invoice #</th>
                  <th className="py-2">Issue Date</th>
                  <th className="py-2">Due Date</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {customer.invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:bg-slate-950">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">{new Date(inv.issueDate).toLocaleDateString('en-IN')}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400">{new Date(inv.dueDate).toLocaleDateString('en-IN')}</td>
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-slate-400 italic">No invoices recorded for this account.</p>
          )}
        </div>
      )}

      {/* 8. SAAS SUBSCRIPTIONS TAB */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">SaaS Subscriptions & Product Licenses</h2>
          {customer.subscriptions && customer.subscriptions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.subscriptions.map((sub: any) => (
                <div key={sub.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {sub.product?.name || 'SaaS Product'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-800">
                      {sub.status}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Plan: {sub.plan?.name || 'Standard'} • Interval: {sub.interval || 'Monthly'}
                  </div>
                  <div className="font-bold text-emerald-600 text-sm">
                    ₹{sub.price?.toLocaleString('en-IN') || 0}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No active SaaS product subscriptions found for this client.</p>
          )}
        </div>
      )}

      {/* 9. TICKETS TAB */}
      {activeTab === 'tickets' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Support & Help Desk Tickets</h2>
          {customer.tickets && customer.tickets.length > 0 ? (
            <div className="space-y-3">
              {customer.tickets.map((t: any) => (
                <div key={t.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{t.title || t.ticketNumber}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Created: {new Date(t.createdAt).toLocaleDateString('en-IN')} • Priority: {t.priority}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No support tickets opened by this customer.</p>
          )}
        </div>
      )}

      {/* 10. WHATSAPP HISTORY TAB */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                WhatsApp Communication Timeline
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official Meta Cloud API message thread linked to {customer.phone || 'customer'}.
              </p>
            </div>
            {whatsappConversation && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Thread ({whatsappConversation.waNumber})
              </span>
            )}
          </div>

          {/* Messages Stream */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-96 overflow-y-auto space-y-3">
            {whatsappConversation?.messages && whatsappConversation.messages.length > 0 ? (
              whatsappConversation.messages.map((m: any) => {
                const isOutbound = m.direction === 'OUTBOUND';
                return (
                  <div key={m.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-md p-3 rounded-2xl text-xs space-y-1 shadow-xs ${
                        isOutbound
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.textBody}</p>
                      <div className={`flex items-center justify-end gap-1 text-[10px] ${isOutbound ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isOutbound && (
                          <span className="font-bold">
                            {m.status === 'READ' ? '✓✓ Read' : m.status === 'DELIVERED' ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No WhatsApp conversation history found for this account.</p>
              </div>
            )}
          </div>

          {/* Quick Reply Form */}
          {customer.phone && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!outboundMessage.trim()) return;
                  setSendingMessage(true);
                  try {
                    const res = await fetch('/api/whatsapp/messages', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        conversationId: whatsappConversation?.id,
                        type: 'text',
                        text: outboundMessage,
                      }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setOutboundMessage('');
                      fetchCustomer360();
                    } else {
                      alert(data.error || 'Failed to dispatch WhatsApp message');
                    }
                  } catch (err: any) {
                    alert(err.message);
                  } finally {
                    setSendingMessage(false);
                  }
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  value={outboundMessage}
                  onChange={(e) => setOutboundMessage(e.target.value)}
                  placeholder={`Send WhatsApp message to ${customer.phone}...`}
                  className="flex-1 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !outboundMessage.trim()}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingMessage ? 'Sending...' : 'Send WhatsApp'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Follow-up for {customer.name}</h3>
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleFollowUp} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discuss Q4 Hardware Renewal"
                  value={followUpTitle}
                  onChange={(e) => setFollowUpTitle(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Type</label>
                  <select
                    value={followUpType}
                    onChange={(e) => setFollowUpType(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp Message</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Meeting / Demo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">Notes / Agenda</label>
                <textarea
                  rows={2}
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none"
                  placeholder="Key points to cover..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingFollowUp}
                  className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium shadow-xs disabled:opacity-50"
                >
                  {schedulingFollowUp ? 'Scheduling...' : 'Save Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Payment Link Modal */}
      <GeneratePaymentLinkModal
        isOpen={showPaymentLinkModal}
        onClose={() => setShowPaymentLinkModal(false)}
        initialCustomerId={customer?.id}
        initialCustomerName={customer?.name}
        initialCustomerEmail={customer?.email}
        initialCustomerPhone={customer?.phone}
        onSuccess={fetchCustomer360}
      />

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        defaultCustomerId={customer?.id}
        defaultCustomerName={customer?.name}
        defaultCustomerEmail={customer?.email}
        onSuccess={fetchCustomer360}
      />
    </div>
  );
}
