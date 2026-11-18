export const dynamic = 'force-dynamic';

import React from 'react';
import { Metadata } from 'next';
import RequestQuoteModal from '@/components/RequestQuoteModal';
import { CheckCircle2, Laptop, ShieldCheck, Zap, HelpCircle, MapPin, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { ncrLocations } from '@/lib/locations';

export const metadata: Metadata = {
  title: 'Laptop on Rent in Delhi, Noida & Gurgaon | TechInPedia',
  description: 'Rent commercial & corporate laptops in Delhi NCR from TechInPedia. High-performance Dell, HP, Lenovo & Apple MacBook on flexible monthly & short-term rental plans with 24-hr support.',
  alternates: {
    canonical: 'https://techinpedia.com/laptop-on-rent',
  },
  keywords: [
    'laptop on rent',
    'laptop on rent near me',
    'laptop rent near me',
    'laptop rental delhi ncr',
    'laptop on rent in noida',
    'laptop on rent in gurgaon',
    'corporate laptop rental',
    'macbook on rent delhi',
  ],
};

const rentalPlans = [
  {
    name: 'Standard Office Laptop',
    specs: 'Intel Core i3 / i5 | 8GB RAM | 256GB SSD',
    bestFor: 'Data entry, CRM operations, BPO, general office use',
    monthlyPrice: '₹1,499 - ₹1,999/mo',
    popular: false,
  },
  {
    name: 'Executive & Developer Laptop',
    specs: 'Intel Core i5 / i7 / Ryzen 5 | 16GB RAM | 512GB SSD',
    bestFor: 'Software developers, data analysts, management teams',
    monthlyPrice: '₹2,299 - ₹2,999/mo',
    popular: true,
  },
  {
    name: 'Workstation & MacBook Pro',
    specs: 'Intel Core i7 / i9 / Apple M1/M2/M3 | 32GB RAM | 1TB SSD',
    bestFor: 'Designers, video editors, 3D renderers, ML engineers',
    monthlyPrice: '₹3,999 - ₹7,499/mo',
    popular: false,
  },
];

const faqs = [
  {
    q: 'What is the minimum rental duration for laptops at TechInPedia?',
    a: 'We support short-term rentals starting from 1 day for events, hackathons, and corporate conferences, as well as monthly and annual subscription plans with flexible scale-up options.',
  },
  {
    q: 'Do you deliver laptops across all sectors of Noida, Gurgaon, and Delhi?',
    a: 'Yes, TechInPedia provides same-day and 24-hour express doorstep delivery across all sectors of Noida, Greater Noida, Gurgaon Cyber City, Udyog Vihar, Manesar, and commercial hubs in Delhi.',
  },
  {
    q: 'What happens if a rented laptop encounters a hardware glitch?',
    a: 'Every rental includes a comprehensive 24/7 SLA. Our on-site technicians repair or replace any malfunctioning machine within 4 to 24 hours at zero extra maintenance charge.',
  },
  {
    q: 'Can we rent bulk laptops for startup onboarding or corporate training?',
    a: 'Absolutely. We manage bulk fleets ranging from 5 to 500+ pre-configured laptops with custom OS, antivirus, VPN, and productivity software loaded before delivery.',
  },
];

export default function LaptopOnRentHubPage() {
  const siteUrl = 'https://techinpedia.com';

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Laptop Rental Services',
    provider: {
      '@type': 'LocalBusiness',
      name: 'TechInPedia',
      url: siteUrl,
      telephone: '+919818768680',
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
      lowPrice: '1499',
      highPrice: '7499',
      offerCount: '1000+',
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
      <section className="pt-32 pb-20 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-2">
              <Laptop className="w-4 h-4" /> Delhi NCR&apos;s Leading Hardware Fleet Provider
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Laptop on Rent in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Delhi, Noida & Gurgaon</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              Get enterprise-grade Dell, HP, Lenovo laptops and Apple MacBooks on flexible daily, monthly, and yearly rental plans. Zero upfront capital expenditure, 24-hour maintenance SLA, and free doorstep delivery across Delhi NCR.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
              <a
                href="tel:+919818768680"
                className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                📞 Call Now: +91 98187 68680
              </a>
              <RequestQuoteModal serviceName="Laptop on Rent Fleet" />
              <Link
                href="/laptop-rental-price"
                className="px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2"
              >
                View Rental Pricing <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-5xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="text-2xl font-black text-blue-600 mb-1">24-Hr</div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Doorstep Delivery</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="text-2xl font-black text-blue-600 mb-1">Zero</div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Maintenance Cost</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="text-2xl font-black text-blue-600 mb-1">500+</div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Bulk Fleet Available</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="text-2xl font-black text-blue-600 mb-1">100%</div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tax Deductible OpEx</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Configurations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Choose Your Laptop Configuration
            </h2>
            <p className="text-base md:text-lg text-slate-600">
              Cleanly formatted, tested, and high-performance machines ready for deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {rentalPlans.map((plan, idx) => (
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
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="text-sm font-medium text-blue-600 mb-4">{plan.specs}</div>
                  <p className="text-sm text-slate-600 mb-6">{plan.bestFor}</p>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 mb-6">{plan.monthlyPrice}</div>
                  <RequestQuoteModal serviceName={`Laptop Rental - ${plan.name}`} />
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
              <MapPin className="w-4 h-4" /> Hyperlocal Service Hubs
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Laptop Rental Near You Across Delhi NCR
            </h2>
            <p className="text-slate-600">
              Explore dedicated hubs across Delhi, Noida, and Gurgaon for instant doorstep deployment.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {ncrLocations.map((loc) => (
              <Link
                key={loc.slug}
                href={`/laptop-on-rent/${loc.slug}`}
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
            <p className="text-slate-600">Common questions about renting laptops with TechInPedia</p>
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
