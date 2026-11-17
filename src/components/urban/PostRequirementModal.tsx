'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Send,
  Loader2,
  Wrench,
  Package,
  MapPin,
  Phone,
  User,
  Mail,
  FileText,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';

interface PostRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'B2C' | 'B2B';
  initialCategory?: string;
  defaultCity?: string;
}

const POPULAR_B2C_CATEGORIES = [
  'AC Repair & Service',
  'Electrician & Wiring',
  'Plumbing Services',
  'Deep Home Cleaning',
  'Packers & Movers',
  'Pest Control',
  'Carpentry & Furniture',
  'Home Painting',
  'Appliance Repair'
];

const POPULAR_B2B_CATEGORIES = [
  'Industrial AC & HVAC Plants',
  'AC Compressors & Spares',
  'Copper Pipes & Fittings',
  'Bulk IT Hardware & Laptops',
  'Electrical Panels & Switchgear',
  'Packaging Materials & Boxes',
  'Industrial Tools & Fasteners',
  'Raw Materials & Chemicals'
];

export default function PostRequirementModal({
  isOpen,
  onClose,
  initialMode = 'B2C',
  initialCategory = '',
  defaultCity = 'New Delhi'
}: PostRequirementModalProps) {
  const [mode, setMode] = useState<'B2C' | 'B2B'>(initialMode);
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState(defaultCity);
  const [locality, setLocality] = useState('');
  const [details, setDetails] = useState('');
  const [quantity, setQuantity] = useState(mode === 'B2B' ? '10 Units' : '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leadRef, setLeadRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!category.trim()) {
      setError('Please select or specify a category');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullMessage = [
        `[URBAN MARKETPLACE ${mode === 'B2B' ? 'B2B RFQ' : 'B2C SERVICE REQUIREMENT'}]`,
        `Category: ${category}`,
        `Location: ${locality ? locality + ', ' : ''}${city}`,
        mode === 'B2B' && quantity ? `Quantity/Volume: ${quantity}` : null,
        `Requirement Details: ${details || 'Looking for best quotes and immediate service'}`,
        whatsappUpdates ? `WhatsApp Updates: Opted-In` : null
      ].filter(Boolean).join('\n');

      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase() || `${phone}@urban.techinpedia.com`,
          phone: phone.trim(),
          city: city.trim(),
          address: locality.trim() || undefined,
          service: category.trim(),
          projectType: mode === 'B2B' ? 'B2B_RFQ' : 'B2C_LOCAL_SERVICE',
          budget: mode === 'B2B' ? quantity : 'Market Competitive',
          message: fullMessage,
          source: 'Urban Marketplace Web',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        setLeadRef(data.enquiry?.id || `URB-${Date.now().toString().slice(-6)}`);
      } else {
        setError(data.error || 'Failed to submit requirement. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setCategory('');
    setDetails('');
    setLeadRef(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20">
          <button
            onClick={handleReset}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              100% Free • Verified Quotes
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5" /> Fast 15-Min Response
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {submitted ? 'Requirement Posted Successfully!' : 'Tell Us What You Need & Get Quotes'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {submitted 
              ? 'Verified vendors are reviewing your requirement and will share quotations directly.'
              : 'Compare prices from top-rated service experts and verified suppliers in your city.'}
          </p>
        </div>

        {submitted ? (
          /* Success Screen */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Request Registered with Urban Market
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Reference ID: <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{leadRef}</span>
              </p>
              <p className="text-xs text-slate-400">
                Category: <strong className="text-slate-700 dark:text-slate-200">{category}</strong> in <strong className="text-slate-700 dark:text-slate-200">{city}</strong>
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 text-left border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <strong className="block text-slate-900 dark:text-white mb-0.5">What Happens Next?</strong>
                  Eligible verified {mode === 'B2B' ? 'suppliers' : 'technicians'} in {city} will contact you via WhatsApp or Call with competitive quotes. No booking fee or commission.
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-slate-900/20"
            >
              Done & Browse More
            </button>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('B2C');
                  setCategory(POPULAR_B2C_CATEGORIES[0]);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'B2C'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Wrench className="w-4 h-4 text-emerald-500" />
                <span>Home & Local Service</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('B2B');
                  setCategory(POPULAR_B2B_CATEGORIES[0]);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'B2B'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Package className="w-4 h-4 text-blue-500" />
                <span>B2B Industrial & Wholesale</span>
              </button>
            </div>

            {/* Quick Category Chips */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Popular {mode === 'B2B' ? 'Industrial Categories' : 'Local Services'}
              </label>
              <div className="flex flex-wrap gap-2">
                {(mode === 'B2B' ? POPULAR_B2B_CATEGORIES : POPULAR_B2C_CATEGORIES).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      category === cat
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Specific Service / Item input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Selected Requirement / Item Name *
              </label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={mode === 'B2B' ? 'e.g. 5 Ton Industrial Compressor or Copper Tubes' : 'e.g. Split AC Installation & Gas Refill'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="New Delhi">New Delhi</option>
                    <option value="Noida">Noida</option>
                    <option value="Greater Noida">Greater Noida</option>
                    <option value="Gurgaon">Gurgaon / Gurugram</option>
                    <option value="Ghaziabad">Ghaziabad</option>
                    <option value="Faridabad">Faridabad</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Locality / Area
                </label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Sector 62, Indirapuram, Connaught Place"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quantity for B2B or Details */}
            {mode === 'B2B' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Quantity / Order Size
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 50 Units / 500 Meters / 2 Metric Tons"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Additional Details / Specifications
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Mention brand preference, urgency, or specific work required..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Contact Details */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Your Contact Information
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Full Name *"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                      placeholder="10-digit Mobile Number *"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address (optional, for quote receipts)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappUpdates}
                  onChange={(e) => setWhatsappUpdates(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Send vendor responses and price updates to my WhatsApp
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Matching Verified {mode === 'B2B' ? 'Suppliers' : 'Experts'}...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit & Receive Free Quotes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
