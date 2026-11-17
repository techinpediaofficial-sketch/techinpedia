'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Laptop,
  Monitor,
  Wrench,
  Smartphone,
  Globe,
  Cloud,
  Handshake,
  Video,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Server,
  Cpu,
  MessageCircle,
} from 'lucide-react';

export interface AccordionServiceItem {
  id: string;
  slug: string;
  title: string;
  pillar: 'HARDWARE' | 'SOFTWARE' | 'MARKETING';
  pillarLabel: string;
  teaser: string;
  description: string;
  iconName: string;
  badge: string;
  badgeColor: string;
  iconBg: string;
  iconColor: string;
  ambientGlow: string;
  features: {
    iconBg: string;
    iconColor: string;
    text: string;
  }[];
  mockup: {
    appBadge: string;
    appBadgeColor: string;
    title: string;
    subtitle: string;
    status: string;
    statusColor: string;
    chips: string[];
    statLabel: string;
    statValue: string;
    previewText: string;
  };
}

const ALL_SERVICES: AccordionServiceItem[] = [
  // ==================== 1. HARDWARE SERVICES ====================
  {
    id: 'laptop-rental',
    slug: 'laptop-rental',
    title: 'Laptop Rental',
    pillar: 'HARDWARE',
    pillarLabel: 'Hardware & Rentals',
    teaser: 'Enterprise MacBooks & ThinkPads on flexible monthly rentals.',
    description: 'TechInPedia delivers premium business laptops on flexible short-term and long-term rental plans with doorstep same-day replacement and zero capital expenditure.',
    iconName: 'Laptop',
    badge: 'Popular Choice',
    badgeColor: 'bg-blue-500 text-white',
    iconBg: 'bg-blue-50 border-blue-200 text-blue-600',
    iconColor: 'text-blue-600',
    ambientGlow: 'from-blue-100/60 via-indigo-50/40 to-white',
    features: [
      {
        iconBg: 'bg-blue-100 text-blue-600',
        iconColor: 'text-blue-600',
        text: 'Pre-configured with developer stacks (Docker, Node, Python, Xcode)',
      },
      {
        iconBg: 'bg-emerald-100 text-emerald-600',
        iconColor: 'text-emerald-600',
        text: 'Doorstep hardware replacement within 4 hours SLA',
      },
      {
        iconBg: 'bg-purple-100 text-purple-600',
        iconColor: 'text-purple-600',
        text: 'Zero CapEx lock-in with 100% tax-deductible monthly rental invoices',
      },
    ],
    mockup: {
      appBadge: '💻 Apple M3 Pro',
      appBadgeColor: 'bg-blue-500 text-white',
      title: 'Provisioning Order #TIP-9824',
      subtitle: 'Doorstep Enterprise Fleet Deployment',
      status: 'Out for Doorstep Delivery • ETA 2h',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      chips: ['32GB Unified RAM', '1TB NVMe SSD', 'AppleCare+ Enterprise', 'Pre-Loaded Dev Stack'],
      statLabel: 'Deployment SLA',
      statValue: '< 4 Hours',
      previewText: 'Fleet configuration verified: macOS Sequoia, MDM enrollment active, zero-touch setup completed for IPL Enterprises engineering team.',
    },
  },
  {
    id: 'computer-rental',
    slug: 'computer-rental',
    title: 'Computer Rental',
    pillar: 'HARDWARE',
    pillarLabel: 'Hardware & Rentals',
    teaser: 'High-compute GPU workstations & multi-display rigs.',
    description: 'High-compute desktop PCs, Nvidia RTX 4090 GPU rigs for 3D rendering and AI training, multi-monitor setups, and local testing servers tailored to your project.',
    iconName: 'Monitor',
    badge: 'GPU Rigs',
    badgeColor: 'bg-indigo-500 text-white',
    iconBg: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    iconColor: 'text-indigo-600',
    ambientGlow: 'from-indigo-100/60 via-violet-50/40 to-white',
    features: [
      {
        iconBg: 'bg-indigo-100 text-indigo-600',
        iconColor: 'text-indigo-600',
        text: 'Nvidia RTX 4090 / 4080 & Intel Core i9 / Xeon 24-core CPUs',
      },
      {
        iconBg: 'bg-emerald-100 text-emerald-600',
        iconColor: 'text-emerald-600',
        text: 'Dual 4K color-calibrated monitors with heavy-duty ergonomic desk arms',
      },
      {
        iconBg: 'bg-purple-100 text-purple-600',
        iconColor: 'text-purple-600',
        text: 'Stress-tested benchmarks for Blender, Premiere Pro, CUDA, and Unreal Engine 5',
      },
    ],
    mockup: {
      appBadge: '⚡ Nvidia RTX 4090',
      appBadgeColor: 'bg-indigo-600 text-white',
      title: 'Workstation Rig #TIP-GPU-04',
      subtitle: 'Liquid Cooled 3D & AI Training Rig',
      status: 'Stress Tested • 100% Benchmarked',
      statusColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      chips: ['64GB DDR5 6000MHz', '2TB Gen4 NVMe', 'Dual 27" 4K IPS', 'Liquid Cooler 360mm'],
      statLabel: 'Render Compute',
      statValue: '82.6 TFLOPS',
      previewText: 'Benchmarked across 8-hour Octane & Blender rendering load with thermal limits strictly maintained under 68°C.',
    },
  },
  {
    id: 'amc-maintenance',
    slug: 'amc-maintenance',
    title: 'AMC Maintenance',
    pillar: 'HARDWARE',
    pillarLabel: 'Hardware & Rentals',
    teaser: '24/7 IT Infrastructure SLA Support with 4h on-site resolution.',
    description: 'Full IT hardware footprint maintenance—including employee laptops, desktops, networks, firewalls, and server racks—with periodic preventive audits.',
    iconName: 'Wrench',
    badge: '24/7 SLA',
    badgeColor: 'bg-emerald-500 text-white',
    iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    iconColor: 'text-emerald-600',
    ambientGlow: 'from-emerald-100/60 via-teal-50/40 to-white',
    features: [
      {
        iconBg: 'bg-emerald-100 text-emerald-600',
        iconColor: 'text-emerald-600',
        text: 'Guaranteed 4-hour on-site technician response SLA',
      },
      {
        iconBg: 'bg-blue-100 text-blue-600',
        iconColor: 'text-blue-600',
        text: 'Periodic quarterly health audits and thermal dust maintenance',
      },
      {
        iconBg: 'bg-teal-100 text-teal-600',
        iconColor: 'text-teal-600',
        text: 'Comprehensive spare parts replacement and standby backup machines',
      },
    ],
    mockup: {
      appBadge: '🛡️ 99.98% SLA',
      appBadgeColor: 'bg-emerald-600 text-white',
      title: 'AMC Incident Portal #TICK-4401',
      subtitle: 'Active IT Infrastructure Monitoring',
      status: 'Preventive Audit Completed • Healthy',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      chips: ['Firewall Monitored', '42 Laptops Inspected', 'LAN Speed 1Gbps', 'Data Backup OK'],
      statLabel: 'Response Time',
      statValue: '< 45 Mins',
      previewText: 'All office workstations and network routers checked. Thermal paste re-applied, SSD health optimal, zero unresolved support tickets.',
    },
  },

  // ==================== 2. SOFTWARE SERVICES ====================
  {
    id: 'mobile-application',
    slug: 'mobile-application',
    title: 'Mobile Application',
    pillar: 'SOFTWARE',
    pillarLabel: 'Software & Engineering',
    teaser: 'Native iOS & Android apps engineered for 120fps fluid UX.',
    description: 'Engineered for smooth 120fps animations, biometric authentication, offline database sync, and published seamlessly to the App Store and Google Play.',
    iconName: 'Smartphone',
    badge: '120 FPS Native',
    badgeColor: 'bg-purple-500 text-white',
    iconBg: 'bg-purple-50 border-purple-200 text-purple-600',
    iconColor: 'text-purple-600',
    ambientGlow: 'from-purple-100/60 via-fuchsia-50/40 to-white',
    features: [
      {
        iconBg: 'bg-purple-100 text-purple-600',
        iconColor: 'text-purple-600',
        text: 'Flutter & Swift iOS native cross-platform architecture',
      },
      {
        iconBg: 'bg-fuchsia-100 text-fuchsia-600',
        iconColor: 'text-fuchsia-600',
        text: 'Offline-first SQLite local caching and real-time WebSocket sync',
      },
      {
        iconBg: 'bg-blue-100 text-blue-600',
        iconColor: 'text-blue-600',
        text: 'Biometric FaceID / Fingerprint security and push notification pipelines',
      },
    ],
    mockup: {
      appBadge: '📱 App Store Ready',
      appBadgeColor: 'bg-purple-600 text-white',
      title: 'Mobile App Build v2.4.0',
      subtitle: 'iOS & Android Production Release',
      status: 'Passed All App Store Guidelines',
      statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
      chips: ['Flutter 3.24', 'FaceID Biometrics', 'Offline Sync', 'Push Notifications'],
      statLabel: 'FPS Performance',
      statValue: '120 FPS',
      previewText: 'App bundle size optimized to 18MB. Zero memory leaks detected across 24-hour automated UI monkey tests on iPhone 15 Pro and Galaxy S24.',
    },
  },
  {
    id: 'website-development',
    slug: 'website-development',
    title: 'Website Development',
    pillar: 'SOFTWARE',
    pillarLabel: 'Software & Engineering',
    teaser: 'Sub-second Next.js web applications with 98+ PageSpeed scores.',
    description: 'Custom, blazing-fast web applications built on Next.js 16, React 19, and TypeScript with 95+ PageSpeed scores, dynamic CMS backends, and SEO schemas.',
    iconName: 'Globe',
    badge: 'Sub-Second Next.js',
    badgeColor: 'bg-violet-600 text-white',
    iconBg: 'bg-violet-50 border-violet-200 text-violet-600',
    iconColor: 'text-violet-600',
    ambientGlow: 'from-violet-100/60 via-purple-50/40 to-white',
    features: [
      {
        iconBg: 'bg-violet-100 text-violet-600',
        iconColor: 'text-violet-600',
        text: 'Next.js 16 App Router with Server Components & React 19',
      },
      {
        iconBg: 'bg-purple-100 text-purple-600',
        iconColor: 'text-purple-600',
        text: 'Sub-180ms Time-To-First-Byte (TTFB) and 98+ Google Lighthouse scores',
      },
      {
        iconBg: 'bg-emerald-100 text-emerald-600',
        iconColor: 'text-emerald-600',
        text: 'Complete IP ownership, Clean TypeScript architecture & automated CI/CD',
      },
    ],
    mockup: {
      appBadge: '⚡ Lighthouse 99/100',
      appBadgeColor: 'bg-violet-600 text-white',
      title: 'Production Web App Pipeline',
      subtitle: 'Next.js 16 & React 19 Enterprise Architecture',
      status: 'Edge Cached • Sub-Second TTFB',
      statusColor: 'bg-violet-50 text-violet-700 border-violet-200',
      chips: ['Server Components', 'TypeScript Clean Code', 'Tailwind CSS', 'Schema.org SEO'],
      statLabel: 'Average TTFB',
      statValue: '< 65ms',
      previewText: 'Production build deployed across global edge nodes. Automatic static asset optimization and zero JavaScript hydration delay.',
    },
  },
  {
    id: 'cloud-services',
    slug: 'cloud-services',
    title: 'Cloud Services',
    pillar: 'SOFTWARE',
    pillarLabel: 'Software & Engineering',
    teaser: 'AWS, GCP, DevOps, Docker & CI/CD deployment pipelines.',
    description: 'Scalable cloud infrastructure design, Kubernetes container orchestration, zero-downtime CI/CD automation, and multi-region automated backups on AWS and GCP.',
    iconName: 'Cloud',
    badge: 'AWS & Docker',
    badgeColor: 'bg-sky-500 text-white',
    iconBg: 'bg-sky-50 border-sky-200 text-sky-600',
    iconColor: 'text-sky-600',
    ambientGlow: 'from-sky-100/60 via-cyan-50/40 to-white',
    features: [
      {
        iconBg: 'bg-sky-100 text-sky-600',
        iconColor: 'text-sky-600',
        text: 'AWS ECS, Docker containerization and auto-scaling server clusters',
      },
      {
        iconBg: 'bg-cyan-100 text-cyan-600',
        iconColor: 'text-cyan-600',
        text: 'Zero-downtime GitHub Actions CI/CD deployment pipelines',
      },
      {
        iconBg: 'bg-emerald-100 text-emerald-600',
        iconColor: 'text-emerald-600',
        text: 'Multi-AZ database replication, automated hourly snapshots & DDoS shield',
      },
    ],
    mockup: {
      appBadge: '☁️ AWS Cloud ECS',
      appBadgeColor: 'bg-sky-600 text-white',
      title: 'Cloud Cluster Orchestration',
      subtitle: 'Auto-Scaling Docker Deployment',
      status: '10 Nodes Active • Zero Packet Loss',
      statusColor: 'bg-sky-50 text-sky-700 border-sky-200',
      chips: ['Docker Containers', 'Terraform IaC', 'SSL TLS 1.3', 'PostgreSQL Multi-AZ'],
      statLabel: 'Server Uptime',
      statValue: '99.99%',
      previewText: 'Cloud infrastructure auto-scaled from 2 to 8 container instances during traffic spike with zero server latency increase.',
    },
  },

  // ==================== 3. MARKETING SERVICES ====================
  {
    id: 'brand-collaboration',
    slug: 'brand-collaboration',
    title: 'Brand Collaboration',
    pillar: 'MARKETING',
    pillarLabel: 'Strategic Marketing',
    teaser: 'Strategic creator partnerships & high-impact B2B brand tie-ups.',
    description: 'Connect your brand with leading industry influencers, corporate partners, and technology creators for high-engagement co-marketing activations.',
    iconName: 'Handshake',
    badge: 'Creator Reach',
    badgeColor: 'bg-amber-500 text-white',
    iconBg: 'bg-amber-50 border-amber-200 text-amber-600',
    iconColor: 'text-amber-600',
    ambientGlow: 'from-amber-100/60 via-orange-50/40 to-white',
    features: [
      {
        iconBg: 'bg-amber-100 text-amber-600',
        iconColor: 'text-amber-600',
        text: 'Vetted roster of top tier-1 tech influencers and corporate partners',
      },
      {
        iconBg: 'bg-orange-100 text-orange-600',
        iconColor: 'text-orange-600',
        text: 'End-to-end contract drafting, brand safety and deliverable verification',
      },
      {
        iconBg: 'bg-rose-100 text-rose-600',
        iconColor: 'text-rose-600',
        text: 'Tracked attribution UTM links with real-time lead and sales dashboards',
      },
    ],
    mockup: {
      appBadge: '🤝 Verified Partners',
      appBadgeColor: 'bg-amber-600 text-white',
      title: 'Creator Campaign #COLLAB-92',
      subtitle: 'Tier-1 B2B Tech Influencer Tie-Up',
      status: '3.8M Targeted Impressions Delivered',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
      chips: ['12 Tech Creators', 'YouTube Integrated', 'LinkedIn B2B', 'Custom UTM Tracker'],
      statLabel: 'Engagement Rate',
      statValue: '18.4%',
      previewText: 'Sponsored unboxing & enterprise software review generated 420+ verified demo booking inquiries within 72 hours of premiere.',
    },
  },
  {
    id: 'content-creation-for-social-media',
    slug: 'content-creation-for-social-media',
    title: 'Content Creation',
    pillar: 'MARKETING',
    pillarLabel: 'Strategic Marketing',
    teaser: 'Viral 4K Reels, YouTube Shorts, and brand visual storytelling.',
    description: 'Script-to-screen social media video production: studio 4K recording, motion graphics, viral reel pacing, and high-retention visual editing.',
    iconName: 'Video',
    badge: 'Viral Reels',
    badgeColor: 'bg-rose-500 text-white',
    iconBg: 'bg-rose-50 border-rose-200 text-rose-600',
    iconColor: 'text-rose-600',
    ambientGlow: 'from-rose-100/60 via-red-50/40 to-white',
    features: [
      {
        iconBg: 'bg-rose-100 text-rose-600',
        iconColor: 'text-rose-600',
        text: 'Scriptwriting optimized for initial 3-second hook retention',
      },
      {
        iconBg: 'bg-red-100 text-red-600',
        iconColor: 'text-red-600',
        text: '4K cinema cameras, pro lighting, wireless mics & studio sets',
      },
      {
        iconBg: 'bg-purple-100 text-purple-600',
        iconColor: 'text-purple-600',
        text: 'After Effects motion graphics, dynamic subtitles & sound design',
      },
    ],
    mockup: {
      appBadge: '🎬 4K HDR Studio',
      appBadgeColor: 'bg-rose-600 text-white',
      title: 'Reels Production Sprint #14',
      subtitle: 'Viral 9:16 Social Media Content Pipeline',
      status: 'Rendered in 4K 60fps • Color Graded',
      statusColor: 'bg-rose-50 text-rose-700 border-rose-200',
      chips: ['Hook Scripting', 'Dynamic Subtitles', 'Sound Design', 'Multi-Platform Export'],
      statLabel: 'Avg Watch Time',
      statValue: '86.2%',
      previewText: '15 high-converting Reels delivered: 3-second hook tested, sound effects mastered, formatted for Instagram, YouTube Shorts, and LinkedIn.',
    },
  },
  {
    id: 'digital-marketing',
    slug: 'digital-marketing',
    title: 'Digital Marketing',
    pillar: 'MARKETING',
    pillarLabel: 'Strategic Marketing',
    teaser: 'High-ROAS Meta & Google PPC ad campaigns engineered for scale.',
    description: 'Data-driven paid advertising across Google Search, YouTube, Meta, and LinkedIn with continuous A/B testing and algorithmic conversion bidding.',
    iconName: 'TrendingUp',
    badge: '3.8x+ ROAS',
    badgeColor: 'bg-teal-500 text-white',
    iconBg: 'bg-teal-50 border-teal-200 text-teal-600',
    iconColor: 'text-teal-600',
    ambientGlow: 'from-teal-100/60 via-emerald-50/40 to-white',
    features: [
      {
        iconBg: 'bg-teal-100 text-teal-600',
        iconColor: 'text-teal-600',
        text: 'High-intent Google Search PPC and negative keyword optimizations',
      },
      {
        iconBg: 'bg-emerald-100 text-emerald-600',
        iconColor: 'text-emerald-600',
        text: 'Meta Conversions API (CAPI) server-side tracking setup',
      },
      {
        iconBg: 'bg-blue-100 text-blue-600',
        iconColor: 'text-blue-600',
        text: 'Weekly creative refresh to prevent ad fatigue and maximize ROAS',
      },
    ],
    mockup: {
      appBadge: '📈 4.2x ROAS Meta/PPC',
      appBadgeColor: 'bg-teal-600 text-white',
      title: 'Paid Ads Performance Dashboard',
      subtitle: 'Google Search & Meta Dynamic Retargeting',
      status: 'Conversion Tracking Active • Verified',
      statusColor: 'bg-teal-50 text-teal-700 border-teal-200',
      chips: ['Meta CAPI Sync', 'Google Ads Top Rank', 'Cost/Lead -38%', 'A/B Ad Variants'],
      statLabel: 'Return On Ad Spend',
      statValue: '4.2x ROAS',
      previewText: 'Weekly ad spend $3,800 yielded 142 enterprise qualified leads and $16,200 in closed contracts with zero ad budget wastage.',
    },
  },
];

