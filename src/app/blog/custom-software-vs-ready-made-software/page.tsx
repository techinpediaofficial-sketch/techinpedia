import type { Metadata } from 'next';
import Link from 'next/link';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import JsonLd from '@/components/JsonLd';
import { ChevronLeft, CheckCircle2, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Custom Software vs Ready-Made Software: Which is Better for Growth?',
  description:
    'Detailed comparison guide between custom software development and off-the-shelf ready-made software for business operations, CRMs, and web platforms.',
  keywords: [
    'Custom Software vs Ready-Made Software',
    'Bespoke Software Development Benefits',
    'Custom CRM vs Off the Shelf CRM',
    'Software Engineering ROI Business',
  ],
  alternates: {
    canonical: 'https://techinpedia.com/blog/custom-software-vs-ready-made-software',
  },
  openGraph: {
    title: 'Custom Software vs Ready-Made Software: Business Guide',
    description: 'Comprehensive evaluation of scalability, long-term costs, IP ownership, and performance.',
    url: 'https://techinpedia.com/blog/custom-software-vs-ready-made-software',
    siteName: 'TechInPedia',
    type: 'article',
    images: [{ url: 'https://techinpedia.com/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Software vs Ready-Made SaaS',
    description: 'Compare long-term costs, security, and custom features for growing businesses.',
    images: ['https://techinpedia.com/og-image.jpg'],
  },
};

export default async function CustomVsReadyMadePage() {
  const whatsappLink = await getGeneralWhatsAppLink();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: 'Custom Software vs Ready-Made Software: Which is Better for Business Growth?',
        description:
          'Detailed analysis comparing custom software development against off-the-shelf software packages.',
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
        datePublished: '2026-02-01T08:00:00+05:30',
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
            name: 'Custom Software vs Ready-Made Software',
            item: `${siteUrl}/blog/custom-software-vs-ready-made-software`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={schemaData} />
      <div className="bg-slate-950 py-16 text-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Blog & Guides</span>
          </Link>

          <div className="space-y-4 text-left border-b border-slate-800 pb-8">
            <span className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30 text-xs font-semibold uppercase tracking-wider">
              Strategic Business Guide
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-snug">
              Custom Software vs Ready-Made Software
            </h1>
            <p className="text-base text-slate-300 leading-relaxed">
              When scaling business operations, choosing between off-the-shelf subscription software and custom software development is one of the most critical technology decisions.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <h2 className="text-2xl font-bold text-white">Side-by-Side Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-lg font-bold text-blue-400">Custom Software Development</h3>
                <ul className="space-y-2 text-slate-300 text-xs">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>100% IP & Source Code Ownership</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Zero Monthly Per-User Licensing Fees</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Tailored Exactly to Your Workflow</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Infinite Scalability & Custom API Hooks</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-lg font-bold text-amber-400">Ready-Made Off-The-Shelf SaaS</h3>
                <ul className="space-y-2 text-slate-300 text-xs">
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>Recurring Monthly Subscription Costs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>Locked Features & Rigid Workflow</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>No Codebase Ownership or Export</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>Data Privacy Dependency on Third Parties</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contextual Links */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white">Explore Custom Software Services</h3>
            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              <Link href="/services/crm-erp-development" className="text-blue-400 hover:underline">
                → Custom CRM & ERP Engineering
              </Link>
              <Link href="/services/laravel-development" className="text-rose-400 hover:underline">
                → Enterprise Laravel Web Apps
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="p-8 rounded-2xl bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-800/50 text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Ready to Build Custom Business Software?</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Discuss your operational challenges with TechInPedia.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/start-project" className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">
                Start Custom Software Project
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Consultation</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
