import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import {
  Search,
  ChevronRight,
  MapPin,
  Building2,
  Eye,
  Activity,
  Heart,
  Baby,
  Smile,
  ShieldCheck,
  Stethoscope,
  Wrench,
  Zap,
  Layers,
  Sparkles,
  Truck,
  Briefcase,
  Home,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  Star,
  Mic,
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

const SUBCATEGORY_ICON_MAP: Record<string, any> = {
  eye: Eye,
  heart: Heart,
  cardiac: Heart,
  dental: Smile,
  child: Baby,
  maternity: Baby,
  ac: Wrench,
  electr: Zap,
  plumb: Layers,
  clean: Sparkles,
  packer: Truck,
  estate: Home,
  hvac: Wrench,
  hardware: Briefcase,
};

function getSubIcon(name: string) {
  const lower = name.toLowerCase();
  for (const [key, Icon] of Object.entries(SUBCATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return Icon;
  }
  return Building2;
}

import { Metadata } from 'next';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const parent = await db.marketplaceCategory.findFirst({
    where: { slug, status: 'ACTIVE' },
    select: { name: true, slug: true, tagline: true, metaTitle: true, metaDescription: true },
  });

  if (!parent) return {};

  const title = parent.metaTitle || `${parent.name} Services & Suppliers in Lucknow | Urban Marketplace`;
  const description = parent.metaDescription || parent.tagline || `Find top-rated ${parent.name} service providers, scanned rate-cards, verified dealers, and contact numbers in Lucknow on Urban.`;
  const canonicalUrl = `https://urban.techinpedia.com/category/${parent.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Urban Marketplace',
      type: 'website',
    },
  };
}

export default async function CategoryHubPage({ params }: Props) {
  const { slug } = await params;

  // 1. Fetch the parent category
  const parent = await db.marketplaceCategory.findFirst({
    where: {
      slug,
      status: 'ACTIVE',
    },
  });

  if (!parent) {
    notFound();
  }

  // 2. Fetch all child subcategories belonging to this parent
  const subcategories = await db.marketplaceCategory.findMany({
    where: {
      parentId: parent.id,
      status: 'ACTIVE',
    },
    orderBy: { displayOrder: 'asc' },
  });

  // 3. Fetch top vendors in this parent category or its subcategories
  const vendors = await db.marketplaceVendor.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { primaryCategory: { contains: parent.name } },
        { categories: { contains: parent.name } },
        { primaryCategory: { contains: slug.split('-')[0] } },
      ],
    },
    take: 6,
    orderBy: [{ isFeatured: 'desc' }, { averageRating: 'desc' }],
    include: {
      media: { where: { mediaType: 'PHOTO' }, take: 2 },
      services: { where: { status: 'ACTIVE' }, take: 2 },
    },
  });

  return (
    <div className="min-h-screen bg-[#070b18] text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-20">
      {/* 1. TOP HEADER (Unified with Homepage) */}
      <header className="sticky top-0 z-40 bg-[#070b18]/95 backdrop-blur-md border-b border-slate-800/80 shadow-md">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
                U
              </div>
              <div>
                <span className="text-2xl font-black text-white tracking-tight">
                  Urban<span className="text-orange-500">Market</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800 uppercase font-mono font-bold tracking-wider">
                  Live
                </span>
              </div>
            </Link>

            {/* Smart Search Bar */}
            <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-4">
              <div className="flex items-center w-full border border-slate-700/80 rounded-full overflow-hidden bg-[#0c1427] shadow-inner hover:border-slate-600 transition-colors p-1">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 border-r border-slate-700/80 text-xs font-bold text-white w-52 flex-shrink-0 hover:text-orange-400 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="truncate">Mathur Lane, Lucknow</span>
                </Link>

                <div className="flex items-center flex-1 px-3 py-1 text-xs">
                  <input
                    type="text"
                    defaultValue={`Search in ${parent.name}...`}
                    className="w-full bg-transparent outline-none text-white placeholder:text-slate-400 text-xs"
                  />
                  <Mic className="w-4 h-4 text-blue-400 hover:text-blue-300 mr-2 flex-shrink-0 cursor-pointer" />
                  <button className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors flex-shrink-0 shadow-md shadow-orange-500/40 cursor-pointer">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Badges */}
            <div className="flex items-center gap-3">
              <Link
                href="/list-business"
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-bold border border-slate-700/80 transition-all"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Free Listing</span>
              </Link>

              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-105"
              >
                <span>Login / Sign Up</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BREADCRUMBS */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-5 pb-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-blue-400 transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-white font-bold">{parent.name}</span>
        </div>
      </div>

      {/* 3. CATEGORY HERO BANNER */}
      <section className="bg-gradient-to-r from-[#0c1427] via-[#111c33] to-[#0c1427] border-y border-slate-800 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden mb-8">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800 px-3 py-1 rounded-full">
              Category Directory • {parent.mode}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-3 text-white">
              {parent.name} in Lucknow
            </h1>
            <p className="text-sm text-slate-300 mt-2">
              {parent.tagline || `Explore top verified ${parent.name.toLowerCase()} in Lucknow with ratings, photos, consultation fees, and emergency contact details.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-[#070b18]/80 border border-slate-800 text-center">
              <span className="text-2xl font-black text-blue-400 block">{subcategories.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Subcategories</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-[#070b18]/80 border border-slate-800 text-center">
              <span className="text-2xl font-black text-emerald-400 block">{vendors.length * 5}+</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Pros</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SUBCATEGORIES DESK ("ander sub caatopiores ka page daalo") */}
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 space-y-12">
        <div className="bg-[#0c1427] rounded-3xl border border-slate-800/80 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-950/80 text-blue-400 border border-blue-800 mb-2">
                <span>Browse Specializations</span>
              </div>
              <h2 className="text-2xl font-black text-white">
                All {parent.name} Specializations &amp; Subcategories
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select your required branch or specialty below to view matching verified doctors, clinics, or service vendors.
              </p>
            </div>
          </div>

          {/* Subcategories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 pt-2">
            {subcategories.map((sub) => {
              const IconComp = getSubIcon(sub.name);
              return (
                <Link
                  key={sub.id}
                  href={`/services/${sub.slug}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#111c33] hover:bg-blue-950/60 border border-slate-800/80 hover:border-blue-500/50 transition-all duration-200 group shadow-md hover:shadow-blue-500/10 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all flex-shrink-0">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {sub.name}
                    </div>
                    {sub.tagline && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{sub.tagline}</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 mt-1 group-hover:translate-x-1 transition-transform">
                      <span>Explore Vendors</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* 5. TOP VERIFIED VENDORS IN THIS CATEGORY ("and then ander vendor rakho") */}
        {vendors.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Featured Recommendations
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  Top Recommended {parent.name} in Lucknow
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Verified providers with highest patient and customer satisfaction ratings.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
              {vendors.map((v) => (
                <div
                  key={v.id}
                  className="bg-[#0c1427] rounded-3xl border border-slate-800/80 p-6 shadow-xl flex flex-col justify-between hover:border-blue-500/40 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-400 border border-blue-800">
                        ✓ Verified Listing
                      </span>
                      <span className="text-amber-400 text-xs font-bold flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{Number(v.averageRating).toFixed(1)} ({v.reviewCount})</span>
                      </span>
                    </div>

                    <Link href={`/biz/${v.locality ? v.locality.toLowerCase() : 'lucknow'}/${v.slug}`}>
                      <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                        {v.businessName}
                      </h4>
                    </Link>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{v.description || v.tagline}</p>

                    <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{v.locality || v.city}, Lucknow</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-slate-800">
                    <a
                      href={`tel:${v.phone}`}
                      className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center flex items-center justify-center gap-1 transition-colors shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </a>
                    <Link
                      href={`/biz/${v.locality ? v.locality.toLowerCase() : 'lucknow'}/${v.slug}`}
                      className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold text-center transition-colors shadow-xs"
                    >
                      360 Profile ↗
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
