'use client';

import { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Copy,
  Table,
} from 'lucide-react';

export default function LeadImportPage() {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Mapping state
  const [nameCol, setNameCol] = useState('');
  const [emailCol, setEmailCol] = useState('');
  const [phoneCol, setPhoneCol] = useState('');
  const [companyCol, setCompanyCol] = useState('');
  const [serviceCol, setServiceCol] = useState('');
  const [messageCol, setMessageCol] = useState('');

  const [duplicateStrategy, setDuplicateStrategy] = useState<'SKIP' | 'UPDATE' | 'CREATE_NEW'>('SKIP');
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<any | null>(null);

  // Sample CSV helper
  const loadSampleData = () => {
    const sample = `Full Name,Email Address,Phone Number,Company Name,Service Required,Requirement Details
Vikram Malhotra,vikram@alphacorp.in,+91 98112 34567,Alpha Corp,Laptop Rental,Need 20 Dell Latitude laptops on 6 month rental
Sneha Rao,sneha.rao@zenith.tech,+91 98223 45678,Zenith Tech,Custom Software,Building Next.js corporate portal
Ankit Sharma,ankit@sharmalogistics.com,+91 98334 56789,Sharma Logistics,IT AMC,Annual maintenance for 35 desktop workstations`;
    setCsvText(sample);
  };

  const handleParseCsv = () => {
    if (!csvText.trim()) return;

    const lines = csvText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      alert('Please provide at least a header line and one data row.');
      return;
    }

    const head = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    setHeaders(head);

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const rowObj: Record<string, string> = {};
      head.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      rows.push(rowObj);
    }

    setParsedRows(rows);

    // Auto-detect columns
    head.forEach((h) => {
      const lower = h.toLowerCase();
      if (lower.includes('name')) setNameCol(h);
      if (lower.includes('email')) setEmailCol(h);
      if (lower.includes('phone') || lower.includes('mobile')) setPhoneCol(h);
      if (lower.includes('company') || lower.includes('org')) setCompanyCol(h);
      if (lower.includes('service')) setServiceCol(h);
      if (lower.includes('requirement') || lower.includes('message') || lower.includes('detail')) setMessageCol(h);
    });

    setStep(2);
  };

  const handleRunImport = async () => {
    if (!nameCol || !emailCol) {
      alert('Name and Email column mappings are required.');
      return;
    }

    setImporting(true);
    setReport(null);

    try {
      const res = await fetch('/api/crm/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsedRows,
          mapping: {
            nameCol,
            emailCol,
            phoneCol: phoneCol || undefined,
            companyCol: companyCol || undefined,
            serviceCol: serviceCol || undefined,
            messageCol: messageCol || undefined,
          },
          duplicateStrategy,
          sourceName: 'CSV Bulk Import',
        }),
      });

      const data = await res.json();
      if (res.ok && data.report) {
        setReport(data.report);
        setStep(3);
      } else {
        alert(data.error || 'Import failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Error executing import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Bulk Lead Import</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Import prospective client leads from CSV spreadsheets, Google Sheets, or marketing campaigns.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-4 text-xs font-semibold">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-violet-700' : 'text-slate-400 dark:text-slate-500'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-violet-100 text-violet-700 font-bold' : 'bg-slate-100 dark:bg-slate-800'}`}>
            1
          </span>
          <span>Upload / Paste CSV</span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-violet-700' : 'text-slate-400 dark:text-slate-500'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-violet-100 text-violet-700 font-bold' : 'bg-slate-100 dark:bg-slate-800'}`}>
            2
          </span>
          <span>Column Mapping & Rules</span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300" />
        <div className={`flex items-center gap-2 ${step === 3 ? 'text-violet-700' : 'text-slate-400 dark:text-slate-500'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step === 3 ? 'bg-violet-100 text-violet-700 font-bold' : 'bg-slate-100 dark:bg-slate-800'}`}>
            3
          </span>
          <span>Import Verification Report</span>
        </div>
      </div>

      {/* Step 1: Input CSV */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Paste Comma-Separated CSV Data</h2>
            <button
              onClick={loadSampleData}
              className="text-xs text-violet-600 hover:text-violet-800 font-medium underline"
            >
              Load Sample Data
            </button>
          </div>

          <textarea
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Full Name,Email Address,Phone Number,Company Name,Service Required,Requirement Details&#10;Vikram Sharma,vikram@example.com,+91 98765 43210,Alpha Tech,Laptop Rental,Need 15 MacBooks..."
            className="w-full p-3 font-mono text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
          />

          <div className="flex justify-end">
            <button
              onClick={handleParseCsv}
              disabled={!csvText.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <span>Parse & Map Columns ({csvText.split('\n').filter(Boolean).length > 1 ? csvText.split('\n').filter(Boolean).length - 1 : 0} rows)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping & Duplicate Strategy */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Map Columns to CRM Fields</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified {parsedRows.length} rows. Select which column corresponds to each lead attribute.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Lead Name *</label>
              <select
                value={nameCol}
                onChange={(e) => setNameCol(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900 font-medium"
              >
                <option value="">Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Email Address *</label>
              <select
                value={emailCol}
                onChange={(e) => setEmailCol(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900 font-medium"
              >
                <option value="">Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Phone / WhatsApp</label>
              <select
                value={phoneCol}
                onChange={(e) => setPhoneCol(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900 font-medium"
              >
                <option value="">(Optional) Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Company Account</label>
              <select
                value={companyCol}
                onChange={(e) => setCompanyCol(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900 font-medium"
              >
                <option value="">(Optional) Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Service Required</label>
              <select
                value={serviceCol}
                onChange={(e) => setServiceCol(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900 font-medium"
              >
                <option value="">(Optional) Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-semibold mb-1">Requirements / Message</label>
              <select
                value={messageCol}
                onChange={(e) => setMessageCol(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:outline-none bg-white dark:bg-slate-900 font-medium"
              >
                <option value="">(Optional) Select column...</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duplicate Strategy */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
            <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-200 font-bold mb-2">Duplicate Detection Strategy</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'SKIP', label: 'Skip Existing', desc: 'Ignore if email/phone exists' },
                { key: 'UPDATE', label: 'Update Existing', desc: 'Update details & append notes' },
                { key: 'CREATE_NEW', label: 'Create Anyway', desc: 'Create multiple lead records' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDuplicateStrategy(opt.key as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    duplicateStrategy === opt.key
                      ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-500 text-violet-900 dark:text-violet-200 ring-2 ring-violet-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-950"
            >
              Back to CSV Input
            </button>
            <button
              onClick={handleRunImport}
              disabled={importing || !nameCol || !emailCol}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Importing {parsedRows.length} Leads...
                </>
              ) : (
                <>
                  <span>Import {parsedRows.length} Leads</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Import Report */}
      {step === 3 && report && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Lead Import Completed</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All records processed through duplicate detection, scoring, and auto-assignment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 text-xs">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 font-bold block mb-1">New Leads Created</span>
              <span className="text-2xl font-black text-emerald-900">{report.created}</span>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-blue-700 font-bold block mb-1">Existing Leads Updated</span>
              <span className="text-2xl font-black text-blue-900">{report.updated}</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-bold block mb-1">Duplicates Skipped</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{report.skipped}</span>
            </div>
          </div>

          {report.errors?.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              <span className="font-bold block mb-1">Warning notices:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {report.errors.map((e: string, idx: number) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setCsvText('');
                setStep(1);
              }}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-950"
            >
              Import More Leads
            </button>
            <a
              href="/admin/leads"
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              View Inbound Leads Desk
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
