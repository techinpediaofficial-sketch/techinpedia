'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Star,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  SlidersHorizontal,
  ThumbsUp,
  Sparkles,
  Zap,
  Tag,
  ArrowRight,
  Check,
  X,
  User,
  Stethoscope,
  Building2,
  Share2,
  Heart
} from 'lucide-react';

export interface VendorDoctor {
  name: string;
  spec?: string;
  timings?: string;
}

export interface VendorCardItem {
  id: string;
  slug: string;
  businessName: string;
  tagline?: string | null;
  phone: string;
  whatsappNumber?: string | null;
  locality?: string | null;
  city: string;
  address?: string | null;
  primaryCategory: string;
  categories: string[];
  averageRating: number;
  ratingCount: number;
  reviewCount: number;
  isVerified: boolean;
  isClaimed: boolean;
  isFeatured: boolean;
  distance: string;
  responseSpeed: string;
  tagSuggestion: string;
  startingPrice?: number | null;
  photos: string[];
  services: Array<{ id: string; title: string; price: number; priceUnit: string }>;
  doctors?: VendorDoctor[];
  timings?: string;
  insurance?: string[];
}

interface Props {
  categorySlug: string;
  categoryName?: string;
  categoryTagline?: string | null;
  initialCity?: string;
  initialVendors: VendorCardItem[];
}

interface CategoryLeadConfig {
  question: string;
  options: string[];
}

function getCategoryLeadConfig(categorySlug: string, categoryTitle: string): CategoryLeadConfig {
  const slug = (categorySlug || '').toLowerCase();
  
  if (slug.includes('eye-hospital') || slug.includes('eye')) {
    return {
      question: 'What eye condition do you need help with?',
      options: ['Vision Correction', 'Eye Disease Treatment', 'Cataract / LASIK Consultation', 'General Eye Checkup']
    };
  }
  if (slug.includes('hospital') || slug.includes('clinic')) {
    return {
      question: 'What medical department or treatment is required?',
      options: ['General OPD Consultation', 'Emergency / Inpatient', 'Surgery / Specialist', 'Diagnostics & Scans']
    };
  }
  if (slug.includes('dentist') || slug.includes('dental')) {
    return {
      question: 'What dental service are you looking for?',
      options: ['Root Canal (RCT)', 'Teeth Cleaning / Whitening', 'Dental Implants / Braces', 'Painless Tooth Extraction']
    };
  }
  if (slug.includes('ac-repair') || slug.includes('ac-') || slug.includes('air-conditioner')) {
    return {
      question: 'Select AC service required:',
      options: ['Deep Jet Foam Cleaning', 'Gas Refill (Cooling Fix)', 'Installation / Uninstallation', 'PCB Circuit & Noise Fix']
    };
  }
  if (slug.includes('electric') || slug.includes('power')) {
    return {
      question: 'Select electrical service required:',
      options: ['Home Rewiring & Fuse Fix', 'MCB / Tripping Repair', 'Appliance Installation', 'Inverter Wiring Setup']
    };
  }
  if (slug.includes('plumb')) {
    return {
      question: 'Select plumbing requirement:',
      options: ['Water Leakage & Seepage', 'Tap & Pipe Fitting', 'Drain Blockage Removal', 'Water Tank / Motor Repair']
    };
  }
  if (slug.includes('clean')) {
    return {
      question: 'Select cleaning requirement:',
      options: ['Full Home Deep Cleaning', 'Kitchen & Bathroom Cleaning', 'Sofa & Carpet Shampooing', 'Disinfection Service']
    };
  }
  if (slug.includes('packer') || slug.includes('mover') || slug.includes('transport')) {
    return {
      question: 'What type of shifting do you need?',
      options: ['Within City Shifting', 'Intercity Relocation', 'Vehicle Transportation', 'Office Relocation']
    };
  }
  if (slug.includes('beauty') || slug.includes('spa') || slug.includes('salon')) {
    return {
      question: 'Select beauty / spa service:',
      options: ['Hair Care & Styling', 'Facial & Skin Treatment', 'Bridal & Party Makeup', 'Body Spa & Massage']
    };
  }
  if (slug.includes('wedding') || slug.includes('event')) {
    return {
      question: 'What event service do you require?',
      options: ['Full Event Planning & Decor', 'Catering & Food Services', 'Photography & Drone', 'Banquet & Venue Booking']
    };
  }
  if (slug.includes('hotel') || slug.includes('resort')) {
    return {
      question: 'What accommodation are you booking?',
      options: ['Standard AC Room', 'Deluxe / Suite', 'Family / Group Stay', 'Conference / Banquet Hall']
    };
  }
  if (slug.includes('restaurant') || slug.includes('food') || slug.includes('cafe')) {
    return {
      question: 'Select dining preference:',
      options: ['Table Reservation', 'Family Dining & Private Party', 'Buffet Special', 'Takeaway & Delivery']
    };
  }
  if (slug.includes('decor') || slug.includes('interior')) {
    return {
      question: 'Select interior / decor service:',
      options: ['Full Home Interior Design', 'Modular Kitchen & Wardrobes', 'Wall Painting & Wallpaper', 'False Ceiling & Lighting']
    };
  }
  if (slug.includes('gym') || slug.includes('fitness')) {
    return {
      question: 'Select membership / training goal:',
      options: ['Weight Loss & Cardio', 'Bodybuilding & Strength', 'Personal Trainer', 'Yoga / Zumba Classes']
    };
  }
  if (slug.includes('estate') || slug.includes('property') || slug.includes('rent')) {
    return {
      question: 'What property service do you need?',
      options: ['Buy Commercial / Residential', 'Rent Flat / Office', 'Sell Property', 'Plot / Land Investment']
    };
  }
  
  return {
    question: `What ${categoryTitle} service do you need?`,
    options: ['Standard Consultation / Booking', 'Emergency / Express Service', 'Get Price Estimates', 'Speak to Expert']
  };
}