function renderServiceIcon(name: string, className: string = 'w-6 h-6') {
  switch (name) {
    case 'Laptop': return <Laptop className={className} />;
    case 'Monitor': return <Monitor className={className} />;
    case 'Wrench': return <Wrench className={className} />;
    case 'Smartphone': return <Smartphone className={className} />;
    case 'Globe': return <Globe className={className} />;
    case 'Cloud': return <Cloud className={className} />;
    case 'Handshake': return <Handshake className={className} />;
    case 'Video': return <Video className={className} />;
    case 'TrendingUp': return <TrendingUp className={className} />;
    default: return <Laptop className={className} />;
  }
}

export default function OrbitalServicesShowcase({ whatsappLink }: { whatsappLink?: string }) {
  const router = useRouter();
  const [activePillar, setActivePillar] = useState<'HARDWARE' | 'SOFTWARE' | 'MARKETING'>('HARDWARE');
  
  // Filter services for the selected pillar
  const pillarServices = ALL_SERVICES.filter((s) => s.pillar === activePillar);
  
  // Track the currently expanded card index within the active pillar (default to first card)
  const [hoveredIndex, setHoveredIndex] = useState<number>(0);

  const handlePillarChange = (pillar: 'HARDWARE' | 'SOFTWARE' | 'MARKETING') => {
    setActivePillar(pillar);
    setHoveredIndex(0); // Reset to first card on tab switch
  };

  return (
    <section className="relative py-20 bg-gradient-to-b from-white via-violet-50/20 to-white border-b border-violet-100 select-none overflow-hidden">
      {/* Background Ambient Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-violet-200/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Interactive Services Showcase</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Hardware, Software & Strategic Marketing
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Hover over any service card below to smoothly reveal its detailed specifications, engineering deliverables, and interactive preview.
          </p>
        </div>

        {/* 3 Pillar Tab Switcher */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-violet-200 shadow-sm gap-1.5 sm:gap-2">
            <button
              onClick={() => handlePillarChange('HARDWARE')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                activePillar === 'HARDWARE'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/60'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Hardware & Rentals</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activePillar === 'HARDWARE' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}`}>
                3
              </span>
            </button>

            <button
              onClick={() => handlePillarChange('SOFTWARE')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                activePillar === 'SOFTWARE'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-violet-600 hover:bg-violet-50/60'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Software & Engineering</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activePillar === 'SOFTWARE' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}`}>
                3
              </span>
            </button>

            <button
              onClick={() => handlePillarChange('MARKETING')}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                activePillar === 'MARKETING'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Strategic Marketing</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activePillar === 'MARKETING' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}`}>
                3
              </span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* DESKTOP: CALENDLY-STYLE EXPANDING ACCORDION CARDS (lg:flex) */}
        {/* Fixed height h-[560px], strictly NO parent layout shift/flicker */}
        {/* ============================================================ */}
        <div className="hidden lg:flex flex-row gap-5 h-[560px] w-full items-stretch overflow-hidden">
          {pillarServices.map((service, index) => {
            const isExpanded = index === hoveredIndex;

            return (
              <div
                key={service.id}
                onMouseEnter={() => {
                  if (hoveredIndex !== index) {
                    setHoveredIndex(index);
                  }
                }}
                onClick={() => router.push(`/services/${service.slug}`)}
                className={`relative h-full rounded-[30px] overflow-hidden cursor-pointer select-none border ${
                  isExpanded
                    ? 'flex-[3.4] bg-white border-violet-300/90 shadow-[0_20px_50px_-15px_rgba(128,46,227,0.18)] ring-1 ring-violet-300/40'
                    : 'flex-1 bg-white/95 border-violet-100 hover:border-violet-300 shadow-xs hover:shadow-md'
                }`}
                style={{
                  transition: 'flex 450ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 250ms ease, border-color 250ms ease',
                  willChange: 'flex',
                }}
              >
                {/* Ambient Soft Glow inside Card */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${service.ambientGlow} pointer-events-none transition-opacity duration-300 ${
                    isExpanded ? 'opacity-70' : 'opacity-20'
                  }`}
                />

                {/* Decorative Bottom Organic Gradient Wave matching Logo Violet */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-40 pointer-events-none transition-opacity duration-300 ${
                    isExpanded ? 'opacity-25' : 'opacity-75'
                  }`}
                  style={{
                    background:
                      'radial-gradient(ellipse at bottom, rgba(128, 46, 227, 0.22) 0%, rgba(167, 139, 250, 0.12) 50%, transparent 75%)',
                  }}
                />

                {/* ---------------------------------------------------- */}
                {/* 1. COLLAPSED VIEW LAYER (Opacity & transform fade)   */}
                {/* ---------------------------------------------------- */}
                <div
                  className={`absolute inset-0 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ease-out ${
                    isExpanded
                      ? 'opacity-0 pointer-events-none -translate-x-4 invisible'
                      : 'opacity-100 pointer-events-auto translate-x-0 visible delay-100'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Icon Badge */}
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-xs ${service.iconBg}`}>
                      {renderServiceIcon(service.iconName, 'w-6 h-6')}
                    </div>

                    {/* Title & Short Teaser */}
                    <div className="space-y-1.5 pr-2">
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">
                        {service.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {service.teaser}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Prompt */}
                  <div className="pt-3 border-t border-violet-100 flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span className="text-[10px] uppercase tracking-wider font-mono">Hover to Inspect</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* 2. EXPANDED VIEW LAYER (Constant width, no reflow)   */}
                {/* ---------------------------------------------------- */}
                <div
                  className={`absolute inset-0 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ease-out overflow-hidden ${
                    isExpanded
                      ? 'opacity-100 pointer-events-auto translate-x-0 visible delay-100'
                      : 'opacity-0 pointer-events-none translate-x-4 invisible'
                  }`}
                >
                  {/* Fixed width inner container prevents text re-wrapping during width expansion */}
                  <div className="w-[580px] max-w-full h-full flex flex-col justify-between space-y-3.5">
                    
                    {/* Top Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-xs ${service.iconBg}`}>
                          {renderServiceIcon(service.iconName, 'w-5 h-5')}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-600 block leading-none">
                            {service.pillarLabel}
                          </span>
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-1 ${service.badgeColor}`}>
                            {service.badge}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/services/${service.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl border border-violet-200 transition-colors"
                      >
                        <span>Full Specs</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                        {service.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    {/* 3 Distinct Feature Bullets (Calendly timeline items match) */}
                    <div className="grid grid-cols-3 gap-2">
                      {service.features.map((feat, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white/90 border border-violet-100 shadow-xs"
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 font-bold ${feat.iconBg}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[11px] text-slate-700 font-medium leading-snug line-clamp-2">
                            {feat.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Visual UI Mockup Card (Calendly bottom preview match) */}
                    <div className="rounded-2xl bg-white/95 border border-violet-200/80 p-3.5 shadow-sm space-y-2 relative overflow-hidden backdrop-blur-md">
                      {/* Top Bar with Status Tag */}
                      <div className="flex items-center justify-between border-b border-violet-100 pb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${service.mockup.appBadgeColor}`}>
                            {service.mockup.appBadge}
                          </span>
                          <span className="font-bold text-slate-800 text-xs truncate max-w-[220px]">
                            {service.mockup.title}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${service.mockup.statusColor}`}>
                          {service.mockup.status}
                        </span>
                      </div>

                      {/* Chips / Metadata Specifications */}
                      <div className="flex flex-wrap gap-1.5">
                        {service.mockup.chips.map((chip, cIdx) => (
                          <span
                            key={cIdx}
                            className="px-2 py-0.5 rounded-md bg-violet-50/70 border border-violet-200/60 text-[10px] font-mono font-medium text-slate-700"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>

                      {/* Preview Content Body */}
                      <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/60 text-xs text-slate-600 leading-relaxed font-sans">
                        <div className="flex items-center justify-between mb-0.5 text-[11px] font-bold text-slate-700">
                          <span>{service.mockup.subtitle}</span>
                          <span className="text-violet-600 font-mono">{service.mockup.statValue}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 italic line-clamp-2">
                          "{service.mockup.previewText}"
                        </p>
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center justify-between pt-0.5 text-xs">
                        <Link
                          href={`/services/${service.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors"
                        >
                          <span>Explore Specs</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                        <a
                          href={whatsappLink || 'https://wa.me/919876543210'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp Quote</span>
                        </a>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* MOBILE / TABLET: VERTICAL ACCORDION CARDS (< 1024px) */}
        {/* ============================================================ */}
        <div className="lg:hidden flex flex-col gap-4">
          {pillarServices.map((service, index) => {
            const isExpanded = index === hoveredIndex;

            return (
              <div
                key={service.id}
                onClick={() => {
                  if (isExpanded) {
                    router.push(`/services/${service.slug}`);
                  } else {
                    setHoveredIndex(index);
                  }
                }}
                className={`rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer ${
                  isExpanded
                    ? 'bg-white border-violet-400 shadow-xl ring-2 ring-violet-200'
                    : 'bg-white border-violet-100 shadow-sm'
                }`}
              >
                {/* Card Header (Always Visible) */}
                <div className="p-5 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${service.iconBg}`}>
                      {renderServiceIcon(service.iconName, 'w-5 h-5')}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {service.title}
                      </h3>
                      <p className="text-xs text-violet-600 font-semibold mt-0.5">
                        {service.badge}
                      </p>
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${isExpanded ? 'bg-violet-600 text-white rotate-90' : 'bg-violet-50 text-violet-600'}`}>
                    →
                  </div>
                </div>

                {/* Expanded Details on Mobile */}
                {isExpanded && (
                  <div className="px-5 pb-6 pt-1 space-y-4 border-t border-violet-100 bg-gradient-to-b from-violet-50/30 to-white">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2">
                      {service.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
                          <span>{feat.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Mobile Mockup Card */}
                    <div className="p-3.5 rounded-2xl bg-white border border-violet-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${service.mockup.appBadgeColor}`}>
                          {service.mockup.appBadge}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 font-bold">
                          {service.mockup.statValue}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 italic">
                        "{service.mockup.previewText}"
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2 text-xs font-bold">
                      <Link
                        href={`/services/${service.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20"
                      >
                        <span>Explore Full Service</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <a
                        href={whatsappLink || 'https://wa.me/919876543210'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Inquire on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
