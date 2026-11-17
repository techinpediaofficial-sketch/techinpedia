import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import { Sparkles, ArrowRight, Laptop, Code2, TrendingUp, CheckCircle2, MessageSquare, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Work & Case Studies | TechInPedia',
  description: 'Explore upcoming enterprise case studies in hardware rentals, custom software engineering, and digital growth marketing engineered by TechInPedia.',
  alternates: {
    canonical: 'https://techinpedia.com/work',
  },
  openGraph: {
    title: 'Case Studies & Deliverables | TechInPedia',
    description: 'Explore our latest hardware, software, and marketing client deployments.',
    url: 'https://techinpedia.com/work',
    siteName: 'TechInPedia',
    type: 'website',
  },
};

export default async function PortfolioPage() {
  const whatsappLink = await getGeneralWhatsAppLink().catch(() => 'https://wa.me/919876543210');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com';

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'TechInPedia Portfolio & Case Studies',
    url: `${siteUrl}/work`,
    description: 'TechInPedia client deliverables and case studies.',
  };

  return (
    <>
      <JsonLd data={schemaData} />
      <div className="bg-[#faf8ff] py-20 min-h-screen text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>Portfolio & Case Studies</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
              Our Work & Client Deliverables
            </h1>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              We are currently updating this section with our brand-new 2026 enterprise project case studies across all three core pillars.
            </p>
          </div>

          {/* 3 Core Pillars Showcase Cards (Upcoming / In-Update State) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1: Hardware Deliverables */}
            <div className="p-8 rounded-3xl bg-white border border-violet-100 shadow-sm hover:border-violet-300 hover:shadow-[0_15px_35px_rgba(128,46,227,0.1)] transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center font-bold">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Updating</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Hardware & Workstations</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bulk enterprise fleet deployments, high-compute AI/GPU workstation setups, and corporate AMC infrastructure maintenance.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-violet-50 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>50+ Configured MacBook Pro M3 Fleet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>RTX 4090 Deep Learning Workstation Lab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Multi-Branch Corporate IT AMC Contract</span>
                  </div>
                </div>
              </div>

              <Link
                href="/services/laptop-rental"
                className="w-full py-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold text-xs border border-violet-200 transition-all text-center block"
              >
                Explore Hardware Offerings →
              </Link>
            </div>

            {/* Pillar 2: Software Engineering */}
            <div className="p-8 rounded-3xl bg-white border border-violet-100 shadow-sm hover:border-violet-300 hover:shadow-[0_15px_35px_rgba(128,46,227,0.1)] transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Updating</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Software & Mobile Apps</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sub-second Next.js web applications, native Flutter & React Native mobile applications, and auto-scaling cloud DevOps.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-violet-50 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Enterprise Multi-Vendor Super App</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Real-Time Logistics & Fleet Tracking Platform</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Sub-Second Next.js E-Commerce Architecture</span>
                  </div>
                </div>
              </div>

              <Link
                href="/services/website-development"
                className="w-full py-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs border border-purple-200 transition-all text-center block"
              >
                Explore Software Offerings →
              </Link>
            </div>

            {/* Pillar 3: Growth Marketing */}
            <div className="p-8 rounded-3xl bg-white border border-violet-100 shadow-sm hover:border-violet-300 hover:shadow-[0_15px_35px_rgba(128,46,227,0.1)] transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Updating</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Strategic Growth Marketing</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    High-impact brand collaborations, viral short-form video content creation, and data-driven performance marketing campaigns.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-violet-50 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Viral Social Media Content & Reels Growth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>B2B Brand Tie-Ups & Strategic Alliances</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Meta & Google High-ROAS Acquisition Funnels</span>
                  </div>
                </div>
              </div>

              <Link
                href="/services/digital-marketing"
                className="w-full py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-all text-center block"
              >
                Explore Marketing Offerings →
              </Link>
            </div>

          </div>

          {/* Bottom CTA Banner */}
          <div className="mt-20 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-violet-50 via-purple-50/50 to-indigo-50/60 border border-violet-200 text-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-violet-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Want to Request a Private Portfolio Presentation or Custom Quote?
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
                Whether you need bulk laptop rentals, high-spec workstations, an enterprise mobile/web solution, or a viral growth campaign, connect with our senior team.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link
                  href="/start-project"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-violet-500/25 transition-all hover:scale-105 flex items-center gap-2"
                >
                  <span>Start a Project</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all inline-flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
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
