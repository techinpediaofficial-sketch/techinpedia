'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, Phone, MapPin, CheckCircle2, ArrowRight, MessageSquare } from 'lucide-react';

export default function ContactFormClient({ isModal = false, serviceName = '' }: { isModal?: boolean; serviceName?: string }) {
  const searchParams = useSearchParams();
  const prefilledService = serviceName || searchParams.get('service') || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: prefilledService,
    budget: '',
    message: '',
    source: isModal ? 'Quote Modal' : 'Contact Page',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [companySettings, setCompanySettings] = useState<{
    email: string;
    phones: Array<{ id: string; label: string; number: string; isWhatsApp: boolean; isPrimary: boolean }>;
    addresses: Array<{ id: string; title: string; address: string; isPrimary: boolean }>;
  }>({
    email: 'contact@techinpedia.com',
    phones: [{ id: '1', label: 'Primary Support', number: '+91 98765 43210', isWhatsApp: true, isPrimary: true }],
    addresses: [{ id: '1', title: 'Corporate Headquarters', address: 'Cyber Hub & Worldwide Services, India', isPrimary: true }],
  });

  useEffect(() => {
    if (prefilledService) {
      setFormData((prev) => ({ ...prev, service: prefilledService }));
    }

    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: any) => {
        const s = data?.settings || {};
        const email = s.company_email || 'contact@techinpedia.com';

        let phones: any[] = [];
        if (s.company_phones) {
          try {
            phones = JSON.parse(s.company_phones);
          } catch {}
        }
        if (!Array.isArray(phones) || phones.length === 0) {
          phones = [{ id: '1', label: 'Support & Inquiries', number: s.company_phone || '+91 98765 43210', isWhatsApp: true, isPrimary: true }];
        }

        let addresses: any[] = [];
        if (s.company_addresses) {
          try {
            addresses = JSON.parse(s.company_addresses);
          } catch {}
        }
        if (!Array.isArray(addresses) || addresses.length === 0) {
          addresses = [{ id: '1', title: 'Corporate Headquarters', address: s.company_address || 'Cyber Hub & Worldwide Services, India', isPrimary: true }];
        }

        setCompanySettings({ email, phones, addresses });

        const phone = s.whatsapp_number || s.company_phone || '919876543210';
        const clean = phone.replace(/[^0-9]/g, '');
        const msg = encodeURIComponent('Hi TechInPedia, I would like to inquire about your services.');
        setWhatsappLink(`https://wa.me/${clean}?text=${msg}`);
      })
      .catch(() => {
        setWhatsappLink('https://wa.me/919876543210?text=Hi%20TechInPedia');
      });
  }, [searchParams, prefilledService]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isModal ? "w-full" : "grid grid-cols-1 lg:grid-cols-12 gap-12"}>
      
      {/* Form Container */}
      <div className={`${isModal ? "w-full" : "lg:col-span-7 bg-white border border-violet-100 rounded-3xl p-8 sm:p-10 shadow-xl"}`}>
        {success ? (
          <div className="text-center py-12 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Message Sent Successfully!</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you for contacting TechInPedia. Our team will review your requirements and respond within 24 hours.
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <button
                onClick={() => setSuccess(false)}
                className="px-6 py-3 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-slate-700 font-semibold text-sm transition-all"
              >
                Send Another Inquiry
              </button>
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
                {errorMsg}
              </div>
            )}

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
                  className="w-full px-4 py-3 rounded-xl bg-violet-50/30 border border-violet-100 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
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
                  placeholder="aditya@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-violet-50/30 border border-violet-100 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Phone / WhatsApp <span className="text-violet-600">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-violet-50/30 border border-violet-100 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Company / Organization
                </label>
                <input
                  type="text"
                  name="company"
                  placeholder="e.g. Acme Tech Solutions"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-violet-50/30 border border-violet-100 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Interested Service
                </label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-violet-50/30 border border-violet-100 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-sm outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center]"
                >
                  <option value="">Select a Service...</option>
                  <optgroup label="Hardware & Infrastructure">
                    <option value="Laptop Rental">Laptop Rental</option>
                    <option value="Computer Rental">Computer Rental</option>
                    <option value="AMC Maintenance">AMC Maintenance</option>
                  </optgroup>
                  <optgroup label="Software & Engineering">
                    <option value="Mobile Application">Mobile Application</option>
                    <option value="Website Development">Website Development</option>
                    <option value="Cloud Services">Cloud Services</option>
                  </optgroup>
                  <optgroup label="Strategic Marketing">
                    <option value="Brand Collaboration">Brand Collaboration</option>
                    <option value="Content Creation For Social Media">Content Creation For Social Media</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                  </optgroup>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Estimated Budget
                </label>
                <select
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-violet-50/30 border border-violet-100 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-sm outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center]"
                >
                  <option value="">Select Budget Range...</option>
                  <option value="< ₹50,000">Under ₹50,000 (Short-term / Small)</option>
                  <option value="₹50,000 – ₹1.5 Lakhs">₹50,000 – ₹1.5 Lakhs</option>
                  <option value="₹1.5 Lakhs – ₹3.5 Lakhs">₹1.5 Lakhs – ₹3.5 Lakhs</option>
                  <option value="₹3.5 Lakhs+">₹3.5 Lakhs+ (Corporate Enterprise)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Project Requirements & Overview <span className="text-violet-600">*</span>
              </label>
              <textarea
                name="message"
                required
                rows={5}
                placeholder="Describe your requirements (e.g. laptop models and quantity, software features, or marketing objectives)..."
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-violet-50/30 border border-violet-100 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              {loading ? (
                <span>Submitting Project Request...</span>
              ) : (
                <>
                  <span>Submit Inquiry Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Side Info */}
      {!isModal && (
        <div className="lg:col-span-5 space-y-8">
        <div className="p-8 rounded-3xl bg-white border border-violet-100 shadow-xl space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Direct Communication Channels</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Need an urgent response or immediate hardware rental / software consultation? Reach out directly.
          </p>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase">Email Us</span>
                <a
                  href={`mailto:${companySettings.email}`}
                  className="text-sm text-slate-900 hover:text-violet-600 font-medium block transition-colors"
                >
                  {companySettings.email}
                </a>
              </div>
            </div>

            {/* Multiple Phone Numbers */}
            {companySettings.phones.map((p) => {
              const cleanNum = p.number.replace(/[^0-9+]/g, '');
              const cleanWa = p.number.replace(/[^0-9]/g, '');
              return (
                <div key={p.id} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold uppercase">{p.label || 'Phone / WhatsApp'}</span>
                      {p.isWhatsApp && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          WhatsApp
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <a
                        href={`tel:${cleanNum}`}
                        className="text-sm text-slate-900 hover:text-violet-600 font-medium font-mono transition-colors"
                      >
                        {p.number}
                      </a>
                      {p.isWhatsApp && cleanWa && (
                        <a
                          href={`https://wa.me/${cleanWa}?text=Hi%20TechInPedia`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:underline font-semibold"
                        >
                          Chat →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Multiple Physical Addresses */}
            {companySettings.addresses.map((a) => (
              <div key={a.id} className="flex items-start gap-4 pt-1">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold uppercase">{a.title || 'Location'}</span>
                    {a.isPrimary && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                        Primary HQ
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 font-medium leading-snug mt-0.5 whitespace-pre-line">
                    {a.address}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50/60 border border-violet-200 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Prefer WhatsApp?</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Connect directly with our senior operations and technical team for immediate quotes and hardware availability.
          </p>
          <a
            href={whatsappLink || 'https://wa.me/919876543210?text=Hi%20TechInPedia%2C%20I%27d%20like%20to%20discuss%20services.'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open WhatsApp Chat</span>
          </a>
        </div>
      </div>
      )}

    </div>
  );
}
