'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  MessageSquare,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Phone,
  Sparkles,
  RefreshCw,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';

function SingleSendContent() {
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get('phone') || '';

  const [recipientPhone, setRecipientPhone] = useState(initialPhone);
  const [messageType, setMessageType] = useState<'template' | 'text'>('template');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [templateVariables, setTemplateVariables] = useState<string[]>(['', '', '']);
  const [textBody, setTextBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Dispatch state
  const [sending, setSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const res = await fetch('/api/whatsapp/templates');
        const data = await res.json();
        if (data.templates) {
          const approved = data.templates.filter((t: any) => t.status === 'APPROVED');
          setTemplates(approved);
          if (approved.length > 0) {
            setSelectedTemplateName(approved[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const selectedTemplate = templates.find((t) => t.name === selectedTemplateName);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone.trim()) {
      alert('Please enter a destination phone number.');
      return;
    }

    setSending(true);
    setDispatchResult(null);

    try {
      const res = await fetch('/api/whatsapp/single-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: recipientPhone.trim(),
          messageType,
          text: textBody,
          templateName: selectedTemplateName,
          templateVariables: templateVariables.filter((v) => v.trim() !== ''),
          mediaUrl: mediaUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      setDispatchResult(data);
    } catch (err: any) {
      setDispatchResult({ success: false, error: err.message || 'Dispatch request failed' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40 shadow-sm">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Single Send Console</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Dispatch individual Meta message templates or direct session replies with full delivery telemetry.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Form: 2 cols */}
        <div className="md:col-span-2 space-y-5">
          <form onSubmit={handleSend} className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
            {/* Recipient */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Recipient WhatsApp Number (with Country Code)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98187 68680"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Message Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMessageType('template')}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    messageType === 'template'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                      : 'border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5 mb-0.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Meta Approved Template
                  </div>
                  <div className="text-[11px] opacity-75">
                    Can initiate conversations anytime (outside 24h window).
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMessageType('text')}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    messageType === 'text'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                      : 'border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5 mb-0.5">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    Direct Text / Freeform
                  </div>
                  <div className="text-[11px] opacity-75">
                    Requires active customer message within 24 hours.
                  </div>
                </button>
              </div>
            </div>

            {/* Template Mode Controls */}
            {messageType === 'template' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Select Approved Template
                  </label>
                  {loadingTemplates ? (
                    <div className="text-xs text-gray-400">Loading approved Meta templates...</div>
                  ) : templates.length === 0 ? (
                    <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg">
                      No approved Meta templates found. Please sync or create templates in Message Templates.
                    </div>
                  ) : (
                    <select
                      value={selectedTemplateName}
                      onChange={(e) => setSelectedTemplateName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 dark:text-gray-200"
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.category} • {t.language})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Variable fields */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Template Variables (Parameters)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Variable {{1}} (e.g. Rahul)"
                      value={templateVariables[0]}
                      onChange={(e) => setTemplateVariables([e.target.value, templateVariables[1], templateVariables[2]])}
                      className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Variable {{2}} (e.g. Order #123)"
                      value={templateVariables[1]}
                      onChange={(e) => setTemplateVariables([templateVariables[0], e.target.value, templateVariables[2]])}
                      className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                    />
                  </div>
                </div>

                {/* Header Media URL if image header */}
                {selectedTemplate?.headerType === 'IMAGE' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Header Image URL (Public HTTPS)
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/banner.jpg"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Direct Freeform Text Controls */}
            {messageType === 'text' && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <b>Meta 24-Hour Policy:</b> Freeform messages can only be sent if the customer messaged your business in the last 24 hours. Otherwise Meta will reject the message with error #131047.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Message Body
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Type your WhatsApp message..."
                    value={textBody}
                    onChange={(e) => setTextBody(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="text-right text-[10px] text-gray-400 mt-1">
                    {textBody.length} characters
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Dispatching to Meta Cloud API...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send WhatsApp Message Now
                </>
              )}
            </button>
          </form>

          {/* Result Alert */}
          {dispatchResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-1.5 shadow-sm ${
                dispatchResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {dispatchResult.success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Message Sent Successfully!
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-600" />
                    Delivery Attempt Failed
                  </>
                )}
              </div>

              {dispatchResult.success ? (
                <div className="font-mono text-[11px]">
                  Meta Message ID: <b>{dispatchResult.messageId || 'wamid.sent'}</b>
                </div>
              ) : (
                <div>
                  <p className="font-medium">{dispatchResult.error || 'Unknown error'}</p>
                  {dispatchResult.hint && (
                    <p className="text-[11px] opacity-80 mt-1 italic">
                      Resolution Hint: {dispatchResult.hint}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Preview Card: 1 col */}
        <div className="space-y-4">
          <div className="bg-gray-100 dark:bg-neutral-800/60 p-4 rounded-2xl border border-gray-200 dark:border-neutral-800">
            <h3 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Live Preview
            </h3>

            {/* Mock chat bubble */}
            <div className="bg-[#e7fedb] dark:bg-[#075e54]/30 border border-[#bbf7a7] dark:border-[#128c7e]/40 p-3.5 rounded-2xl rounded-tr-none shadow-sm space-y-2 text-xs text-gray-900 dark:text-white">
              {selectedTemplate?.headerContent && (
                <div className="font-bold text-xs border-b border-black/10 pb-1">
                  {selectedTemplate.headerContent}
                </div>
              )}

              <p className="whitespace-pre-wrap leading-relaxed">
                {messageType === 'template'
                  ? selectedTemplate?.bodyText || 'Select a template to view preview...'
                  : textBody || 'Type a message on the left to see live preview...'}
              </p>

              {selectedTemplate?.footerText && (
                <p className="text-[10px] text-gray-500 dark:text-gray-400 italic pt-1 border-t border-black/10">
                  {selectedTemplate.footerText}
                </p>
              )}

              <div className="text-[9px] text-gray-400 text-right">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SingleSendPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
            Loading Single Send Console...
          </div>
        </div>
      }
    >
      <SingleSendContent />
    </Suspense>
  );
}
