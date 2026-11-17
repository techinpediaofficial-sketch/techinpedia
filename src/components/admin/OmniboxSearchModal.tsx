'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Inbox,
  Users2,
  TrendingUp,
  UserCheck,
  CreditCard,
  Video,
  FolderKanban,
  ArrowRight,
  Sparkles,
  Command,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface OmniboxSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OmniboxSearchModal({ isOpen, onClose }: OmniboxSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({
    leads: [],
    customers: [],
    deals: [],
    employees: [],
    invoices: [],
    meetings: [],
    projects: [],
  });
  const [totalCount, setTotalCount] = useState(0);
  const [responseTimeMs, setResponseTimeMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setTotalCount(0);
    }
  }, [isOpen]);

  // Debounced search
  const performSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults({
        leads: [],
        customers: [],
        deals: [],
        employees: [],
        invoices: [],
        meetings: [],
        projects: [],
      });
      setTotalCount(0);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search/omni?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (data?.success) {
        setResults(data.results);
        setTotalCount(data.totalCount);
        setResponseTimeMs(data.responseTimeMs);
      }
    } catch (err) {
      console.error('Omnibox search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (query) performSearch(query);
    }, 200);

    return () => clearTimeout(handler);
  }, [query, performSearch]);

  const handleSelectResult = (url: string) => {
    onClose();
    router.push(url);
  };

  if (!isOpen) return null;

  const quickActions = [
    { label: 'Schedule Google Meet', url: '/admin/meetings', icon: Video, color: 'text-emerald-500' },
    { label: 'Generate Payment Link', url: '/admin/payments', icon: CreditCard, color: 'text-violet-500' },
    { label: 'Clock In / Out (Punch)', url: '/admin/portal', icon: Clock, color: 'text-blue-500' },
    { label: 'Customer 360 Workspace', url: '/admin/customers', icon: Users2, color: 'text-indigo-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-16 sm:pt-24 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Leads, Customers, Deals, Staff, Invoices, Meetings, Projects..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {loading ? (
            <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              ESC
            </span>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* Quick Actions (When query is empty) */}
          {!query && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick Shortcuts
              </span>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectResult(action.url)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-850 hover:border-violet-500/40 dark:hover:border-violet-500/40 text-left transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Icon className={`w-4 h-4 ${action.color}`} />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results Metadata Bar */}
          {query && totalCount > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 border-b border-slate-100 dark:border-slate-800/60 pb-2">
              <span>{totalCount} results found</span>
              <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-3 h-3" />
                {responseTimeMs}ms
              </span>
            </div>
          )}

          {/* No results message */}
          {query && query.length >= 2 && !loading && totalCount === 0 && (
            <div className="text-center py-8 space-y-1">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No matching results found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-slate-400">
                Try searching by client name, email address, deal name, or invoice number.
              </p>
            </div>
          )}

          {/* 1. Customers */}
          {results.customers?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Customers ({results.customers.length})
              </span>
              {results.customers.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectResult(c.url)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                      <Users2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {c.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {c.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${c.badgeColor}`}>
                    {c.badge}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 2. Leads */}
          {results.leads?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Leads & Enquiries ({results.leads.length})
              </span>
              {results.leads.map((l: any) => (
                <div
                  key={l.id}
                  onClick={() => handleSelectResult(l.url)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                      <Inbox className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {l.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {l.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${l.badgeColor}`}>
                    {l.badge}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 3. Deals */}
          {results.deals?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Sales Deals ({results.deals.length})
              </span>
              {results.deals.map((d: any) => (
                <div
                  key={d.id}
                  onClick={() => handleSelectResult(d.url)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {d.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {d.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${d.badgeColor}`}>
                    {d.badge}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 4. Meetings */}
          {results.meetings?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Meetings & Google Meet ({results.meetings.length})
              </span>
              {results.meetings.map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectResult(m.url)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {m.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {m.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 5. Employees */}
          {results.employees?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Staff Directory ({results.employees.length})
              </span>
              {results.employees.map((e: any) => (
                <div
                  key={e.id}
                  onClick={() => handleSelectResult(e.url)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {e.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {e.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${e.badgeColor}`}>
                    {e.badge}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 6. Invoices */}
          {results.invoices?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Invoices & Billing ({results.invoices.length})
              </span>
              {results.invoices.map((inv: any) => (
                <div
                  key={inv.id}
                  onClick={() => handleSelectResult(inv.url)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {inv.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {inv.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${inv.badgeColor}`}>
                    {inv.badge}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 7. Projects */}
          {results.projects?.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Client Projects ({results.projects.length})
              </span>
              {results.projects.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectResult(p.url)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {p.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {p.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">↓</kbd> navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">↵</kbd> select
            </span>
          </div>
          <span className="font-semibold text-violet-600 dark:text-violet-400">
            TechInPedia Omnibox
          </span>
        </div>
      </div>
    </div>
  );
}
