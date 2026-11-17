import type { Metadata } from 'next';
import Link from 'next/link';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import JsonLd from '@/components/JsonLd';
import { ChevronLeft, ArrowRight, CheckCircle2, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'How Much Does Website Development Cost in India? (2026 Price Guide)',
  description:
    'Complete transparent cost breakdown for website development in India. Compare prices for basic business websites, custom web apps, e-commerce portals, and enterprise SaaS platforms.',
  keywords: [
    'How Much Does Website Development Cost in India',
    'Website Development Price India',
    'Web Application Development Cost India',
    'Custom Software Cost Breakdown',
    'Hire Web Developer Cost India 2026',
  ],
  alternates: {
    canonical: 'https://techinpedia.com/blog/how-much-does-website-development-cost-in-india',
  },
  openGraph: {
    title: 'How Much Does Website Development Cost in India? (2026 Price Guide)',
    description:
      'Complete guide to website and web application development costs in India. Factors affecting pricing, tech stack costs, and agency rates.',
    url: 'https://techinpedia.com/blog/how-much-does-website-development-cost-in-india',
    siteName: 'TechInPedia',
    type: 'article',
    images: [{ url: 'https://techinpedia.com/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How Much Does Website Development Cost in India?',
    description: 'Detailed transparent breakdown of web design and web application development pricing in India.',
    images: ['https://techinpedia.com/og-image.jpg'],
  },
};

export default async function WebsiteCostGuidePage() {
  const whatsappLink = await getGeneralWhatsAppLink();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: 'How Much Does Website Development Cost in India? (2026 Price Guide)',
        description:
          'Comprehensive breakdown of website development cost in India, including basic corporate sites, custom web apps, e-commerce stores, and enterprise SaaS applications.',
        author: {
          '@type': 'Organization',
          name: 'TechInPedia',
          url: siteUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: 'TechInPedia',
          logo: `${siteUrl}/logo.png`,
        },
        datePublished: '2026-01-15T08:00:00+05:30',
        dateModified: '2026-09-09T00:00:00+05:30',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Blog',
            item: `${siteUrl}/blog`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Website Development Cost in India',
            item: `${siteUrl}/blog/how-much-does-website-development-cost-in-india`,
          },
        ],
      },
    ],
  };

  const priceTiers = [
    {
      type: 'Basic Corporate Business Site',
      range: '₹15,000 – ₹35,000',
      features: ['5–10 Responsive Pages', 'SEO Meta Tags & Contact Form', 'Mobile-First Layout', 'Google Maps & WhatsApp CTA'],
      idealFor: 'Small local businesses, consultants, and startups needing instant web presence.',
    },
    {
      type: 'Custom E-Commerce Portal',
      range: '₹35,000 – ₹85,000',
      features: ['Product Catalogue & Cart System', 'Stripe / Razorpay Payment Gateway', 'Order & Inventory Admin Panel', 'Customer Account Dashboard'],
      idealFor: 'Retail brands, jewellery stores, and online product catalog businesses.',
    },
    {
      type: 'Custom Web Application / SaaS',
      range: '₹60,000 – ₹2,500,000+',
      features: ['Next.js / React / Node.js Architecture', 'Multi-Tenant Auth & User Roles', 'Database Tuning & REST APIs', 'Automated Subscription Billing'],
      idealFor: 'Tech startups, SaaS founders, and corporate workflow automation.',
    },
  ];

  return (
    <>
      <JsonLd data={schemaData} />
      <div className="bg-slate-950 py-16 text-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Blog & Guides</span>
          </Link>

          {/* Title Header */}
          <div className="space-y-4 text-left border-b border-slate-800 pb-8">
            <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold uppercase tracking-wider">
              2026 Pricing Guide
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-snug">
              How Much Does Website Development Cost in India?
            </h1>
            <p className="text-base text-slate-300 leading-relaxed">
              If you are planning to build a website or web application in India, understanding true development pricing is essential. Here is a transparent breakdown of costs based on features, technology, and scope.
            </p>
          </div>

          {/* Price Table Cards */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Estimated Price Breakdown in India (2026)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {priceTiers.map((tier, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">{tier.type}</h3>
                    <div className="text-xl font-extrabold text-emerald-400">{tier.range}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{tier.idealFor}</p>
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      {tier.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/start-project"
                    className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-center text-xs font-bold transition-all inline-block"
                  >
                    Get Exact Quote
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Key Factors Influencing Cost */}
          <div className="space-y-4 p-8 rounded-2xl bg-slate-900 border border-slate-800">
            <h2 className="text-2xl font-bold text-white">4 Factors That Control Website Pricing</h2>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                <strong>1. Custom Design vs Templates:</strong> Pre-built templates cost less upfront but limit performance and branding. Custom React/Next.js UI design guarantees sub-second load times and high conversions.
              </p>
              <p>
                <strong>2. Tech Stack Complexity:</strong> Static HTML/CSS sites are cheap, while dynamic Node.js, Laravel, or Python backend engines with MySQL databases require senior full-stack engineering.
              </p>
              <p>
                <strong>3. Integrations:</strong> Payment gateways, custom CRM pipelines, SMS/WhatsApp APIs, and real-time push notifications add functionality and engineering depth.
              </p>
              <p>
                <strong>4. SEO & Core Web Vitals:</strong> A website built with clean semantic HTML, schema graph markup, and image compression ranks higher on Google from day 1.
              </p>
            </div>
          </div>

          {/* Contextual Internal Links */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white">Explore TechInPedia Development Services</h3>
            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              <Link href="/services/website-development" className="text-blue-400 hover:underline">
                → Custom Website Development
              </Link>
              <Link href="/services/web-application-development" className="text-blue-400 hover:underline">
                → Web Application Development
              </Link>
              <Link href="/services/laravel-development" className="text-rose-400 hover:underline">
                → Laravel & PHP Development
              </Link>
              <Link href="/services/android-app-development" className="text-emerald-400 hover:underline">
                → Android App Development
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-800/50 text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Need a Transparent Cost Estimate For Your Project?</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Tell us your requirements and TechInPedia will deliver a detailed scope breakdown within 24 hours.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/start-project" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">
                Request Free Estimate
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Instant Estimate</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
