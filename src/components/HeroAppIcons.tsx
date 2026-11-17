'use client';

import Link from 'next/link';

interface Service3DCard {
  name: string;
  sub: string;
  pillar: string;
  url: string;
  dotColor: string;
  badgeBg: string;
  hoverBorder: string;
  hoverText: string;
  pos: string;
  svg: React.ReactNode;
}

export function HeroFloatingOrbits() {
  const serviceCards: Service3DCard[] = [
    // 1. TOP ROW CARDS (Generous spacing above the terminal)
    {
      name: 'Laptop Rental',
      sub: 'MacBook & Win Pro',
      pillar: 'Hardware',
      url: '/services/laptop-rental',
      dotColor: 'bg-blue-500',
      badgeBg: 'from-blue-50 via-indigo-50 to-blue-100/80 border-blue-200 text-blue-600',
      hoverBorder: 'hover:border-blue-400',
      hoverText: 'group-hover:text-blue-600',
      pos: 'absolute -top-14 -left-4 sm:-left-16 lg:-left-20 z-30 animate-float-1',
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="12" rx="2" className="stroke-blue-600 fill-blue-500/15" />
          <path d="M2 20h20" className="stroke-blue-700" />
          <circle cx="12" cy="10" r="1.5" className="fill-blue-500 stroke-none" />
        </svg>
      ),
    },
    {
      name: 'AMC Maintenance',
      sub: '24/7 IT Doorstep SLA (OWNER VERIFICATION REQUIRED)',
      pillar: 'Hardware',
      url: '/services/amc-maintenance',
      dotColor: 'bg-emerald-500',
      badgeBg: 'from-emerald-50 via-teal-50 to-emerald-100/80 border-emerald-200 text-emerald-600',
      hoverBorder: 'hover:border-emerald-400',
      hoverText: 'group-hover:text-emerald-600',
      pos: 'absolute -top-18 left-1/4 sm:left-1/3 z-30 animate-float-3 hidden sm:flex',
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" className="stroke-emerald-600 fill-emerald-500/15" />
          <path d="M9 12l2 2 4-4" className="stroke-teal-600" />
        </svg>
      ),
    },
    {
      name: 'Mobile Application',
      sub: 'iOS & Android Native',
      pillar: 'Software',
      url: '/services/mobile-application',
      dotColor: 'bg-purple-500',
      badgeBg: 'from-purple-50 via-fuchsia-50 to-purple-100/80 border-purple-200 text-purple-600',
      hoverBorder: 'hover:border-purple-400',
      hoverText: 'group-hover:text-purple-600',
      pos: 'absolute -top-14 -right-4 sm:-right-16 lg:-right-20 z-30 animate-float-4',
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2.5" className="stroke-purple-600 fill-purple-500/15" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" className="stroke-purple-600" />
          <circle cx="12" cy="7" r="1" className="fill-fuchsia-500 stroke-none" />
        </svg>
      ),
    },

    // 2. UPPER-MIDDLE CARDS (Generous lateral offset)
    {
      name: 'Website Development',
      sub: 'Sub-Second Next.js',
      pillar: 'Software',
      url: '/services/website-development',
      dotColor: 'bg-violet-500',
      badgeBg: 'from-violet-50 via-purple-50 to-violet-100/80 border-violet-200 text-violet-600',
      hoverBorder: 'hover:border-violet-400',
      hoverText: 'group-hover:text-violet-600',
      pos: 'absolute top-[14%] -left-8 sm:-left-24 lg:-left-28 z-30 animate-float-2',
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" className="stroke-violet-600 fill-violet-500/15" />
          <line x1="2" y1="12" x2="22" y2="12" className="stroke-violet-500" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" className="stroke-purple-600" />
        </svg>
      ),
    },
    {
      name: 'Cloud Services',
      sub: 'AWS & Docker DevOps',
      pillar: 'Software',
      url: '/services/cloud-services',
      dotColor: 'bg-sky-500',
      badgeBg: 'from-sky-50 via-cyan-50 to-sky-100/80 border-sky-200 text-sky-600',
      hoverBorder: 'hover:border-sky-400',
      hoverText: 'group-hover:text-sky-600',
      pos: 'absolute top-[14%] -right-8 sm:-right-24 lg:-right-28 z-30 animate-float-1',
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" className="stroke-sky-600 fill-sky-500/20" />
          <polyline points="13 14 11 16 9 14" className="stroke-cyan-600" />
        </svg>
      ),
    },

    // 3. MID CARDS (Flanking left & right with proper vertical rhythm)
    {
      name: 'Brand Collaboration',
      sub: 'B2B & Partner Deals',
      pillar: 'Marketing',
      url: '/services/brand-collaboration',
      dotColor: 'bg-amber-500',
      badgeBg: 'from-amber-50 via-orange-50 to-amber-100/80 border-amber-200 text-amber-600',
      hoverBorder: 'hover:border-amber-400',
      hoverText: 'group-hover:text-amber-600',
      pos: 'absolute top-[42%] -left-10 sm:-left-28 lg:-left-32 z-30 animate-float-4',
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" className="stroke-amber-600" />
          <circle cx="9" cy="7" r="4" className="stroke-amber-600 fill-amber-500/15" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" className="stroke-orange-500" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" className="stroke-orange-500" />
        </svg>
      ),
    },
    {
      name: 'Content Creation',
      sub: 'Viral Reels & Shorts',
      pillar: 'Marketing',
      url: '/services/content-creation-for-social-media',
      dotColor: 'bg-red-500',
      badgeBg: 'from-rose-50 via-red-50 to-rose-100/80 border-rose-200 text-rose-600',
      hoverBorder: 'hover:border-rose-400',
      hoverText: 'group-hover:text-rose-600',
      pos: 'absolute top-[42%] -right-10 sm:-right-28 lg:-right-32 z-30 animate-float-2',
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" className="stroke-red-600 fill-red-500/25" />
          <rect x="1" y="5" width="15" height="14" rx="2" className="stroke-rose-600 fill-rose-500/15" />
          <circle cx="8" cy="12" r="2" className="fill-red-500 stroke-none" />
        </svg>
      ),
    },

    // 4. LOWER-MIDDLE CARDS
    {
      name: 'Digital Marketing',
      sub: 'Meta & Google High-ROAS',
      pillar: 'Marketing',
      url: '/services/digital-marketing',
      dotColor: 'bg-teal-500',
      badgeBg: 'from-teal-50 via-emerald-50 to-teal-100/80 border-teal-200 text-teal-600',
      hoverBorder: 'hover:border-teal-400',
      hoverText: 'group-hover:text-teal-600',
      pos: 'absolute top-[70%] -left-8 sm:-left-24 lg:-left-28 z-30 animate-float-1',
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" className="stroke-teal-600" />
          <polyline points="17 6 23 6 23 12" className="stroke-emerald-600" />
          <circle cx="13.5" cy="15.5" r="2" className="fill-teal-500 stroke-none" />
        </svg>
      ),
    },
    {
      name: 'Doorstep Provisioning',
      sub: 'Rapid 24h Deployment',
      pillar: 'Hardware & IT',
      url: '/services/laptop-rental',
      dotColor: 'bg-indigo-500',
      badgeBg: 'from-indigo-50 via-blue-50 to-indigo-100/80 border-indigo-200 text-indigo-600',
      hoverBorder: 'hover:border-indigo-400',
      hoverText: 'group-hover:text-indigo-600',
      pos: 'absolute top-[70%] -right-8 sm:-right-24 lg:-right-28 z-30 animate-float-3',
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" className="stroke-indigo-600 fill-indigo-500/15" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" className="stroke-blue-600 fill-blue-500/20" />
          <circle cx="5.5" cy="18.5" r="2.5" className="stroke-indigo-600" />
          <circle cx="18.5" cy="18.5" r="2.5" className="stroke-blue-600" />
        </svg>
      ),
    },

    // 5. BOTTOM ROW CARDS (Generous spacing below the terminal)
    {
      name: '100% IP Ownership (OWNER VERIFICATION REQUIRED)',
      sub: 'Enterprise Clean Code',
      pillar: 'Software & Cloud',
      url: '/services/website-development',
      dotColor: 'bg-amber-500',
      badgeBg: 'from-amber-50 via-yellow-50 to-amber-100/80 border-amber-200 text-amber-600',
      hoverBorder: 'hover:border-amber-400',
      hoverText: 'group-hover:text-amber-600',
      pos: 'absolute -bottom-14 -left-4 sm:-left-16 lg:-left-20 z-30 animate-float-4',
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" className="stroke-amber-600 fill-amber-500/20" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" className="stroke-yellow-600" />
        </svg>
      ),
    },
    {
      name: 'Zero CapEx Lock-In',
      sub: 'Monthly Flexible Rental',
      pillar: 'Hardware Hub',
      url: '/services/computer-rental',
      dotColor: 'bg-emerald-500',
      badgeBg: 'from-emerald-50 via-green-50 to-emerald-100/80 border-emerald-200 text-emerald-600',
      hoverBorder: 'hover:border-emerald-400',
      hoverText: 'group-hover:text-emerald-600',
      pos: 'absolute -bottom-18 left-1/4 sm:left-1/3 z-30 animate-float-2 hidden xl:flex',
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" className="stroke-emerald-600" />
          <polyline points="22 4 12 14.01 9 11.01" className="stroke-teal-600" />
        </svg>
      ),
    },
    {
      name: 'Turnkey Execution',
      sub: 'All 3 Pillars Unified',
      pillar: 'Marketing & Scale',
      url: '/services',
      dotColor: 'bg-purple-500',
      badgeBg: 'from-purple-50 via-violet-50 to-purple-100/80 border-purple-200 text-purple-600',
      hoverBorder: 'hover:border-purple-400',
      hoverText: 'group-hover:text-purple-600',
      pos: 'absolute -bottom-14 -right-4 sm:-right-16 lg:-right-20 z-30 animate-float-1',
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" className="stroke-purple-600 fill-purple-500/25" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes heroFloat1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1.5deg); }
        }
        @keyframes heroFloat2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(8px) rotate(-1.5deg); }
        }
        @keyframes heroFloat3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
        }
        @keyframes heroFloat4 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(10px) rotate(1deg); }
        }
        .animate-float-1 { animation: heroFloat1 4.5s ease-in-out infinite; }
        .animate-float-2 { animation: heroFloat2 5.2s ease-in-out infinite; }
        .animate-float-3 { animation: heroFloat3 4.8s ease-in-out infinite; }
        .animate-float-4 { animation: heroFloat4 5.5s ease-in-out infinite; }
      `}</style>

      {serviceCards.map((card, index) => {
        return (
          <div key={card.name || index} className={card.pos}>
            <Link
              href={card.url}
              className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-b from-white via-white/98 to-slate-50/70 border border-slate-200/80 shadow-[0_12px_30px_-5px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 ${card.hoverBorder} hover:shadow-[0_20px_45px_-6px_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.05)] active:scale-95 cursor-pointer`}
            >
              {/* Distinct 3D Embossed Colored Icon Container */}
              <div className={`relative w-9 h-9 rounded-xl bg-gradient-to-br ${card.badgeBg} flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_5px_rgba(0,0,0,0.06)] flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                {card.svg}
              </div>

              {/* Service Details */}
              <div className="text-left pr-1">
                <div className={`text-[11px] font-extrabold text-slate-900 ${card.hoverText} transition-colors leading-tight truncate flex items-center gap-1.5`}>
                  <span>{card.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-500 mt-0.5">
                  <span className={`flex h-1.5 w-1.5 rounded-full ${card.dotColor} animate-pulse`} />
                  <span className="truncate">{card.sub}</span>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </>
  );
}

export default function HeroAppIcons() {
  return null;
}
