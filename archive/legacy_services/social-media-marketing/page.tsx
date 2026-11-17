import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import JsonLd from '@/components/JsonLd';
import {
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Share2,
  TrendingUp,
  Target,
  BarChart3,
  Users,
  Video,
  Layers,
  Zap,
  ShieldCheck,
  Award,
  Clock,
  Compass,
  FileText,
  Calendar,
  Send,
  HeartHandshake,
  Repeat,
  ChevronRight,
  PieChart,
  Eye,
  DollarSign,
  Flame,
} from 'lucide-react';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Social Media Marketing Services | TechInPedia',
  description:
    'Grow your brand with TechInPedia social media marketing services including social media management, content creation, reels, paid advertising, lead generation and analytics.',
  keywords: [
    'Social Media Marketing Services',
    'Social Media Management India',
    'Reels and Short Video Marketing',
    'Meta Ads Agency India',
    'Paid Social Advertising',
    'Organic Social Growth',
    'B2B LinkedIn Marketing',
    'TechInPedia Social Media',
  ],
  alternates: {
    canonical: 'https://techinpedia.in/services/social-media-marketing',
  },
  openGraph: {
    title: 'Social Media Marketing Services | TechInPedia',
    description:
      'We create, manage and optimize social media strategies that turn your online presence into a powerful growth channel.',
    url: 'https://techinpedia.in/services/social-media-marketing',
    siteName: 'TechInPedia India',
    type: 'website',
    images: [{ url: 'https://techinpedia.in/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Social Media Marketing Services | TechInPedia',
    description:
      'Grow your brand with TechInPedia social media marketing services including social media management, content creation, reels, and paid advertising.',
    images: ['https://techinpedia.in/og-image.jpg'],
  },
};

// Configurable Packages Data
const SOCIAL_PACKAGES = [
  {
    name: 'STARTER',
    tagline: 'Essential brand presence & organic consistency',
    badge: 'Foundation',
    badgeColor: 'border-slate-700 bg-slate-800/80 text-slate-300',
    popular: false,
    pricingNote: 'Custom Strategy & Monthly Retainer',
    features: [
      '12 Curated Static & Carousel Posts',
      '8 Engaging Story Sequences',
      '4 High-Quality Edited Reels',
      'Instagram + Facebook Management',
      'Monthly Content Calendar Planning',
      'End-of-Month Performance Report',
      'Hashtag & Caption Optimization',
      'Profile Optimization & Bio Revamp',
    ],
  },
  {
    name: 'GROWTH',
    tagline: 'Multi-channel scaling & active community building',
    badge: 'Most Popular',
    badgeColor: 'border-blue-500/50 bg-blue-600/20 text-blue-400',
    popular: true,
    pricingNote: 'Scalable Growth Retainer',
    features: [
      '16 Curated Static & Carousel Posts',
      '12 Dynamic Story Sequences',
      '8 High-Quality Short-Form Reels',
      'Instagram + Facebook + LinkedIn',
      'Comprehensive Content Strategy',
      'Active Community Management & DM Filter',
      'In-Depth Analytics & Tracking Dashboard',
      'Basic Ad Management & Campaign Setup',
      'Competitor Benchmarking & Hook Research',
    ],
  },
  {
    name: 'PREMIUM',
    tagline: 'Dominant omnichannel presence with full-funnel paid ads',
    badge: 'Enterprise / Scale',
    badgeColor: 'border-purple-500/50 bg-purple-600/20 text-purple-300',
    popular: false,
    pricingNote: 'Tailored Enterprise Retainer',
    features: [
      '20+ Premium Brand Posts & Carousels',
      '16+ Viral-Optimized Reels & Shorts',
      'Daily Stories & Polls/Q&A Engagement',
      'Multi-Platform Management (IG, FB, LI, YT, X)',
      'Advanced Omnichannel Strategy & Funnels',
      'Dedicated Community Manager (Comments & DMs)',
      'Meta Ads & Lead Generation Campaigns',
      'A/B Creative & Hook Testing',
      'Weekly In-Depth ROI & Attribution Analytics',
    ],
  },
];

// 6 Process Steps
const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Discover',
    desc: 'Understand the business, audience, competitors and goals.',
    icon: Compass,
    color: 'text-blue-400',
  },
  {
    step: '02',
    title: 'Strategize',
    desc: 'Create the social media, content and growth strategy.',
    icon: Target,
    color: 'text-cyan-400',
  },
  {
    step: '03',
    title: 'Create',
    desc: 'Develop creatives, reels, captions and campaign assets.',
    icon: Sparkles,
    color: 'text-violet-400',
  },
  {
    step: '04',
    title: 'Publish',
    desc: 'Schedule and distribute content across relevant platforms.',
    icon: Send,
    color: 'text-emerald-400',
  },
  {
    step: '05',
    title: 'Engage',
    desc: 'Manage comments, messages, audience interaction and leads.',
    icon: HeartHandshake,
    color: 'text-amber-400',
  },
  {
    step: '06',
    title: 'Optimize',
    desc: 'Analyze performance, test new approaches and continuously improve.',
    icon: Repeat,
    color: 'text-rose-400',
  },
];

