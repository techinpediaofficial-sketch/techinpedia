'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Search, Send, User, Mail, Phone, Trash2, CheckCircle2, RefreshCw, Clock } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'ADMIN' | 'SYSTEM';
  message: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  userName: string;
  userEmail: string;
  userPhone?: string | null;
  status: 'ACTIVE' | 'RESOLVED' | 'CLOSED';
  lastMessage?: string | null;
  lastSender?: 'USER' | 'ADMIN' | 'SYSTEM' | null;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export default function AdminChatInboxClient({ initialSessions }: { initialSessions: ChatSession[] }) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(initialSessions[0]?.id || null);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  
  const [loadingMsg, setLoadingMsg] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll chat sessions list every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchSessions();
    }, 5000);
    return () => clearInterval(interval);
  }, [filterStatus, searchTerm, autoRefresh]);

  // Fetch session details whenever selectedSessionId changes
  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionDetails(selectedSessionId);
    } else {
      setActiveSession(null);
      setMessages([]);
    }
  }, [selectedSessionId]);

  // Auto-scroll messages stream to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      let url = '/api/admin/chats';
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.sessions) {
        setSessions(data.sessions);
      }
    } catch {
      // Ignore network errors
    }
  };

  const fetchSessionDetails = async (id: string) => {
    setLoadingMsg(true);
    try {
      const res = await fetch(`/api/admin/chats/${id}`);
      const data = await res.json();
      if (res.ok && data.session) {
        setActiveSession(data.session);
        setMessages(data.session.messages || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingMsg(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSessionId) return;

    const currentReply = replyText.trim();
    setReplyText('');
    setSending(true);

    // Optimistic UI update
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'ADMIN',
      message: currentReply,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`/api/admin/chats/${selectedSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyMessage: currentReply,
        }),
      });

      const data = await res.json();
      if (res.ok && data.session) {
        fetchSessionDetails(selectedSessionId);
        fetchSessions();
      }
    } catch (err) {
      console.error('Error sending admin reply:', err);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'RESOLVED' | 'CLOSED') => {
    if (!selectedSessionId) return;
    try {
      const res = await fetch(`/api/admin/chats/${selectedSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchSessionDetails(selectedSessionId);
        fetchSessions();
      }
    } catch (err) {
      console.error('Error changing status:', err);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSessionId || !confirm('Are you sure you want to delete this chat session?')) return;
    try {
      const res = await fetch(`/api/admin/chats/${selectedSessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedSessionId(null);
        setActiveSession(null);
        fetchSessions();
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-xl transition-colors">
      
      {/* LEFT SIDEBAR: SESSION LIST */}
      <div className="w-full lg:w-96 bg-slate-50/70 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-600 dark:text-blue-400" />
              <span>Live Chat Inbox</span>
            </h2>

            <button
              onClick={() => fetchSessions()}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              title="Refresh sessions"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search chats by user or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-950 p-1 rounded-xl border border-slate-300 dark:border-slate-800 text-[11px] font-semibold">
            {['ALL', 'ACTIVE', 'RESOLVED', 'CLOSED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === tab
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List Stream */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/60 thin-scrollbar">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600" />
              <p>No chat sessions found.</p>
            </div>
          ) : (
            sessions.map((s) => {
              const isSelected = s.id === selectedSessionId;
              const statusColor =
                s.status === 'ACTIVE'
                  ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                  : s.status === 'RESOLVED'
                  ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`p-4 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                    isSelected ? 'bg-slate-100 dark:bg-slate-800/90 border-l-4 border-violet-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                      {s.userName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor}`}>
                      {s.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1.5">{s.userEmail}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[200px] text-slate-700 dark:text-slate-300">
                      {s.lastSender === 'USER' ? '👤 ' : s.lastSender === 'ADMIN' ? '👨‍💻 ' : ''}
                      {s.lastMessage || 'Chat started'}
                    </span>
                    <span className="flex-shrink-0 text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* RIGHT MAIN CONVERSATION PANEL */}
      {activeSession ? (
        <div className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-950/80">
          
          {/* HEADER */}
          <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-blue-600/20 border border-violet-200 dark:border-blue-500/30 text-violet-700 dark:text-blue-400 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{activeSession.userName}</span>
                  <a
                    href={`mailto:${activeSession.userEmail}`}
                    className="text-xs text-violet-600 dark:text-blue-400 font-normal hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    <span>{activeSession.userEmail}</span>
                  </a>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phone: {activeSession.userPhone || 'Not provided'} | Session ID: {activeSession.id.substring(0, 8)}
                </p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-3">
              <select
                value={activeSession.status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                <option value="ACTIVE">Mark ACTIVE</option>
                <option value="RESOLVED">Mark RESOLVED</option>
                <option value="CLOSED">Mark CLOSED</option>
              </select>

              <button
                onClick={handleDeleteSession}
                className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
                title="Delete session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MESSAGES STREAM */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 thin-scrollbar">
            {messages.map((msg) => {
              const isAdmin = msg.sender === 'ADMIN';
              const isSystem = msg.sender === 'SYSTEM';

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center my-3">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                      {msg.message}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {isAdmin ? 'TechInPedia Admin' : activeSession.userName}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[75%] px-5 py-3 rounded-2xl text-xs leading-relaxed ${
                      isAdmin
                        ? 'bg-violet-600 text-white rounded-tr-none shadow-md shadow-violet-600/20'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* REPLY FORM (WITH INSTANT SMTP DISPATCH) */}
          <form onSubmit={handleSendReply} className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <textarea
              rows={2}
              placeholder="Type your reply to send via Live Chat & Email notification..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs outline-none resize-none transition-colors"
            />

            <button
              type="submit"
              disabled={!replyText.trim() || sending}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-violet-600/20 flex items-center gap-2 cursor-pointer"
            >
              {sending ? (
                <span>Sending...</span>
              ) : (
                <>
                  <span>Send Reply</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
          <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Select a Chat Session</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Choose a live chat session from the left sidebar to read user messages and dispatch instant live & email replies.
          </p>
        </div>
      )}

    </div>
  );
}
