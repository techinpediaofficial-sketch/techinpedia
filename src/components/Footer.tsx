'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Phone, Mail } from 'lucide-react';

interface FooterProps {
  settings?: Record<string, string>;
  whatsappLink?: string;
  seoPages?: Array<{ id: string; title: string; slug: string }>;
}

export default function Footer({ settings, seoPages: initialSeoPages = [] }: FooterProps) {
  const pathname = usePathname();
  const [pages, setPages] = useState<Array<{ id: string; title: string; slug: string }>>(initialSeoPages);

  useEffect(() => {
    if (initialSeoPages && initialSeoPages.length > 0) {
      setPages(initialSeoPages);
    } else {
      fetch('/api/seo-pages')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data?.pages)) setPages(data.pages);
        })
        .catch(() => {});
    }
  }, [initialSeoPages]);
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const companyName = settings?.company_name || 'TechInPedia';
  const companyEmail = settings?.company_email || 'contact@techinpedia.com';
  const instagramUrl = settings?.social_instagram || 'https://www.instagram.com/techinpedia/';
  const linkedinUrl = settings?.social_linkedin || 'https://linkedin.com/company/techinpedia';
  const githubUrl = settings?.social_github || 'https://github.com/techinpedia';
  const twitterUrl = settings?.social_twitter || 'https://x.com/techinpedia';
  const youtubeUrl = settings?.social_youtube || 'https://www.youtube.com/@techinpedia';

  let phones: Array<{ id: string; label: string; number: string; isWhatsApp: boolean; isPrimary: boolean }> = [];
  try {
    if (settings?.company_phones) phones = JSON.parse(settings.company_phones);
  } catch {}
  if (!Array.isArray(phones) || phones.length === 0) {
    phones = [{ id: 'phone-default', label: 'Direct Support', number: settings?.company_phone || '+91 98765 43210', isWhatsApp: true, isPrimary: true }];
  }

  let addresses: Array<{ id: string; title: string; address: string; isPrimary: boolean }> = [];
  try {
    if (settings?.company_addresses) addresses = JSON.parse(settings.company_addresses);
  } catch {}
  if (!Array.isArray(addresses) || addresses.length === 0) {
    addresses = [{ id: 'addr-default', title: 'Headquarters', address: settings?.company_address || 'Cyber Hub & Worldwide Services, India', isPrimary: true }];
  }

  return (
    <footer className="bg-gradient-to-b from-[#faf8ff] via-violet-50/50 to-violet-100/60 text-slate-600 border-t border-violet-200/80 pt-12 pb-0 relative overflow-hidden select-none group/footer">
      
      {/* 1. 3D PERSPECTIVE LIGHT GRID BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25 z-0 [perspective:1000px]">
        <div className="absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-[1600px] h-[800px] bg-[linear-gradient(to_right,#ddd6fe_1px,transparent_1px),linear-gradient(to_bottom,#ddd6fe_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [transform:rotateX(65deg)] origin-bottom" />
      </div>

      {/* 2. VOLUMETRIC AMBIENT GLOW ORBS (VIOLET & PURPLE) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-tr from-violet-300/25 via-purple-300/20 to-indigo-300/20 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* FOOTER CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
        
        {/* TOP NAV BAR */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-violet-200/80">
          <Link href="/" className="hover:opacity-90 transition-opacity flex items-center shrink-0">
            <img
              src="/logo.png"
              alt="TechInPedia Logo"
              className="h-7 sm:h-8 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(128,46,227,0.2)]"
            />
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-slate-600">
            <Link href="/services" className="hover:text-violet-600 transition-colors">Services</Link>
            <Link href="/work" className="hover:text-violet-600 transition-colors">Solutions / Work</Link>
            <Link href="/workflows" className="hover:text-violet-600 transition-colors">Workflows</Link>
            <Link href="/about" className="hover:text-violet-600 transition-colors">Company</Link>
            <Link href="/blog" className="hover:text-violet-600 transition-colors">Insights</Link>
            <Link href="/contact" className="hover:text-violet-600 transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://admin.techinpedia.com/admin/login"
              className="text-xs font-semibold text-slate-500 hover:text-violet-600 px-3 py-2 transition-colors"
            >
              Admin Portal
            </a>
            <Link
              href="/start-project"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-violet-500/25 transition-all hover:scale-105"
            >
              Start Your Project
            </Link>
          </div>
        </div>

        {/* SERVICES QUICK LINKS - 3 PILLARS */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-600 pb-4 border-b border-violet-200/60">
          <span className="text-violet-600 font-bold uppercase tracking-wider text-[10px]">Core Offerings:</span>
          <Link href="/services/laptop-rental" className="text-violet-600 hover:text-violet-700 font-semibold transition-colors">
            Laptop Rental
          </Link>
          <span className="text-violet-300 hidden sm:inline">•</span>
          <Link href="/services/computer-rental" className="hover:text-violet-600 transition-colors">
            Computer Rental
          </Link>
          <span className="text-violet-300 hidden sm:inline">•</span>
          <Link href="/services/amc-maintenance" className="hover:text-violet-600 transition-colors">
            AMC Maintenance
          </Link>
          <span className="text-violet-300 hidden sm:inline">•</span>
          <Link href="/services/mobile-application" className="hover:text-violet-600 transition-colors">
            Mobile Applications
          </Link>
          <span className="text-violet-300 hidden sm:inline">•</span>
          <Link href="/services/website-development" className="hover:text-violet-600 transition-colors">
            Website Development
          </Link>
          <span className="text-violet-300 hidden sm:inline">•</span>
          <Link href="/services/cloud-services" className="hover:text-violet-600 transition-colors">
            Cloud Services
          </Link>
          <span className="text-violet-300 hidden sm:inline">•</span>
          <Link href="/services/brand-collaboration" className="hover:text-violet-600 transition-colors">
            Brand Collaboration
          </Link>
          <span className="text-violet-300 hidden sm:inline">•</span>
          <Link href="/services/content-creation-for-social-media" className="hover:text-violet-600 transition-colors">
            Content Creation
          </Link>
          <span className="text-violet-300 hidden sm:inline">•</span>
          <Link href="/services/digital-marketing" className="hover:text-violet-600 transition-colors">
            Digital Marketing
          </Link>
        </div>

        {/* SEO RENTAL QUICK LINKS */}
        <div className="flex flex-col gap-4 text-xs text-slate-600 pb-4 border-b border-violet-200/60">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <span className="text-violet-600 font-bold uppercase tracking-wider text-[10px]">Laptops on Rent:</span>
            <Link href="/laptop-on-rent/delhi" className="hover:text-violet-600 transition-colors">Delhi</Link>
            <span className="text-violet-300 hidden sm:inline">•</span>
            <Link href="/laptop-on-rent/noida" className="hover:text-violet-600 transition-colors">Noida</Link>
            <span className="text-violet-300 hidden sm:inline">•</span>
            <Link href="/laptop-on-rent/gurgaon" className="hover:text-violet-600 transition-colors">Gurgaon</Link>
            <span className="text-violet-300 hidden sm:inline">•</span>
            <Link href="/laptop-on-rent/ghaziabad" className="hover:text-violet-600 transition-colors">Ghaziabad</Link>
            <span className="text-violet-300 hidden sm:inline">•</span>
            <Link href="/laptop-on-rent/faridabad" className="hover:text-violet-600 transition-colors">Faridabad</Link>
            <span className="text-violet-300 hidden sm:inline">•</span>
            <Link href="/macbook-on-rent" className="hover:text-violet-600 transition-colors">MacBook</Link>
            <span className="text-violet-300 hidden sm:inline">•</span>
            <Link href="/dell-laptop-on-rent" className="hover:text-violet-600 transition-colors">Dell</Link>
            <span className="text-violet-300 hidden sm:inline">•</span>
            <Link href="/hp-laptop-on-rent" className="hover:text-violet-600 transition-colors">HP</Link>
            <span className="text-violet-300 hidden sm:inline">•</span>
            <Link href="/lenovo-laptop-on-rent" className="hover:text-violet-600 transition-colors">Lenovo</Link>
            <span className="text-violet-300 hidden sm:inline">•</span>
            <Link href="/corporate-laptop-rental" className="hover:text-violet-600 transition-colors">Corporate</Link>
            <span className="text-violet-300 hidden sm:inline">•</span>
            <Link href="/bulk-laptop-rental" className="hover:text-violet-600 transition-colors">Bulk</Link>
            <span className="text-violet-300 hidden sm:inline">•</span>
            <Link href="/laptop-rental-price" className="hover:text-violet-600 font-bold transition-colors">Pricing</Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <span className="text-blue-600 font-bold uppercase tracking-wider text-[10px]">Desktops on Rent:</span>
            <Link href="/desktop-on-rent/delhi" className="hover:text-blue-600 transition-colors">Delhi</Link>
            <span className="text-blue-300 hidden sm:inline">•</span>
            <Link href="/desktop-on-rent/noida" className="hover:text-blue-600 transition-colors">Noida</Link>
            <span className="text-blue-300 hidden sm:inline">•</span>
            <Link href="/desktop-on-rent/gurgaon" className="hover:text-blue-600 transition-colors">Gurgaon</Link>
            <span className="text-blue-300 hidden sm:inline">•</span>
            <Link href="/desktop-on-rent/ghaziabad" className="hover:text-blue-600 transition-colors">Ghaziabad</Link>
            <span className="text-blue-300 hidden sm:inline">•</span>
            <Link href="/desktop-on-rent/faridabad" className="hover:text-blue-600 transition-colors">Faridabad</Link>
            <span className="text-blue-300 hidden sm:inline">•</span>
            <Link href="/dell-desktop-on-rent" className="hover:text-blue-600 transition-colors">Dell</Link>
            <span className="text-blue-300 hidden sm:inline">•</span>
            <Link href="/hp-desktop-on-rent" className="hover:text-blue-600 transition-colors">HP</Link>
            <span className="text-blue-300 hidden sm:inline">•</span>
            <Link href="/lenovo-desktop-on-rent" className="hover:text-blue-600 transition-colors">Lenovo</Link>
            <span className="text-blue-300 hidden sm:inline">•</span>
            <Link href="/bpo-computer-rental" className="hover:text-blue-600 transition-colors">BPO Setup</Link>
            <span className="text-blue-300 hidden sm:inline">•</span>
            <Link href="/gaming-pc-on-rent" className="hover:text-blue-600 transition-colors">Gaming PC</Link>
            <span className="text-blue-300 hidden sm:inline">•</span>
            <Link href="/workstation-on-rent" className="hover:text-blue-600 transition-colors">Workstation</Link>
            <span className="text-blue-300 hidden sm:inline">•</span>
            <Link href="/desktop-rental-price" className="hover:text-blue-600 font-bold transition-colors">Pricing</Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-4 pt-4 border-t border-violet-100">
            <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">App Development:</span>
            <Link href="/mobile-app-development" className="hover:text-emerald-600 transition-colors">Mobile App</Link>
            <span className="text-emerald-300 hidden sm:inline">•</span>
            <Link href="/android-app-development" className="hover:text-emerald-600 transition-colors">Android</Link>
            <span className="text-emerald-300 hidden sm:inline">•</span>
            <Link href="/ios-app-development" className="hover:text-emerald-600 transition-colors">iOS / iPhone</Link>
            <span className="text-emerald-300 hidden sm:inline">•</span>
            <Link href="/flutter-app-development" className="hover:text-emerald-600 transition-colors">Flutter</Link>
            <span className="text-emerald-300 hidden sm:inline">•</span>
            <Link href="/react-native-app-development" className="hover:text-emerald-600 transition-colors">React Native</Link>
            <span className="text-emerald-300 hidden sm:inline">•</span>
            <Link href="/on-demand-app-development" className="hover:text-emerald-600 transition-colors">On-Demand</Link>
            <span className="text-emerald-300 hidden sm:inline">•</span>
            <Link href="/food-delivery-app-development" className="hover:text-emerald-600 transition-colors">Food Delivery</Link>
            <span className="text-emerald-300 hidden sm:inline">•</span>
            <Link href="/ecommerce-app-development" className="hover:text-emerald-600 transition-colors">E-Commerce</Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-2">
            <span className="text-purple-600 font-bold uppercase tracking-wider text-[10px]">Web & Software:</span>
            <Link href="/website-development" className="hover:text-purple-600 transition-colors">Website Development</Link>
            <span className="text-purple-300 hidden sm:inline">•</span>
            <Link href="/software-development" className="hover:text-purple-600 transition-colors">Software Development</Link>
            <span className="text-purple-300 hidden sm:inline">•</span>
            <Link href="/ecommerce-website-development" className="hover:text-purple-600 transition-colors">E-Commerce Web</Link>
            <span className="text-purple-300 hidden sm:inline">•</span>
            <Link href="/crm-development" className="hover:text-purple-600 transition-colors">Custom CRM</Link>
            <span className="text-purple-300 hidden sm:inline">•</span>
            <Link href="/erp-development" className="hover:text-purple-600 transition-colors">ERP Software</Link>
            <span className="text-purple-300 hidden sm:inline">•</span>
            <Link href="/whatsapp-crm" className="hover:text-purple-600 transition-colors">WhatsApp CRM</Link>
            <span className="text-purple-300 hidden sm:inline">•</span>
            <Link href="/nextjs-development" className="hover:text-purple-600 transition-colors">Next.js Apps</Link>
          </div>
        </div>

        {/* CONTACT & LOCATIONS STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 px-6 rounded-2xl bg-white/70 border border-violet-100/90 shadow-sm backdrop-blur-sm">
          {/* Offices */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span>Locations & Offices</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              {addresses.map((a) => (
                <div key={a.id}>
                  <span className="font-semibold text-slate-700">{a.title}: </span>
                  <span className="text-slate-600">{a.address}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Lines */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>Contact Numbers</span>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              {phones.map((p) => {
                const clean = p.number.replace(/[^0-9+]/g, '');
                return (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-slate-500">{p.label}:</span>
                    <a
                      href={`tel:${clean}`}
                      className="font-semibold text-slate-800 hover:text-violet-600 font-mono transition-colors"
                    >
                      {p.number}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Email & Support */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Mail className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
              <span>Corporate Email</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <a
                href={`mailto:${companyEmail}`}
                className="font-semibold text-slate-800 hover:text-violet-600 block transition-colors"
              >
                {companyEmail}
              </a>
              <p className="text-[11px] text-slate-500">Need bulk enterprise hardware rentals or software consulting? Contact our team 24/7.</p>
            </div>
          </div>
        </div>

        {/* MIDDLE SUB-ROW: COPYRIGHT & LEGAL & SOCIAL LINKS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} {companyName}. All Rights Reserved.
          </div>

          <div className="flex items-center gap-3">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white border border-violet-200 text-violet-600 hover:text-white hover:bg-violet-600 hover:border-violet-600 shadow-sm transition-all hover:scale-110"
              title="Instagram"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white border border-violet-200 text-violet-600 hover:text-white hover:bg-violet-600 hover:border-violet-600 shadow-sm transition-all hover:scale-110"
              title="LinkedIn"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>

            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white border border-violet-200 text-slate-700 hover:text-white hover:bg-slate-700 hover:border-slate-700 shadow-sm transition-all hover:scale-110"
              title="GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>

            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white border border-violet-200 text-violet-600 hover:text-white hover:bg-violet-600 hover:border-violet-600 shadow-sm transition-all hover:scale-110"
              title="X / Twitter"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            {/* YouTube */}
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white border border-violet-200 text-red-600 hover:text-white hover:bg-red-600 hover:border-red-600 shadow-sm transition-all hover:scale-110"
              title="YouTube"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
              </svg>
            </a>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-violet-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-violet-600 transition-colors">Terms of Service</Link>
            <Link href="/refund-policy" className="hover:text-violet-600 transition-colors">Refund Policy</Link>
          </div>
        </div>

        {/* SEO PAGES SECTION (4 COLUMNS) */}
        {pages && pages.length > 0 && (
          <div className="pt-6 border-t border-violet-200/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold text-violet-900 tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                Popular Searches & Regional Services
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Verified Enterprise Services Across India
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2.5 text-xs">
              {pages.map((p) => (
                <Link
                  key={p.id}
                  href={`/${p.slug}`}
                  className="text-slate-500 hover:text-violet-700 transition-colors flex items-center gap-1.5 truncate group"
                  title={p.title}
                >
                  <span className="text-violet-400 group-hover:text-violet-600 transition-colors font-mono text-[11px]">›</span>
                  <span className="truncate group-hover:underline underline-offset-2">{p.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* GIGANTIC BRAND TYPOGRAPHY */}
      <div className="relative pt-6 pb-0 text-center overflow-hidden w-full mt-8 z-10 flex flex-col items-center">
        
        {/* GIANT "TECHINPEDIA" TEXT STRETCHED FULL WIDTH EDGE-TO-EDGE */}
        <div className="w-full flex justify-center z-10">
          <svg
            viewBox="0 0 1100 95"
            className="w-full h-auto overflow-visible drop-shadow-[0_10px_25px_rgba(128,46,227,0.35)] select-none pointer-events-none"
          >
            <defs>
              <linearGradient id="techinpedia-3d-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#802ee3" />
                <stop offset="35%" stopColor="#993eef" />
                <stop offset="75%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>

              <filter id="shadow-blur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
              </filter>
            </defs>

            {/* Ambient Glow Aura Behind Text */}
            <text
              x="550"
              y="88"
              textAnchor="middle"
              className="font-black tracking-tighter uppercase font-sans"
              style={{
                fontSize: '95px',
                fontWeight: 900,
                fill: '#802ee3',
                opacity: 0.25,
                filter: 'url(#shadow-blur)',
              }}
            >
              TECHINPEDIA
            </text>

            {/* Front Metallic Text Layer */}
            <text
              x="550"
              y="86"
              textAnchor="middle"
              className="font-black tracking-tighter uppercase font-sans"
              style={{
                fontSize: '95px',
                fontWeight: 900,
                fill: 'url(#techinpedia-3d-gradient)',
              }}
            >
              TECHINPEDIA
            </text>
          </svg>
        </div>

        {/* FULL WIDTH CROPPED TEAM IMAGE TOUCHING THE TEXT */}
        <div className="w-full relative -mt-3 sm:-mt-6 md:-mt-10 lg:-mt-14 xl:-mt-18 pointer-events-none z-20 flex justify-center leading-none">
          <img
            src="/footer-image.png"
            alt="TechInPedia Team"
            className="w-full h-auto object-cover block drop-shadow-[0_5px_15px_rgba(0,0,0,0.15)]"
          />
        </div>

      </div>
    </footer>
  );
}
