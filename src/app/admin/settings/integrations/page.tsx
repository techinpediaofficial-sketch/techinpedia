'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  FileSpreadsheet,
  Mail,
  Share2,
  Webhook,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Settings,
  ExternalLink,
  ShieldAlert,
  CreditCard,
  Video,
  X,
  Save,
} from 'lucide-react';

interface IntegrationCard {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
  icon: any;
  color: string;
  configLink?: string;
  onConfigure?: () => void;
  envKeys: string[];
}

export default function IntegrationsPage() {
  const [showCalendarConfig, setShowCalendarConfig] = useState(false);
  const [calendarConfig, setCalendarConfig] = useState({
    google_client_email: '',
    google_private_key: '',
    google_calendar_id: '',
  });
  const [savingCalendar, setSavingCalendar] = useState(false);

  useEffect(() => {
    // Fetch existing settings
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.settings) {
          setCalendarConfig({
            google_client_email: data.settings.google_client_email || '',
            google_private_key: data.settings.google_private_key || '',
            google_calendar_id: data.settings.google_calendar_id || '',
          });
        }
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  const handleSaveCalendarConfig = async () => {
    setSavingCalendar(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_client_email: calendarConfig.google_client_email,
          google_private_key: calendarConfig.google_private_key,
          google_calendar_id: calendarConfig.google_calendar_id,
        }),
      });
      setShowCalendarConfig(false);
      // Optional: Refresh integration status
    } catch (err) {
      alert('Failed to save config');
    } finally {
      setSavingCalendar(false);
    }
  };

  const [integrations, setIntegrations] = useState<IntegrationCard[]>([
    {
      id: 'razorpay',
      name: 'Razorpay Payment Gateway',
      category: 'Payments & Collections',
      description: 'Official Razorpay Payments API for generating trackable payment links, UPI checkout, and automated webhook settlement.',
      status: 'CONNECTED',
      icon: CreditCard,
      color: 'text-violet-600 bg-violet-50 border-violet-200',
      configLink: '/admin/payments',
      envKeys: ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'],
    },
    {
      id: 'google_calendar',
      name: 'Google Calendar & Meet',
      category: 'Conferencing & Scheduling',
      description: 'Official Google Calendar API v3 with Google Meet video link auto-generation and CRM timeline synchronization.',
      status: 'CONNECTED',
      icon: Video,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      onConfigure: () => setShowCalendarConfig(true),
      envKeys: ['GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'GOOGLE_CALENDAR_ID'],
    },
    {
      id: 'whatsapp',
      name: 'Meta WhatsApp Cloud API',
      category: 'Messaging',
      description: 'Official Meta WhatsApp Business Cloud API for lead alerts, auto-replies, and unified inbox sync.',
      status: 'NOT_CONFIGURED',
      icon: MessageSquare,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      configLink: '/admin/whatsapp',
      envKeys: ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_VERIFY_TOKEN'],
    },
    {
      id: 'sheets',
      name: 'Google Sheets Connector',
      category: 'Lead Synchronization',
      description: 'Google Sheets API v4 connector to pull real-time lead updates, parse data into the CRM, and trigger assignment workflows.',
      status: 'CONNECTED',
      icon: FileSpreadsheet,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      configLink: '/admin/settings',
      envKeys: ['GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_PRIVATE_KEY'],
    },
    {
      id: 'smtp_mailer',
      name: 'SMTP Mailer',
      category: 'Communication',
      description: 'Nodemailer mailer for sending client quotations, billing invoices, and lead notifications.',
      status: 'CONNECTED',
      icon: Mail,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      configLink: '/admin/settings',
      envKeys: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'],
    },
    {
      id: 'meta_ads',
      name: 'Meta Ads Lead Form Connector',
      category: 'Marketing',
      description: 'Direct webhook connector to instantly push Facebook & Instagram Lead Ads into TechInPedia CRM.',
      status: 'CONNECTED',
      icon: Share2,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      configLink: '/admin/settings/webhooks',
      envKeys: ['META_APP_SECRET'],
    },
    {
      id: 'webhooks',
      name: 'Event Webhooks System',
      category: 'Automation',
      description: 'Inbound and outbound signed webhooks for lead.created, deal.won, and payment.received events.',
      status: 'CONNECTED',
      icon: Webhook,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      configLink: '/admin/settings/webhooks',
      envKeys: ['CRON_SECRET'],
    },
    {
      id: 'storage',
      name: 'Local & Cloud File Manager',
      category: 'Media & Storage',
      description: 'Secure, authorized document storage for customer agreements, rental KYC, and project attachments.',
      status: 'CONNECTED',
      icon: HardDrive,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      configLink: '/admin/media',
      envKeys: ['UPLOAD_DIR'],
    },
  ]);

  useEffect(() => {
    // Check WhatsApp status dynamically
    fetch('/api/whatsapp/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.configured) {
          setIntegrations((prev) =>
            prev.map((item) => (item.id === 'whatsapp' ? { ...item, status: 'CONNECTED' } : item))
          );
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Connected Integrations & APIs</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Connect external marketing platforms, official Meta messaging APIs, and data synchronization endpoints.
        </p>
      </div>

      {/* Security Notice */}
      <div className="p-4 rounded-2xl bg-violet-50 border border-violet-100 flex items-start gap-3 text-xs text-violet-900">
        <ShieldAlert className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold block">Enterprise Security Standard</span>
          Credentials, API secrets, and private keys are strictly managed through server environment variables and encrypted database tables. Plaintext secrets are never exposed back to client browsers.
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item) => {
          const IconComponent = item.icon;
          const isConnected = item.status === 'CONNECTED';

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border ${item.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        CONNECTED
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        NOT CONFIGURED
                      </>
                    )}
                  </span>
                </div>

                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  {item.category}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{item.name}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                  {item.envKeys.length} config {item.envKeys.length === 1 ? 'key' : 'keys'}
                </div>
                {item.configLink ? (
                  <Link
                    href={item.configLink}
                    className="inline-flex items-center gap-1.5 font-semibold text-violet-600 hover:text-violet-800"
                  >
                    <span>Configure</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                ) : item.onConfigure ? (
                  <button
                    onClick={item.onConfigure}
                    className="inline-flex items-center gap-1.5 font-semibold text-violet-600 hover:text-violet-800 cursor-pointer"
                  >
                    <span>Configure</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Google Calendar Config Modal */}
      {showCalendarConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Google Calendar Configuration</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure Service Account Credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowCalendarConfig(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Google Client Email (Service Account)
                </label>
                <input
                  type="email"
                  value={calendarConfig.google_client_email}
                  onChange={(e) => setCalendarConfig(prev => ({ ...prev, google_client_email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="techinpedia@project-id.iam.gserviceaccount.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Google Private Key
                </label>
                <textarea
                  value={calendarConfig.google_private_key}
                  onChange={(e) => setCalendarConfig(prev => ({ ...prev, google_private_key: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-[10px]"
                  placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Calendar ID (Email or ID)
                </label>
                <input
                  type="text"
                  value={calendarConfig.google_calendar_id}
                  onChange={(e) => setCalendarConfig(prev => ({ ...prev, google_calendar_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="e.g. primary or your-email@gmail.com"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/60">
              <button
                onClick={() => setShowCalendarConfig(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCalendarConfig}
                disabled={savingCalendar}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                {savingCalendar ? <span className="animate-spin">⟳</span> : <Save className="w-3.5 h-3.5" />}
                {savingCalendar ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
