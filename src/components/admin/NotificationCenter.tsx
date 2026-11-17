'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Target,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [badgeCount, setBadgeCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setBadgeCount(data.badgeCount || 0);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // 20s poll
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleAccept = async (item: any) => {
    if (!item.acceptEndpoint) return;
    setActingId(item.id);
    try {
      const res = await fetch(item.acceptEndpoint, { method: 'POST' });
      if (res.ok) {
        // Remove accepted item from list
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setBadgeCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error('Failed to accept item', e);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4" />
        {badgeCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white font-mono text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Notification Center
              </span>
              {badgeCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                  {badgeCount} Pending
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                You're all caught up! No pending notifications.
              </div>
            ) : (
              items.map((item) => {
                const isActing = actingId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`p-3 text-xs transition ${
                      item.requiresAction
                        ? 'bg-amber-50/40 dark:bg-amber-950/10 hover:bg-amber-50/70'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="mt-0.5 flex-shrink-0">
                          {item.resourceType === 'WHATSAPP_CONVERSATION' ? (
                            <MessageSquare className="w-4 h-4 text-emerald-500" />
                          ) : item.resourceType === 'LEAD' ? (
                            <Target className="w-4 h-4 text-purple-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {item.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons if requires action */}
                    {item.requiresAction && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => handleAccept(item)}
                          disabled={isActing}
                          className="flex-1 py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition"
                        >
                          {isActing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          Accept
                        </button>
                        <Link
                          href={item.link || '#'}
                          onClick={() => setIsOpen(false)}
                          className="py-1 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-[11px] flex items-center gap-1 transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center">
            <Link
              href="/admin/assignments"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline"
            >
              Open Full SLA Monitor →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
