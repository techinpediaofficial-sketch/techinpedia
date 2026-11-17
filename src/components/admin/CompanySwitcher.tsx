'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, ExternalLink } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  isTenant?: boolean;
}

interface CompanySwitcherProps {
  selectedCompanyId?: string;
  availableCompanies: Company[];
  onCompanyChange: (newCompanyId: string) => void;
  accentColor?: 'emerald' | 'violet';
}

export function CompanySwitcher({
  selectedCompanyId,
  availableCompanies,
  onCompanyChange,
  accentColor = 'violet',
}: CompanySwitcherProps) {
  if (!availableCompanies || availableCompanies.length === 0) {
    return null;
  }

  const ringFocus = accentColor === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-violet-500';
  const textLink = accentColor === 'emerald' ? 'text-emerald-400 hover:text-emerald-300' : 'text-violet-400 hover:text-violet-300';

  return (
    <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 shadow-xs">
      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      <label htmlFor="company-switcher-select" className="text-xs font-semibold text-slate-400 whitespace-nowrap">
        Account:
      </label>
      <select
        id="company-switcher-select"
        value={selectedCompanyId || ''}
        onChange={(e) => onCompanyChange(e.target.value)}
        className={`bg-transparent text-xs font-bold text-slate-100 py-1 px-1.5 rounded-lg border-0 focus:ring-2 ${ringFocus} focus:outline-none cursor-pointer max-w-[200px] sm:max-w-xs truncate`}
      >
        {availableCompanies.map((c) => (
          <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
            {c.name} {c.isTenant ? '(Tenant)' : ''}
          </option>
        ))}
      </select>
      {selectedCompanyId && (
        <Link
          href={`/admin/companies/${selectedCompanyId}`}
          target="_blank"
          className={`px-1.5 py-1 text-[11px] font-semibold ${textLink} flex items-center gap-0.5 whitespace-nowrap transition`}
          title="Open Company 360"
        >
          360 <ExternalLink className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
