'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  UserCheck,
  Building,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Flame,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface ChatSession {
  id: string;
  userName: string;
  userEmail: string;
  userPhone?: string | null;
  status: string;
  lastMessage?: string | null;
  lastSender: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'ADMIN' | 'SYSTEM';
  message: string;
  createdAt: string;
}

export default function UnifiedInboxPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'CHAT' | 'WHATSAPP'>('ALL');

  // Associated CRM Lead State
  const [associatedLead, setAssociatedLead] = useState<any | null>(null);
  const [convertingLead, setConvertingLead] = useState(false);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const url = new URL('/api/admin/chats', window.location.origin);
      if (search) url.searchParams.set('search', search);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok && data.sessions) {
        setSessions(data.sessions);
        if (data.sessions.length > 0 && !selectedSessionId) {
          setSelectedSessionId(data.sessions[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [search]);

  // Load message thread & CRM lead when session selected
  useEffect(() => {
    if (!selectedSessionId) return;

    setLoadingMessages(true);
    setAssociatedLead(null);

    fetch(`/api/admin/chats/${selectedSessionId}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (data.ok !== false && data.session) {
          setMessages(data.session.messages || []);

          // Check if user has an existing CRM Lead
          if (data.session.userEmail) {
            const leadRes = await fetch(`/api/enquiries?search=${encodeURIComponent(data.session.userEmail)}`);
            const leadData = await leadRes.json();
            if (leadData.enquiries && leadData.enquiries.length > 0) {
              setAssociatedLead(leadData.enquiries[0]);
            }
          }
        }
      })
      .catch((err) => console.error('Failed to load chat messages:', err))
      .finally(() => setLoadingMessages(false));
  }, [selectedSessionId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/chats/${selectedSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyMessage: replyText.trim() }),
      });
      if (res.ok) {
        const newMsg: ChatMessage = {
          id: `temp-${Date.now()}`,
          sender: 'ADMIN',
          message: replyText.trim(),
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMsg]);
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleConvertToLead = async () => {
    const current = sessions.find((s) => s.id === selectedSessionId);
    if (!current) return;

    setConvertingLead(true);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: current.userName,
          email: current.userEmail,
          phone: current.userPhone || null,
          message: current.lastMessage || 'Initiated via Live Chat / Inbox conversation',
          source: 'Live Chat Inbox',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Fetch created lead
        const leadRes = await fetch(`/api/enquiries/${data.enquiryId}`);
        const leadData = await leadRes.json();
        if (leadData.enquiry) {
          setAssociatedLead(leadData.enquiry);
        }
      }
    } catch (err) {
      console.error('Failed to convert conversation to lead:', err);
    } finally {
      setConvertingLead(false);
    }
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Unified Communication Inbox</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Omnichannel inbox syncing live website chat visitors, WhatsApp inquiries, and customer communication.
        </p>
      </div>

      {/* 3-Column Desk Layout */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-220px)]">
        {/* Column 1: Threads List (4 cols) */}
        <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800/80 flex flex-col bg-slate-50 dark:bg-slate-950/40">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
            {loadingSessions ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-violet-500 border-t-transparent mb-2"></div>
                <p>Loading threads...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs p-4">
                <MessageSquare className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-200">No conversations</p>
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`p-3.5 cursor-pointer transition-colors text-xs ${
                    selectedSessionId === s.id
                      ? 'bg-violet-50/70 border-l-4 border-violet-600'
                      : 'hover:bg-slate-50 dark:bg-slate-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white line-clamp-1">{s.userName}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                      {new Date(s.updatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{s.userEmail}</div>
                  <p className="text-slate-600 text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 font-medium">
                    {s.lastMessage || 'Started conversation'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700">
                      Live Chat
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{s.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Message Thread & Reply Box (5 cols) */}
        <div className="md:col-span-5 flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          {selectedSession ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-sm">{selectedSession.userName}</h2>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{selectedSession.userEmail}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedSession.status}
                </span>
              </div>

              {/* Messages Bubbles Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white dark:bg-slate-900 text-xs">
                {loadingMessages ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <p>Loading message history...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-slate-400 dark:text-slate-500 italic py-12">No messages in this conversation yet.</p>
                ) : (
                  messages.map((m) => {
                    const isAdmin = m.sender === 'ADMIN';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-2xl ${
                            isAdmin
                              ? 'bg-violet-600 text-white rounded-br-xs shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-xs'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Reply Box */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Type reply to client..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
              Select a conversation thread to view messages
            </div>
          )}
        </div>

        {/* Column 3: CRM Contact & Lead Details (3 cols) */}
        <div className="md:col-span-3 p-4 bg-slate-50 dark:bg-slate-950/40 flex flex-col space-y-4 text-xs overflow-y-auto">
          <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
            CRM Context & Contact 360°
          </h3>

          {selectedSession && (
            <>
              {/* Profile Card */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                  {selectedSession.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedSession.userName}</div>
                  <span className="text-slate-500 dark:text-slate-400">{selectedSession.userEmail}</span>
                </div>
                {selectedSession.userPhone && (
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-700 dark:text-slate-200 font-medium">
                    <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    <span>{selectedSession.userPhone}</span>
                  </div>
                )}
              </div>

              {/* Linked CRM Lead */}
              {associatedLead ? (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">Linked CRM Lead</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700">
                      {associatedLead.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">Score:</span>
                      <span className="font-bold text-violet-700">{associatedLead.score || 10}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">Temp:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{associatedLead.temperature || 'WARM'}</span>
                    </div>
                    {associatedLead.service && (
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-slate-500">Service:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100 truncate max-w-[120px]">
                          {associatedLead.service}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-3">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    This visitor does not have an active CRM Lead record yet.
                  </div>
                  <button
                    onClick={handleConvertToLead}
                    disabled={convertingLead}
                    className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {convertingLead ? 'Converting...' : 'Convert to CRM Lead'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
