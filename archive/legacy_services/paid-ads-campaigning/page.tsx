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
  Megaphone,
  Target,
  TrendingUp,
  ShieldCheck,
  Zap,
  BarChart3,
  Layers,
  Sparkles,
} from 'lucide-react';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Paid Ads Agency India | Meta & Google PPC Campaigns | TechInPedia',
  description:
    'Scale revenue with high-ROI Meta Ads (Facebook & Instagram), Google PPC, Shopping, and YouTube Ads managed by TechInPedia India performance marketers.',
  keywords: [
    'Paid Ads Agency India',
    'Meta Ads Management',
    'Google Ads PPC Agency',
    'Performance Marketing Agency',
    'Facebook Ads Agency India',
    'E-commerce PPC Ads',
  ],
  alternates: {
    canonical: 'https://techinpedia.in/services/paid-ads-campaigning',
  },
  openGraph: {
    title: 'High-ROI Paid Advertising Agency | TechInPedia India',
    description: 'Transform advertising spend into measurable revenue with precision Meta Ads and Google PPC campaigns.',
    url: 'https://techinpedia.in/services/paid-ads-campaigning',
    siteName: 'TechInPedia India',
    type: 'website',
  },
};

export default async function PaidAdsServicePage() {
  const whatsappLink = await getServiceWhatsAppLink('Paid Ads Campaigning (Meta & Google)');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.in';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Paid Ads Campaigning Services',
        serviceType: 'Performance Marketing & Paid Advertising',
        provider: {
          '@type': 'Organization',
          name: 'TechInPedia India',
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
        },
        description: 'High-converting Meta Ads, Google PPC, and automated retargeting funnels managed by TechInPedia India.',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` },
          { '@type': 'ListItem', position: 3, name: 'Paid Ads', item: `${siteUrl}/services/paid-ads-campaigning` },
        ],
      },
    ],
  };

  const adChannels = [
    {
      title: 'Meta Ads (Facebook & Instagram)',
      desc: 'High-converting carousel ads, UGC-style video hooks, dynamic catalog ads, and precision lookalike audience funnels with full CAPI server-side tracking.',
      icon: Megaphone,
      badge: 'B2C & D2C',
    },
    {
      title: 'Google Search PPC & Intent Capture',
      desc: 'Top-of-page search ads targeting high-intent commercial keywords. Strict negative keyword filtration to eliminate wasted ad spend completely.',
      icon: Target,
      badge: 'High Inbound',
    },
    {
      title: 'Google Shopping & Performance Max',
      desc: 'Automated product feed optimization, Google Merchant Center synchronization, and smart bidding algorithms that capture high-converting shoppers.',
      icon: TrendingUp,
      badge: 'E-Commerce',
    },
    {
      title: 'Multi-Stage Retargeting & Win-Backs',
      desc: 'Dynamic retargeting sequences targeting website drop-offs, abandoned carts, and past purchasers to drive repeat orders at fractional acquisition costs.',
      icon: Layers,
      badge: 'High ROAS',
    },
    {
      title: 'Server-Side Conversions API (CAPI)',
      desc: 'First-party tracking setup using Google Tag Manager Server Containers, bypassing iOS 14.5+ cookie restrictions for 95%+ event match quality.',
      icon: ShieldCheck,
      badge: 'Tracking',
    },
    {
      title: 'High-CTR Ad Creatives & Copywriting',
      desc: 'Direct-response copywriting, thumb-stopping graphic design, and video editing engineered strictly for high click-through rates and cheap acquisition.',
      icon: Zap,
      badge: 'Creative Suite',
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
              <span className="px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5" />
                <span>Performance Marketing</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-extrabold uppercase tracking-wider">
                Meta & Google Ads
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Scale Your Revenue With Precision Paid Advertising & Guaranteed ROAS
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
              Stop burning money on unoptimized ad boosts. TechInPedia engineers data-backed paid media funnels across Meta Ads, Google PPC, and Shopping feeds to generate predictable leads and sales.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/start-project"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-xl shadow-blue-500/25 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Launch Ads Campaign</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-xl shadow-emerald-600/20 transition-all hover:scale-105 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Discuss Ad Strategy</span>
              </a>
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="p-4 text-center space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-rose-400">4.2x</p>
              <p className="text-xs text-slate-400 font-semibold uppercase">Average Campaign ROAS</p>
            </div>
            <div className="p-4 text-center space-y-1 border-l border-slate-800">
              <p className="text-3xl sm:text-4xl font-black text-blue-400">₹2.5Cr+</p>
              <p className="text-xs text-slate-400 font-semibold uppercase">Ad Spend Managed</p>
            </div>
            <div className="p-4 text-center space-y-1 border-l border-slate-800">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400">95%+</p>
              <p className="text-xs text-slate-400 font-semibold uppercase">CAPI Event Match Rate</p>
            </div>
            <div className="p-4 text-center space-y-1 border-l border-slate-800">
              <p className="text-3xl sm:text-4xl font-black text-amber-400">&lt; 48 Hrs</p>
              <p className="text-xs text-slate-400 font-semibold uppercase">Campaign Launch Time</p>
            </div>
          </div>

          {/* Multi-Channel Grid */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Full-Stack Paid Advertising Architecture</h2>
              <p className="text-slate-400 text-sm">Every campaign is engineered with audience targeting, ad creatives, tracking scripts, and landing page alignment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adChannels.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 transition-all hover:scale-[1.02] space-y-3 flex flex-col justify-between shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                          {item.badge}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Conversion Banner */}
          <div className="p-10 rounded-3xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-indigo-950/60 border border-rose-500/30 text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to Turn Clicks Into Customers?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Get an expert audit of your existing Meta or Google Ads accounts. We’ll show you where ad spend is leaking and how to double your ROAS.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/start-project"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-rose-500/25 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Start Your Campaign</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 transition-all hover:scale-105 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Instant WhatsApp Call</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
