'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  MessageSquare,
  Target,
  LifeBuoy,
  Zap,
} from 'lucide-react';
import AdminHeader from '@/components/admin/AdminHeader';

interface RuleFormItem {
  id?: string;
  entityType: string;
  actionType: string;
  priority: string;
  warningMinutes: number;
  breachMinutes: number;
}

const ENTITY_CONFIGS = [
  {
    key: 'LEAD:ACCEPTANCE',
    entityType: 'LEAD',
    actionType: 'ACCEPTANCE',
    title: 'Lead Assignment Acceptance SLA',
    description: 'Time an assigned agent has to review and click "Accept" on a CRM lead before escalation.',
    icon: Target,
    color: 'text-emerald-600 bg-emerald-500/10',
    defaults: { NORMAL: 10, HIGH: 5, URGENT: 2 },
  },
  {
    key: 'WHATSAPP_CHAT:ACCEPTANCE',
    entityType: 'WHATSAPP_CHAT',
    actionType: 'ACCEPTANCE',
    title: 'WhatsApp Conversation Acceptance SLA',
    description: 'Time an assigned agent has to accept an incoming WhatsApp customer chat thread.',
    icon: MessageSquare,
    color: 'text-purple-600 bg-purple-500/10',
    defaults: { NORMAL: 5, HIGH: 2, URGENT: 1 },
  },
  {
    key: 'WHATSAPP_CHAT:FIRST_RESPONSE',
    entityType: 'WHATSAPP_CHAT',
    actionType: 'FIRST_RESPONSE',
    title: 'First Customer Response SLA',
    description: 'Time from assignment until the first real outbound agent message is sent to the customer.',
    icon: Zap,
    color: 'text-blue-600 bg-blue-500/10',
    defaults: { NORMAL: 15, HIGH: 5, URGENT: 2 },
  },
  {
    key: 'TICKET:FIRST_RESPONSE',
    entityType: 'TICKET',
    actionType: 'FIRST_RESPONSE',
    title: 'Support Ticket First Response SLA',
    description: 'Time an agent has to respond to a newly opened customer support ticket.',
    icon: LifeBuoy,
    color: 'text-amber-600 bg-amber-500/10',
    defaults: { NORMAL: 60, HIGH: 30, URGENT: 10 },
  },
];

const PRIORITIES = ['NORMAL', 'HIGH', 'URGENT'];

