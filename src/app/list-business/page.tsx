'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2,
  Phone,
  Mail,
  User,
  MapPin,
  Briefcase,
  Package,
  Wrench,
  TrendingUp,
  Sparkles,
  Award
} from 'lucide-react';

const SERVICE_CATEGORIES = [
  'AC Repair & Installation',
  'Electrician & Electrical Works',
  'Plumbing & Sanitation',
  'Deep Cleaning & Sanitization',
  'Packers & Movers',
  'Pest Control Services',
  'Painting & Waterproofing',
  'Carpentry & Modular Kitchen'
];

const B2B_CATEGORIES = [
  'Industrial HVAC & Chillers',
  'AC Compressors & Spares',
  'Copper Pipes & Brass Valves',
  'Bulk IT Hardware & Rentals',
  'Electrical Panels & Switchgear',
  'Packaging Materials & Cartons',
  'Industrial Tools & Fasteners',
  'Sheet Metal & Raw Materials'
];

const TIERS = [
  {
    id: 'starter',
    name: 'Free Starter',
    price: '₹0',
    period: 'forever',
    badge: 'Popular for Beginners',
    features: [
      '5 Verified Buyer Leads per month',
      'Basic Urban Market listing',
      'SMS & Email notifications',
      'Standard listing ranking',
      'Pay-per-lead unlock option'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Growth',
    price: '₹2,499',
    period: 'per month',
    badge: 'Best for Active Contractors',
    highlighted: true,
    features: [
      '35 Verified Buyer Leads per month',
      'Verified Partner Gold Badge',
      'Instant WhatsApp Lead Alerts',
      'Priority top 3 local ranking',
      'Dedicated Account Manager'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Wholesale',
    price: '₹6,999',
    period: 'per month',
    badge: 'For Manufacturers & Wholesalers',
    features: [
      'Unlimited B2B RFQ Access',
      'Manufacturer Verified Tag',
      'Direct Buyer Contact Unlocks',
      'Pan-India B2B Search Placement',
      'Priority CRM Sync & Analytics'
    ]
  }
];

export default function ListBusinessPage() {
  const [businessType, setBusinessType] = useState<'SERVICE' | 'SUPPLIER' | 'BOTH'>('SERVICE');
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [address, setAddress] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['AC Repair & Installation']);
  const [selectedTier, setSelectedTier] = useState('starter');
  const [gstin, setGstin] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please provide a valid 10-digit mobile number');
      return;
    }
    if (!businessName.trim()) {
      setError('Please provide your business or company name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullMessage = [
        `[URBAN MARKETPLACE VENDOR REGISTRATION ONBOARDING]`,
        `Business Name: ${businessName}`,
        `Owner / Contact: ${ownerName}`,
        `Type: ${businessType}`,
        `Selected Plan: ${selectedTier.toUpperCase()}`,
        gstin ? `GSTIN: ${gstin}` : null,
        `Categories: ${selectedCategories.join(', ')}`,
        `Address: ${address ? address + ', ' : ''}${city}`,
        `Contact Phone: ${phone}`,
        `Email: ${email}`
      ].filter(Boolean).join('\n');

      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ownerName.trim() || businessName.trim(),
          company: businessName.trim(),
          email: email.trim().toLowerCase() || `${phone}@vendor.urban.techinpedia.com`,
          phone: phone.trim(),
          city: city.trim(),
          address: address.trim() || undefined,
          service: selectedCategories[0] || 'Vendor Registration',
          projectType: 'VENDOR_ONBOARDING',
          budget: selectedTier === 'starter' ? 'Free Starter' : selectedTier === 'pro' ? 'Pro Growth (₹2,499)' : 'Enterprise (₹6,999)',
          message: fullMessage,
          source: 'Urban Vendor Onboarding',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit registration. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-9 h-9 bg-emerald-500 text-slate-950 rounded-xl flex items-center justify-center font-black text-xl">
              U
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Urban<span className="text-emerald-400">Market</span>
            </span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Vendor Partner Program</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            List Your Business & Receive High-Intent Local Leads
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-2xl mx-auto">
            Get discovered by thousands of customers looking for services or industrial supplies in your city. Zero upfront listing fee.
          </p>
        </div>

        {submitted ? (
          <div className="bg-slate-950 rounded-3xl border border-emerald-500/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                Application Received Successfully!
              </h2>
              <p className="text-slate-400 text-sm max-w-lg mx-auto">
                Welcome to Urban Market, <strong>{businessName}</strong>! Your application for the <strong>{selectedTier.toUpperCase()}</strong> plan has been registered.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 text-left border border-slate-800 text-xs text-slate-300 max-w-md mx-auto space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Next Verification Steps:</span>
              </div>
              <p>1. Our onboarding desk will verify your business details within 2 hours.</p>
              <p>2. You will receive active lead notifications directly on WhatsApp: <strong>{phone}</strong>.</p>
              <p>3. You can access your lead workspace anytime via the Vendor Hub.</p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/vendor"
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
              >
                Go to Vendor Hub
              </Link>
              <Link
                href="/"
                className="px-6 py-3.5 rounded-full bg-slate-900 hover:bg-slate-850 text-white font-semibold text-sm border border-slate-800 transition-all"
              >
                Back to Marketplace
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-950 rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-8">
            {error && (
              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900 text-red-300 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Step 1: Business Profile */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800 text-sm font-bold text-emerald-400">
                <Building2 className="w-4 h-4" />
                <span>1. Business Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Business / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex Air Conditioning & Refrigeration"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    GSTIN or Business Registration (Optional)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Type Switcher */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Business Operation Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBusinessType('SERVICE')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      businessType === 'SERVICE'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Service Provider (B2C)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessType('SUPPLIER')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      businessType === 'SUPPLIER'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Manufacturer / Supplier (B2B)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessType('BOTH')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      businessType === 'BOTH'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Both Services & Products
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Categories */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800 text-sm font-bold text-emerald-400">
                <Briefcase className="w-4 h-4" />
                <span>2. Categories You Serve (Select All That Apply)</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(businessType === 'SUPPLIER'
                  ? B2B_CATEGORIES
                  : businessType === 'SERVICE'
                  ? SERVICE_CATEGORIES
                  : [...SERVICE_CATEGORIES, ...B2B_CATEGORIES]
                ).map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {cat} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Location & Contact */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800 text-sm font-bold text-emerald-400">
                <Phone className="w-4 h-4" />
                <span>3. Owner & Contact Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Owner / Representative Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number (Receives Leads on WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                    placeholder="10-digit Mobile Number"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@yourcompany.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Primary City *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
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

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Workshop / Office Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot 45, Sector 63, Industrial Area"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Step 4: Subscription Plan */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800 text-sm font-bold text-emerald-400">
                <Award className="w-4 h-4" />
                <span>4. Select Your Vendor Membership Plan</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                      selectedTier === tier.id
                        ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        {tier.badge}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1">{tier.name}</h3>
                      <div className="mt-2 mb-4">
                        <span className="text-2xl font-black text-white">{tier.price}</span>
                        <span className="text-xs text-slate-400"> /{tier.period}</span>
                      </div>

                      <ul className="space-y-1.5 text-xs text-slate-300 mb-4">
                        {tier.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className={`text-xs font-bold ${selectedTier === tier.id ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {selectedTier === tier.id ? '● Selected Plan' : '○ Click to Select'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit & Start Receiving Leads</span>
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-500 mt-3">
                By submitting, you agree to receive customer inquiries via Phone, WhatsApp & Email.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
