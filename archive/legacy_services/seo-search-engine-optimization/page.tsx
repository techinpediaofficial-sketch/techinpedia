import type { Metadata } from 'next';
import Link from 'next/link';
import { getServiceWhatsAppLink } from '@/lib/whatsapp';
import JsonLd from '@/components/JsonLd';
import TechIcon from '@/components/TechIcons';
import {
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  MessageSquare,
  Search,
  TrendingUp,
  ShieldCheck,
  Zap,
  BarChart3,
  Globe2,
  FileCheck,
  Award,
} from 'lucide-react';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'SEO Agency in India | Search Engine Optimization Services | TechInPedia',
  description:
    'Premier SEO company in India delivering #1 Google rankings, technical Core Web Vitals optimization, high-authority link building, and high-intent organic traffic.',
  keywords: [
    'SEO Agency in India',
    'Search Engine Optimization Services',
    'Technical SEO Company',
    'Local SEO Google Map Pack',
    'E-commerce SEO Services India',
    'Link Building Agency',
  ],
  alternates: {
    canonical: 'https://techinpedia.in/services/seo-search-engine-optimization',
  },
  openGraph: {
    title: 'Top SEO Company in India | TechInPedia',
    description: 'Dominate Google search results with technical SEO, Core Web Vitals speed optimization, and white-hat link building.',
    url: 'https://techinpedia.in/services/seo-search-engine-optimization',
    siteName: 'TechInPedia India',
    type: 'website',
  },
};

export default async function SeoServicePage() {
  const whatsappLink = await getServiceWhatsAppLink('SEO & Search Engine Optimization');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.in';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'SEO & Search Engine Optimization Services',
        serviceType: 'Search Engine Optimization',
        provider: {
          '@type': 'Organization',
          name: 'TechInPedia India',
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
        },
        description: 'Comprehensive technical SEO, keyword strategy, and backlink outreach services to scale organic Google traffic.',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` },
          { '@type': 'ListItem', position: 3, name: 'SEO Services', item: `${siteUrl}/services/seo-search-engine-optimization` },
        ],
      },
    ],
  };

  const pillars = [
    {
      title: 'Technical SEO & Core Web Vitals',
      desc: 'Sub-second speed optimization, JavaScript rendering fixes, schema markup, canonicalization, and clean XML sitemaps to ensure perfect search crawler indexing.',
      icon: Zap,
    },
    {
      title: 'High-Intent Commercial Keywords',
      desc: 'In-depth search intent mapping targeting high-conversion buyer keywords rather than vanity search volume to deliver qualified leads and paying customers.',
      icon: Search,
    },
    {
      title: 'High-DA White-Hat Link Building',
      desc: 'Manual PR outreach and contextual backlink placements on real authority industry publications with zero automated PBN spam or Google penalties.',
      icon: ShieldCheck,
    },
    {
      title: 'Local SEO & Google Maps (GMB)',
      desc: 'Top 3 Map Pack rankings for geo-targeted local searches, local citation syndication, and automated review acquisition for high neighborhood walk-ins.',
      icon: Globe2,
    },
    {
      title: 'Content Siloing & Semantic Relevance',
      desc: 'Pillar-cluster content architecture, semantic entity optimization, and internal link trees that establish topical authority across your core business niches.',
      icon: FileCheck,
    },
    {
      title: 'Transparent Attribution Reporting',
      desc: 'Bi-weekly ranking reports, organic revenue attribution, and real-time Google Search Console performance visibility with no hidden metrics.',
      icon: BarChart3,
    },
  ];

  return (
    <>
      <JsonLd data={schemaData} />
      <div className="bg-slate-950 py-16 text-slate-100 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Breadcrumbs */}
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Services</span>
          </Link>

          {/* Hero Section */}
          <div className="space-y-6 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>Search Engine Optimization</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold uppercase tracking-wider">
                Rank #1 on Google
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Turn Organic Search Into Your Most Predictable Revenue Engine
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
              Stop burning ad budget every time you need traffic. TechInPedia engineers technical SEO, high-authority backlinks, and Core Web Vitals optimization to rank your business at the top of Google.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/start-project"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-xl shadow-blue-500/25 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Request Free SEO Audit</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-xl shadow-emerald-600/20 transition-all hover:scale-105 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat with SEO Specialist</span>
              </a>
            </div>
          </div>

          {/* Core Metrics Proof Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="p-4 text-center space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-teal-400">#1</p>
              <p className="text-xs text-slate-400 font-semibold uppercase">Google Rankings Targeted</p>
            </div>
            <div className="p-4 text-center space-y-1 border-l border-slate-800">
              <p className="text-3xl sm:text-4xl font-black text-blue-400">350%+</p>
              <p className="text-xs text-slate-400 font-semibold uppercase">Average Traffic Surge</p>
            </div>
            <div className="p-4 text-center space-y-1 border-l border-slate-800">
              <p className="text-3xl sm:text-4xl font-black text-purple-400">100%</p>
              <p className="text-xs text-slate-400 font-semibold uppercase">White-Hat Compliance</p>
            </div>
            <div className="p-4 text-center space-y-1 border-l border-slate-800">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400">45 Days</p>
              <p className="text-xs text-slate-400 font-semibold uppercase">First Visible Keyword Jumps</p>
            </div>
          </div>

          {/* 6 Strategic Pillars Grid */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Full-Funnel SEO Capabilities</h2>
              <p className="text-slate-400 text-sm">We don’t just tweak meta tags — we rebuild your organic visibility from the architecture level up.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pillars.map((p, idx) => {
                const IconComponent = p.icon;
                return (
                  <div
                    key={idx}
                    className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 transition-all hover:scale-[1.02] space-y-3 flex flex-col justify-between shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white">{p.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technical Stack Tags */}
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-white">Industry Standard SEO Stacks</h3>
            <div className="flex flex-wrap gap-3 pt-1">
              {['Google Search Console', 'Ahrefs', 'Semrush', 'Screaming Frog', 'Schema.org', 'Google Analytics 4', 'Core Web Vitals'].map((tool, i) => (
                <span
                  key={i}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm"
                >
                  <TechIcon name={tool} className="w-4 h-4 text-teal-400" />
                  <span>{tool}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Conversion Banner */}
          <div className="p-10 rounded-3xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-blue-950/60 border border-teal-500/30 text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to Claim the Top Spot on Google?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Get a comprehensive Technical SEO Audit & Competitor Gap Analysis within 48 hours. Let’s make your website work for you.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/start-project"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-teal-500/25 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Claim Free SEO Audit</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 transition-all hover:scale-105 flex items-center gap-2"
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