export default function CompanySlaSettingsPage() {
  const [rules, setRules] = useState<Record<string, RuleFormItem>>({});
  const [warningThresholdPercent, setWarningThresholdPercent] = useState<number>(80);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSlaData = async () => {
    setLoading(true);
    try {
      const [rulesRes, settingsRes] = await Promise.all([
        fetch('/api/admin/sla-rules').then((r) => r.json()),
        fetch('/api/admin/company/settings').then((r) => r.json()),
      ]);

      const ruleMap: Record<string, RuleFormItem> = {};

      // Seed defaults first
      for (const conf of ENTITY_CONFIGS) {
        for (const prio of PRIORITIES) {
          const key = `${conf.entityType}:${conf.actionType}:${prio}`;
          const defBreach = (conf.defaults as any)[prio] || 10;
          ruleMap[key] = {
            entityType: conf.entityType,
            actionType: conf.actionType,
            priority: prio,
            breachMinutes: defBreach,
            warningMinutes: Math.max(1, Math.round(defBreach * 0.8)),
          };
        }
      }

      // Merge backend rules
      if (rulesRes.rules && Array.isArray(rulesRes.rules)) {
        for (const r of rulesRes.rules) {
          const key = `${r.entityType}:${r.actionType}:${r.priority}`;
          ruleMap[key] = {
            id: r.id,
            entityType: r.entityType,
            actionType: r.actionType,
            priority: r.priority,
            warningMinutes: r.warningMinutes,
            breachMinutes: r.breachMinutes,
          };
        }
      }

      setRules(ruleMap);

      if (settingsRes.settings?.slaWarningPercent) {
        setWarningThresholdPercent(settingsRes.settings.slaWarningPercent);
      }
    } catch (e: any) {
      console.error('Failed to load SLA rules', e);
      setMessage({ type: 'error', text: 'Failed to load current SLA configuration.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlaData();
  }, []);

  const handleBreachChange = (key: string, breachVal: number) => {
    const validBreach = Math.max(1, breachVal);
    const calculatedWarning = Math.max(1, Math.round((validBreach * warningThresholdPercent) / 100));

    setRules((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        breachMinutes: validBreach,
        warningMinutes: Math.min(validBreach - 1 || 1, calculatedWarning),
      },
    }));
  };

  const handleThresholdPercentChange = (newPercent: number) => {
    setWarningThresholdPercent(newPercent);
    setRules((prev) => {
      const updated = { ...prev };
      for (const k in updated) {
        const breach = updated[k].breachMinutes;
        const calculatedWarning = Math.max(1, Math.round((breach * newPercent) / 100));
        updated[k] = {
          ...updated[k],
          warningMinutes: Math.min(breach - 1 || 1, calculatedWarning),
        };
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // 1. Save all rules
      const rulePromises = Object.values(rules).map((rule) =>
        fetch('/api/admin/sla-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rule),
        })
      );

      // 2. Save warning threshold percentage in company settings
      const settingsPromise = fetch('/api/admin/company/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slaWarningPercent: warningThresholdPercent }),
      });

      await Promise.all([...rulePromises, settingsPromise]);

      setMessage({ type: 'success', text: 'All company SLA rules and warning thresholds saved successfully!' });
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to save SLA rules.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b18] text-slate-900 dark:text-white pb-20">
      <AdminHeader title="Company SLA Rules" />

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                Company Settings
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
              <Clock className="w-7 h-7 text-purple-600" />
              Configurable SLA Rules & Timers
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure maximum acceptance windows, first customer response deadlines, and early warning thresholds per priority.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-sm transition"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save SLA Rules
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Global Warning Threshold Slider */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Early SLA Warning Threshold
                </h3>
                <p className="text-xs text-slate-500">
                  When elapsed time reaches this percentage of the breach deadline, assignment status changes to <strong className="text-amber-600">SLA Warning</strong>.
                </p>
              </div>
            </div>
            <span className="text-2xl font-black text-amber-600 font-mono">
              {warningThresholdPercent}%
            </span>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs text-slate-400 font-semibold">50%</span>
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={warningThresholdPercent}
              onChange={(e) => handleThresholdPercentChange(parseInt(e.target.value))}
              className="flex-1 accent-purple-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs text-slate-400 font-semibold">95%</span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-medium">
              Safe: 0% → {warningThresholdPercent - 1}%
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-medium">
              Warning: {warningThresholdPercent}% → 99%
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 font-medium">
              Breached: 100%+
            </div>
          </div>
        </div>

        {/* SLA Rule Modules */}
        <div className="space-y-6">
          {ENTITY_CONFIGS.map((conf) => {
            const Icon = conf.icon;
            return (
              <div
                key={conf.key}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${conf.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {conf.title}
                    </h3>
                    <p className="text-xs text-slate-500">{conf.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PRIORITIES.map((prio) => {
                    const ruleKey = `${conf.entityType}:${conf.actionType}:${prio}`;
                    const currentRule = rules[ruleKey] || { breachMinutes: 10, warningMinutes: 8 };

                    return (
                      <div
                        key={prio}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              prio === 'URGENT'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                : prio === 'HIGH'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {prio} Priority
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Breach SLA (minutes)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={1440}
                            value={currentRule.breachMinutes}
                            onChange={(e) => handleBreachChange(ruleKey, parseInt(e.target.value) || 1)}
                            className="w-full text-sm font-bold font-mono px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div className="pt-1 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 dark:border-slate-700/60">
                          <span>Warning at:</span>
                          <span className="font-mono font-bold text-amber-600">
                            {currentRule.warningMinutes} min
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
