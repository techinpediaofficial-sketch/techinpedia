import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import JsonLd from '@/components/JsonLd';
import TechInPediaLogo from '@/components/TechInPediaLogo';
// ThreeDBackground removed - caused blue laser lines & white ball animations
import TypewriterTerminal from '@/components/TypewriterTerminal';
import BrandsTicker from '@/components/BrandsTicker';
import FullWidthTechBanner from '@/components/FullWidthTechBanner';
import { HeroFloatingOrbits } from '@/components/HeroAppIcons';
import OrbitalServicesShowcase from '@/components/OrbitalServicesShowcase';
import ScrollReveal, { ScrollStaggerContainer, ScrollStaggerItem } from '@/components/ScrollReveal';
import UrbanMarketplaceShell from '@/components/urban/UrbanMarketplaceShell';

import {
  ArrowRight,
  Code2,
  Smartphone,
  Globe,
  Cpu,
  Layout,
  ShoppingBag,
  Database,
  CheckCircle2,
  Zap,
  ShieldCheck,
  MessageCircle,
  ChevronRight,
  Layers,
  Server,
  Cloud,
  Sparkles,
  Terminal,
  Activity,
  Share2,
  Search,
  Megaphone,
  Target,
  Video,
  Mail,
} from 'lucide-react';
import { ContentStatus } from '@prisma/client';

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const isUrban = process.env.NEXT_PUBLIC_SITE_CODE === 'MARKETPLACE_PUBLIC';

  if (isUrban) {
    const siteUrl = 'https://urban.techinpedia.com';
    return {
      metadataBase: new URL(siteUrl),
      title: {
        absolute: 'Urban Marketplace | Local Services, Verified Vendors & B2B Directory in Lucknow',
      },
      description: 'Discover verified local service providers, rate cards, wholesale manufacturers, and B2B suppliers in Lucknow on Urban Marketplace.',
      keywords: [
        'Urban Marketplace',
        'Lucknow local services',
        'B2B marketplace Lucknow',
        'verified vendors Lucknow',
        'local directory Lucknow',
        'AC repair Lucknow',
        'packers and movers Lucknow',
        'dentists in Lucknow',
        'catering services Lucknow',
      ],
      alternates: {
        canonical: siteUrl,
      },
      openGraph: {
        title: 'Urban Marketplace — Local Discovery & B2B Directory',
        description: 'Discover verified local service providers, rate cards, and B2B suppliers in Lucknow.',
        url: siteUrl,
        siteName: 'Urban Marketplace',
        locale: 'en_US',
        type: 'website',
        images: [{ url: `${siteUrl}/logo.png`, width: 1200, height: 630, alt: 'Urban Marketplace' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Urban Marketplace — Local Discovery & B2B Directory',
        description: 'Discover verified local service providers, rate cards, and B2B suppliers in Lucknow.',
        images: [`${siteUrl}/logo.png`],
      },
    };
  }

  return {
    metadataBase: new URL('https://techinpedia.com'),
    title: {
      absolute: 'TechInPedia | Laptop & Desktop Rental, Mobile App, Custom Software & Digital Marketing',
    },
    description: 'TechInPedia is an IT company offering laptop & desktop rentals, mobile app development, website development, custom software, CRM, ERP and digital marketing services.',
    keywords: [
      'TechInPedia',
      'techinpedia',
      'TechInPedia company',
      'TechInPedia India',
      'TechInPedia Delhi',
      'Laptop on Rent',
      'Desktop on Rent',
      'Mobile App Development',
      'Website Development',
      'Custom Software Development',
      'CRM Development',
      'ERP Development',
      'Digital Marketing Agency',
      'AMC Maintenance',
      'Cloud Services',
      'IT Hardware Rentals India',
      'software company India',
      'IT company Delhi NCR',
    ],
    alternates: {
      canonical: 'https://techinpedia.com',
    },
    openGraph: {
      title: 'TechInPedia — Laptop & Desktop Rental, Mobile App, Website & Software Development',
      description: 'TechInPedia is an IT company offering laptop & desktop rentals, mobile app development, website development, custom software, CRM, ERP and digital marketing services.',
      url: 'https://techinpedia.com',
      siteName: 'TechInPedia',
      locale: 'en_US',
      type: 'website',
      images: [{ url: '/logo.png', width: 1200, height: 630, alt: 'TechInPedia — IT Solutions Company' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'TechInPedia — Laptop Rental, Mobile App & Software Development',
      description: 'TechInPedia is an IT company offering laptop & desktop rentals, mobile app development, website development, custom software, CRM, ERP and digital marketing services.',
      images: ['/logo.png'],
    },
  };
}




export default async function HomePage() {
  if (process.env.NEXT_PUBLIC_SITE_CODE === 'MARKETPLACE_PUBLIC') {
    return <UrbanMarketplaceShell />;
  }

  let services: any[] = [];
  let projects: any[] = [];
  let testimonials: any[] = [];
  let faqs: any[] = [];
  let whatsappLink = '';

  try {
    const [sData, pData, tData, fData, wa] = await Promise.all([
      db.service.findMany({
        where: { status: ContentStatus.PUBLISHED },
        take: 6,
        orderBy: { displayOrder: 'asc' },
      }).catch((err) => {
        console.error('Home service fetch error:', err);
        return [];
      }),
      db.project.findMany({
        where: { status: ContentStatus.PUBLISHED, featured: true },
        take: 8,
        orderBy: { displayOrder: 'asc' },
      }).catch((err) => {
        console.error('Home project fetch error:', err);
        return [];
      }),
      db.testimonial.findMany({
        where: { status: ContentStatus.PUBLISHED },
        take: 6,
        orderBy: { displayOrder: 'asc' },
      }).catch((err) => {
        console.error('Home testimonial fetch error:', err);
        return [];
      }),
      db.faq.findMany({
        where: { status: ContentStatus.PUBLISHED },
        take: 6,
        orderBy: { displayOrder: 'asc' },
      }).catch((err) => {
        console.error('Home faq fetch error:', err);
        return [];
      }),
      getGeneralWhatsAppLink().catch(() => 'https://wa.me/919876543210'),
    ]);

    services = sData;
    projects = pData;
    testimonials = Array.isArray(tData) ? tData : [];
    faqs = fData;
    whatsappLink = wa || 'https://wa.me/919876543210';
  } catch {
    whatsappLink = 'https://wa.me/919876543210';
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      ...(faqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: faqs.map((f: { question: string; answer: string }) => ({
                '@type': 'Question',
                name: f.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: f.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };



  const processSteps = [
    { num: '01', title: 'Discovery & Strategy', desc: 'We analyze business goals and map out full feature roadmaps.' },
    { num: '02', title: '3D & UI Architecture', desc: 'Designing human-centered wireframes and interactive prototypes.' },
    { num: '03', title: 'Agile Full-Stack Coding', desc: 'Writing modular Next.js, React, Node.js, and MySQL backend code.' },
    { num: '04', title: 'QA & Security Audits', desc: 'Comprehensive cross-device checks, load testing, and security hardening.' },
    { num: '05', title: 'Cloud Deployment', desc: 'Zero-downtime deployment to AWS/Vercel with CI/CD automation.' },
    { num: '06', title: 'Scale & Long-Term SLA', desc: 'Continuous performance optimization, server monitoring, and updates.' },
  ];

  return (
    <>
      <JsonLd data={schemaData} />
      {/* ThreeDBackground removed — was rendering blue laser lines & white traveling ball */}

      {/* 1. ULTRA-MODERN HERO SECTION WITH LOGO VIOLET & WHITE PALETTE */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#faf8ff] via-violet-50/40 to-white pt-16 pb-28 border-b border-violet-100">
        {/* Background Ambient Glow & Light Mesh */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-violet-400/20 via-purple-300/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-purple-300/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Soft Violet Grid Graphic Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ddd6fe_1px,transparent_1px),linear-gradient(to_bottom,#ddd6fe_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7">
              <ScrollReveal variant="fade-up" duration={0.6} className="space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold tracking-wide uppercase shadow-sm">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span>Hardware • Software • Digital Marketing</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                  TechInPedia —{' '}
                  <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Laptop Rentals, Custom Software & Digital Marketing
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                  TechInPedia delivers premium business laptop, desktop and MacBook rentals across Delhi NCR, plus full-cycle mobile app engineering, custom web platforms and strategic digital marketing.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link
                    href="/start-project"
                    className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-[0_4px_25px_rgba(128,46,227,0.35)] transition-all hover:scale-105 active:scale-95"
                  ><span>Get a Quote</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white border border-violet-200 hover:border-violet-400 text-slate-700 hover:text-violet-600 font-bold text-sm transition-all shadow-sm"
                  ><span>Explore Services</span>
                  </Link>
                </div>

                {/* Guarantees */}
                <div className="pt-6 border-t border-violet-100 grid grid-cols-3 gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-violet-600" />
                    <span>Doorstep SLA & 100% IP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-violet-600" />
                    <span>Transparent Pricing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-600" />
                    <span>Rapid Turnaround</span>
                  </div>
                </div>

                {/* INSTANT CORE SERVICES QUICK BAR */}
                <div className="pt-2 space-y-2.5">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                    <span>Explore What We Deliver & Scale:</span>
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <Link
                      href="/services/laptop-rental"
                      className="px-3.5 py-1.5 rounded-full bg-violet-100 border border-violet-300 text-violet-700 hover:bg-violet-200/70 transition-all flex items-center gap-1.5 shadow-sm hover:scale-105"
                    >
                      <span>💻 Laptop on Rent</span>
                      <span className="text-[9px] font-mono uppercase bg-violet-600 text-white px-1.5 py-0.2 rounded font-black">
                        Hot
                      </span>
                    </Link>
                    <Link
                      href="/services/computer-rental"
                      className="px-3.5 py-1.5 rounded-full bg-white border border-violet-200 text-slate-700 hover:text-violet-600 hover:border-violet-300 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>🖥️ Desktop on Rent</span>
                    </Link>
                    <Link
                      href="/services/amc-maintenance"
                      className="px-3.5 py-1.5 rounded-full bg-white border border-violet-200 text-slate-700 hover:text-violet-600 hover:border-violet-300 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>🛠️ AMC Maintenance</span>
                    </Link>
                    <Link
                      href="/services/mobile-application"
                      className="px-3.5 py-1.5 rounded-full bg-white border border-violet-200 text-slate-700 hover:text-violet-600 hover:border-violet-300 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>📱 Mobile Applications</span>
                    </Link>
                    <Link
                      href="/services/website-development"
                      className="px-3.5 py-1.5 rounded-full bg-white border border-violet-200 text-slate-700 hover:text-violet-600 hover:border-violet-300 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>🌐 Website Development</span>
                    </Link>
                    <Link
                      href="/services/cloud-services"
                      className="px-3.5 py-1.5 rounded-full bg-white border border-violet-200 text-slate-700 hover:text-violet-600 hover:border-violet-300 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>☁️ Cloud Services</span>
                    </Link>
                    <Link
                      href="/services/brand-collaboration"
                      className="px-3.5 py-1.5 rounded-full bg-white border border-violet-200 text-slate-700 hover:text-violet-600 hover:border-violet-300 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>🤝 Brand Collaboration</span>
                    </Link>
                    <Link
                      href="/services/content-creation-for-social-media"
                      className="px-3.5 py-1.5 rounded-full bg-white border border-violet-200 text-slate-700 hover:text-violet-600 hover:border-violet-300 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>🎥 Content Creation</span>
                    </Link>
                    <Link
                      href="/services/digital-marketing"
                      className="px-3.5 py-1.5 rounded-full bg-white border border-violet-200 text-slate-700 hover:text-violet-600 hover:border-violet-300 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>📈 Digital Marketing</span>
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right 3D Visual Interactive Stage */}
            <div className="lg:col-span-5 relative [perspective:1200px] mt-8 lg:mt-0">
              <ScrollReveal variant="scale-up" delay={0.15} duration={0.65}>
                {/* Animated 3D Floating Coding Tech Stack Orbit Badges */}
                <HeroFloatingOrbits />

                <div className="relative mx-auto max-w-md rounded-2xl bg-white/95 border border-violet-200 p-6 shadow-[0_20px_50px_rgba(128,46,227,0.12)] backdrop-blur-2xl [transform-style:preserve-3d] transition-transform duration-700 hover:[transform:rotateY(-8deg)_rotateX(6deg)]">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-violet-100 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-violet-400 inline-block shadow-sm" />
                      <span className="w-3 h-3 rounded-full bg-purple-400 inline-block shadow-sm" />
                      <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block shadow-sm" />
                    </div>
                    <span className="text-[11px] font-mono text-violet-600 font-semibold">TechInPedia Engine v2026</span>
                  </div>

                  {/* 3D Code Screen */}
                  <div className="space-y-4 font-mono text-xs">
                    <TypewriterTerminal />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-violet-50/50 border border-violet-100">
                        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Laptop & Desktop Rentals</div>
                        <div className="text-violet-600 text-lg font-bold font-sans mt-0.5">Delhi NCR</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-violet-50/50 border border-violet-100">
                        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Custom Software</div>
                        <div className="text-slate-800 text-lg font-bold font-sans mt-0.5">App Development</div>
                      </div>
                    </div>
                  </div>

                  {/* Floating 3D Badge */}
                  <div className="absolute -bottom-4 -left-4 px-4 py-2.5 rounded-xl bg-gradient-to-r from-white via-violet-50 to-white border border-violet-200 text-slate-800 text-xs font-bold shadow-[0_10px_25px_rgba(128,46,227,0.18)] flex items-center gap-2 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                    <span>Hardware • Software • Marketing Synced</span>
                  </div>

                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* 1.5 INFRASTRUCTURE & CLOUD BRANDS TICKER */}
      <BrandsTicker />

      {/* 1.8 THREE CORE PILLARS OVERVIEW (LOGO VIOLET & WHITE THEME) */}
      
      <section className="py-20 bg-gradient-to-b from-white via-violet-50/20 to-white border-b border-violet-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          <ScrollReveal variant="fade-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-violet-100 pb-8">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>Services Overview</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                  Complete Technology Solutions for{' '}
                  <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Businesses & Individuals
                  </span>
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  From renting laptops and desktops to building custom mobile applications, websites, CRM, ERP and business software, TechInPedia provides technology solutions designed around your requirements.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollStaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" staggerDelay={0.1}>
            
            {/* Hardware Rentals */}
            <ScrollStaggerItem className="h-full">
              <Link href="/services/laptop-rental" className="h-full p-8 rounded-3xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-md shadow-sm transition-all flex flex-col justify-between group block cursor-pointer">
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-violet-600 transition-colors">
                      Laptop & Desktop Rentals
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2">
                      Rent laptops, desktops, MacBooks, workstations and other IT equipment for business, office, work-from-home, events, projects or personal use. We serve both businesses and individual customers across Delhi NCR.
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-3 border-t border-violet-100">
                    {['Laptop on Rent', 'Desktop on Rent', 'MacBook on Rent', 'Workstation on Rent', 'Corporate Laptop Rental', 'Bulk Laptop Rental', 'Laptop & Desktop AMC'].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700"><span className="text-violet-600">✔</span> {s}</div>
                    ))}
                  </div>
                </div>
                <div className="pt-6">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-50 text-violet-700 font-bold text-xs group-hover:bg-violet-100 transition-all">View Rental Services</span>
                </div>
              </Link>
            </ScrollStaggerItem>

            {/* Mobile App */}
            <ScrollStaggerItem className="h-full">
              <Link href="/services/mobile-application" className="h-full p-8 rounded-3xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-md shadow-sm transition-all flex flex-col justify-between group block cursor-pointer">
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-violet-600 transition-colors">
                      Mobile App Development
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2">
                      Build custom Android and iOS mobile applications for startups, businesses and enterprises. From on-demand and booking apps to food delivery, e-commerce and business applications, we develop apps according to your requirements.
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-3 border-t border-violet-100">
                    {['Android App Development', 'iOS App Development', 'Flutter App Development', 'On-Demand Apps', 'Booking Apps', 'Food Delivery Apps', 'E-commerce Apps', 'Business Apps'].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700"><span className="text-violet-600">✔</span> {s}</div>
                    ))}
                  </div>
                </div>
                <div className="pt-6">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-50 text-violet-700 font-bold text-xs group-hover:bg-violet-100 transition-all">Explore Mobile App Development</span>
                </div>
              </Link>
            </ScrollStaggerItem>

            {/* Software */}
            <ScrollStaggerItem className="h-full">
              <Link href="/start-project" className="h-full p-8 rounded-3xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-md shadow-sm transition-all flex flex-col justify-between group block cursor-pointer">
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-violet-600 transition-colors">
                      Custom Software Development
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2">
                      We build custom business software to manage operations, customers, sales and automation. Our solutions include CRM, ERP, billing, booking, WhatsApp CRM, e-commerce and industry-specific software.
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-3 border-t border-violet-100">
                    {['Custom CRM', 'ERP Software', 'WhatsApp CRM', 'Billing Software', 'Booking Software', 'Business Automation', 'E-commerce Software', 'Custom Business Software'].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700"><span className="text-violet-600">✔</span> {s}</div>
                    ))}
                  </div>
                </div>
                <div className="pt-6">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-50 text-violet-700 font-bold text-xs group-hover:bg-violet-100 transition-all">Build Your Custom Software</span>
                </div>
              </Link>
            </ScrollStaggerItem>

            {/* Website Development */}
            <ScrollStaggerItem className="h-full">
              <Link href="/services/website-development" className="h-full p-8 rounded-3xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-md shadow-sm transition-all flex flex-col justify-between group block cursor-pointer">
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-violet-600 transition-colors">
                      Website & Web Application Development
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2">
                      Create fast, responsive and conversion-focused websites and web applications for startups, small businesses and enterprises.
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-3 border-t border-violet-100">
                    {['Business Websites', 'E-commerce Websites', 'Custom Web Applications', 'WordPress Development', 'Laravel Development', 'React / Next.js Development'].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700"><span className="text-violet-600">✔</span> {s}</div>
                    ))}
                  </div>
                </div>
                <div className="pt-6">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-50 text-violet-700 font-bold text-xs group-hover:bg-violet-100 transition-all">Start Your Website Project</span>
                </div>
              </Link>
            </ScrollStaggerItem>

            {/* Cloud & IT */}
            <ScrollStaggerItem className="h-full">
              <Link href="/services/cloud-services" className="h-full p-8 rounded-3xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-md shadow-sm transition-all flex flex-col justify-between group block cursor-pointer">
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-violet-600 transition-colors">
                      Cloud & IT Solutions
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2">
                      Reliable cloud, hosting, server, infrastructure, backup and technical support solutions for growing businesses.
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-3 border-t border-violet-100">
                    {['AWS / Server Setup', 'Cloud Hosting', 'Data Backup', 'IT Infrastructure', 'Technical Support'].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700"><span className="text-violet-600">✔</span> {s}</div>
                    ))}
                  </div>
                </div>
                <div className="pt-6">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-50 text-violet-700 font-bold text-xs group-hover:bg-violet-100 transition-all">Explore Cloud Services</span>
                </div>
              </Link>
            </ScrollStaggerItem>

            {/* Digital Marketing */}
            <ScrollStaggerItem className="h-full">
              <Link href="/services/digital-marketing" className="h-full p-8 rounded-3xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-md shadow-sm transition-all flex flex-col justify-between group block cursor-pointer">
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-violet-600 transition-colors">
                      Digital Marketing & Growth Services
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-2">
                      Grow your online presence with SEO, Local SEO, Google Ads, Meta Ads, social media marketing, content marketing and performance marketing.
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-3 border-t border-violet-100">
                    {['Search Engine Optimization (SEO)', 'Local SEO', 'Google Ads', 'Meta (Facebook/IG) Ads', 'Social Media Marketing', 'Performance Marketing'].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700"><span className="text-violet-600">✔</span> {s}</div>
                    ))}
                  </div>
                </div>
                <div className="pt-6">
                  <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-50 text-violet-700 font-bold text-xs group-hover:bg-violet-100 transition-all">Grow Your Business</span>
                </div>
              </Link>
            </ScrollStaggerItem>

          </ScrollStaggerContainer>
        </div>
      </section>


      {/* 2. TRUST & VALUE CARDS */}
      
      <section className="py-20 bg-[#faf8ff] border-b border-violet-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fade-up">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Why Choose TechInPedia?
              </h2>
            </div>
          </ScrollReveal>

          <ScrollStaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.07}>
            {[
              { title: 'Hardware Rentals', desc: 'Laptop & desktop rentals for businesses and individuals' },
              { title: 'Custom Software', desc: 'Custom software built around your business requirements' },
              { title: 'Mobile Apps', desc: 'Android and iOS mobile app development' },
              { title: 'Web Development', desc: 'Complete website and web application development' },
              { title: 'Flexible Solutions', desc: 'Flexible technology solutions for startups, SMEs and enterprises' },
              { title: 'Local Presence', desc: 'Delhi NCR rental and technology support' },
              { title: 'One Technology Partner', desc: 'One technology partner for hardware and software requirements' },
            ].map((item, idx) => (
              <ScrollStaggerItem key={idx} className="h-full">
                <div className="h-full p-6 rounded-2xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-md transition-all duration-300 flex flex-col shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-xs mb-4 border border-violet-200">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </ScrollStaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>


      {/* 3. INTERACTIVE ORBITAL SERVICES SHOWCASE */}
      <ScrollReveal variant="fade-up" duration={0.6}>
        <OrbitalServicesShowcase whatsappLink={whatsappLink} />
      </ScrollReveal>

      {/* 5. DEVELOPMENT WORKFLOW */}
      <section className="py-24 bg-white border-b border-violet-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fade-up">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Our Development Workflow</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
                Proven 6-Step Development Lifecycle
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-3">
                Structure, transparency, and high performance at every phase of production.
              </p>
            </div>
          </ScrollReveal>

          <ScrollStaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
            {processSteps.map((step) => (
              <ScrollStaggerItem key={step.num} className="h-full">
                <div className="h-full p-6 rounded-2xl bg-white border border-violet-100 shadow-sm hover:border-violet-300 hover:shadow-md transition-all relative space-y-3">
                  <span className="text-3xl font-black font-mono text-violet-300 block">{step.num}</span>
                  <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </ScrollStaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      {/* 6. TECH STACK MATRIX */}
      <section className="py-24 bg-gradient-to-b from-[#faf8ff] via-violet-50/30 to-white border-b border-violet-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fade-up">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Technical Stack</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
                Modern Technologies We Master
              </h2>
            </div>
          </ScrollReveal>

          <ScrollStaggerContainer className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 text-center" staggerDelay={0.07}>
            <ScrollStaggerItem className="h-full">
              <div className="h-full p-6 rounded-2xl bg-white border border-violet-100 hover:border-violet-300 shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-200 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Frontend</h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>React.js</li>
                  <li>Next.js (App Router)</li>
                  <li>TypeScript</li>
                  <li>Tailwind CSS</li>
                </ul>
              </div>
            </ScrollStaggerItem>

            <ScrollStaggerItem className="h-full">
              <div className="h-full p-6 rounded-2xl bg-white border border-violet-100 hover:border-violet-300 shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-200 flex items-center justify-center mx-auto mb-4">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Backend</h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>Node.js</li>
                  <li>Express.js</li>
                  <li>TypeScript APIs</li>
                  <li>REST / GraphQL</li>
                </ul>
              </div>
            </ScrollStaggerItem>

            <ScrollStaggerItem className="h-full">
              <div className="h-full p-6 rounded-2xl bg-white border border-violet-100 hover:border-violet-300 shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-200 flex items-center justify-center mx-auto mb-4">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Database</h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>MySQL</li>
                  <li>Prisma ORM</li>
                  <li>PostgreSQL</li>
                  <li>Redis Caching</li>
                </ul>
              </div>
            </ScrollStaggerItem>

            <ScrollStaggerItem className="h-full">
              <div className="h-full p-6 rounded-2xl bg-white border border-violet-100 hover:border-violet-300 shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-200 flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Mobile</h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>React Native</li>
                  <li>Flutter</li>
                  <li>iOS & Android</li>
                  <li>Expo</li>
                </ul>
              </div>
            </ScrollStaggerItem>

            <ScrollStaggerItem className="h-full">
              <div className="h-full p-6 rounded-2xl bg-white border border-violet-100 hover:border-violet-300 shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 border border-violet-200 flex items-center justify-center mx-auto mb-4">
                  <Cloud className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">DevOps & Cloud</h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>AWS / Vercel</li>
                  <li>Docker Containers</li>
                  <li>GitHub Actions</li>
                  <li>Nginx</li>
                </ul>
              </div>
            </ScrollStaggerItem>
          </ScrollStaggerContainer>
        </div>
      </section>

      
      {/* 10. LOCATION SECTION */}
      <section className="py-16 bg-white border-b border-violet-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal variant="fade-up">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              Laptop & Desktop Rentals Across Delhi NCR
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Looking for a laptop or desktop on rent? TechInPedia provides rental solutions for businesses and individuals across Delhi, Noida, Gurgaon, Ghaziabad and Faridabad.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="py-24 bg-white border-b border-violet-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="fade-up">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Client Feedback</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
                  What Our Clients Say
                </h2>
              </div>
            </ScrollReveal>

            <ScrollStaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8" staggerDelay={0.1}>
              {testimonials.map((t: { id: string; testimonial: string; clientName: string; designation: string; company: string }) => (
                <ScrollStaggerItem key={t.id} className="h-full">
                  <div className="h-full p-6 rounded-2xl bg-white border border-violet-100 shadow-sm hover:border-violet-300 transition-all flex flex-col justify-between space-y-4">
                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      &quot;{t.testimonial}&quot;
                    </p>
                    <div className="pt-4 border-t border-violet-100">
                      <div className="font-bold text-slate-900 text-xs">{t.clientName}</div>
                      <div className="text-[11px] text-slate-500">{t.designation}, {t.company}</div>
                    </div>
                  </div>
                </ScrollStaggerItem>
              ))}
            </ScrollStaggerContainer>
          </div>
        </section>
      )}

      {/* 8. FAQ ACCORDION */}
      {faqs.length > 0 && (
        <section className="py-24 bg-gradient-to-b from-[#faf8ff] via-violet-50/20 to-white border-b border-violet-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="fade-up">
              <div className="text-center mb-16">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600">FAQ</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Frequently Asked Questions
                </h2>
              </div>
            </ScrollReveal>

            <ScrollStaggerContainer className="space-y-4" staggerDelay={0.06}>
              {faqs.map((faq: { id: string; question: string; answer: string }) => (
                <ScrollStaggerItem key={faq.id}>
                  <div className="p-6 rounded-2xl bg-white border border-violet-100 shadow-sm hover:border-violet-200">
                    <h3 className="text-base font-bold text-slate-900 mb-2">{faq.question}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </ScrollStaggerItem>
              ))}
            </ScrollStaggerContainer>
          </div>
        </section>
      )}

      {/* 9. FINAL HIGH-IMPACT CONVERSION CTA */}
      <section className="py-24 bg-gradient-to-b from-white via-violet-50/80 to-violet-100/70 border-t border-violet-100 relative overflow-hidden">
        <ScrollReveal variant="scale-up" duration={0.6}>
          <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Ready to equip, build, or scale?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Partner with TechInPedia for enterprise hardware rentals, custom software development, and growth marketing.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/start-project"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-[0_4px_25px_rgba(128,46,227,0.35)] transition-all hover:scale-105"
              >
                Start Your Project / Request Quote
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* SEO KEYWORDS FOOTER (Visual Content for Rank) */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-sm text-slate-500 leading-relaxed text-center sm:text-left space-y-4">
            <h3 className="font-semibold text-slate-700 mb-2 tracking-wide">Enterprise IT & Marketing Solutions in Delhi NCR</h3>
            <p>
              TechInPedia is a trusted technology partner providing comprehensive IT infrastructure and digital growth solutions. We specialize in <Link href="/services/laptop-rental" className="hover:text-violet-600 transition-colors font-medium">corporate laptop rentals</Link> and <Link href="/services/computer-rental" className="hover:text-violet-600 transition-colors font-medium">high-performance desktop rentals</Link> for businesses, startups, and events across India. From individual workstation setups for developers to bulk IT deployment for BPO centers, our rental services offer a cost-effective alternative to hardware procurement.
            </p>
            <p>
              We serve major corporate hubs including Delhi, Noida, Gurgaon, Faridabad, and Ghaziabad. Beyond hardware, our in-house engineering team delivers <Link href="/custom-software-development" className="hover:text-violet-600 transition-colors font-medium">custom software development</Link>, <Link href="/mobile-app-development" className="hover:text-violet-600 transition-colors font-medium">mobile applications</Link>, and scalable <Link href="/website-development" className="hover:text-violet-600 transition-colors font-medium">website development</Link>. Combined with our ROI-focused digital marketing and cloud services, we provide end-to-end digital transformation for modern enterprises.
            </p>
          </div>
        </div>
      </section>

      {/* 1000+ Local SEO Keywords Component */}

    </>
  );
}
