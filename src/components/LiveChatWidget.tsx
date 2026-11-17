'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Mail, Phone, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

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
  status: 'ACTIVE' | 'RESOLVED' | 'CLOSED';
}

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Pre-chat Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Chat Input State
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load existing session from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('techinpedia_chat_session_id');
    if (savedSessionId) {
      fetchSession(savedSessionId);
    }
  }, []);

  // Poll for new messages every 3 seconds if active session exists and widget is open
  useEffect(() => {
    if (!session || !isOpen) return;

    const interval = setInterval(() => {
      fetchMessages(session.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [session, isOpen]);

  // Auto-scroll to bottom of chat when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const fetchSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat/session?sessionId=${sessionId}`);
      const data = await res.json();

      if (res.ok && data.session) {
        setSession(data.session);
        setMessages(data.session.messages || []);
        setName(data.session.userName);
        setEmail(data.session.userEmail);
      } else {
        // Stale or deleted session
        localStorage.removeItem('techinpedia_chat_session_id');
      }
    } catch {
      // Ignore network errors
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
      const data = await res.json();
      if (res.ok && data.messages) {
        setMessages(data.messages);
      }
    } catch {
      // Ignore poll errors
    }
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Please enter your name and email.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: name, userEmail: email, userPhone: phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start chat.');

      setSession(data.session);
      setMessages(data.session.messages || []);
      localStorage.setItem('techinpedia_chat_session_id', data.session.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error starting chat.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !session) return;

    const currentMsg = inputMsg.trim();
    setInputMsg('');

    // Optimistic UI update
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'USER',
      message: currentMsg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          message: currentMsg,
          sender: 'USER',
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        fetchMessages(session.id);
      }
    } catch {
      // Silent catch
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      
      {/* CHAT WIDGET WINDOW */}
      {isOpen && (
        <div className="mb-4 w-[360px] sm:w-[400px] h-[520px] rounded-3xl bg-white/95 border border-violet-200 backdrop-blur-2xl shadow-[0_20px_60px_rgba(128,46,227,0.18)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* WIDGET HEADER */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 border-b border-violet-400/30 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-bold shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">TechInPedia Live Desk</h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-300" />
                </div>
                <p className="text-[11px] text-violet-100">
                  {session ? `Logged in as ${session.userName}` : 'Instant Support & Inquiries'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* WIDGET BODY */}
          {!session ? (
            /* PRE-CHAT FORM */
            <div className="p-6 flex-1 flex flex-col justify-between overflow-y-auto bg-white">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900">Start Live Chat</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Please enter your name and email to connect with our operations team and save chat history.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleStartChat} id="prechat-form" className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Your Name <span className="text-violet-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Rahul Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-violet-50/40 border border-violet-100 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-xs outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Email Address <span className="text-violet-600">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="rahul@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-violet-50/40 border border-violet-100 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-xs outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-violet-50/40 border border-violet-100 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-xs outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  form="prechat-form"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-violet-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>Starting Session...</span>
                  ) : (
                    <>
                      <span>Start Conversation</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE CHAT MESSAGES STREAM */
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-violet-50/20">
              
              {/* MESSAGES LIST */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'USER';
                  const isSystem = msg.sender === 'SYSTEM';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <span className="inline-block px-3 py-1 rounded-full bg-violet-100/80 border border-violet-200 text-[11px] text-slate-700">
                          {msg.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-none shadow-md shadow-violet-500/20'
                            : 'bg-white text-slate-800 border border-violet-100 rounded-bl-none shadow-xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* CHAT INPUT FORM */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-violet-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-violet-50/40 border border-violet-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-xs outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-40 text-white transition-all cursor-pointer shadow-sm"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          )}

        </div>
      )}

      {/* FLOATING CHAT BUTTON TOGGLE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-[0_10px_30px_rgba(128,46,227,0.4)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 group relative cursor-pointer"
        title="Live Chat Support"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
          </>
        )}
      </button>

    </div>
  );
}
