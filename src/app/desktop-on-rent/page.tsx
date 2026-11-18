import React from 'react';
import { Metadata } from 'next';
import RequestQuoteModal from '@/components/RequestQuoteModal';
import { CheckCircle2, Monitor, ShieldCheck, Zap, HelpCircle, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { ncrLocations } from '@/lib/locations';

export const metadata: Metadata = {
  title: 'Desktop on Rent in Delhi, Noida & Gurgaon | TechInPedia',
  description: 'Rent desktop computers & workstations in Delhi NCR from TechInPedia. Dell, HP, Lenovo PCs & GPU editing workstations on flexible monthly rental plans with free on-site maintenance.',
  alternates: {
    canonical: 'https://techinpedia.com/desktop-on-rent',
  },
  keywords: [
    'desktop on rent',
    'desktop on rent near me',
    'computer on rent',
    'computer on rent near me',
    'desktop rent near me',
    'computer rent near me',
    'desktop rental delhi ncr',
    'desktop on rent in noida',
    'desktop on rent in gurgaon',
    'workstation on rent delhi',
  ],
};

const desktopPlans = [
  {
    name: 'Commercial Office Desktop',
    specs: 'Intel Core i3 / i5 | 8GB RAM | 256GB SSD | 19"-22" LED Monitor',
    bestFor: 'BPO setups, back-office operations, accounting, data entry',
    monthlyPrice: '₹1,000 - ₹1,500/mo',
    popular: false,
  },
  {
    name: 'High-Performance Business PC',
    specs: 'Intel Core i5 / i7 | 16GB RAM | 512GB SSD | 24" IPS Monitor',
    bestFor: 'Software development, financial modeling, graphic design',
    monthlyPrice: '₹1,800 - ₹2,500/mo',
    popular: true,
  },
  {
    name: 'GPU & Workstation Rig',
    specs: 'Core i7 / i9 / Ryzen 9 | 32GB-64GB RAM | 1TB NVMe | Nvidia RTX GPU',
    bestFor: 'AI model training, 3D Maya/Blender rendering, 4K video editing',
    monthlyPrice: '₹6,000 - ₹10,000/mo',
    popular: false,
  },
];

const faqs = [
  {
    q: 'What is included in the desktop rental package?',
    a: 'Every desktop rental comes as a complete ready-to-use bundle including the CPU tower, LED monitor (19" to 27"), keyboard, mouse, power cables, and pre-activated licensed OS.',
  },
  {
    q: 'Do you offer bulk computer rental for BPOs, call centers, and exams in Noida & Gurgaon?',
    a: 'Yes, we supply 10 to 500+ identical desktop computers with pre-configured networking, domain setup, and testing for call centers, testing labs, and training centers across NCR.',
  },
  {
    q: 'Who takes care of hardware repairs and computer maintenance?',
    a: 'TechInPedia provides 100% free hardware maintenance. If any component (power supply, RAM, SSD, or monitor) fails, our field engineers replace it within 4 to 24 hours at zero extra charge.',
  },
  {
    q: 'Can we rent desktops on a short-term basis for events and exhibitions?',
    a: 'Yes, we offer flexible daily and weekly desktop computer rental packages for events, expos at Pragati Maidan / India Expo Mart, and short-term corporate projects.',
  },
];

export default function DesktopOnRentHubPage() {
  const siteUrl = 'https://techinpedia.com';

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Desktop Computer Rental Services',
    provider: {
      '@type': 'LocalBusiness',
      name: 'TechInPedia',
      url: siteUrl,
      telephone: '+919211729690',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Sector 2',
        addressLocality: 'Noida',
        addressRegion: 'UP',
        postalCode: '201301',
        addressCountry: 'IN',
      },
    },
    areaServed: ['Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad', 'Delhi NCR'],
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: '1000',
      highPrice: '10000',
      offerCount: '500+',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  return (
    <>
      <JsonLd data={schemaData} />
      <JsonLd data={faqSchema} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-2">
              <Monitor className="w-4 h-4" /> Complete PC & Workstation Rental Fleet
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Desktop & Computer on Rent in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Delhi NCR</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              Equip your office, BPO, or design studio without heavy capital investments. Rent Dell, HP, Lenovo desktop PCs and custom GPU rendering workstations with complete monitor setups and doorstep installation.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
              <a
                href="tel:+919211729690"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                📞 Call Now: +91 92117 29690
              </a>
              <RequestQuoteModal serviceName="Desktop & Computer on Rent Fleet" />
              <Link
                href="/desktop-rental-price"
                className="px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2"
              >
                View Desktop Pricing <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-5xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="text-2xl font-black text-blue-600 mb-1">Starting ₹1,000</div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Monthly Rental Rate</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="text-2xl font-black text-blue-600 mb-1">Monitor Included</div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Full Keyboard & Mouse Set</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="text-2xl font-black text-blue-600 mb-1">Free On-Site AMC</div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Zero Maintenance Fees</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="text-2xl font-black text-blue-600 mb-1">10 to 500+</div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Scalable Fleet Deployment</div>
            </div>
          </div>
        </div>
      </section>

      {/* Desktop Configurations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Featured Computer Configurations
            </h2>
            <p className="text-base md:text-lg text-slate-600">
              Cleanly built, SSD-accelerated PCs with genuine Windows OS and peripherals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {desktopPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-3xl p-8 border transition-all duration-300 flex flex-col justify-between ${
                  plan.popular
                    ? 'border-blue-600 shadow-xl shadow-blue-50 relative bg-gradient-to-b from-blue-50/40 to-white'
                    : 'border-slate-200 hover:border-slate-300 bg-white shadow-sm'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full">
                    Best Value
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="text-sm font-medium text-blue-600 mb-4">{plan.specs}</div>
                  <p className="text-sm text-slate-600 mb-6">{plan.bestFor}</p>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 mb-6">{plan.monthlyPrice}</div>
                  <RequestQuoteModal serviceName={`Desktop Rental - ${plan.name}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hyperlocal NCR Areas Grid */}
      <section className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-blue-600 font-semibold text-sm uppercase tracking-wider mb-2">
              <MapPin className="w-4 h-4" /> Local Delivery Hubs
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Desktop & Computer on Rent Near Me
            </h2>
            <p className="text-slate-600">
              Browse dedicated computer rental pages for your specific area across Delhi, Noida, and Gurgaon.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {ncrLocations.map((loc) => (
              <Link
                key={loc.slug}
                href={`/desktop-on-rent/${loc.slug}`}
                className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-all text-xs font-semibold text-slate-700 shadow-sm flex items-center justify-between group"
              >
                <span className="truncate">{loc.city}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-600">Key questions regarding desktop computer rentals</p>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
