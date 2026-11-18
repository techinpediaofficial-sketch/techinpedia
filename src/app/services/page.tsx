import type { Metadata } from 'next';
import Link from 'next/link';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import JsonLd from '@/components/JsonLd';
import {
  ArrowRight,
  Laptop,
  Monitor,
  Wrench,
  Smartphone,
  Globe,
  Cloud,
  Handshake,
  Video,
  TrendingUp,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import OrbitalServicesShowcase from '@/components/OrbitalServicesShowcase';
import { SERVICES_CATALOG } from '@/lib/servicesCatalog';

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: 'All Services & Solutions | TechInPedia' },
  description: 'Explore enterprise hardware rentals (laptops, desktops, workstations), IT AMC maintenance, custom software development, cloud infrastructure, and strategic digital marketing.',
  alternates: {
    canonical: 'https://techinpedia.com/services',
  },
  openGraph: {
    title: 'Enterprise Services & Solutions | TechInPedia',
    description: 'Hardware Rentals, Custom Software & High-Impact Digital Marketing engineered for modern businesses.',
    url: 'https://techinpedia.com/services',
    siteName: 'TechInPedia',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enterprise Services & Solutions | TechInPedia',
    description: 'Explore hardware rentals, software engineering, and digital marketing.',
  },
};

const SERVICE_PILLARS = [
  {
    name: 'Hardware & Infrastructure Rentals',
    desc: 'High-spec corporate laptop rentals, custom GPU computer workstations, and comprehensive IT AMC maintenance.',
    icon: Laptop,
    accent: 'purple',
    items: [
      {
        title: 'Laptop Rental',
        slug: 'laptop-rental',
        icon: Laptop,
        badge: 'Popular',
        desc: 'Enterprise MacBooks (M2/M3/M4), Lenovo ThinkPads, and Dell XPS on flexible daily, monthly, or annual rental contracts with doorstep replacement.',
        technologies: ['Apple Silicon', 'Intel Core i7/i9', 'AMD Ryzen', 'Windows 11 Pro', 'macOS', 'Ubuntu'],
      },
      {
        title: 'Computer Rental',
        slug: 'computer-rental',
        icon: Monitor,
        badge: 'High Compute',
        desc: 'High-performance commercial desktop PCs, custom Nvidia RTX GPU workstations, multi-display setups, and local server nodes on rent.',
        technologies: ['Nvidia RTX 4090/A6000', 'Custom Towers', 'Multi-4K Monitors', 'Intel Xeon', 'Windows Server'],
      },
      {
        title: 'AMC Maintenance',
        slug: 'amc-maintenance',
        icon: Wrench,
        badge: '24/7 SLA Support',
        desc: 'Comprehensive Annual Maintenance Contracts (AMC) for corporate IT infrastructure, laptops, PCs, routers, firewalls, and office hardware.',
        technologies: ['Preventive Maintenance', 'Network Diagnostics', 'Thermal Tuning', 'Data Recovery', 'Hardware SLA'],
      },
    ],
  },
  {
    name: 'Software Engineering & Cloud',
    desc: 'Bespoke mobile applications, sub-second web applications, and auto-scaling cloud infrastructure engineered for scale.',
    icon: Globe,
    accent: 'violet',
    items: [
      {
        title: 'Mobile Application',
        slug: 'mobile-application',
        icon: Smartphone,
        badge: 'iOS & Android',
        desc: 'Native iOS & Android mobile apps and cross-platform Flutter & React Native applications engineered for buttery 120fps performance.',
        technologies: ['Flutter', 'React Native', 'Swift (iOS)', 'Kotlin (Android)', 'Firebase', 'Play Store & App Store'],
      },
      {
        title: 'Website Development',
        slug: 'website-development',
        icon: Globe,
        badge: 'Next.js 16',
        desc: 'Blazing-fast web applications, corporate portals, and headless SaaS platforms built on Next.js, React, and TypeScript with 95+ PageSpeed.',
        technologies: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Prisma ORM'],
      },
      {
        title: 'Cloud Services',
        slug: 'cloud-services',
        icon: Cloud,
        badge: 'DevOps & 99.99%',
        desc: 'Scalable cloud architecture, Docker containerization, Kubernetes cluster orchestration, and automated CI/CD deployment pipelines on AWS, GCP & Azure.',
        technologies: ['AWS', 'Google Cloud', 'Microsoft Azure', 'Docker', 'Kubernetes', 'CI/CD Pipelines'],
      },
    ],
  },
  {
    name: 'Strategic Marketing & Growth',
    desc: 'Strategic B2B collaborations, viral short-form social media content creation, and high-ROAS performance marketing.',
    icon: Sparkles,
    accent: 'fuchsia',
    items: [
      {
        title: 'Brand Collaboration',
        slug: 'brand-collaboration',
        icon: Handshake,
        badge: 'High Reach',
        desc: 'Strategic creator partnerships, B2B co-branding tie-ups, influencer campaigns, and cross-promotions that build brand authority.',
        technologies: ['Influencer CRM', 'Brand Matchmaking', 'Partnership Legal', 'Campaign Analytics', 'Media Kits'],
      },
      {
        title: 'Content Creation For Social Media',
        slug: 'content-creation-for-social-media',
        icon: Video,
        badge: 'Viral Formats',
        desc: 'Studio-grade short-form video production (Instagram Reels, YouTube Shorts), visual carousels, and motion graphics that stop the scroll.',
        technologies: ['Adobe Premiere Pro', 'After Effects', 'Figma', 'Motion Graphics', 'Sound Design', '4K Production'],
      },
      {
        title: 'Digital Marketing',
        slug: 'digital-marketing',
        icon: TrendingUp,
        badge: 'High ROAS',
        desc: 'Full-funnel performance marketing across Meta Ads (Facebook & Instagram), Google PPC, technical SEO, and conversion-rate optimization.',
        technologies: ['Meta Ads Manager', 'Google Ads', 'GA4', 'Meta Conversions API', 'Technical SEO', 'CRO Funnels'],
      },
    ],
  },
];

