'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TechInPediaLogo from './TechInPediaLogo';
import {
  Menu,
  X,
  ChevronDown,
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
  Sparkles,
} from 'lucide-react';

export default function Header({ whatsappLink }: { whatsappLink?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const pathname = usePathname();
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setServicesDropdownOpen(false);
    setMobileServicesOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: 'Services', href: '/services', hasDropdown: true },
    { name: 'Work', href: '/work' },
    { name: 'Workflows', href: '/workflows' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'News', href: '/news' },
    { name: 'Contact', href: '/contact' },
  ];

  // 1. HARDWARE SERVICES
  const hardwareServices = [
    {
      name: 'Laptop on Rent',
      href: '/services/laptop-rental',
      desc: 'MacBooks & Corporate Laptops On Rent',
      icon: Laptop,
      color: 'text-blue-600 bg-blue-50 border-blue-200 group-hover:bg-blue-100/80 group-hover:border-blue-400',
      hoverBg: 'hover:bg-blue-50/70 border-transparent hover:border-blue-200',
      titleHover: 'group-hover:text-blue-600',
      badge: 'Popular',
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      name: 'Desktop on Rent',
      href: '/services/computer-rental',
      desc: 'GPU Workstations & Desktop Rigs',
      icon: Monitor,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200 group-hover:bg-indigo-100/80 group-hover:border-indigo-400',
      hoverBg: 'hover:bg-indigo-50/70 border-transparent hover:border-indigo-200',
      titleHover: 'group-hover:text-indigo-600',
    },
    {
      name: 'AMC Maintenance',
      href: '/services/amc-maintenance',
      desc: '24/7 IT Infrastructure SLA Support',
      icon: Wrench,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200 group-hover:bg-emerald-100/80 group-hover:border-emerald-400',
      hoverBg: 'hover:bg-emerald-50/70 border-transparent hover:border-emerald-200',
      titleHover: 'group-hover:text-emerald-600',
    },
  ];

  // 2. SOFTWARE SERVICES
  const softwareServices = [
    {
      name: 'Mobile Application',
      href: '/services/mobile-application',
      desc: 'iOS & Android Flutter & Native Apps',
      icon: Smartphone,
      color: 'text-purple-600 bg-purple-50 border-purple-200 group-hover:bg-purple-100/80 group-hover:border-purple-400',
      hoverBg: 'hover:bg-purple-50/70 border-transparent hover:border-purple-200',
      titleHover: 'group-hover:text-purple-600',
      badge: 'Trending',
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      name: 'Website Development',
      href: '/services/website-development',
      desc: 'Next.js & React Sub-Second Web Apps',
      icon: Globe,
      color: 'text-violet-600 bg-violet-50 border-violet-200 group-hover:bg-violet-100/80 group-hover:border-violet-400',
      hoverBg: 'hover:bg-violet-50/70 border-transparent hover:border-violet-200',
      titleHover: 'group-hover:text-violet-600',
      badge: 'Core',
      badgeColor: 'bg-violet-600 text-white',
    },
    {
      name: 'Cloud Services',
      href: '/services/cloud-services',
      desc: 'AWS, GCP, DevOps & CI/CD Pipelines',
      icon: Cloud,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200 group-hover:bg-cyan-100/80 group-hover:border-cyan-400',
      hoverBg: 'hover:bg-cyan-50/70 border-transparent hover:border-cyan-200',
      titleHover: 'group-hover:text-cyan-600',
    },
  ];

  // 3. MARKETING SERVICES
  const marketingServices = [
    {
      name: 'Brand Collaboration',
      href: '/services/brand-collaboration',
      desc: 'B2B Strategic Creator & Brand Tie-Ups',
      icon: Handshake,
      color: 'text-amber-600 bg-amber-50 border-amber-200 group-hover:bg-amber-100/80 group-hover:border-amber-400',
      hoverBg: 'hover:bg-amber-50/70 border-transparent hover:border-amber-200',
      titleHover: 'group-hover:text-amber-600',
      badge: 'High Reach',
      badgeColor: 'bg-amber-600 text-white',
    },
    {
      name: 'Content Creation',
      href: '/services/content-creation-for-social-media',
      desc: 'Viral Reels, Shorts & Social Storytelling',
      icon: Video,
      color: 'text-rose-600 bg-rose-50 border-rose-200 group-hover:bg-rose-100/80 group-hover:border-rose-400',
      hoverBg: 'hover:bg-rose-50/70 border-transparent hover:border-rose-200',
      titleHover: 'group-hover:text-rose-600',
      badge: 'Viral',
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      name: 'Digital Marketing',
      href: '/services/digital-marketing',
      desc: 'High-ROAS Meta & Google PPC Campaigns',
      icon: TrendingUp,
      color: 'text-teal-600 bg-teal-50 border-teal-200 group-hover:bg-teal-100/80 group-hover:border-teal-400',
      hoverBg: 'hover:bg-teal-50/70 border-transparent hover:border-teal-200',
      titleHover: 'group-hover:text-teal-600',
      badge: 'High ROI',
      badgeColor: 'bg-teal-600 text-white',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/') {
      if (pathname === path) return true;
      if (pathname.startsWith(path + '/')) return true;
    }
    return false;
  };

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setServicesDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setServicesDropdownOpen(false);
    }, 200);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-violet-100 shadow-sm'
          : 'bg-white/85 backdrop-blur-md border-b border-violet-100/70'
      }`}
    >
      {/* TOP ANNOUNCEMENT & DIRECT CALL STRIP */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white text-[11px] sm:text-xs py-1 px-4 text-center font-medium shadow-inner flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
        <span className="flex items-center gap-1.5 font-semibold text-blue-100">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>Laptop & Computer Rentals Delhi NCR:</span>
        </span>
        <span className="hidden md:inline text-blue-200">Express Doorstep Delivery in Noida, Gurgaon & Delhi</span>
        <span className="text-white/40 hidden sm:inline">•</span>
        <a
          href="tel:+919818768680"
          className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-white transition-colors underline decoration-amber-400 decoration-1 underline-offset-2"
        >
          📞 Call: +91 98187 68680
        </a>
        <span className="text-white/40 hidden sm:inline">•</span>
        <a
          href={whatsappLink || "https://wa.me/919818768680?text=Hi%20TechInPedia%2C%20I%20am%20inquiring%20about%20laptop%20or%20computer%20rental."}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-emerald-300 hover:text-white transition-colors"
        >
          💬 WhatsApp
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 relative">
        <div className="flex items-center justify-between">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <TechInPediaLogo />
          </Link>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              if (link.hasDropdown) {
                return (
                  <div
                    key={link.name}
                    className="relative"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                        isActive('/services')
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25'
                          : 'text-slate-700 hover:text-violet-600 hover:bg-violet-50/80'
                      }`}
                    >
                      <span>{link.name}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          servicesDropdownOpen ? 'rotate-180 text-violet-600' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive(link.href)
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25'
                      : 'text-slate-700 hover:text-violet-600 hover:bg-violet-50/80'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT ACTION CTA */}
          <div className="hidden lg:flex items-center gap-2.5">
            <a
              href="tel:+919818768680"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all shadow-sm"
              title="Direct Rental Hotline"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>📞 +91 98187 68680</span>
            </a>
            <Link
              href="/start-project"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Start a Project</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* MOBILE CALL BUTTON + MENU TOGGLE */}
          <div className="lg:hidden flex items-center gap-2">
            <a
              href="tel:+919818768680"
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
              title="Call TechInPedia"
            >
              <span>📞 Call</span>
            </a>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl bg-violet-50 border border-violet-200 text-slate-700 hover:text-violet-600 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MEGA DROPDOWN MENU - Perfectly centered within max-w-7xl container, never cut off */}
        {servicesDropdownOpen && (
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[980px] max-w-[calc(100vw-2rem)]"
            style={{ zIndex: 99999 }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #ddd6fe',
                boxShadow: '0 25px 60px -10px rgba(124, 58, 237, 0.15), 0 0 25px rgba(221, 214, 254, 0.4)',
                borderRadius: '20px',
                padding: '22px 24px',
              }}
              className="text-left relative overflow-hidden"
            >
              {/* Ambient Accent Glow inside container */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-violet-100/50 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none" />

              {/* Top Header */}
              <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-violet-100 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold">
                    Enterprise Solutions & Services Matrix
                  </span>
                </div>
                <Link
                  href="/services"
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1.5 transition-colors group"
                >
                  <span>View All Services Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* 3-Column Services Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '20px',
                }}
                className="relative z-10"
              >
                {/* Column 1: Hardware */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 pb-1.5 px-1 border-b border-blue-100 mb-2">
                    <div className="w-4 h-4 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Laptop className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                      Hardware & Rentals
                    </span>
                  </div>
                  <div className="space-y-1">
                    {hardwareServices.map((h) => {
                      const IconComponent = h.icon;
                      return (
                        <Link
                          key={h.name}
                          href={h.href}
                          className={`group flex items-start gap-2.5 p-2 rounded-xl transition-all border ${h.hoverBg}`}
                        >
                          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm transition-transform group-hover:scale-105 ${h.color}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                              <span className={`text-xs font-bold text-slate-800 transition-colors truncate min-w-0 ${h.titleHover}`}>
                                {h.name}
                              </span>
                              {h.badge && (
                                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-extrabold flex-shrink-0 whitespace-nowrap ${h.badgeColor || 'bg-blue-600 text-white'}`}>
                                  {h.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-snug">
                              {h.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Software & Engineering */}
                <div className="space-y-1 border-l border-violet-100 pl-4">
                  <div className="flex items-center gap-1.5 pb-1.5 px-1 border-b border-purple-100 mb-2">
                    <div className="w-4 h-4 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Globe className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                      Software & Engineering
                    </span>
                  </div>
                  <div className="space-y-1">
                    {softwareServices.map((s) => {
                      const IconComponent = s.icon;
                      return (
                        <Link
                          key={s.name}
                          href={s.href}
                          className={`group flex items-start gap-2.5 p-2 rounded-xl transition-all border ${s.hoverBg}`}
                        >
                          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm transition-transform group-hover:scale-105 ${s.color}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                              <span className={`text-xs font-bold text-slate-800 transition-colors truncate min-w-0 ${s.titleHover}`}>
                                {s.name}
                              </span>
                              {s.badge && (
                                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-extrabold flex-shrink-0 whitespace-nowrap ${s.badgeColor || 'bg-purple-600 text-white'}`}>
                                  {s.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-snug">
                              {s.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Column 3: Marketing & Growth */}
                <div className="space-y-1 border-l border-violet-100 pl-4">
                  <div className="flex items-center gap-1.5 pb-1.5 px-1 border-b border-amber-100 mb-2">
                    <div className="w-4 h-4 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Sparkles className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      Strategic Marketing
                    </span>
                  </div>
                  <div className="space-y-1">
                    {marketingServices.map((m) => {
                      const IconComponent = m.icon;
                      return (
                        <Link
                          key={m.name}
                          href={m.href}
                          className={`group flex items-start gap-2.5 p-2 rounded-xl transition-all border ${m.hoverBg}`}
                        >
                          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm transition-transform group-hover:scale-105 ${m.color}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5 min-w-0">
                              <span className={`text-xs font-bold text-slate-800 transition-colors truncate min-w-0 ${m.titleHover}`}>
                                {m.name}
                              </span>
                              {m.badge && (
                                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-extrabold flex-shrink-0 whitespace-nowrap ${m.badgeColor || 'bg-amber-600 text-white'}`}>
                                  {m.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-snug">
                              {m.desc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dropdown Bottom Bar */}
              <div className="mt-3.5 pt-3 border-t border-violet-100 flex items-center justify-between relative z-10 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  <span className="text-[11px] text-slate-600">Hardware Rentals, Custom Software & Digital Marketing</span>
                </div>
                <Link
                  href="/start-project"
                  className="text-[11px] font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors"
                >
                  <span>Start Project / Request Quote</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE FULL-SCREEN / SLIDE-DOWN DRAWER */}
      {isOpen && (
        <div className="lg:hidden mt-3 px-4 pt-2 pb-6 bg-white/98 backdrop-blur-xl border-b border-violet-200 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              if (link.hasDropdown) {
                return (
                  <div key={link.name} className="space-y-1">
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-violet-50/70 border border-violet-100 text-sm font-semibold text-slate-800">
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={isActive(link.href) ? 'text-violet-600 font-bold' : ''}
                      >
                        {link.name}
                      </Link>
                      <button
                        onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                        className="p-1 rounded text-slate-500 hover:text-violet-600 cursor-pointer"
                        aria-label="Toggle services list"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            mobileServicesOpen ? 'rotate-180 text-violet-600' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Submenu for Mobile */}
                    {mobileServicesOpen && (
                      <div className="pl-3 pr-2 py-3 bg-white rounded-2xl space-y-3 border border-violet-200 shadow-sm">
                        {/* Hardware */}
                        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 px-2 flex items-center gap-1.5">
                          <Laptop className="w-3 h-3 text-blue-600" />
                          <span>Hardware & Rentals</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          {hardwareServices.map((h) => {
                            const IconComponent = h.icon;
                            return (
                              <Link
                                key={h.name}
                                href={h.href}
                                onClick={() => setIsOpen(false)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between text-slate-700 hover:text-blue-600 hover:bg-blue-50/60"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${h.color}`}>
                                    <IconComponent className="w-3 h-3" />
                                  </div>
                                  <span>{h.name}</span>
                                </div>
                                {h.badge && (
                                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${h.badgeColor || 'bg-blue-600 text-white'}`}>
                                    {h.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>

                        {/* Software */}
                        <div className="pt-2 border-t border-violet-100 text-[11px] font-bold uppercase tracking-wider text-purple-700 px-2 flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-purple-600" />
                          <span>Software & Engineering</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          {softwareServices.map((s) => {
                            const IconComponent = s.icon;
                            return (
                              <Link
                                key={s.name}
                                href={s.href}
                                onClick={() => setIsOpen(false)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between text-slate-700 hover:text-purple-600 hover:bg-purple-50/60"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${s.color}`}>
                                    <IconComponent className="w-3 h-3" />
                                  </div>
                                  <span>{s.name}</span>
                                </div>
                                {s.badge && (
                                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${s.badgeColor || 'bg-purple-600 text-white'}`}>
                                    {s.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>

                        {/* Marketing */}
                        <div className="pt-2 border-t border-violet-100 text-[11px] font-bold uppercase tracking-wider text-amber-700 px-2 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Strategic Marketing</span>
                        </div>
                        <div className="flex flex-col space-y-1">
                          {marketingServices.map((m) => {
                            const IconComponent = m.icon;
                            return (
                              <Link
                                key={m.name}
                                href={m.href}
                                onClick={() => setIsOpen(false)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between text-slate-700 hover:text-amber-600 hover:bg-amber-50/60"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${m.color}`}>
                                    <IconComponent className="w-3 h-3" />
                                  </div>
                                  <span>{m.name}</span>
                                </div>
                                {m.badge && (
                                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${m.badgeColor || 'bg-amber-600 text-white'}`}>
                                    {m.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>

                        <div className="pt-2 border-t border-violet-100">
                          <Link
                            href="/services"
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1"
                          >
                            <span>Explore All Services Catalog →</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive(link.href)
                      ? 'bg-violet-100 text-violet-700 font-bold border-l-4 border-violet-600'
                      : 'text-slate-700 hover:bg-violet-50 hover:text-violet-600'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-violet-100 space-y-2">
            <Link
              href="/start-project"
              onClick={() => setIsOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white text-sm font-bold shadow-md shadow-violet-500/25"
            >
              <span>Start a Project</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
