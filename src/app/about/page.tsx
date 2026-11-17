import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import JsonLd from '@/components/JsonLd';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Laptop, Code2, TrendingUp, Cpu, Sparkles } from 'lucide-react';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'About TechInPedia | Hardware Rentals, Software Engineering & Marketing',
  description: 'Learn about TechInPedia — your integrated partner for enterprise laptop/computer rentals, IT AMC maintenance, custom software development, and growth marketing.',
  alternates: {
    canonical: 'https://techinpedia.com/about',
  },
  openGraph: {
    title: 'About TechInPedia | Enterprise Hardware, Software & Marketing',
    description: 'We empower modern businesses with flexible laptop/desktop rentals, robust software engineering, and high-impact digital marketing.',
    url: 'https://techinpedia.com/about',
    siteName: 'TechInPedia',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About TechInPedia',
    description: 'Enterprise Hardware Rentals, Custom Software & Growth Marketing.',
  },
};

export default async function AboutPage() {
  const whatsappLink = await getGeneralWhatsAppLink();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com';

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About TechInPedia',
    url: `${siteUrl}/about`,
    description: 'TechInPedia provides enterprise hardware rentals, IT AMC maintenance, full-stack software development, and digital marketing.',
    mainEntity: {
      '@type': 'Organization',
      name: 'TechInPedia',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
    },
  };

  return (
    <>
      <JsonLd data={schemaData} />
      <div className="bg-[#faf8ff] py-16 text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 border border-violet-200 text-violet-700">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>About TechInPedia</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              One Unified Partner for <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Hardware, Software & Growth</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              TechInPedia eliminates operational fragmentation for growing companies. We supply plug-and-play enterprise IT hardware rentals, engineer high-performance web and mobile applications, and scale brands through data-driven digital marketing.
            </p>
          </div>

          {/* Three Pillars Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: Hardware */}
            <div className="p-8 rounded-3xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-[0_15px_30px_rgba(128,46,227,0.08)] transition-all space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center font-bold">
                <Laptop className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Hardware & Rentals</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                MacBook & Windows laptop rentals, high-compute desktop workstations, and corporate IT AMC maintenance agreements backed by rapid doorstep replacement SLAs.
              </p>
            </div>

            {/* Pillar 2: Software */}
            <div className="p-8 rounded-3xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-[0_15px_30px_rgba(128,46,227,0.08)] transition-all space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold">
                <Code2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Software & Cloud</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Native iOS & Android mobile applications, sub-second Next.js web applications, and auto-scaling cloud DevOps infrastructure engineered for high concurrency.
              </p>
            </div>

            {/* Pillar 3: Marketing */}
            <div className="p-8 rounded-3xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-[0_15px_30px_rgba(128,46,227,0.08)] transition-all space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Marketing & Growth</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                High-impact B2B brand collaborations, viral short-form video content creation for social media, and high-ROAS performance digital marketing campaigns.
              </p>
            </div>
          </div>

          {/* Mission & Vision Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-white border border-violet-100 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <Zap className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                To empower companies with zero-hassle technology solutions — whether that is instantly equipping 50 engineers with high-spec laptops, shipping an enterprise mobile application, or executing multi-channel customer acquisition funnels.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-violet-100 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Our Commitment</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Reliability, transparency, and agility. We eliminate CapEx hardware locks, write clean production code with 100% IP ownership, and maintain strict SLAs on all maintenance and campaign execution.
              </p>
            </div>
          </div>

          {/* Philosophy & CTA */}
          <div className="p-10 rounded-3xl bg-gradient-to-r from-violet-50 via-purple-50/50 to-indigo-50/60 border border-violet-200 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center shadow-lg relative overflow-hidden">
            <div className="space-y-4 relative z-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-600">Why Work With TechInPedia</span>
              <h2 className="text-3xl font-extrabold text-slate-900">Accelerate Your Operational Velocity</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Forget coordinating with dozens of isolated vendors. TechInPedia brings your physical hardware needs, digital engineering, and marketing strategy under one seamless umbrella.
              </p>
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Doorstep Laptop & Computer Hardware Provisioning</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Modern Engineering (Next.js, Flutter, AWS, Docker)</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>24/7 Corporate IT AMC & Dedicated Support</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-violet-100 shadow-xl space-y-5 text-center relative z-10">
              <h3 className="text-xl font-bold text-slate-900">Ready to Partner With Us?</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Discuss your hardware requirements, development sprint, or marketing campaign today.
              </p>
              <div className="pt-2 flex flex-col gap-3">
                <Link
                  href="/start-project"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-violet-500/25 transition-all"
                >
                  Start a Project
                </Link>
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all"
                  >
                    Direct WhatsApp Chat
                  </a>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
