'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ExternalLink, Globe, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import TechIcon from '@/components/TechIcons';

export interface WebsiteItem {
  title: string;
  slug: string;
  category: string;
  categoryFilter: 'ecommerce' | 'realestate' | 'enterprise' | 'media' | 'hospitality';
  liveUrl: string;
  shortDesc: string;
  features: string[];
  technologies: string[];
  screenshot: string;
  client: string;
}

const WEBSITES_DATA: WebsiteItem[] = [
  {
    title: 'Admiles Super App & Web Portal',
    slug: 'admiless-portal',
    category: 'Multi-Vendor / E-Commerce & Food',
    categoryFilter: 'ecommerce',
    liveUrl: 'https://admiless.com/',
    shortDesc: 'All-in-one on-demand web portal for multi-vendor restaurant food ordering, retail e-commerce shopping, and courier parcel dispatch.',
    features: ['Multi-Vendor Food Ordering', 'Instant Courier Rate Calculator', 'Real-Time Driver Tracking', 'Integrated Multi-Payment Gateway'],
    technologies: ['Next.js', 'Flutter Web', 'Node.js', 'MySQL', 'Google Maps API'],
    screenshot: '/projects/screenshots/admiless.png',
    client: 'Admiles New Mart Ltd',
  },
  {
    title: 'Vijayabharna Jewellers',
    slug: 'vijayabharna-jewellers-web',
    category: 'Luxury Jewellery / E-Commerce',
    categoryFilter: 'ecommerce',
    liveUrl: 'https://vijayabharnajewellers.com/',
    shortDesc: 'Luxury jewellery digital storefront featuring live daily gold and silver market tickers, bridal vaults, and consultation booking.',
    features: ['Live Gold & Silver Price Ticker', 'High-Definition Bridal Vault', 'Bespoke Consultation Booking', 'Direct WhatsApp Concierge'],
    technologies: ['Laravel', 'PHP 8.3', 'MySQL', 'Tailwind CSS', 'Bullion API'],
    screenshot: '/projects/screenshots/vijayabharnajewellers.png',
    client: 'Vijaya Bharna Jewellers',
  },
  {
    title: 'Vijayabharna Real Estate',
    slug: 'vijayabharna-realestate',
    category: 'Real Estate & Land Properties',
    categoryFilter: 'realestate',
    liveUrl: 'https://realestate.vijayabharnajewellers.com/',
    shortDesc: 'Property listing and layout portal for commercial plots, residential land, and site visit booking in Devadurga.',
    features: ['Verified Plot & Master Plan Maps', 'One-Click Site Visit Booking', 'Brochure & Approval Downloads', 'Connectivity & Amenities Map'],
    technologies: ['Laravel', 'PHP 8.3', 'MySQL', 'Bootstrap 5', 'Google Maps API'],
    screenshot: '/projects/screenshots/realestate-vijayabharna.png',
    client: 'Vijaya Bharna Properties Devadurga',
  },
  {
    title: 'Velora Jewels',
    slug: 'velora-jewels',
    category: 'Fashion Jewellery & D2C E-Commerce',
    categoryFilter: 'ecommerce',
    liveUrl: 'https://velorajewels.co.in/',
    shortDesc: 'Modern D2C e-commerce jewellery shopping brand with dynamic product filtering, customer cart, and express pan-India checkout.',
    features: ['D2C Shopping Storefront', 'Faceted Category & Occasion Filters', 'Automated Promo & Discount Engine', 'Express Pan-India Checkout'],
    technologies: ['PHP', 'Laravel', 'MySQL', 'JavaScript', 'Razorpay'],
    screenshot: '/projects/screenshots/velorajewels.png',
    client: 'Velora Jewels India',
  },
  {
    title: 'TruCraft Modular Solutions',
    slug: 'trucraft-modular',
    category: 'Architecture & Modular Manufacturing',
    categoryFilter: 'realestate',
    liveUrl: 'https://trucraftmodular.com/',
    shortDesc: 'Precision modular kitchen, wardrobe, and interior architecture showcase website for custom residential and commercial manufacturing.',
    features: ['Architectural Precision Joinery', 'Modular Kitchen 3D Galleries', 'Factory Production Walkthrough', 'Instant Consultation Booking Funnel'],
    technologies: ['Next.js', 'React', 'Tailwind CSS', 'Framer Motion', 'Node.js'],
    screenshot: '/projects/screenshots/trucraftmodular.png',
    client: 'TruCraft Modular Pvt Ltd',
  },
  {
    title: 'Vinfexo Tech',
    slug: 'vinfexo-tech',
    category: 'Enterprise IT & Digital Agency',
    categoryFilter: 'enterprise',
    liveUrl: 'https://vinfexotech.com/',
    shortDesc: 'Corporate technology agency website highlighting web development, mobile applications, cloud engineering, and digital growth services.',
    features: ['Corporate Dark-Mode Engineering', 'Interactive Capability Matrices', 'Client Project Case Studies', 'Multi-Step Project Estimator'],
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Node.js'],
    screenshot: '/projects/screenshots/vinfexotech.png',
    client: 'Vinfexo Tech Private Limited',
  },
  {
    title: 'Hello Mam Beauty & Skincare',
    slug: 'hello-mam',
    category: 'Cosmetics & Beauty E-Commerce',
    categoryFilter: 'ecommerce',
    liveUrl: 'https://hellomam.co.in/',
    shortDesc: 'Curated beauty, skincare, and women wellness e-commerce shopping platform with categorized product catalogue and speedy checkout.',
    features: ['Beauty & Skincare Catalogue', 'Skin Concern & Ingredient Filters', 'Quick Buy & Cart Persistence', 'Verified Customer Ratings'],
    technologies: ['Laravel', 'PHP', 'MySQL', 'JavaScript', 'Razorpay'],
    screenshot: '/projects/screenshots/hellomam.png',
    client: 'Hello Mam Brand',
  },
  {
    title: 'Abdiel Aircon',
    slug: 'abdiel-aircon',
    category: 'Industrial HVAC & Parts Supply',
    categoryFilter: 'enterprise',
    liveUrl: 'https://abdielaircon.info/',
    shortDesc: 'B2B industrial catalog and supply portal for genuine commercial HVAC compressors, refrigerants, and cooling spare parts.',
    features: ['Industrial Spare Parts Catalog', 'Compressor Specification Matrices', 'B2B Bulk Quotation Engine', 'WhatsApp Technical Field Support'],
    technologies: ['HTML5', 'CSS3', 'JavaScript', 'PHP', 'MySQL'],
    screenshot: '/projects/screenshots/abdielaircon.png',
    client: 'Abdiel Aircon Industrial',
  },
  {
    title: 'Swastik / Shivalik FinAdvisors',
    slug: 'shivalik-finadvisor',
    category: 'Financial Services & Loan Advisory',
    categoryFilter: 'enterprise',
    liveUrl: 'https://shivaliksalesfinadvisor.com/',
    shortDesc: 'Online loan comparison, EMI calculation, and financial advisory portal connecting borrowers with top banking partners.',
    features: ['Interactive Loan EMI Calculator', 'Multi-Bank Loan Comparison Table', 'Eligibility Check Assessment', 'Direct Consultation Booking'],
    technologies: ['PHP', 'Laravel', 'MySQL', 'JavaScript', 'Bootstrap 5'],
    screenshot: '/projects/screenshots/shivaliksalesfinadvisor.png',
    client: 'Swastik FinAdvisors LLP',
  },
  {
    title: 'BM Naveen Movies Web Portal',
    slug: 'bm-naveen-movies-web',
    category: 'Entertainment & Video Streaming',
    categoryFilter: 'media',
    liveUrl: 'https://movie.bmnaveens.com/',
    shortDesc: 'High-speed multimedia entertainment web portal for discovering movie trailers, upcoming releases, and video streaming.',
    features: ['HD Video Streaming Player', 'Genre & Language Categorization', 'Upcoming Release Countdown', 'Actor Filmographies & Bios'],
    technologies: ['Next.js', 'Node.js', 'HLS Streaming', 'Tailwind CSS', 'MySQL'],
    screenshot: '/projects/screenshots/movie-bmnaveens.png',
    client: 'BM Naveen Entertainment',
  },
  {
    title: 'KCN Sons Luxury Fashion',
    slug: 'kcn-sons-boutique',
    category: 'Heritage Bridal & Luxury Fashion',
    categoryFilter: 'hospitality',
    liveUrl: 'https://kcnsons.in/',
    shortDesc: 'Prestigious heritage bridal boutique website featuring handcrafted Lucknowi Gararas, Chikankari craftsmanship, and custom designer appointments.',
    features: ['High-Resolution Bridal Lookbook', 'Awadhi Chikankari Heritage Story', 'Custom Couture Booking Form', 'Global Concierge Shipping Inquiry'],
    technologies: ['PHP 8.3', 'MySQL', 'JavaScript', 'Luxury CSS3', 'Bootstrap'],
    screenshot: '/projects/screenshots/kcnsons.png',
    client: 'KCN Sons Lucknow',
  },
  {
    title: 'Book My Hotel',
    slug: 'book-my-hotel',
    category: 'Hospitality & Hotel Booking Engine',
    categoryFilter: 'hospitality',
    liveUrl: 'https://book-myhotel.com/',
    shortDesc: 'Comprehensive hotel reservation and stay discovery platform featuring destination filtering, live room rates, and instant booking confirmation.',
    features: ['Real-Time Room Booking Engine', 'Destination & Star-Rating Filters', 'Instant Voucher Generation', 'Guest Review & Rating System'],
    technologies: ['Laravel', 'PHP', 'MySQL', 'JavaScript', 'Payment Gateway'],
    screenshot: '/projects/screenshots/book-myhotel.png',
    client: 'Book My Hotel Network',
  },
  {
    title: 'Anytime Salon',
    slug: 'anytime-salon',
    category: 'Beauty, Grooming & Salon Booking',
    categoryFilter: 'hospitality',
    liveUrl: 'https://anytimesalon.com/',
    shortDesc: 'On-demand salon and beauty appointment booking marketplace connecting customers with professional stylists and spa therapies.',
    features: ['Time-Slot Stylist Booking Engine', 'Transparent Service & Price Menu', 'In-Salon & Home Grooming Options', 'Automated SMS Reminders'],
    technologies: ['Laravel', 'PHP', 'MySQL', 'JavaScript', 'Tailwind CSS'],
    screenshot: '/projects/screenshots/anytimesalon.png',
    client: 'Anytime Salon Network',
  },
  {
    title: 'MakeupTym Studio & Academy',
    slug: 'makeuptym',
    category: 'Bridal Makeup & Artist Academy',
    categoryFilter: 'hospitality',
    liveUrl: 'http://makeuptym.com/',
    shortDesc: 'Professional bridal makeup portfolio and beauty academy portal for booking elite bridal packages and makeup artistry masterclasses.',
    features: ['Bridal Makeover Transformation Vault', 'Academy Course Curriculums', 'Wedding Date Availability Calendar', 'WhatsApp Booking Assistant'],
    technologies: ['PHP', 'MySQL', 'Bootstrap', 'JavaScript', 'HTML5'],
    screenshot: '/projects/screenshots/makeuptym.png',
    client: 'MakeupTym Studio & Academy',
  },
];

