'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Calendar,
  Send,
  ExternalLink,
} from 'lucide-react';

interface AuditMessage {
  id: string;
  conversationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  senderType: string;
  type: string;
  textBody?: string | null;
  templateName?: string | null;
  status: string;
  metaMessageId?: string | null;
  failureReason?: string | null;
  errorCode?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  createdAt: string;
  conversation?: {
    id: string;
    waNumber: string;
    customerName?: string | null;
  };
}

export default function WhatsAppMessagesLogPage() {
  const [messages, setMessages] = useState<AuditMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 30, totalPages: 1 });

  const fetchMessages = async (page = 1) => {
    setLoading(true);
    try {
      const url = new URL('/api/whatsapp/messages', window.location.origin);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', '30');
      if (searchPhone) url.searchParams.set('phone', searchPhone);
      if (statusFilter) url.searchParams.set('status', statusFilter);
      if (typeFilter) url.searchParams.set('messageType', typeFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(1);
  }, [searchPhone, statusFilter, typeFilter]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'READ':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            <CheckCheck className="w-3.5 h-3.5" /> Read
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCheck className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-50 dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-neutral-700">
            <Check className="w-3.5 h-3.5" /> Sent
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
            <AlertCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl border border-blue-200/50 dark:border-blue-800/40 shadow-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Messages Audit Log</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Canonical delivery ledger for all outbound broadcast, drip, single-send, and inbound WhatsApp messages.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchMessages(pagination.page)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Log
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-neutral-900 p-3.5 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search phone number..."
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-1.5 px-3 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300"
        >
          <option value="">All Delivery Statuses</option>
          <option value="SENT">Sent</option>
          <option value="DELIVERED">Delivered</option>
          <option value="READ">Read</option>
          <option value="FAILED">Failed</option>
          <option value="QUEUED">Queued</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="py-1.5 px-3 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-700 dark:text-gray-300"
        >
          <option value="">All Message Types</option>
          <option value="text">Direct Text</option>
          <option value="template">Meta Template</option>
          <option value="image">Image</option>
          <option value="document">Document</option>
          <option value="interactive">Interactive</option>
        </select>

        <div className="text-xs text-gray-500 flex items-center justify-end px-2">
          Total Logged: <b>{pagination.total}</b>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-neutral-800/60 border-b border-gray-200 dark:border-neutral-800 text-gray-500 uppercase font-semibold">
              <tr>
                <th className="p-3.5">Direction & Recipient</th>
                <th className="p-3.5">Message Preview</th>
                <th className="p-3.5">Type / Template</th>
                <th className="p-3.5">Delivery Status</th>
                <th className="p-3.5">Timestamps</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {loading && messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading message audit logs...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-neutral-700" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">No message records found</p>
                  </td>
                </tr>
              ) : (
                messages.map((m) => {
                  const isOutbound = m.direction === 'OUTBOUND';
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/70 dark:hover:bg-neutral-800/40 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 rounded ${
                              isOutbound ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                            }`}
                            title={isOutbound ? 'Outbound' : 'Inbound'}
                          >
                            {isOutbound ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <div>
                            <div className="font-mono font-semibold text-gray-900 dark:text-white">
                              {m.conversation?.waNumber || '—'}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {m.conversation?.customerName || m.senderType}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 max-w-md">
                        <div className="truncate text-gray-800 dark:text-gray-200">
                          {m.textBody || `[${m.type}]`}
                        </div>
                        {m.failureReason && (
                          <div className="text-[11px] text-red-500 mt-0.5 truncate">
                            Error: {m.failureReason}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300">
                          {m.templateName ? `Template: ${m.templateName}` : m.type}
                        </span>
                      </td>

                      <td className="p-3.5">{renderStatusBadge(m.status)}</td>

                      <td className="p-3.5 text-gray-500 text-[11px] whitespace-nowrap">
                        <div>Sent: {new Date(m.createdAt).toLocaleString()}</div>
                        {m.deliveredAt && (
                          <div className="text-[10px] text-emerald-600">
                            Delivered: {new Date(m.deliveredAt).toLocaleTimeString()}
                          </div>
                        )}
                        {m.readAt && (
                          <div className="text-[10px] text-blue-600">
                            Read: {new Date(m.readAt).toLocaleTimeString()}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/whatsapp?tab=inbox&conversationId=${m.conversationId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                        >
                          View Thread
                          <ExternalLink className="w-3 h-3" />
                        </Link>
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
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchMessages(pagination.page - 1)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-md disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchMessages(pagination.page + 1)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-md disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
