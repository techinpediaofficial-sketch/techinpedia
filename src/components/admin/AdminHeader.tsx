'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Key, ExternalLink, Sun, Moon, Laptop, Check, ChevronDown, Menu } from 'lucide-react';
import { useTheme, Theme } from '@/components/ThemeProvider';
import { NotificationCenter } from './NotificationCenter';

interface AdminHeaderProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    mustChangePassword?: boolean;
    companyId?: string | null;
    companyName?: string | null;
    companyRole?: string | null;
    isTenant?: boolean;
    allowedModules?: string[];
  };
  isTenant?: boolean;
  companyName?: string;
  companyRole?: string;
  title?: string;
  onChangePasswordClick?: () => void;
  onMenuToggle?: () => void;
}

export default function AdminHeader({
  user,
  isTenant = false,
  companyName,
  companyRole,
  title,
  onChangePasswordClick,
  onMenuToggle,
}: AdminHeaderProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeOptions: { key: Theme; label: string; icon: any; description: string }[] = [
    { key: 'light', label: 'Light', icon: Sun, description: 'Crisp high-contrast daylight' },
    { key: 'dark', label: 'Dark', icon: Moon, description: 'Sleek eye-care dark mode' },
    { key: 'system', label: 'System', icon: Laptop, description: 'Follows operating system' },
  ];

  const CurrentThemeIcon = theme === 'system' ? Laptop : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3.5 sm:px-6 py-3 flex items-center justify-between transition-colors duration-200 sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="md:hidden p-1.5 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {isTenant ? (
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {companyName || 'Tenant Workspace'}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
              {companyRole || 'TENANT'}
            </span>
          </div>
        ) : (
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
            Dashboard Overview
          </h1>
        )}
        {user?.mustChangePassword && (
          <button
            onClick={onChangePasswordClick}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/25 transition-all"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Update Default Password</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Center */}
        <NotificationCenter />

        {/* Theme Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            aria-label="Toggle theme selector"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 transition-all text-xs font-medium cursor-pointer"
          >
            <CurrentThemeIcon className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span className="capitalize hidden md:inline">{theme}</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${themeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {themeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800/60 pb-1.5 mb-1">
                Appearance
              </div>
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setTheme(opt.key);
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`} />
                      <div>
                        <div>{opt.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{opt.description}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* View Website External Link or Tenant Badge */}
        {!isTenant ? (
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-white transition-colors"
          >
            <span className="hidden sm:inline">View Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Workspace Active</span>
          </div>
        )}

        {/* User Profile Badge */}
        {user && (
          <Link href="/admin/profile" className="flex items-center gap-2.5 pl-3 sm:pl-4 border-l border-slate-200 dark:border-slate-800 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-slate-800 border border-violet-200 dark:border-slate-700 flex items-center justify-center text-violet-700 dark:text-slate-300 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left text-xs hidden md:block">
              <div className="font-semibold text-slate-900 dark:text-white">{user.name}</div>
              <div className="text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                {isTenant ? `${companyRole || 'TENANT'}` : user.role}
              </div>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
