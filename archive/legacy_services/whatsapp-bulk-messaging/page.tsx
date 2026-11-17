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
  MessageCircle,
  Zap,
  ShieldCheck,
  Send,
  Bot,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'WhatsApp Marketing & Bulk Messaging Engine | Official Meta Cloud API | TechInPedia',
  description:
    'Broadcast WhatsApp marketing campaigns with 98% open rates using the official Meta WhatsApp Business Cloud API. Zero ban risk, automated chatbots, and green tick support.',
  keywords: [
    'WhatsApp Marketing India',
    'WhatsApp Bulk Messaging Service',
    'Official Meta WhatsApp Cloud API',
    'WhatsApp Chatbot Development',
    'Green Tick Verification India',
    'WhatsApp Broadcast Platform',
  ],
  alternates: {
    canonical: 'https://techinpedia.in/services/whatsapp-bulk-messaging',
  },
  openGraph: {
    title: 'WhatsApp Marketing & Official Cloud API Engine | TechInPedia',
    description: 'Engage customers directly with 98% open-rate WhatsApp broadcasts, interactive buttons, and automated CRM webhooks.',
    url: 'https://techinpedia.in/services/whatsapp-bulk-messaging',
    siteName: 'TechInPedia India',
    type: 'website',
  },
};

export default async function WhatsAppMarketingServicePage() {
  const whatsappLink = await getServiceWhatsAppLink('WhatsApp Bulk Messaging & Cloud API');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.in';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'WhatsApp Bulk Messaging & Official Cloud API Solutions',
        serviceType: 'Messaging & Conversational Marketing',
        provider: {
          '@type': 'Organization',
          name: 'TechInPedia India',
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
        },
        description: 'Enterprise Meta Cloud API WhatsApp broadcasting, automated customer support chatbots, and CRM sync.',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` },
          { '@type': 'ListItem', position: 3, name: 'WhatsApp Marketing', item: `${siteUrl}/services/whatsapp-bulk-messaging` },
        ],
      },
    ],
  };

  const capabilities = [
    {
      title: 'Official Meta WhatsApp Cloud API',
      desc: '100% compliant enterprise connection directly with Meta servers. Send up to 100,000+ messages daily with zero risk of phone number blocking.',
      icon: ShieldCheck,
      badge: 'Zero Ban Risk',
    },
    {
      title: 'High-Open Bulk Broadcast Engine',
      desc: 'Deliver rich-media campaigns (images, videos, PDF brochures) with interactive quick-reply buttons and website CTAs boasting industry-leading 98% open rates.',
      icon: Send,
      badge: '98% Open Rate',
    },
    {
      title: 'Automated 24/7 AI Chatbots',
      desc: 'Answer FAQs, qualify sales leads, display product catalogs, and book customer appointments round the clock without human agent overhead.',
      icon: Bot,
      badge: 'Automation',
    },
    {
      title: 'Abandoned Cart & OTP Triggers',
      desc: 'Direct webhook integration with your website or app to trigger instant order confirmations, payment receipts, OTP verification, and abandoned cart alerts.',
      icon: Zap,
      badge: 'Instant Triggers',
    },
    {
      title: 'Green Tick Verification Assistance',
      desc: 'End-to-end guidance and documentation support to secure the prestigious Meta Verified Green Tick badge beside your brand name.',
      icon: CheckCircle2,
      badge: 'Brand Authority',
    },
    {
      title: 'Multi-Agent Support Inbox & CRM',
      desc: 'Allow your sales and support agents to collaborate from a unified WhatsApp dashboard with chat routing, contact tags, and quick-reply snippets.',
      icon: Users,
      badge: 'Team Inbox',
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
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Business Solutions</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold uppercase tracking-wider">
                Official Meta Cloud API
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Reach 100% of Your Customers Where They Actually Read: On WhatsApp
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
              Emails get lost in spam, but WhatsApp messages boast an unprecedented 98% open rate. Deploy official Meta Cloud API broadcasts, automated chatbots, and instant trigger notifications with TechInPedia.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/start-project"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Get WhatsApp API Setup</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-white text-sm font-bold shadow-xl transition-all hover:scale-105 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Live WhatsApp Demo</span>
              </a>
            </div>
          </div>

          {/* Key Metrics Proof Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="p-4 text-center space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400">98%</p>
              <p className="text-xs text-slate-400 font-semibold uppercase">Average Open Rate</p>
            </div>
            <div className="p-4 text-center space-y-1 border-l border-slate-800">
              <p className="text-3xl sm:text-4xl font-black text-teal-400">&lt; 3 Sec</p>
              <p className="text-xs text-slate-400 font-semibold uppercase">Average Delivery Time</p>
            </div>
            <div className="p-4 text-center space-y-1 border-l border-slate-800">
              <p className="text-3xl sm:text-4xl font-black text-blue-400">0%</p>
              <p className="text-xs text-slate-400 font-semibold uppercase">Risk of Number Ban</p>
            </div>
            <div className="p-4 text-center space-y-1 border-l border-slate-800">
              <p className="text-3xl sm:text-4xl font-black text-purple-400">100K+</p>
              <p className="text-xs text-slate-400 font-semibold uppercase">Daily Broadcast Limit</p>
            </div>
          </div>

          {/* Capabilities Grid */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Enterprise WhatsApp Capabilities</h2>
              <p className="text-slate-400 text-sm">Everything you need to automate customer conversations and drive instant sales orders.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {capabilities.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all hover:scale-[1.02] space-y-3 flex flex-col justify-between shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
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
          <div className="p-10 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to Supercharge Customer Engagement on WhatsApp?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
              Get onboarded onto the official Meta WhatsApp Business Cloud API with custom message templates and chatbot workflows in under 48 hours.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/start-project"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Setup WhatsApp API</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-white font-bold text-sm shadow-xl transition-all hover:scale-105 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Talk to WhatsApp Specialist</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
