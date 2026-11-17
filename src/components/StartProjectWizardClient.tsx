'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

export default function StartProjectWizardClient() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    service: 'Website Development',
    projectType: 'Commercial Deployment',
    message: '',
    budget: '₹80k – ₹2L',
    timeline: '1–2 months',
    source: 'Start Project Wizard',
  });

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim()) {
        setErrorMsg('Please enter your name and valid email address.');
        return;
      }
    }
    if (step === 2) {
      if (!formData.message.trim()) {
        setErrorMsg('Please provide a brief description of your project or rental requirements.');
        return;
      }
    }
    setErrorMsg('');
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setErrorMsg('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectOption = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit enquiry.');

      const cleanPhone = '919876543210';
      const text = encodeURIComponent(
        `Hi TechInPedia! My name is ${formData.name}. I just submitted an inquiry for "${formData.service}".`
      );
      setWhatsappLink(`https://wa.me/${cleanPhone}?text=${text}`);

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-violet-100 rounded-3xl p-10 text-center space-y-6 shadow-xl">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900">Project Scope Submitted!</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Thank you <span className="font-semibold text-slate-900">{formData.name}</span>. Our technical and operations team at TechInPedia is analyzing your requirements for <span className="text-violet-600 font-semibold">{formData.service}</span>.
        </p>

        <div className="p-6 rounded-2xl bg-violet-50/50 border border-violet-100 text-left space-y-2 text-xs text-slate-600">
          <p><strong className="text-slate-900">Selected Solution:</strong> {formData.service}</p>
          <p><strong className="text-slate-900">Budget Range:</strong> {formData.budget}</p>
          <p><strong className="text-slate-900">Estimated Timeline:</strong> {formData.timeline}</p>
          <p><strong className="text-slate-900">Contact Email:</strong> {formData.email}</p>
        </div>

        <div className="pt-4 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-white border border-violet-200 hover:border-violet-300 text-slate-700 hover:text-violet-600 font-semibold text-sm shadow-sm"
          >
            Return to Homepage
          </Link>
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Connect on WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white border border-violet-100 rounded-3xl p-8 sm:p-12 shadow-xl space-y-8">
      
      {/* Wizard Progress */}
      <div className="flex items-center justify-between border-b border-violet-100 pb-6">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                step === num
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white ring-4 ring-violet-500/20'
                  : step > num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-violet-50 text-slate-400 border border-violet-100'
              }`}
            >
              {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
            </div>
            <span
              className={`text-xs font-semibold uppercase tracking-wider hidden sm:inline ${
                step === num ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {num === 1 ? 'Contact Info' : num === 2 ? 'Solution Scope' : 'Budget & Timeline'}
            </span>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        
        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Let&apos;s start with your contact details</h2>
              <p className="text-xs text-slate-500">Where should we send your custom quotation & availability report?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Full Name <span className="text-violet-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Aditya Verma"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-violet-50/40 border border-violet-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-sm outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Work Email <span className="text-violet-600">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="aditya@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-violet-50/40 border border-violet-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-sm outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-violet-50/40 border border-violet-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-sm outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Company / Organization
                </label>
                <input
                  type="text"
                  name="company"
                  placeholder="Acme Innovations"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-violet-50/40 border border-violet-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-sm outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={nextStep}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-violet-500/25 transition-all"
              >
                <span>Continue to Solution Scope</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Select Your Desired Solution</h2>
              <p className="text-xs text-slate-500">Choose across our Hardware, Software, or Marketing pillars.</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Primary Service Category</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: 'Laptop Rental', group: 'Hardware' },
                  { name: 'Computer Rental', group: 'Hardware' },
                  { name: 'AMC Maintenance', group: 'Hardware' },
                  { name: 'Mobile Application', group: 'Software' },
                  { name: 'Website Development', group: 'Software' },
                  { name: 'Cloud Services', group: 'Software' },
                  { name: 'Brand Collaboration', group: 'Marketing' },
                  { name: 'Content Creation For Social Media', group: 'Marketing' },
                  { name: 'Digital Marketing', group: 'Marketing' },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleSelectOption('service', item.name)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      formData.service === item.name
                        ? 'bg-violet-100 border-violet-300 text-violet-700 shadow-sm'
                        : 'bg-white border-violet-100 text-slate-700 hover:border-violet-300 hover:bg-violet-50/50'
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-wider text-violet-600 font-bold mb-1">
                      {item.group}
                    </div>
                    <div className="text-xs font-bold leading-tight">
                      {item.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Scope & Requirements Overview <span className="text-violet-600">*</span>
              </label>
              <textarea
                name="message"
                required
                rows={5}
                placeholder="Share your requirements (e.g., number of laptops needed, app features, target marketing audience, or tech stack preference)..."
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-violet-50/40 border border-violet-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-sm outline-none resize-none"
              />
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 rounded-xl bg-white border border-violet-200 hover:border-violet-300 text-slate-700 hover:text-violet-600 font-semibold text-sm inline-flex items-center gap-2 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={nextStep}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-violet-500/25 transition-all"
              >
                <span>Continue to Budget & Timeline</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Budget & Timeline Expectations</h2>
              <p className="text-xs text-slate-500">Help us tailor a package that aligns with your timeline and goals.</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Target Budget Bracket</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: '< ₹50,000 (Short-term / Startup)', val: '< ₹50k' },
                  { label: '₹50,000 – ₹1.5 Lakhs (Growth Tier)', val: '₹50k–₹1.5L' },
                  { label: '₹1.5 Lakhs – ₹3.5 Lakhs (Pro / Mid-Market)', val: '₹1.5L–₹3.5L' },
                  { label: '₹3.5 Lakhs+ (Enterprise Bulk / Custom)', val: '₹3.5L+' },
                ].map((b) => (
                  <button
                    key={b.val}
                    type="button"
                    onClick={() => handleSelectOption('budget', b.val)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      formData.budget === b.val
                        ? 'bg-violet-100 border-violet-300 text-violet-700 shadow-sm'
                        : 'bg-white border-violet-100 text-slate-700 hover:border-violet-300 hover:bg-violet-50/50'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Preferred Delivery Timeline</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['Immediate (< 48 hrs)', '1–2 weeks', '1–2 months', 'Ongoing / Annual'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleSelectOption('timeline', t)}
                    className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                      formData.timeline === t
                        ? 'bg-violet-100 border-violet-300 text-violet-700 shadow-sm'
                        : 'bg-white border-violet-100 text-slate-700 hover:border-violet-300 hover:bg-violet-50/50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 rounded-xl bg-white border border-violet-200 hover:border-violet-300 text-slate-700 hover:text-violet-600 font-semibold text-sm inline-flex items-center gap-2 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-10 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-violet-500/30 inline-flex items-center gap-2"
              >
                {loading ? (
                  <span>Submitting Requirements...</span>
                ) : (
                  <>
                    <span>Submit & Request Quote</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}
