'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, FileText, FileBadge, ReceiptText } from 'lucide-react';

const TABS = [
  { id: 'LEGAL_PRIVACY_POLICY', label: 'Privacy Policy', icon: FileText },
  { id: 'LEGAL_TERMS_OF_SERVICE', label: 'Terms of Service', icon: FileBadge },
  { id: 'LEGAL_REFUND_POLICY', label: 'Refund Policy', icon: ReceiptText },
];

export default function LegalSettingsPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [content, setContent] = useState<Record<string, string>>({
    LEGAL_PRIVACY_POLICY: '',
    LEGAL_TERMS_OF_SERVICE: '',
    LEGAL_REFUND_POLICY: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/legal');
      const data = await res.json();
      if (res.ok && data.config) {
        setContent({
          LEGAL_PRIVACY_POLICY: data.config.LEGAL_PRIVACY_POLICY || '',
          LEGAL_TERMS_OF_SERVICE: data.config.LEGAL_TERMS_OF_SERVICE || '',
          LEGAL_REFUND_POLICY: data.config.LEGAL_REFUND_POLICY || '',
        });
      }
    } catch (err) {
      console.error('Failed to load legal settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const valueToSave = content[activeTab];
      const res = await fetch('/api/settings/legal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: activeTab, value: valueToSave }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Legal page updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update setting' });
      }
    } catch (err) {
      console.error('Save failed', err);
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Loading legal pages...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Legal Pages</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage the content for your Privacy Policy, Terms of Service, and Refund Policy.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 overflow-x-auto bg-slate-50/50 dark:bg-slate-950/50 px-2 pt-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage(null);
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Editor */}
        <div className="p-6 space-y-4">
          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              HTML Content
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              You can use standard HTML tags (e.g., &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;b&gt;, &lt;a&gt;) to format your content. The website styling will automatically apply to these elements.
            </p>
            <textarea
              rows={25}
              value={content[activeTab]}
              onChange={(e) => setContent({ ...content, [activeTab]: e.target.value })}
              placeholder={`Enter the HTML content for ${TABS.find((t) => t.id === activeTab)?.label} here...`}
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all font-mono"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
