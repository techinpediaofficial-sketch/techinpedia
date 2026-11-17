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
  Video,
  Play,
  TrendingUp,
  Sparkles,
  Zap,
  Eye,
  Sliders,
} from 'lucide-react';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'YouTube Channel Optimization & Video Marketing Agency | TechInPedia',
  description:
    'Scale YouTube views, subscribers, and watch time with algorithmic video SEO, high-CTR thumbnail design, and viral Shorts strategy engineered by TechInPedia.',
  keywords: [
    'YouTube Channel Optimization',
    'YouTube Video SEO Agency',
    'High CTR Thumbnail Design',
    'YouTube Shorts Marketing',
    'Channel Monetization Growth',
  ],
  alternates: {
    canonical: 'https://techinpedia.in/services/youtube-channel-optimization',
  },
  openGraph: {
    title: 'YouTube Marketing & Channel Growth Agency | TechInPedia',
    description: 'Grow views and subscribers with algorithmic video SEO, custom high-CTR thumbnails, and viral Shorts funnels.',
    url: 'https://techinpedia.in/services/youtube-channel-optimization',
    siteName: 'TechInPedia India',
    type: 'website',
  },
};

export default async function YouTubeMarketingServicePage() {
  const whatsappLink = await getServiceWhatsAppLink('YouTube Channel Marketing');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.in';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'YouTube Channel Optimization Services',
        serviceType: 'Video Marketing & Channel Growth',
        provider: {
          '@type': 'Organization',
          name: 'TechInPedia India',
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
        },
        description: 'Algorithmic video SEO, custom high-CTR thumbnails, and YouTube Shorts monetization funnels.',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` },
          { '@type': 'ListItem', position: 3, name: 'YouTube Marketing', item: `${siteUrl}/services/youtube-channel-optimization` },
        ],
      },
    ],
  };

  const capabilities = [
    {
      title: 'Algorithmic Video SEO & Tags',
      desc: 'Deep keyword research to rank videos on both YouTube search and Suggested Videos, using optimized titles, descriptions, and semantic tag packets.',
      icon: TrendingUp,
      badge: 'Search Traffic',
    },
    {
      title: 'High-CTR Custom 4K Thumbnails',
      desc: 'Bespoke high-contrast visual hooks designed to maximize click-through rates (CTR) and trigger YouTube Browse feature amplification.',
      icon: Eye,
      badge: '12%+ CTR',
    },
    {
      title: 'Viral YouTube Shorts Strategy',
      desc: 'Fast-paced, hook-optimized short-form videos tailored to conquer the Shorts algorithm and generate thousands of subscribers rapidly.',
      icon: Play,
      badge: 'Shorts Engine',
    },
    {
      title: 'Watch Time & Retention Architecture',
      desc: 'Pacing analysis, drop-off reduction strategies, and chapter markers that train YouTube algorithms to push your content to wider audiences.',
      icon: Sliders,
      badge: 'High Retention',
    },
    {
      title: 'Channel Branding & End-Screen Funnels',
      desc: 'Professional channel banners, playlists, community tab schedules, and end-screen video cards that create endless binge-watching loops.',
      icon: Sparkles,
      badge: 'Channel Identity',
    },
    {
      title: 'Inbound Lead & Monetization Setup',
      desc: 'Turn video views into paying clients with custom lead magnets, video descriptions links, pinned comments, and sponsorship integration.',
      icon: Zap,
      badge: 'Monetization',
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
              <span className="px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                <span>YouTube Growth Suite</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-extrabold uppercase tracking-wider">
                Video SEO & High CTR
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Scale Your YouTube Views, Subscribers & Revenue Organically
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
              YouTube is the world’s second largest search engine. TechInPedia engineers algorithmic video SEO, high-CTR custom thumbnails, and viral YouTube Shorts pipelines to build an engaged, monetizable audience.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/start-project"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-bold shadow-xl shadow-red-500/25 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Audit My YouTube Channel</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-red-500 text-white text-sm font-bold shadow-xl transition-all hover:scale-105 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-red-400" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-red-500/40 transition-all hover:scale-[1.02] space-y-3 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
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