export default async function SocialMediaMarketingPage() {
  const whatsappLink = await getGeneralWhatsAppLink();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.in';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Social Media Marketing Services',
        serviceType: 'Digital Marketing & Social Media Strategy',
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
          'Comprehensive social media marketing services including social media management, content creation, short-form reels, organic audience growth, paid social advertising, community management, and analytics.',
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
            name: 'Social Media Marketing',
            item: `${siteUrl}/services/social-media-marketing`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={schemaData} />

      <div className="bg-slate-950 text-slate-100 min-h-screen relative overflow-hidden">
        
        {/* Subtle Ambient Background Grids */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25 z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent rounded-full blur-[140px]" />
          <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 space-y-24">

          {/* Breadcrumb Navigation */}
          <div>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-800"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Services Overview</span>
            </Link>
          </div>

          {/* =========================================================================
              3. HERO SECTION
              Headline: "Social Media Marketing That Builds Brands & Drives Growth"
              Supporting text: "We create, manage and optimize social media strategies that turn your online presence into a powerful growth channel."
              Primary CTA: "Get a Free Strategy Call"
              Secondary CTA: "Let's Talk"
             ========================================================================= */}
          <section className="pt-4 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Strategic Brand Growth & Social Engineering</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                  Social Media Marketing That{' '}
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                    Builds Brands & Drives Growth
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
                  We create, manage and optimize social media strategies that turn your online presence into a powerful growth channel.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-3">
                  <Link
                    href="/start-project?service=Social+Media+Marketing"
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2"
                  >
                    <span>Get a Free Strategy Call</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 font-bold text-sm transition-all inline-flex items-center gap-2 shadow-inner"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>Let&apos;s Talk</span>
                  </a>
                </div>

                {/* Quick Trust Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-800/80">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Content Strategy</p>
                    <p className="text-sm font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Data-Driven</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Performance Focus</p>
                    <p className="text-sm font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Full-Funnel</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Production Quality</p>
                    <p className="text-sm font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Studio Standard</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Hero Graphic Card: Social Command Hub Preview */}
              <div className="lg:col-span-5 relative">
                <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden group">
                  
                  {/* Glowing header accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">
                        Social Growth Engine
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                      Multi-Channel Active
                    </span>
                  </div>

                  {/* Core Growth Metric Preview Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        Engagement Rate
                      </span>
                      <p className="text-xl font-black text-white">+142%</p>
                      <span className="text-[10px] text-emerald-400 font-mono">Quarterly average benchmark</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Video className="w-3 h-3 text-cyan-400" />
                        Reels Retention
                      </span>
                      <p className="text-xl font-black text-white">84.2%</p>
                      <span className="text-[10px] text-cyan-400 font-mono">Hook-to-completion rate</span>
                    </div>
                  </div>

                  {/* Simulated Publishing Pipeline */}
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Campaign Delivery Schedule
                    </p>
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-purple-400" />
                          <span className="font-semibold text-slate-200">Reels & Short Video Batch</span>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-400">Published & Active</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          <span className="font-semibold text-slate-200">B2B Thought Leadership Carousel</span>
                        </div>
                        <span className="text-[11px] font-mono text-blue-400">Scheduled (10:00 AM)</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-rose-400" />
                          <span className="font-semibold text-slate-200">Meta Paid Retargeting Ad Set</span>
                        </div>
                        <span className="text-[11px] font-mono text-amber-400">Optimizing ROAS</span>
                      </div>
                    </div>
                  </div>

                  {/* Strategic Bottom Banner */}
                  <div className="p-3.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
                    <span className="font-medium">Direct CRM & Lead Integration</span>
                    <span className="text-[11px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded">Connected</span>
                  </div>

                </div>
              </div>

            </div>
          </section>

          {/* =========================================================================
              4. SOCIAL MEDIA PLATFORMS ("Platforms We Manage")
              Instagram, Facebook, LinkedIn, YouTube, X / Twitter, Pinterest
             ========================================================================= */}
          <section className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Omnichannel Presence</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Platforms We Manage
              </h2>
              <p className="text-sm text-slate-400">
                We tailor custom content architectures for every platform where your prospective customers spend their time.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              
              {/* Instagram */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-pink-500/50 transition-all text-center space-y-3 group hover:scale-[1.02]">
                <div className="w-12 h-12 mx-auto rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 fill-current text-pink-400" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white">Instagram</h3>
                <p className="text-[11px] text-slate-400">Reels, Carousels, Stories & Creator DM pipelines.</p>
              </div>

              {/* Facebook */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition-all text-center space-y-3 group hover:scale-[1.02]">
                <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 fill-current text-blue-400" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.667 5H18V0h-3.808C10.595 0 9 1.582 9 4.615V8z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white">Facebook</h3>
                <p className="text-[11px] text-slate-400">Page scaling, Meta Lead Ads, Groups & Community.</p>
              </div>

              {/* LinkedIn */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 transition-all text-center space-y-3 group hover:scale-[1.02]">
                <div className="w-12 h-12 mx-auto rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 fill-current text-sky-400" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white">LinkedIn</h3>
                <p className="text-[11px] text-slate-400">B2B thought leadership, founder branding & outbound lead gen.</p>
              </div>

              {/* YouTube */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-red-500/50 transition-all text-center space-y-3 group hover:scale-[1.02]">
                <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 fill-current text-red-500" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white">YouTube</h3>
                <p className="text-[11px] text-slate-400">Shorts, video SEO, click-through thumbnails & long-form.</p>
              </div>

              {/* X / Twitter */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all text-center space-y-3 group hover:scale-[1.02]">
                <div className="w-12 h-12 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 fill-current text-cyan-400" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white">X / Twitter</h3>
                <p className="text-[11px] text-slate-400">Trend conversations, industry commentary & direct outreach.</p>
              </div>

              {/* Pinterest */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-red-600/50 transition-all text-center space-y-3 group hover:scale-[1.02]">
                <div className="w-12 h-12 mx-auto rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 fill-current text-rose-500" viewBox="0 0 24 24">
                    <path d="M12 0a12 12 0 0 0-4.37 23.18c-.07-.95-.13-2.42.03-3.46.14-.94.94-6.38.94-6.38s-.24-.48-.24-1.19c0-1.11.64-1.94 1.45-1.94.68 0 1.01.51 1.01 1.13 0 .69-.44 1.72-.67 2.67-.19.8.4 1.45 1.19 1.45 1.43 0 2.53-1.51 2.53-3.69 0-1.93-1.39-3.28-3.37-3.28-2.3 0-3.64 1.72-3.64 3.5 0 .69.27 1.44.6 1.84.07.08.08.15.06.24l-.23.95c-.04.15-.12.18-.28.11-1.04-.49-1.69-2.02-1.69-3.25 0-2.65 1.93-5.09 5.56-5.09 2.92 0 5.19 2.08 5.19 4.86 0 2.9-1.83 5.23-4.37 5.23-.85 0-1.65-.44-1.93-.96l-.53 2.01c-.19.74-.71 1.67-1.06 2.23A12 12 0 1 0 12 0z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-white">Pinterest</h3>
                <p className="text-[11px] text-slate-400">Visual search pins, product catalogs & e-commerce traffic.</p>
              </div>

            </div>
          </section>

          {/* =========================================================================
              5. WHAT WE OFFER (8 Service Cards with specific bullets)
             ========================================================================= */}
          <section className="space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Full-Stack Solutions</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                What We Offer
              </h2>
              <p className="text-sm text-slate-400">
                End-to-end capabilities covering organic community engagement, viral media production, and scalable paid performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* 1. Social Media Management */}
              <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    Social Media Management
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Turn your brand accounts into well-orchestrated digital hubs with disciplined publishing and active community care.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span>Account management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span>Content scheduling</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span>Publishing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span>Profile optimization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span>Community management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span>Comments & DM management</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 2. Content Creation */}
              <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                    Content Creation
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bespoke visuals, carousels, and educational graphics crafted to establish authority and drive organic saves.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Static posts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Carousels</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Stories</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Promotional creatives</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Infographics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Educational content</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 3. Reels & Short-Form Video */}
              <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <Video className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                    Reels & Short-Form Video
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Fast-paced, hook-driven video editing designed to capitalize on algorithmic feeds across modern platforms.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>Instagram Reels</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>YouTube Shorts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>Facebook Reels</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>Video editing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>Hooks & scripts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>Trending-content strategy</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 4. Organic Social Media Growth */}
              <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Organic Social Media Growth
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sustainable audience building based on search intent, algorithmic relevancy, and niche audience psychology.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Audience research</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Competitor analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Hashtag/keyword research</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Engagement strategy</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Organic growth strategy</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 5. Paid Social Advertising */}
              <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-rose-400 transition-colors">
                    Paid Social Advertising
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Performance marketing that turns targeted ad impressions into high-intent inbound inquiries and verifiable sales.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span>Meta Ads (FB + IG)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span>Lead generation campaigns</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span>Conversion campaigns</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span>Retargeting</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span>A/B testing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span>Campaign optimization</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 6. Community Management */}
              <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                    Community Management
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Protect brand reputation and cultivate loyal brand evangelists through rapid, empathetic responses.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Comment management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>DM management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Customer queries</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Lead qualification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Audience engagement</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Reputation management</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 7. LinkedIn Marketing */}
              <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors">
                    LinkedIn Marketing
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Position your founders and enterprise brand as commanding authorities to win high-ticket B2B deals.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span>Company page management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span>Founder/personal branding</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span>B2B content</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span>Thought leadership</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                      <span>B2B lead generation</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 8. YouTube Marketing */}
              <div className="p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-red-500/50 transition-all flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                    YouTube Marketing
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Convert video views into durable inbound search traffic with ranking titles, high-CTR thumbnails and Shorts.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span>Channel optimization</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span>Video SEO</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span>Titles & descriptions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span>Thumbnail strategy</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span>YouTube Shorts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span>Analytics optimization</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          </section>

          {/* =========================================================================
              6. OUR SOCIAL MEDIA PROCESS (Visual 6-Step Process)
              01 — Discover, 02 — Strategize, 03 — Create, 04 — Publish, 05 — Engage, 06 — Optimize
             ========================================================================= */}
          <section className="space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Methodology</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Our Social Media Process
              </h2>
              <p className="text-sm text-slate-400">
                A disciplined, 6-step loop engineered to turn raw ideas into high-converting audience momentum.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {PROCESS_STEPS.map((p) => {
                const IconComponent = p.icon;
                return (
                  <div
                    key={p.step}
                    className="p-7 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 transition-all space-y-4 group relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black font-mono text-slate-600 group-hover:text-blue-400 transition-colors">
                        {p.step}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                        <IconComponent className={`w-5 h-5 ${p.color}`} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* =========================================================================
              7. CONTENT STRATEGY SECTION
              Explains social media isn't only about posting.
              Content pillars: Brand Awareness, Educational Content, Product/Service Promotion,
              Social Proof, Engagement Content, Lead Generation, Community Building
             ========================================================================= */}
          <section className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-8">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Strategic Depth</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Social Media Isn&apos;t Just About Posting Daily
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Blind posting without architectural intent leads to burnout and zero bottom-line growth. At TechInPedia, we construct every monthly calendar across 7 distinct content pillars to ensure balanced reach, trust building, and direct revenue capture.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-blue-500/40 transition-all space-y-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <h3 className="text-sm font-bold text-white">Brand Awareness</h3>
                <p className="text-xs text-slate-400 leading-relaxed">High-reach hooks, trending visuals, and memorable identity cues to capture top-of-funnel eyeballs.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all space-y-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <h3 className="text-sm font-bold text-white">Educational Content</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Breakdowns, actionable carousels, and frameworks that establish industry authority and generate saves.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <h3 className="text-sm font-bold text-white">Product & Service Promotion</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Crisp feature spotlights, client walkthroughs, and compelling offers with clear calls to action.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/40 transition-all space-y-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-bold text-white">Social Proof</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Verified case studies, client testimonials, video reviews, and before-and-after implementation metrics.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-amber-500/40 transition-all space-y-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h3 className="text-sm font-bold text-white">Engagement Content</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Interactive polls, provocative thought-questions, and community debates that trigger comments.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-rose-500/40 transition-all space-y-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <h3 className="text-sm font-bold text-white">Lead Generation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Gated checklists, free strategy audits, webinars, and direct keyword-driven DM automation.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-purple-500/40 transition-all space-y-2 sm:col-span-2 lg:col-span-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <h3 className="text-sm font-bold text-white">Community Building</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Behind-the-scenes culture, transparent milestone updates, and active interaction that turns followers into passionate brand advocates.</p>
              </div>

            </div>
          </section>

          {/* =========================================================================
              8. SOCIAL MEDIA GROWTH SECTION ("From Content to Conversions")
              Funnel: Reach -> Engagement -> Trust -> Leads -> Conversions -> Retention
             ========================================================================= */}
          <section className="space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Full-Funnel Architecture</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                From Content to Conversions
              </h2>
              <p className="text-sm text-slate-400">
                How TechInPedia structures every impression to guide anonymous scrollers into loyal, recurring clients.
              </p>
            </div>

            {/* Funnel Visual Horizontal Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 relative group hover:border-blue-500/50 transition-all">
                <div className="text-[10px] font-mono text-blue-400 font-bold uppercase">Stage 01</div>
                <h3 className="text-base font-bold text-white">Reach</h3>
                <p className="text-[11px] text-slate-400">Targeted reels & viral impressions expanding initial audience surface area.</p>
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-20 text-slate-600">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 relative group hover:border-cyan-500/50 transition-all">
                <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Stage 02</div>
                <h3 className="text-base font-bold text-white">Engagement</h3>
                <p className="text-[11px] text-slate-400">Meaningful comments, carousel saves, and shares signaling active interest.</p>
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-20 text-slate-600">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 relative group hover:border-indigo-500/50 transition-all">
                <div className="text-[10px] font-mono text-indigo-400 font-bold uppercase">Stage 03</div>
                <h3 className="text-base font-bold text-white">Trust</h3>
                <p className="text-[11px] text-slate-400">Case studies, founder transparency, and authoritative niche breakdowns.</p>
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-20 text-slate-600">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 relative group hover:border-amber-500/50 transition-all">
                <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">Stage 04</div>
                <h3 className="text-base font-bold text-white">Leads</h3>
                <p className="text-[11px] text-slate-400">Inbound DM inquiries, lead magnet opt-ins, and landing page visits.</p>
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-20 text-slate-600">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 relative group hover:border-emerald-500/50 transition-all">
                <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Stage 05</div>
                <h3 className="text-base font-bold text-white">Conversions</h3>
                <p className="text-[11px] text-slate-400">Consultation bookings, signed contracts, or direct e-commerce checkouts.</p>
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-20 text-slate-600">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 relative group hover:border-purple-500/50 transition-all">
                <div className="text-[10px] font-mono text-purple-400 font-bold uppercase">Stage 06</div>
                <h3 className="text-base font-bold text-white">Retention</h3>
                <p className="text-[11px] text-slate-400">Ongoing community value, product updates, and customer advocacy programs.</p>
              </div>

            </div>
          </section>

          {/* =========================================================================
              9. PAID SOCIAL ADVERTISING
              Title: "Turn Social Attention Into Measurable Growth"
              Highlights: Meta Ads, Lead Generation, Conversion Campaigns, Retargeting,
              Audience Targeting, Creative Testing, A/B Testing, Campaign Optimization, Performance Tracking
              CTA: "Launch Your Campaign"
             ========================================================================= */}
          <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-900/40 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Paid Performance Engine</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Turn Social Attention Into Measurable Growth
                </h2>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Organic reach builds brand affinity; strategic paid advertising accelerates predictable customer acquisition. We structure targeted ad campaigns with granular attribution, eliminating wasted ad spend through continuous creative iteration.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>Meta Ads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>Lead Generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>Conversion Campaigns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>Retargeting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>Audience Targeting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>Creative Testing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>A/B Testing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>Campaign Optimization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>Performance Tracking</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href="/start-project?service=Paid+Social+Advertising"
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all inline-flex items-center gap-2"
                  >
                    <span>Launch Your Campaign</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-mono font-bold text-slate-300">Paid Funnel Structure</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Data-Backed</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                    <div className="flex justify-between font-bold text-slate-200">
                      <span>Top of Funnel (TOF)</span>
                      <span className="text-blue-400">High Interest Creatives</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Broad & lookalike audiences filtered by engagement triggers.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                    <div className="flex justify-between font-bold text-slate-200">
                      <span>Middle of Funnel (MOF)</span>
                      <span className="text-cyan-400">Social Proof & Objections</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Retargeting video viewers & website visitors with authority assets.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                    <div className="flex justify-between font-bold text-slate-200">
                      <span>Bottom of Funnel (BOF)</span>
                      <span className="text-emerald-400">Direct Inquiries / ROAS</span>
                    </div>
                    <p className="text-[11px] text-slate-400">High-intent conversion campaigns driving direct consults & checkout.</p>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* =========================================================================
              10. ANALYTICS & REPORTING
              Title: "Know What Is Working"
              Metrics: Reach, Impressions, Engagement, Followers Growth, Website Traffic, Leads, Conversions, Cost Per Lead, ROAS
              Important: Labeled as "Sample Dashboard" with transparent illustrative metrics
             ========================================================================= */}
          <section className="space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Transparency & KPIs</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Know What Is Working
              </h2>
              <p className="text-sm text-slate-400">
                No vanity metrics or guesswork. We track real business indicators so you always know where your budget translates into pipeline value.
              </p>
            </div>

            {/* Sample Dashboard Container */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Executive Analytics & Performance Dashboard
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Live client reporting suite (Illustrative Sample Dashboard demonstrating tracked metrics)
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-300 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                  Sample Dashboard Data
                </span>
              </div>

              {/* 9 Core Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">1. Total Reach</span>
                  <p className="text-2xl font-black text-white">482,900</p>
                  <span className="text-[10px] text-emerald-400 font-mono">Unique profiles exposed</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">2. Impressions</span>
                  <p className="text-2xl font-black text-white">1,240,500</p>
                  <span className="text-[10px] text-blue-400 font-mono">Total ad & organic views</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">3. Engagement</span>
                  <p className="text-2xl font-black text-white">58,340</p>
                  <span className="text-[10px] text-cyan-400 font-mono">Likes, shares, saves & DMs</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">4. Followers Growth</span>
                  <p className="text-2xl font-black text-white">+4,850</p>
                  <span className="text-[10px] text-emerald-400 font-mono">Verified organic acquisition</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">5. Website Traffic</span>
                  <p className="text-2xl font-black text-white">18,200</p>
                  <span className="text-[10px] text-indigo-400 font-mono">Direct outbound referral clicks</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">6. Leads</span>
                  <p className="text-2xl font-black text-white">328</p>
                  <span className="text-[10px] text-amber-400 font-mono">CRM-synced qualified inquiries</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">7. Conversions</span>
                  <p className="text-2xl font-black text-white">84</p>
                  <span className="text-[10px] text-emerald-400 font-mono">Closed consultations / sales</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">8. Cost Per Lead (CPL)</span>
                  <p className="text-2xl font-black text-white">₹142.50</p>
                  <span className="text-[10px] text-slate-400 font-mono">Meta Campaign benchmark</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <span className="text-xs text-slate-400">9. Return on Ad Spend (ROAS)</span>
                  <p className="text-2xl font-black text-white">4.3x</p>
                  <span className="text-[10px] text-purple-400 font-mono">Attributed revenue multiplier</span>
                </div>

              </div>
            </div>
          </section>

          {/* =========================================================================
              11. SOCIAL MEDIA PACKAGES (Editable Data Object, 3 Tiers)
              STARTER, GROWTH, PREMIUM
              Important: No invented final prices, uses configurable retainer note + "Get Started" CTA
             ========================================================================= */}
          <section className="space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Tailored Partnerships</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Social Media Packages
              </h2>
              <p className="text-sm text-slate-400">
                Transparent monthly retainers calibrated to your brand&apos;s growth stage. Custom quotes available for enterprise multi-brand scopes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {SOCIAL_PACKAGES.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
                    pkg.popular
                      ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-blue-500 shadow-2xl shadow-blue-500/10 scale-[1.03] z-10'
                      : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-lg">
                      Recommended
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-white tracking-tight">{pkg.name}</h3>
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${pkg.badgeColor}`}>
                          {pkg.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 min-h-[32px]">{pkg.tagline}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pricing Structure</span>
                      <p className="text-lg font-extrabold text-white mt-0.5">{pkg.pricingNote}</p>
                      <p className="text-[11px] text-slate-400">Flexible Monthly Engagements</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Deliverables Included:</p>
                      <ul className="space-y-2.5 text-xs text-slate-300">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-8">
                    <Link
                      href={`/start-project?service=Social+Media+Marketing&package=${pkg.name}`}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        pkg.popular
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================================================
              12. WHY TECHINPEDIA
              "Why Businesses Choose TechInPedia"
              Existing strengths: Tech + Marketing under one roof, Custom strategies,
              Data-driven decisions, Creative + performance approach, Multi-platform expertise,
              Transparent reporting, Scalable solutions, Long-term support
             ========================================================================= */}
          <section className="space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">The Edge</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Why Businesses Choose TechInPedia
              </h2>
              <p className="text-sm text-slate-400">
                Most agencies treat marketing as detached aesthetics. We engineer social campaigns with technical precision, clean attribution, and seamless CRM integrations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-blue-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Technology + Marketing Under One Roof</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  From custom web landing pages and tracking pixels to creative reels, our engineers and marketers collaborate seamlessly.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-indigo-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Custom Strategies</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No cookie-cutter templates. We research your specific competitive moat, audience psychology, and pricing margins before launching.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-cyan-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Data-Driven Decisions</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every hook, creative variation, and post timing is backed by algorithmic retention analytics and conversion metrics.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-purple-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Creative + Performance Approach</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Balancing visual aesthetic elegance with rigorous direct-response marketing designed to prompt immediate inquiries.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-emerald-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Multi-Platform Expertise</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Native understanding of the unique algorithmic differences across Instagram, LinkedIn, YouTube, X, and Facebook.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-amber-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Transparent Reporting</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Direct visibility into metrics that matter—inquiries, CPL, ROAS, and conversions—without obfuscated vanity numbers.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-rose-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Scalable Solutions</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Easily graduate from organic profile consistency to multi-lakh monthly paid ad campaigns as revenue compounds.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-blue-500/40 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Long-Term Partnership</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We don&apos;t just post and disappear. We act as an integrated growth wing invested in your business milestones.
                </p>
              </div>

            </div>
          </section>

          {/* =========================================================================
              15. RELEVANT INTERNAL SERVICES INTER-LINKING
              SEO, Meta Ads, Google Ads, WhatsApp Marketing, Email Marketing,
              YouTube Marketing, Web Development, E-commerce
             ========================================================================= */}
          <section className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                Integrated Digital Ecosystem
              </span>
              <h3 className="text-lg font-extrabold text-white">
                Pair Social Media With Complementary TechInPedia Growth Services
              </h3>
              <p className="text-xs text-slate-400">
                Amplify your organic and paid social channels through connected search, messaging, web engineering, and e-commerce infrastructure.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-semibold">
              <Link
                href="/services/seo-search-engine-optimization"
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/50 text-slate-200 hover:text-teal-300 transition-colors flex items-center justify-between"
              >
                <span>SEO & Search Optimization</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
              <Link
                href="/services/paid-ads-campaigning"
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-slate-200 hover:text-rose-300 transition-colors flex items-center justify-between"
              >
                <span>Meta Ads & Google Ads</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
              <Link
                href="/services/whatsapp-bulk-messaging"
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-green-500/50 text-slate-200 hover:text-green-300 transition-colors flex items-center justify-between"
              >
                <span>WhatsApp Marketing</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
              <Link
                href="/services/email-sender-campaigns"
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-200 hover:text-amber-300 transition-colors flex items-center justify-between"
              >
                <span>Email Marketing Automation</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
              <Link
                href="/services/youtube-channel-optimization"
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/50 text-slate-200 hover:text-red-400 transition-colors flex items-center justify-between"
              >
                <span>YouTube Channel Marketing</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
              <Link
                href="/services/website-development"
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-slate-200 hover:text-blue-400 transition-colors flex items-center justify-between"
              >
                <span>High-Converting Web Development</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
              <Link
                href="/services/ecommerce-solutions"
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/50 text-slate-200 hover:text-orange-300 transition-colors flex items-center justify-between"
              >
                <span>Custom E-Commerce Stores</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
              <Link
                href="/work"
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-emerald-300 transition-colors flex items-center justify-between"
              >
                <span>Live Client Case Studies</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            </div>
          </section>

          {/* =========================================================================
              13. BOTTOM CTA SECTION
              Headline: "Ready to Grow Your Brand on Social Media?"
              Supporting text: "Let's build a social media strategy designed around your business goals."
              Buttons: "Get a Free Strategy Call" & "Contact Us"
             ========================================================================= */}
          <section className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-900/50 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Take The Next Step
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                Ready to Grow Your Brand on Social Media?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Let&apos;s build a social media strategy designed around your business goals.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link
                  href="/start-project?service=Social+Media+Marketing"
                  className="px-7 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-105 inline-flex items-center gap-2"
                >
                  <span>Get a Free Strategy Call</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="px-7 py-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 font-bold text-sm transition-all"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
