'use client';

import { useState } from 'react';
import {
  CreditCard,
  X,
  Copy,
  Check,
  Share2,
  Calendar,
  AlertCircle,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

interface GeneratePaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialCustomerId?: string;
  initialCustomerName?: string;
  initialCustomerEmail?: string;
  initialCustomerPhone?: string;
  initialDealId?: string;
  initialInvoiceId?: string;
  initialAmount?: number;
  initialPurpose?: string;
}

export default function GeneratePaymentLinkModal({
  isOpen,
  onClose,
  onSuccess,
  initialCustomerId,
  initialCustomerName,
  initialCustomerEmail,
  initialCustomerPhone,
  initialDealId,
  initialInvoiceId,
  initialAmount,
  initialPurpose,
}: GeneratePaymentLinkModalProps) {
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
  const [purpose, setPurpose] = useState(initialPurpose || 'ADVANCE');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState(initialCustomerName || '');
  const [clientEmail, setClientEmail] = useState(initialCustomerEmail || '');
  const [clientPhone, setClientPhone] = useState(initialCustomerPhone || '');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [internalNotes, setInternalNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedLink, setGeneratedLink] = useState<{
    shortUrl: string;
    providerLinkId: string;
    amount: number;
    clientName?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/payments/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          purpose,
          description,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          clientPhone: clientPhone.trim(),
          expiresInDays: parseInt(expiresInDays, 10),
          customerId: initialCustomerId || undefined,
          dealId: initialDealId || undefined,
          invoiceId: initialInvoiceId || undefined,
          internalNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate payment link');
      }

      setGeneratedLink({
        shortUrl: data.shortUrl,
        providerLinkId: data.paymentLink.providerLinkId,
        amount: data.paymentLink.amount,
        clientName: clientName || 'Valued Client',
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink?.shortUrl) return;
    navigator.clipboard.writeText(generatedLink.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppShareUrl = () => {
    if (!generatedLink) return '#';
    const text = encodeURIComponent(
      `Hello ${generatedLink.clientName || ''},\n\nPlease find your secure payment link for TechInPedia services amounting to ₹${generatedLink.amount.toLocaleString('en-IN')}:\n\n👉 ${generatedLink.shortUrl}\n\nThank you,\nTechInPedia Team`
    );
    const phone = clientPhone.replace(/\D/g, '');
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Generate Razorpay Payment Link
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authoritative staff attribution with instant client share
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!generatedLink ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Amount (INR ₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Payment Purpose *
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="ADVANCE">Advance Token Payment</option>
                    <option value="PROJECT_MILESTONE">Project Milestone</option>
                    <option value="SOFTWARE_DEVELOPMENT">Custom Software Dev</option>
                    <option value="HARDWARE_RENTAL">Hardware Laptop Rental</option>
                    <option value="AMC_RENEWAL">AMC Annual Renewal</option>
                    <option value="DIGITAL_MARKETING">Growth Marketing Retainer</option>
                    <option value="INVOICE_SETTLEMENT">Invoice Settlement</option>
                    <option value="CUSTOM">Custom Service Fee</option>
                  </select>
                </div>
              </div>

              {/* Client Details */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe / TechCorp"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Client Email
                    </label>
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Client Phone (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Link Options */}
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Link Expiry
                  </label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="1">24 Hours</option>
                    <option value="3">3 Days</option>
                    <option value="7">7 Days (Standard)</option>
                    <option value="30">30 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Internal Reference Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50% advance for design"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  ⚡ Auto-attributed to your employee identity
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate Official Link'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Success State */
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Check className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Payment Link Generated!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Amount: ₹{generatedLink.amount.toLocaleString('en-IN')} • ID: {generatedLink.providerLinkId}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-200 truncate">
                  {generatedLink.shortUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-xs transition-colors flex items-center gap-1.5 text-xs font-semibold flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href={getWhatsAppShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    setGeneratedLink(null);
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
