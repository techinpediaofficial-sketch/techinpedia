import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import JsonLd from '@/components/JsonLd';
import TechIcon from '@/components/TechIcons';
import {
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Zap,
  Globe,
  Layout,
} from 'lucide-react';
import { ContentStatus } from '@prisma/client';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Website Development Company in India | Custom Web Design Services',
  description:
    'Premier website development company in India engineering fast, responsive, SEO-optimized business websites, landing pages, and e-commerce portals.',
  keywords: [
    'Website Development Company in India',
    'Custom Web Design Services',
    'Business Website Development',
    'Next.js Website Developers India',
    'High Converting Website Design',
    'Responsive Web Development India',
  ],
  alternates: {
    canonical: 'https://techinpedia.in/services/website-development',
  },
  openGraph: {
    title: 'Website Development Company in India | TechInPedia',
    description:
      'Engineering high-converting, sub-second speed websites, web apps, and enterprise digital experiences in India.',
    url: 'https://techinpedia.in/services/website-development',
    siteName: 'TechInPedia India',
    type: 'website',
    images: [{ url: 'https://techinpedia.in/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Website Development Company in India | TechInPedia',
    description: 'Custom business websites, web applications, and fast Next.js user interfaces.',
    images: ['https://techinpedia.in/og-image.jpg'],
  },
};

export default async function WebsiteDevelopmentPage() {
  const whatsappLink = await getGeneralWhatsAppLink();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.in';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Website Development Services',
        serviceType: 'Web Design & Software Development',
        provider: {
          '@type': 'Organization',
          name: 'TechInPedia India',
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
        },
        areaServed: {
          '@type': 'Country',
          name: 'Worldwide',
        },
        description:
          'Custom business website design, fast responsive web app development, Next.js engineering, and conversion-optimized websites built by TechInPedia India.',
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
            name: 'Services',
            item: `${siteUrl}/services`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Website Development',
            item: `${siteUrl}/services/website-development`,
          },
        ],
      },
    ],
  };

  const techStack = ['Next.js 16', 'React 19', 'Tailwind CSS', 'TypeScript', 'Node.js', 'MySQL', 'GraphQL'];

  const webFeatures = [
    {
      title: 'Sub-Second Page Load Speeds',
      desc: 'Optimized Core Web Vitals (LCP, INP, CLS) to maximize conversion rates and search rankings.',
    },
    {
      title: 'Flawless Mobile Responsiveness',
      desc: 'Adaptive layouts designed for mobile-first user retention across smartphones, tablets, and desktops.',
    },
    {
      title: 'SEO-Optimized From Day 1',
      desc: 'Semantic HTML5, automated XML sitemaps, OpenGraph cards, and schema graph integration baked in.',
    },
    {
      title: 'Custom Content Management',
      desc: 'Flexible admin dashboard to manage team pages, blogs, services, and dynamic media effortlessly.',
    },
  ];

  return (
    <>
      <JsonLd data={schemaData} />
      <div className="bg-slate-950 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <Link href="/services" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Services</span>
          </Link>

          {/* Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Globe className="w-4 h-4" />
                <span>Premier Web Development Company India</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                High-Converting <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">Website Development</span> in India
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                TechInPedia builds custom websites, web portals, and responsive web applications engineered for lightning speed, search visibility, and maximum customer retention.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/start-project"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  <span>Build Your Website</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white font-bold text-sm flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Discuss Requirements</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <span>The TechInPedia Advantage</span>
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Sub-Second Page Load Optimization</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Built-in Technical SEO & Schema Markup</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Custom UI/UX Designed for Conversions</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>100% Custom Next.js & React Codebase</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white">Modern Web Engineering Tech Stack</h2>
            <div className="flex flex-wrap gap-2.5">
              {techStack.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold flex items-center gap-2"
                >
                  <TechIcon name={tech} className="w-4 h-4" />
                  <span>{tech}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl font-extrabold text-white">What We Build Into Every Website</h2>
              <p className="text-sm text-slate-400">Robust performance, beautiful UI, and conversion focus.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {webFeatures.map((feat, idx) => (
                <div key={idx} className="p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="p-10 rounded-3xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-900/50 text-center space-y-6">
            <h2 className="text-3xl font-extrabold text-white">Let’s Engineer Your Custom Website</h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto">
              Get a custom proposal and estimate for your business website or portal today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/start-project" className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm">
                Get a Fast Quote
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm inline-flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Talk on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
