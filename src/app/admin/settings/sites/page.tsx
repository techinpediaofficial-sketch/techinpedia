'use client';

import { useState, useEffect, useCallback } from 'react';
import { Globe, Plus, Link2, Tag, CheckCircle, XCircle, Building2, X } from 'lucide-react';

interface SiteDomain { id: string; hostname: string; isPrimary: boolean; isActive: boolean; }
interface Site {
  id: string; code: string; name: string; type: string; domain: string;
  isActive: boolean; isPrimary: boolean; createdAt: string;
  businessUnit: { id: string; code: string; name: string } | null;
  domains: SiteDomain[];
  _count: { enquiries: number };
}

const SITE_TYPE_LABELS: Record<string, string> = {
  PUBLIC_WEBSITE: 'Public Website',
  MARKETPLACE: 'Marketplace',
  INTERNAL_PORTAL: 'Internal Portal',
  API: 'API',
};
const SITE_TYPE_COLORS: Record<string, string> = {
  PUBLIC_WEBSITE: 'text-blue-400 bg-blue-400/10',
  MARKETPLACE: 'text-purple-400 bg-purple-400/10',
  INTERNAL_PORTAL: 'text-amber-400 bg-amber-400/10',
  API: 'text-slate-400 bg-slate-400/10',
};

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDomainSite, setAddDomainSite] = useState<Site | null>(null);
  const [newHostname, setNewHostname] = useState('');
  const [newIsPrimary, setNewIsPrimary] = useState(false);
  const [addingDomain, setAddingDomain] = useState(false);
  const [domainError, setDomainError] = useState('');

  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sites');
      const data = await res.json();
      if (res.ok) setSites(data.sites || []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSites(); }, [fetchSites]);

  const handleAddDomain = async () => {
    if (!addDomainSite || !newHostname.trim()) return;
    setAddingDomain(true);
    setDomainError('');
    try {
      const res = await fetch(`/api/admin/sites/${addDomainSite.id}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname: newHostname.trim(), isPrimary: newIsPrimary }),
      });
      const data = await res.json();
      if (!res.ok) { setDomainError(data.error || 'Failed to add domain.'); return; }
      setAddDomainSite(null);
      setNewHostname('');
      setNewIsPrimary(false);
      fetchSites();
    } catch { setDomainError('Network error.'); } finally { setAddingDomain(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Globe className="w-7 h-7 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold">Sites & Domains</h1>
            <p className="text-sm text-slate-400">Manage registered sites and their hostname aliases</p>
          </div>
        </div>

        {/* Urban portability callout */}
        <div className="rounded-xl bg-purple-900/20 border border-purple-700/30 p-4 text-sm text-purple-200">
          <strong className="text-purple-300">Urban Domain Portability:</strong>{' '}
          Urban Marketplace identity is <code className="text-purple-300">MARKETPLACE_PUBLIC</code>, not the hostname.
          To migrate Urban to a new domain: add the new hostname as primary SiteDomain, update DNS/SSL/deployment.
          No marketplace data rebuild required.
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : (
          <div className="space-y-4">
            {sites.map(site => (
              <div key={site.id} className="rounded-xl bg-slate-900 border border-slate-700 p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{site.name}</span>
                        <code className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{site.code}</code>
                        <span className={`text-xs px-2 py-0.5 rounded ${SITE_TYPE_COLORS[site.type] || 'text-slate-400 bg-slate-800'}`}>
                          {SITE_TYPE_LABELS[site.type] || site.type}
                        </span>
                        {!site.isActive && <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">Inactive</span>}
                      </div>
                      {site.businessUnit && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                          <Building2 className="w-3 h-3" />
                          {site.businessUnit.name}
                          <code className="text-slate-500">({site.businessUnit.code})</code>
                        </div>
                      )}
                      {!site.businessUnit && (
                        <div className="text-xs text-amber-400 mt-1">Cross-BU (Admin / Internal)</div>
                      )}
                      <div className="text-xs text-slate-500 mt-0.5">{site._count.enquiries} leads associated</div>
                    </div>
                  </div>
                  <button
                    id={`btn-add-domain-${site.id}`}
                    onClick={() => { setAddDomainSite(site); setNewHostname(''); setNewIsPrimary(false); setDomainError(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Plus className="w-3 h-3" /> Add Domain
                  </button>
                </div>

                {/* Domains list */}
                <div className="space-y-1.5 pl-13">
                  {site.domains.map(d => (
                    <div key={d.id} className="flex items-center gap-2 text-sm">
                      <Link2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className={`font-mono ${d.isActive ? 'text-slate-200' : 'text-slate-600 line-through'}`}>
                        {d.hostname}
                      </span>
                      {d.isPrimary && (
                        <span className="text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Primary</span>
                      )}
                      {d.isActive
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        : <XCircle className="w-3.5 h-3.5 text-red-500" />
                      }
                    </div>
                  ))}
                  {site.domains.length === 0 && (
                    <div className="text-xs text-slate-600 italic">No domains registered. Add one above.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Domain Modal */}
      {addDomainSite && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Add Domain Alias</h2>
              <button onClick={() => setAddDomainSite(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-400">
              Adding a hostname alias for <strong className="text-white">{addDomainSite.name}</strong>.
              {addDomainSite.code === 'MARKETPLACE_PUBLIC' && (
                <span className="block mt-1 text-purple-300">
                  Mark as Primary to migrate Urban to this new domain.
                </span>
              )}
            </p>
            {domainError && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{domainError}</div>
            )}
            <div>
              <label className="text-sm text-slate-300 block mb-1">Hostname</label>
              <input
                id="input-new-hostname"
                value={newHostname}
                onChange={e => setNewHostname(e.target.value)}
                placeholder="e.g. newdomain.com"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 font-mono"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                id="chk-is-primary"
                type="checkbox"
                checked={newIsPrimary}
                onChange={e => setNewIsPrimary(e.target.checked)}
                className="rounded"
              />
              Mark as Primary (demotes current primary)
            </label>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setAddDomainSite(null)} className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg text-sm hover:border-slate-400 transition-colors">
                Cancel
              </button>
              <button
                id="btn-save-domain"
                onClick={handleAddDomain}
                disabled={addingDomain || !newHostname.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {addingDomain ? 'Adding...' : 'Add Domain'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
