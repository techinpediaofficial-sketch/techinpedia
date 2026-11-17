'use client';

import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Play,
  Trash2,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Database,
  Users,
  Settings,
  X,
  Send,
  BookOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function GoogleSheetsAdminPage() {
  const [activeTab, setActiveTab] = useState<'configs' | 'connection' | 'logs'>('configs');
  const [connectionStatus, setConnectionStatus] = useState<{
    configured: boolean;
    clientEmail: string | null;
  }>({ configured: false, clientEmail: null });

  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any | null>(null);

  // Connection Modal / Form State
  const [clientEmail, setClientEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [savingConn, setSavingConn] = useState(false);
  const [connMsg, setConnMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  // New Sheet Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [configName, setConfigName] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [exploring, setExploring] = useState(false);
  const [sheetMetadata, setSheetMetadata] = useState<{
    title: string;
    sheets: string[];
    headers: string[];
    sampleRows: Record<string, string>[];
  } | null>(null);
  const [selectedSheetTab, setSelectedSheetTab] = useState('');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [dedupAction, setDedupAction] = useState<'UPDATE' | 'SKIP' | 'CREATE_NEW'>('UPDATE');
  const [assignmentStrategy, setAssignmentStrategy] = useState<'ROUND_ROBIN' | 'SPECIFIC_USER'>('ROUND_ROBIN');
  const [enableAutoWhatsApp, setEnableAutoWhatsApp] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  const CRM_FIELDS = [
    { key: 'name', label: 'Lead Full Name' },
    { key: 'phone', label: 'Phone / Mobile (E.164)' },
    { key: 'email', label: 'Email Address' },
    { key: 'company', label: 'Company / Organization' },
    { key: 'service', label: 'Service of Interest' },
    { key: 'city', label: 'City' },
    { key: 'budget', label: 'Estimated Budget' },
    { key: 'message', label: 'Requirement / Notes' },
  ];

  const fetchConnection = async () => {
    try {
      const res = await fetch('/api/integrations/google-sheets/connect');
      const data = await res.json();
      setConnectionStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/google-sheets/config');
      const data = await res.json();
      if (res.ok) {
        setConfigs(data.configs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/whatsapp/templates');
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates.filter((t: any) => t.status === 'APPROVED'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConnection();
    fetchConfigs();
    fetchTemplates();
  }, []);

  // Explore spreadsheet
  const handleExploreSpreadsheet = async () => {
    if (!spreadsheetId.trim()) return;
    setExploring(true);
    try {
      const res = await fetch('/api/integrations/google-sheets/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId, sheetTabName: selectedSheetTab }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSheetMetadata(data);
        if (!selectedSheetTab && data.sheets?.length > 0) {
          setSelectedSheetTab(data.sheets[0]);
        }
        // Auto-guess column mappings
        const initialMapping: Record<string, string> = {};
        data.headers.forEach((header: string) => {
          const lower = header.toLowerCase();
          if (lower.includes('name')) initialMapping[header] = 'name';
          else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) initialMapping[header] = 'phone';
          else if (lower.includes('email') || lower.includes('mail')) initialMapping[header] = 'email';
          else if (lower.includes('company') || lower.includes('org')) initialMapping[header] = 'company';
          else if (lower.includes('service') || lower.includes('project')) initialMapping[header] = 'service';
          else if (lower.includes('budget') || lower.includes('amount')) initialMapping[header] = 'budget';
          else if (lower.includes('city') || lower.includes('location')) initialMapping[header] = 'city';
          else if (lower.includes('message') || lower.includes('notes') || lower.includes('query')) initialMapping[header] = 'message';
        });
        setColumnMapping(initialMapping);
        setWizardStep(2);
      } else {
        alert(data.error || 'Failed to access Google Sheet. Please check the Spreadsheet ID and share permissions.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setExploring(false);
    }
  };

  // Save new configuration
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/integrations/google-sheets/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: configName || sheetMetadata?.title || 'Google Sheet CRM Sync',
          spreadsheetId,
          sheetName: selectedSheetTab || 'Sheet1',
          columnMapping,
          duplicateAction: dedupAction,
          assignmentStrategy,
          enableAutoWhatsApp,
          whatsAppTemplateId: selectedTemplateId || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowWizard(false);
        setWizardStep(1);
        fetchConfigs();
      } else {
        alert(data.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  // Trigger manual sync
  const handleSyncNow = async (configId: string) => {
    setSyncingId(configId);
    setSyncResult(null);
    try {
      const res = await fetch('/api/integrations/google-sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId }),
      });
      const data = await res.json();
      setSyncResult(data);
      fetchConfigs();
    } catch (err: any) {
      setSyncResult({ success: false, error: err.message });
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Google Sheets CRM Lead Integration</h1>
            {connectionStatus.configured ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                SERVICE ACCOUNT CONNECTED
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                NOT CONFIGURED
              </span>
            )}
          </div>
          {connectionStatus.configured && connectionStatus.clientEmail && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                {connectionStatus.clientEmail}
              </span>
            </div>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated bidirectional sync between Google Spreadsheets and TechInPedia Leads with deduplication and instant WhatsApp follow-up.
          </p>
        </div>


        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (!connectionStatus.configured) {
                alert('Please connect your Google Service Account first.');
                setActiveTab('connection');
                return;
              }
              setShowWizard(true);
            }}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Connect New Sheet
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 text-slate-500 dark:text-slate-400 pb-0.5">
        {[
          { id: 'configs', label: `Active Sheet Syncs (${configs.length})` },
          { id: 'connection', label: 'Google Credentials & Auth' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-violet-600 text-violet-700 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-50 dark:bg-slate-950'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ACTIVE CONFIGURATIONS */}
      {activeTab === 'configs' && (
        <div className="space-y-6">
          {/* Sync Result Toast Banner */}
          {syncResult && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start justify-between gap-4 ${
              syncResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div>
                <h4 className="font-bold">{syncResult.success ? 'Sync Completed Successfully!' : 'Sync Failed'}</h4>
                {syncResult.success ? (
                  <p className="mt-1">
                    Scanned {syncResult.rowsScanned} rows — Created <strong className="text-emerald-700">{syncResult.leadsCreated}</strong> new leads,
                    Updated <strong className="text-blue-700">{syncResult.leadsUpdated}</strong> existing leads,
                    Skipped <strong>{syncResult.duplicatesSkipped}</strong> duplicates.
                  </p>
                ) : (
                  <p className="mt-1">{syncResult.error}</p>
                )}
              </div>
              <button onClick={() => setSyncResult(null)} className="text-slate-500 dark:text-slate-400 hover:text-slate-600 text-slate-500 dark:text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2 opacity-50" />
              <p className="text-xs">Loading sheet configurations...</p>
            </div>
          ) : configs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Google Sheet Mappings Configured</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Connect your Google Spreadsheet to automatically sync rows into TechInPedia CRM Leads, trigger welcome WhatsApp templates, and assign sales executives.
                </p>
              </div>
              <button
                onClick={() => {
                  if (!connectionStatus.configured) {
                    setActiveTab('connection');
                  } else {
                    setShowWizard(true);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Configure First Sheet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {configs.map((cfg) => {
                const mappings = JSON.parse(cfg.columnMapping || '{}');
                const isSyncing = syncingId === cfg.id;

                return (
                  <div key={cfg.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cfg.name}</h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            Tab: {cfg.sheetName} • ID: {cfg.spreadsheetId.slice(0, 15)}...
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (confirm('Delete this sheet sync mapping?')) {
                            await fetch(`/api/integrations/google-sheets/config?id=${cfg.id}`, { method: 'DELETE' });
                            fetchConfigs();
                          }
                        }}
                        className="text-slate-500 dark:text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Mappings preview */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] space-y-1">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">Mapped Columns ({Object.keys(mappings).length}):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(mappings).map(([sheetCol, crmField]: any) => (
                          <span key={sheetCol} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-700 dark:text-slate-200">
                            <strong>{sheetCol}</strong> → {crmField}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 font-semibold border border-violet-100">
                        Deduplication: {cfg.duplicateAction}
                      </span>
                      {cfg.enableAutoWhatsApp && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100 flex items-center gap-1">
                          <Send className="w-3 h-3" /> Auto WhatsApp Welcome
                        </span>
                      )}
                      {cfg.lastSyncAt && (
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] ml-auto">
                          Last sync: {new Date(cfg.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${cfg.spreadsheetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-violet-600 font-medium hover:underline flex items-center gap-1"
                      >
                        Open Spreadsheet <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => handleSyncNow(cfg.id)}
                        disabled={isSyncing}
                        className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONNECTION & CREDENTIALS */}
      {activeTab === 'connection' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Google Service Account Authentication</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Provide your Google Cloud Service Account credentials with Google Sheets API access. Credentials are encrypted at rest with AES-256.
            </p>
          </div>

          {/* Collapsible Step-by-Step Setup Guide */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50/50 dark:from-violet-950/20 dark:to-indigo-950/20 rounded-2xl border border-violet-100 dark:border-violet-900/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-violet-100/40 dark:hover:bg-violet-900/20 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  How to get your Google Cloud Service Account Credentials? (Step-by-Step Guide)
                </span>
              </div>
              {showGuide ? (
                <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
              )}
            </button>

            {showGuide && (
              <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 space-y-4 border-t border-violet-100 dark:border-violet-900/30">
                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 font-semibold text-[11px] hover:bg-violet-50 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Google Cloud Console
                  </a>
                  <a
                    href="https://console.cloud.google.com/apis/library/sheets.googleapis.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-semibold text-[11px] hover:bg-slate-50 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Enable Google Sheets API
                  </a>
                  <a
                    href="https://console.cloud.google.com/iam-admin/serviceaccounts"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-semibold text-[11px] hover:bg-slate-50 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Service Accounts
                  </a>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-100 block">Create / Select a Google Cloud Project</strong>
                      <span>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-violet-600 dark:text-violet-400 underline font-semibold">Google Cloud Console</a>. Click the project dropdown at the top and create a new project (e.g. <code>TechInPedia Sheets</code>).</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-100 block">Enable Google Sheets &amp; Drive APIs</strong>
                      <span>Search and click <strong>Enable</strong> for both <a href="https://console.cloud.google.com/apis/library/sheets.googleapis.com" target="_blank" rel="noreferrer" className="text-violet-600 dark:text-violet-400 underline font-semibold">Google Sheets API</a> and <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" rel="noreferrer" className="text-violet-600 dark:text-violet-400 underline font-semibold">Google Drive API</a>.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-100 block">Create a Service Account</strong>
                      <span>Go to <strong>IAM &amp; Admin</strong> ➔ <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noreferrer" className="text-violet-600 dark:text-violet-400 underline font-semibold">Service Accounts</a>. Click <strong>+ Create Service Account</strong>. Name it (e.g. <code>techinpedia-sheets-sync</code>) and click <strong>Done</strong>.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-100 block">Create &amp; Download JSON Key</strong>
                      <span>Click on your newly created Service Account ➔ go to the <strong>Keys</strong> tab ➔ click <strong>Add Key</strong> ➔ <strong>Create new key</strong> ➔ choose <strong>JSON</strong> ➔ click <strong>Create</strong>. A <code>.json</code> file will download.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      5
                    </span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-100 block">Copy Credentials into the Form Below</strong>
                      <span>Open the downloaded JSON file in any text editor (Notepad, VS Code):<br />
                      • Copy the <code>client_email</code> value into <strong>Service Account Client Email</strong>.<br />
                      • Copy the entire <code>private_key</code> value (starting from <code>-----BEGIN PRIVATE KEY-----</code> to <code>-----END PRIVATE KEY-----</code>) into <strong>Private Key</strong>.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      6
                    </span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-100 block">Share Your Spreadsheet with the Service Account Email</strong>
                      <span>Open your Google Spreadsheet ➔ click the <strong>Share</strong> button at the top right ➔ paste the <strong>Service Account Client Email</strong> ➔ grant <strong>Editor</strong> access ➔ click <strong>Share</strong>.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      7
                    </span>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-100 block">Save &amp; Verify Connection</strong>
                      <span>Click the <strong>Save &amp; Verify Connection</strong> button below. TechInPedia will verify the RSA-SHA256 handshake with Google Cloud immediately!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {connMsg && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              connMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {connMsg.text}
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingConn(true);
              setConnMsg(null);
              try {
                const res = await fetch('/api/integrations/google-sheets/connect', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ clientEmail, privateKey }),
                });
                const data = await res.json();
                if (res.ok) {
                  setConnMsg({ type: 'success', text: data.message || 'Connected successfully!' });
                  fetchConnection();
                } else {
                  setConnMsg({ type: 'error', text: data.error || 'Connection failed' });
                }
              } catch (err: any) {
                setConnMsg({ type: 'error', text: err.message });
              } finally {
                setSavingConn(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-700 dark:text-slate-200 mb-1">
                Service Account Client Email
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="techinpedia-sheets-sync@project-id.iam.gserviceaccount.com"
                required
                className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-700 dark:text-slate-200 mb-1">
                Private Key (PEM format including -----BEGIN PRIVATE KEY-----)
              </label>
              <textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                rows={6}
                placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
                required
                className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 text-slate-500 dark:text-slate-400 space-y-1">
              <span className="font-bold block text-slate-800 dark:text-slate-100">Important Instruction:</span>
              <p>
                To allow TechInPedia to read your spreadsheet, open Google Sheets, click <strong>Share</strong>, and paste your Service Account email above with <strong>Editor</strong> or <strong>Viewer</strong> access.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingConn}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              {savingConn ? 'Verifying & Encrypting...' : 'Save & Verify Connection'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: CONNECT NEW SHEET WIZARD */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {wizardStep === 1 ? 'Step 1: Select Google Spreadsheet' : 'Step 2: Visual Column Mapping'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {wizardStep === 1
                    ? 'Enter the Spreadsheet ID and worksheet tab to inspect columns.'
                    : 'Map each Google Sheet column to its corresponding TechInPedia CRM Lead field.'}
                </p>
              </div>
              <button onClick={() => setShowWizard(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-600 text-slate-500 dark:text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* WIZARD STEP 1: SHEET SELECTION */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-700 dark:text-slate-200 mb-1">Configuration Name</label>
                  <input
                    type="text"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g. Website Inbound Enquiries Sheet"
                    className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-700 dark:text-slate-200 mb-1">
                    Google Spreadsheet ID (from URL docs.google.com/spreadsheets/d/ID/edit)
                  </label>
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    placeholder="1BxiMVs0XRn5nZyQQ0W3W0YpS6h..."
                    className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl font-mono focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleExploreSpreadsheet}
                    disabled={exploring || !spreadsheetId.trim()}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold flex items-center gap-2 transition-colors"
                  >
                    {exploring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {exploring ? 'Inspecting Sheet...' : 'Next: Map Columns'}
                  </button>
                </div>
              </div>
            )}

            {/* WIZARD STEP 2: COLUMN MAPPING & RULES */}
            {wizardStep === 2 && sheetMetadata && (
              <div className="space-y-6 text-xs">
                {/* Worksheet Tab Selector */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-700 dark:text-slate-200 mb-1">Select Worksheet Tab</label>
                  <select
                    value={selectedSheetTab}
                    onChange={(e) => {
                      setSelectedSheetTab(e.target.value);
                      handleExploreSpreadsheet();
                    }}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
                  >
                    {sheetMetadata.sheets.map((tab) => (
                      <option key={tab} value={tab}>{tab}</option>
                    ))}
                  </select>
                </div>

                {/* Column Mapping Grid */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">Map Google Sheet Columns → CRM Lead Fields</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {sheetMetadata.headers.map((header) => (
                      <div key={header} className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-800 dark:text-slate-100 w-1/3 truncate">{header}</span>
                        <ArrowRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <select
                          value={columnMapping[header] || ''}
                          onChange={(e) => setColumnMapping({ ...columnMapping, [header]: e.target.value })}
                          className="w-1/2 p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
                        >
                          <option value="">-- Ignore Column --</option>
                          {CRM_FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sync Rules */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-700 dark:text-slate-200 mb-1">Duplicate Strategy</label>
                    <select
                      value={dedupAction}
                      onChange={(e) => setDedupAction(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
                    >
                      <option value="UPDATE">Update Existing Lead Details</option>
                      <option value="SKIP">Skip Row (Do Not Overwrite)</option>
                      <option value="CREATE_NEW">Create Duplicate Record</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-700 dark:text-slate-200 mb-1">Sales Assignment</label>
                    <select
                      value={assignmentStrategy}
                      onChange={(e) => setAssignmentStrategy(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
                    >
                      <option value="ROUND_ROBIN">Round-Robin Active Agents</option>
                      <option value="SPECIFIC_USER">Leave Unassigned</option>
                    </select>
                  </div>
                </div>

                {/* Auto WhatsApp Follow-up */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 space-y-2">
                  <label className="flex items-center gap-2 font-bold text-emerald-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableAutoWhatsApp}
                      onChange={(e) => setEnableAutoWhatsApp(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Instant WhatsApp Welcome Template upon Lead Import</span>
                  </label>

                  {enableAutoWhatsApp && (
                    <div className="pt-2">
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="w-full p-2 border border-emerald-200 rounded-lg bg-white dark:bg-slate-900 text-xs"
                      >
                        <option value="">-- Select Approved Meta Template --</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 font-bold"
                  >
                    Back
                  </button>

                  <button
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold flex items-center gap-2"
                  >
                    {savingConfig ? 'Saving...' : 'Save & Activate Sheet Sync'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
