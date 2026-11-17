'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Send, User, MessageCircle, MoreVertical, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type UserData = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  onlineStatus: string;
  lastActiveAt: string | null;
};

type ChatRoom = {
  id: string;
  type: string;
  name: string | null;
  participants: any[];
  messages: any[];
  updatedAt: string;
};

export default function TeamChatPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
    fetchRooms();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (activeRoomId) {
      fetchMessages(activeRoomId);
      const interval = setInterval(() => fetchMessages(activeRoomId), 5000); // Poll for messages
      return () => clearInterval(interval);
    }
  }, [activeRoomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchCurrentUser = async () => {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      setCurrentUser(data.user);
    }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/chat/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
  };

  const fetchRooms = async () => {
    const res = await fetch('/api/chat/rooms');
    if (res.ok) {
      const data = await res.json();
      setRooms(data.chats);
    }
  };

  const fetchMessages = async (chatId: string) => {
    const res = await fetch(`/api/chat/${chatId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
  };

  const startDirectChat = async (targetUserId: string) => {
    const res = await fetch('/api/chat/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [targetUserId], type: 'DIRECT' })
    });
    if (res.ok) {
      const data = await res.json();
      fetchRooms();
      setActiveRoomId(data.chat.id);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoomId) return;

    const content = newMessage;
    setNewMessage(''); // Optimistic clear
    
    // Optimistic UI update
    const optimisticMessage = {
      id: Date.now().toString(),
      content,
      senderId: currentUser?.id,
      sender: { name: currentUser?.name || 'You', id: currentUser?.id },
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMessage]);

    await fetch(`/api/chat/${activeRoomId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    
    fetchMessages(activeRoomId);
  };

  const filteredUsers = users.filter(u => 
    u.id !== currentUser?.id && 
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Sidebar: Users and Recent Chats */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold mb-4">Team Chat</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search colleagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Active Chats List */}
          {rooms.length > 0 && !searchQuery && (
            <div className="p-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Recent Chats</h3>
              {rooms.map(room => {
                const otherParticipant = room.participants.find(p => p.userId !== currentUser?.id)?.user;
                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${activeRoomId === room.id ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {otherParticipant?.avatar ? (
                        <img src={otherParticipant.avatar} alt={otherParticipant.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {room.type === 'DIRECT' ? otherParticipant?.name : room.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {room.messages[0]?.content || 'Started a chat'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Directory */}
          <div className="p-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Directory</h3>
            {filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => startDirectChat(user.id)}
                className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  {/* Status Indicator */}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${user.onlineStatus === 'ONLINE' ? 'bg-green-500' : user.onlineStatus === 'IDLE' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate capitalize">{user.onlineStatus.toLowerCase()}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        {activeRoomId ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Active Chat</h3>
                  <p className="text-xs text-slate-500">Internal Secure Messaging</p>
                </div>
              </div>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser?.id;
                const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
                
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {showAvatar ? (
                          msg.sender?.avatar ? <img src={msg.sender.avatar} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-slate-500" />
                        ) : <div />}
                      </div>
                    )}
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isMe && showAvatar && (
                        <span className="text-xs text-slate-500 mb-1 ml-1">{msg.sender?.name}</span>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl ${isMe ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-sm'}`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        
                        {/* Attachments rendering (Tasks/Leads) */}
                        {msg.sharedTaskId && (
                          <div className="mt-2 p-2 bg-black/10 dark:bg-black/20 rounded border border-black/10 text-xs">
                            🔗 <strong>Shared Task:</strong> #{msg.sharedTaskId.substring(0, 8)}
                          </div>
                        )}
                        {msg.sharedLeadId && (
                          <div className="mt-2 p-2 bg-black/10 dark:bg-black/20 rounded border border-black/10 text-xs">
                            🔗 <strong>Shared Lead:</strong> #{msg.sharedLeadId.substring(0, 8)}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 mx-1">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <form onSubmit={sendMessage} className="flex items-end gap-2">
                <button type="button" className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full resize-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 thin-scrollbar"
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 text-white rounded-xl transition-colors flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Your Team Messages</h3>
            <p className="text-sm max-w-sm text-center">Select a colleague from the directory to start a direct chat or view recent messages.</p>
          </div>
        )}
      </div>
    </div>
  );
}