export default function UrbanDirectoryListingView({
  categorySlug,
  categoryName,
  categoryTagline,
  initialCity = 'lucknow',
  initialVendors,
}: Props) {
  const [vendors, setVendors] = useState<VendorCardItem[]>(initialVendors);
  const [city, setCity] = useState(initialCity);
  const [locality, setLocality] = useState('Mathur Lane');

  const categoryTitle = categoryName || categorySlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const leadConfig = getCategoryLeadConfig(categorySlug, categoryTitle);

  // Filters
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'new'>('rating');
  const [filterTopRated, setFilterTopRated] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterQuickResponse, setFilterQuickResponse] = useState(false);
  const [filterInsurance, setFilterInsurance] = useState(false);

  // Active photo indices per vendor card
  const [photoIndexMap, setPhotoIndexMap] = useState<Record<string, number>>({});

  // Dynamic Right-Rail & Modal Lead State (Screenshot 4)
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    phone: '',
    selectedOption: leadConfig.options[0] || 'Standard Service',
    agreeTerms: true,
  });
  const [targetVendor, setTargetVendor] = useState<string | null>(null);
  const [sendingLead, setSendingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  // Handle carousel next/prev
  const handleNextPhoto = (vendorId: string, max: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndexMap((prev) => ({
      ...prev,
      [vendorId]: ((prev[vendorId] || 0) + 1) % max,
    }));
  };

  const handlePrevPhoto = (vendorId: string, max: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndexMap((prev) => ({
      ...prev,
      [vendorId]: ((prev[vendorId] || 0) - 1 + max) % max,
    }));
  };

  // Submit Lead directly to Central CRM
  const handleLeadSubmit = async (e: React.FormEvent, specificVendorName?: string) => {
    e.preventDefault();
    if (!enquiryForm.name.trim() || !enquiryForm.phone.trim()) {
      alert('Please enter your Name and Mobile Number.');
      return;
    }

    setSendingLead(true);
    const chosenVendor = specificVendorName || targetVendor || 'Top Verified Matches in Category';

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: enquiryForm.name,
          phone: enquiryForm.phone,
          email: `${enquiryForm.phone.replace(/[^0-9]/g, '')}@lead.techinpedia.com`,
          service: categoryTitle,
          projectType: 'MARKETPLACE_REQUIREMENT',
          budget: 'Market Standard',
          source: specificVendorName ? `Direct Vendor: ${specificVendorName}` : `Urban Directory Box: ${categoryTitle}`,
          message: `Category: ${categoryTitle}\nRequirement / Condition: ${enquiryForm.selectedOption}\nTarget Vendor: ${chosenVendor}\nLocality: ${locality}, ${city.toUpperCase()}`,
        }),
      });

      if (res.ok) {
        setLeadSuccess(true);
        setTimeout(() => {
          setLeadSuccess(false);
          setTargetVendor(null);
        }, 5000);
      } else {
        alert('Could not submit enquiry. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error submitting enquiry.');
    } finally {
      setSendingLead(false);
    }
  };

  // Filtered and Sorted Vendors
  const displayedVendors = vendors
    .filter((v) => {
      if (filterVerified && !v.isVerified) return false;
      if (filterTopRated && v.averageRating < 4.8) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.averageRating - a.averageRating;
      if (sortBy === 'name') return a.businessName.localeCompare(b.businessName);
      return 0;
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
                  <span className="truncate">{locality}, {city.toUpperCase()}</span>
                </Link>
                <div className="flex items-center flex-1 px-3 py-1 text-xs">
                  <input
                    type="text"
                    defaultValue={`${categoryTitle} Near ${locality}`}
                    className="w-full bg-transparent outline-none text-white placeholder:text-slate-400 text-xs"
                  />
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

      {/* 2. BREADCRUMBS & JUSTDIAL LISTING TITLE */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-5 pb-3">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 overflow-x-auto whitespace-nowrap mb-2">
          <Link href="/" className="hover:text-blue-400 capitalize transition-colors">{city}</Link>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <Link href={`/category/${categorySlug}`} className="hover:text-blue-400 capitalize transition-colors">{categoryTitle} in {city}</Link>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="capitalize text-slate-300">{categoryTitle} in {locality}</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="font-bold text-blue-400">{displayedVendors.length * 5}+ Listings</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Best {categoryTitle} in {locality}, {city.toUpperCase()} – Book Appointment Online
        </h1>
        {categoryTagline && (
          <p className="text-xs text-slate-400 mt-1">
            {categoryTagline}
          </p>
        )}
      </div>

      {/* 3. FILTER PILLS BAR */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pb-5">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 text-xs font-bold scrollbar-none">
          {/* Sort By Dropdown */}
          <div className="relative flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2 rounded-xl border border-slate-800 bg-[#111c33] text-slate-200 text-xs font-semibold outline-none cursor-pointer hover:border-slate-700 transition-colors"
            >
              <option value="rating">Sort by: Top Rated</option>
              <option value="name">Sort by: Name (A-Z)</option>
              <option value="new">Sort by: Newly Listed</option>
            </select>
          </div>

          <button
            onClick={() => {
              setTargetVendor(null);
              const el = document.getElementById('enquiry-form-card');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex-shrink-0 shadow-md shadow-blue-600/20 cursor-pointer"
          >
            Book Appointment
          </button>

          <button
            onClick={() => setFilterInsurance(!filterInsurance)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${
              filterInsurance
                ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                : 'border-slate-800 bg-[#111c33] text-slate-300 hover:border-slate-700'
            }`}
          >
            <span>Insurance Accepted</span>
          </button>

          <button
            onClick={() => setFilterTopRated(!filterTopRated)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${
              filterTopRated
                ? 'border-amber-400 bg-amber-950/60 text-amber-300 font-bold'
                : 'border-slate-800 bg-[#111c33] text-slate-300 hover:border-slate-700'
            }`}
          >
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>Top Rated</span>
          </button>

          <button
            onClick={() => setFilterQuickResponse(!filterQuickResponse)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${
              filterQuickResponse
                ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300 font-bold'
                : 'border-slate-800 bg-[#111c33] text-slate-300 hover:border-slate-700'
            }`}
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Quick Response</span>
          </button>

          <button
            onClick={() => setFilterVerified(!filterVerified)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${
              filterVerified
                ? 'border-blue-400 bg-blue-950/60 text-blue-300 font-bold'
                : 'border-slate-800 bg-[#111c33] text-slate-300 hover:border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            <span>Verified Partner</span>
          </button>

          <span className="px-3.5 py-2 rounded-xl border border-slate-800 bg-[#111c33] text-slate-300 text-xs font-semibold flex items-center gap-1 flex-shrink-0">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Buyer Protection</span>
          </span>
        </div>
      </div>

      {/* 4. MAIN SPLIT: VENDORS LIST (LEFT 8 COLS) & STICKY DYNAMIC LEAD FORM (RIGHT 4 COLS) */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 8 COLS: VENDOR CARDS */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-8 space-y-4">
            {displayedVendors.length === 0 ? (
              <div className="bg-[#0c1427] rounded-3xl border border-slate-800 p-12 text-center shadow-xl">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No listings found matching current filters</h3>
                <p className="text-xs text-slate-400 mt-1">Try resetting the filters or searching for other nearby localities.</p>
                <button
                  onClick={() => {
                    setFilterTopRated(false);
                    setFilterVerified(false);
                    setFilterQuickResponse(false);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer hover:bg-blue-500 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              displayedVendors.map((vendor) => {
                const photos = vendor.photos.length > 0
                  ? vendor.photos
                  : ['https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80'];
                const currentPhotoIndex = photoIndexMap[vendor.id] || 0;

                return (
                  <div
                    key={vendor.id}
                    className="bg-[#0c1427] rounded-3xl border border-slate-800/80 hover:border-blue-500/50 p-5 shadow-xl transition-all flex flex-col sm:flex-row gap-5 group"
                  >
                    {/* Photo Carousel */}
                    <div className="relative w-full sm:w-56 h-48 sm:h-auto rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0 group/photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photos[currentPhotoIndex]}
                        alt={vendor.businessName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-105"
                      />

                      {photos.length > 1 && (
                        <>
                          <button
                            onClick={(e) => handlePrevPhoto(vendor.id, photos.length, e)}
                            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/80 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleNextPhoto(vendor.id, photos.length, e)}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/80 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[10px] font-bold">
                        {currentPhotoIndex + 1}/{photos.length}
                      </div>
                    </div>

                    {/* Vendor Details */}
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        {/* Title + Verified & Popular Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                            <ThumbsUp className="w-3 h-3 fill-white" />
                          </div>
                          <Link
                            href={`/biz/${vendor.city.split(',')[0].trim().toLowerCase()}/${vendor.slug}`}
                            className="text-base sm:text-lg font-black text-white hover:text-blue-400 transition-colors"
                          >
                            {vendor.businessName}
                          </Link>
                        </div>

                        {/* Rating + Top Search pill */}
                        <div className="flex items-center gap-2 mt-1.5 text-xs flex-wrap">
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-extrabold bg-emerald-600 text-white text-[11px]">
                            <span>{vendor.averageRating.toFixed(1)}</span>
                            <Star className="w-3 h-3 fill-white" />
                          </span>

                          <span className="font-bold text-slate-300 text-xs">
                            {vendor.ratingCount} Ratings
                          </span>

                          {vendor.isFeatured && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800">
                              Popular
                            </span>
                          )}

                          {vendor.isVerified && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-400 border border-blue-800">
                              ✓ Verified
                            </span>
                          )}
                        </div>

                        {/* Address & Working Hours */}
                        <div className="text-xs text-slate-400 mt-2 space-y-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span className="truncate">
                              {vendor.address || `${vendor.locality}, ${vendor.city}`} • <strong>{vendor.distance}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <span className="text-emerald-400 font-bold">Open 24 Hrs</span>
                            <span>•</span>
                            <span>{vendor.tagline || `${vendor.responseSpeed}`}</span>
                          </div>
                        </div>

                        {/* DOCTOR / SPECIALIST PREVIEW CHIPS */}
                        {vendor.doctors && vendor.doctors.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-slate-800">
                            {vendor.doctors.slice(0, 2).map((doc, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#111c33] border border-slate-800 text-[11px]"
                              >
                                <div className="w-5 h-5 rounded-full bg-blue-950 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                                  {doc.name.charAt(0)}
                                </div>
                                <div className="truncate max-w-[170px]">
                                  <div className="font-bold text-white truncate">{doc.name}</div>
                                  <div className="text-[10px] text-slate-400 truncate">{doc.spec || doc.timings}</div>
                                </div>
                              </div>
                            ))}
                            {vendor.doctors.length > 2 && (
                              <span className="text-[10px] font-bold text-blue-400 hover:underline cursor-pointer">
                                +{vendor.doctors.length - 2} More
                              </span>
                            )}
                          </div>
                        )}

                        {/* Service / Rate Card Tags */}
                        {vendor.services.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {vendor.services.slice(0, 3).map((s) => (
                              <span
                                key={s.id}
                                className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#111c33] border border-slate-800 text-slate-300"
                              >
                                {s.title} {s.price > 0 ? `(₹${s.price})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* CTAs Bar */}
                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800">
                        {/* Call Button */}
                        <a
                          href={`tel:${vendor.phone}`}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{vendor.phone}</span>
                        </a>

                        {/* WhatsApp Button */}
                        <a
                          href={`https://wa.me/${(vendor.whatsappNumber || vendor.phone).replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(vendor.businessName)}%2C%20I%20found%20you%20on%20UrbanMarket%20and%20would%20like%20to%20enquire%20about%20${encodeURIComponent(categoryTitle)}%20services.`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl border border-emerald-800 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Send Enquiry Button */}
                        <button
                          onClick={() => {
                            setTargetVendor(vendor.businessName);
                            const el = document.getElementById('enquiry-form-card');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Send Enquiry</span>
                        </button>

                        <Link
                          href={`/biz/${vendor.city.split(',')[0].trim().toLowerCase()}/${vendor.slug}`}
                          className="px-3 py-2 rounded-xl border border-slate-800 bg-[#111c33] text-xs font-semibold text-slate-300 hover:border-blue-500/50 hover:text-white transition-colors ml-auto"
                        >
                          View 360 Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT RAIL: STICKY DYNAMIC LEAD FORM (4 COLS) */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div
              id="enquiry-form-card"
              className="bg-[#0c1427] rounded-3xl border-2 border-blue-500/40 p-6 shadow-2xl space-y-4"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded-md">
                  Free Quote &amp; Direct Contact
                </span>
                <h3 className="text-base font-black text-white mt-1.5">
                  Get the List of Top <span className="text-blue-400">{categoryTitle}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  We&#39;ll send you contact details in seconds for free.
                </p>
              </div>

              {targetVendor && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-950/60 border border-blue-800 text-xs">
                  <div className="truncate">
                    <span className="text-slate-400 text-[11px]">Enquiring to: </span>
                    <strong className="text-blue-300">{targetVendor}</strong>
                  </div>
                  <button
                    onClick={() => setTargetVendor(null)}
                    className="text-slate-400 hover:text-white ml-2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {leadSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 mx-auto flex items-center justify-center shadow-inner">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-sm font-black text-white">Enquiry Sent Successfully!</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Verified {categoryTitle.toLowerCase()} experts in {locality} have received your details and will call you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={(e) => handleLeadSubmit(e, targetVendor || undefined)} className="space-y-4">
                  {/* Dynamic Category Tailored Question */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-200">
                      {leadConfig.question}
                    </label>
                    <div className="space-y-1.5">
                      {leadConfig.options.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                            enquiryForm.selectedOption === opt
                              ? 'border-blue-500 bg-blue-950/60 text-blue-200 font-semibold'
                              : 'border-slate-800 hover:bg-[#111c33] text-slate-300 bg-[#070b18]/60'
                          }`}
                        >
                          <input
                            type="radio"
                            name="categoryLeadOption"
                            checked={enquiryForm.selectedOption === opt}
                            onChange={() => setEnquiryForm({ ...enquiryForm, selectedOption: opt })}
                            className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Name Input */}
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={enquiryForm.name}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                      placeholder="Name *"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#111c33] text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                    />
                  </div>

                  {/* Mobile Input */}
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={enquiryForm.phone}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                      placeholder="Mobile Number *"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#111c33] text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                    />
                  </div>

                  {/* Terms & Privacy */}
                  <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-400">
                    <input
                      type="checkbox"
                      checked={enquiryForm.agreeTerms}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, agreeTerms: e.target.checked })}
                      className="mt-0.5 rounded text-blue-600"
                    />
                    <span>I Agree to T&C&#39;s Privacy Policy</span>
                  </div>

                  {/* CTA Submit Button */}
                  <button
                    type="submit"
                    disabled={sendingLead || !enquiryForm.agreeTerms}
                    className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs transition-all shadow-md shadow-orange-500/25 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{sendingLead ? 'Sending Enquiry...' : 'Send Enquiry >>>'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* CUSTOMERS "TOP PICKS" */}
            <div className="bg-[#0c1427] rounded-3xl border border-slate-800/80 p-6 shadow-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-white">
                <ThumbsUp className="w-4 h-4 text-blue-400" />
                <span>Customers &#34;Top Picks&#34;</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Top rated {categoryTitle.toLowerCase()} in {locality}, {city.toUpperCase()}
              </p>

              <div className="space-y-2.5 pt-2">
                {displayedVendors.slice(0, 3).map((v) => (
                  <Link
                    key={v.id}
                    href={`/biz/${v.city.split(',')[0].trim().toLowerCase()}/${v.slug}`}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#111c33] border border-slate-800 hover:border-blue-500/40 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={v.photos[0] || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=400&q=80'}
                        alt={v.businessName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                        {v.businessName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                        <span className="font-bold text-emerald-400">{v.averageRating.toFixed(1)} ★</span>
                        <span>•</span>
                        <span className="truncate">{v.locality || v.city}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