export default async function ServicesPage() {
  const whatsappLink = await getGeneralWhatsAppLink();

  const serviceItemList = Object.values(SERVICES_CATALOG).map((s, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: s.title,
    url: `https://techinpedia.com/services/${s.slug}`,
    description: s.shortDescription,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'TechInPedia Services Catalog',
    description: 'Complete matrix of hardware rental, software engineering, and digital marketing services offered by TechInPedia.',
    itemListElement: serviceItemList,
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="bg-[#faf8ff] text-slate-800 min-h-screen relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-violet-400/20 via-purple-300/15 to-transparent rounded-full blur-[140px] pointer-events-none" />

        {/* 1. HERO SECTION */}
        <section className="pt-36 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>3 Pillars of Tech Excellence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.15] text-slate-900">
            Hardware Rentals, Software Engineering &{' '}
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Strategic Digital Marketing
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            TechInPedia equips forward-thinking companies with enterprise hardware rentals, bespoke web and mobile applications, scalable cloud environments, and high-converting marketing campaigns.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/start-project"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-xl shadow-violet-500/25 transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              <span>Request Custom Quote</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl bg-white border border-violet-200 hover:border-violet-400 text-slate-700 hover:text-violet-600 font-semibold text-sm transition-all inline-flex items-center gap-2 shadow-sm"
            >
              <MessageSquare className="w-4 h-4 text-violet-600" />
              <span>Direct WhatsApp Chat</span>
            </a>
          </div>
        </section>

        {/* 2. THREE PILLARS SECTIONS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 pb-28 relative z-10">
          {SERVICE_PILLARS.map((pillar, pIdx) => {
            const PillarIcon = pillar.icon;
            return (
              <section key={pillar.name} className="space-y-8">
                {/* Pillar Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-violet-100">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-600">
                      <PillarIcon className="w-4 h-4" />
                      <span>Pillar 0{pIdx + 1}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{pillar.name}</h2>
                    <p className="text-sm text-slate-600 max-w-2xl">{pillar.desc}</p>
                  </div>
                  <Link
                    href="/start-project"
                    className="text-xs font-bold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1 shrink-0"
                  >
                    <span>Inquire About This Pillar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* 3-Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {pillar.items.map((service) => {
                    const Icon = service.icon;
                    return (
                      <Link
                        href={`/services/${service.slug}`}
                        key={service.slug}
                        className="group relative rounded-3xl bg-white border border-violet-100 hover:border-violet-300 p-7 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-[0_15px_35px_rgba(128,46,227,0.1)] block cursor-pointer"
                      >
                        <div className="space-y-4 relative z-10">
                          <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                              <Icon className="w-6 h-6" />
                            </div>
                            {service.badge && (
                              <span className="text-[10px] font-mono uppercase tracking-wider bg-violet-100 border border-violet-200 text-violet-700 px-2.5 py-1 rounded-full font-bold">
                                {service.badge}
                              </span>
                            )}
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                              {service.title}
                            </h3>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                              {service.desc}
                            </p>
                          </div>

                          {/* Technologies / Chips */}
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {service.technologies.slice(0, 4).map((tech) => (
                              <span
                                key={tech}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-50/70 border border-violet-100 text-slate-600"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Card Link (Converted to span to avoid nested links) */}
                        <div className="pt-6 border-t border-violet-100 mt-6 relative z-10 flex items-center justify-between">
                          <span
                            className="text-xs font-bold text-violet-600 group-hover:text-violet-700 inline-flex items-center gap-1.5 group/link"
                          >
                            <span>Explore Full Specifications</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* 3. ORBITAL SHOWCASE SECTION */}
        <section className="py-20 bg-white border-t border-violet-100 relative z-10">
          <OrbitalServicesShowcase whatsappLink={whatsappLink} />
        </section>

        {/* 4. BOTTOM CTA BANNER */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-violet-50 via-purple-50/50 to-indigo-50/70 border border-violet-200 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-violet-600 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Ready to Elevate Your Operations?</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Get Pre-Configured Hardware, Custom Code & Growth Marketing
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Whether you need 20 high-spec developer laptops by tomorrow, a custom Next.js web application, or a viral social media campaign, TechInPedia delivers on time.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <Link
                href="/start-project"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-xl shadow-violet-500/25 transition-all hover:scale-105 inline-flex items-center gap-2"
              >
                <span>Start Project Proposal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 rounded-xl bg-white border border-violet-200 hover:border-violet-300 text-slate-700 hover:text-violet-600 font-semibold text-sm transition-all shadow-sm"
              >
                Contact Sales Team
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