export default function WebsitesShowcase() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'ecommerce' | 'realestate' | 'enterprise' | 'media' | 'hospitality'>('all');

  const filteredWebsites = activeFilter === 'all'
    ? WEBSITES_DATA
    : WEBSITES_DATA.filter((item) => item.categoryFilter === activeFilter);

  const filters = [
    { id: 'all', label: 'All Websites (14)' },
    { id: 'ecommerce', label: 'E-Commerce & Retail' },
    { id: 'realestate', label: 'Real Estate & Interiors' },
    { id: 'enterprise', label: 'Enterprise, IT & Fin' },
    { id: 'hospitality', label: 'Hospitality & Lifestyle' },
    { id: 'media', label: 'Media & Streaming' },
  ];

  return (
    <section className="py-24 bg-slate-950 border-b border-slate-800 relative overflow-hidden" id="websites-showcase">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[300px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/70 border border-violet-800/60 text-violet-300 text-xs font-extrabold uppercase tracking-wider shadow-sm">
              <Globe className="w-3.5 h-3.5" />
              <span>Client Websites & Web Portals Showcase</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Live Production Websites Engineered By TechInPedia
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Explore live web applications, e-commerce storefronts, real estate portals, and custom SaaS platforms built with cutting-edge speed, security, and conversion architecture.
            </p>
          </div>

          <div className="mt-6 md:mt-0 flex-shrink-0">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-violet-500 text-slate-200 hover:text-white font-bold text-xs tracking-wider transition-all hover:scale-105 shadow-md group"
            >
              <span>View All Projects</span>
              <ArrowRight className="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* CATEGORY FILTER BUTTONS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {filters.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* WEBSITES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredWebsites.map((site) => {
            const domain = site.liveUrl.replace('https://', '').replace('http://', '').replace('/', '');

            return (
              <div
                key={site.slug}
                className="group rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 hover:shadow-[0_20px_45px_rgba(0,102,255,0.18)] transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl"
              >
                <div>
                  {/* BROWSER WINDOW TOP BAR (macOS Style) */}
                  <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
                    {/* Window Controls Dots */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    </div>

                    {/* Address URL Pill */}
                    <div className="flex-1 max-w-[210px] mx-auto px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-1.5 truncate font-mono">
                      <span className="text-emerald-400">🔒</span>
                      <span className="truncate">{domain}</span>
                    </div>

                    {/* Live Dot Indicator */}
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="hidden sm:inline">Live</span>
                    </div>
                  </div>

                  {/* DESKTOP SCREENSHOT PREVIEW */}
                  <div className="relative h-52 sm:h-56 w-full bg-slate-950 overflow-hidden border-b border-slate-800/80">
                    <Image
                      src={site.screenshot}
                      alt={`${site.title} Official Website Screenshot`}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                    {/* Category Overlay Tag */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold pointer-events-none">
                      <span className="px-2.5 py-1 rounded-md bg-slate-950/90 border border-slate-700/80 text-blue-400 backdrop-blur-sm shadow-md">
                        {site.category}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-slate-950/90 border border-slate-700/80 text-slate-300 backdrop-blur-sm shadow-md">
                        {site.client}
                      </span>
                    </div>
                  </div>

                  {/* CONTENT AREA */}
                  <div className="p-6 space-y-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">
                      {site.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {site.shortDesc}
                    </p>

                    {/* KEY FEATURES LIST */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                      {site.features.slice(0, 3).map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-[11px] text-slate-300 font-medium truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* TECHNOLOGIES BADGES */}
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      {site.technologies.slice(0, 4).map((tech, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-semibold flex items-center gap-1.5 shadow-sm"
                        >
                          <TechIcon name={tech} className="w-3 h-3 flex-shrink-0" />
                          <span>{tech}</span>
                        </span>
                      ))}
                      {site.technologies.length > 4 && (
                        <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-500 font-semibold">
                          +{site.technologies.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD FOOTER ACTIONS */}
                <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                  <Link
                    href={`/work/${site.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>Read Case Study</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <a
                    href={site.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 font-bold text-xs transition-all hover:scale-105 shadow-sm"
                    title={`Visit ${domain} live`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Visit Live Site</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM CALL TO ACTION STRIP */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-900/30 border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-white">Need a High-Converting Custom Website Built for Your Business?</h3>
            <p className="text-xs sm:text-sm text-slate-300">
              From enterprise e-commerce portals to SaaS web apps, our team delivers production-ready code with guaranteed speed.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/start-project"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
            >
              Start Your Website Project
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
