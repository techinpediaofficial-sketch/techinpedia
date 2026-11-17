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
  Mail,
  Zap,
  ShieldCheck,
  Send,
  Sparkles,
  Inbox,
  Filter,
} from 'lucide-react';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Automated Email Marketing Campaigns & Dedicated SMTP | TechInPedia',
  description:
    'Turn cold prospects into repeat buyers with automated email drips, cold inbound outreach pipelines, and dedicated high-reputation SMTP servers engineered by TechInPedia.',
  keywords: [
    'Email Marketing Agency India',
    'Dedicated SMTP Server Setup',
    'Cold Email Outreach Funnels',
    'Automated Email Drips',
    'E-commerce Cart Recovery Emails',
  ],
  alternates: {
    canonical: 'https://techinpedia.in/services/email-sender-campaigns',
  },
  openGraph: {
    title: 'Automated Email Marketing & Cold Inbound Engine | TechInPedia',
    description: 'High-deliverability automated email drips and cold outreach funnels engineered for maximum inbox placement.',
    url: 'https://techinpedia.in/services/email-sender-campaigns',
    siteName: 'TechInPedia India',
    type: 'website',
  },
};

export default async function EmailMarketingServicePage() {
  const whatsappLink = await getServiceWhatsAppLink('Email Marketing Campaigns');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.in';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Automated Email Marketing Services',
        serviceType: 'Email Marketing & Outreach',
        provider: {
          '@type': 'Organization',
          name: 'TechInPedia India',
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
        },
        description: 'Dedicated SMTP infrastructure, automated behavioral drips, and high-deliverability email marketing campaigns.',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` },
          { '@type': 'ListItem', position: 3, name: 'Email Marketing', item: `${siteUrl}/services/email-sender-campaigns` },
        ],
      },
    ],
  };

  const capabilities = [
    {
      title: 'Dedicated High-Reputation SMTP',
      desc: 'Clean dedicated IP addresses with automated warm-up protocols ensuring your emails bypass spam filters and hit primary inboxes consistently.',
      icon: Inbox,
      badge: '99% Deliverability',
    },
    {
      title: 'Strict DNS Authentication (SPF, DKIM, DMARC)',
      desc: 'Complete protocol configuration preventing domain spoofing and satisfying Google and Yahoo enterprise sender requirements 100%.',
      icon: ShieldCheck,
      badge: 'Zero Spam',
    },
    {
      title: 'Behavioral Drip Automation',
      desc: 'Event-driven email sequences triggered by user actions: welcome series, onboarding workflows, trial expirations, and abandoned cart win-backs.',
      icon: Zap,
      badge: 'Automated Funnels',
    },
    {
      title: 'B2B Cold Outreach Pipelines',
      desc: 'Laser-targeted cold outbound sequences with personalized merge tags, inbox rotation, and follow-up schedules that secure sales discovery meetings.',
      icon: Send,
      badge: 'Lead Gen',
    },
    {
      title: 'Responsive Dark-Mode HTML Templates',
      desc: 'Custom-coded responsive HTML email designs tested across Outlook, Gmail, Apple Mail, and mobile screens for maximum readability.',
      icon: Mail,
      badge: 'Bespoke Design',
    },
    {
      title: 'Real-Time Spam & Reputation Audits',
      desc: 'Continuous domain blacklist monitoring, spam score analysis, bounce rate suppression, and automated unsubscribe hygiene.',
      icon: Filter,
      badge: 'Reputation',
    },
  ];

  return (
    <>
      <JsonLd data={schemaData} />
      <div className="bg-slate-950 py-16 text-slate-100 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Services</span>
          </Link>

          <div className="space-y-6 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Automated Email Marketing</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-extrabold uppercase tracking-wider">
                Dedicated SMTP Engine
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Land in Inboxes, Not Spam Folders: Engineered Email Systems
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
              Unlock the highest ROI channel in digital marketing. TechInPedia configures dedicated SMTP servers, strict SPF/DKIM/DMARC authentication, and conversion-optimized email drip automation.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/start-project"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-sm font-bold shadow-xl shadow-sky-500/25 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Setup Email Engine</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-xl shadow-emerald-600/20 transition-all hover:scale-105 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Strategy Chat</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all hover:scale-[1.02] space-y-3 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
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
      </div>
    </>
  );
}
