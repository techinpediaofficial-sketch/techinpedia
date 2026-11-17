'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Briefcase,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Star,
  CheckCircle2,
  Wrench,
  Package,
  Zap,
  PhoneCall,
  Clock,
  Sparkles,
  Users,
  ChevronDown,
  Building2,
  Cpu,
  Truck,
  Layers,
  Award,
  TrendingUp,
  FileCheck2,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  UtensilsCrossed,
  Building,
  Compass,
  HeartHandshake,
  GraduationCap,
  Key,
  HardHat,
  Dog,
  Bed,
  Activity,
  Dumbbell,
  Wallet,
  CalendarCheck,
  Car,
  Plane,
  Bus,
  Train,
  Mic,
  ChevronRight,
  Eye,
  Stethoscope,
  Smile,
  X,
  Navigation,
  Check,
  Home
} from 'lucide-react';
import PostRequirementModal from './PostRequirementModal';

const POPULAR_CITIES = [
  'Lucknow',
  'Delhi NCR',
  'Noida',
  'Gurgaon / Gurugram',
  'Mumbai',
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Kolkata',
  'Ahmedabad',
];

const LOCALITY_PRESETS: Record<string, string[]> = {
  Lucknow: [
    'Mathur Lane',
    'Hazratganj',
    'Gomti Nagar',
    'Aliganj',
    'Indira Nagar',
    'Lucknow Chowk',
    'Vikas Nagar',
    'Mahanagar',
    'Aminabad',
    'Transport Nagar',
    'Charbagh',
  ],
  'Delhi NCR': [
    'Connaught Place',
    'South Extension',
    'Noida Sector 18',
    'Cyber City Gurgaon',
    'Indirapuram',
    'Dwarka',
    'Lajpat Nagar',
    'Karol Bagh',
  ],
  Mumbai: [
    'Andheri West',
    'Bandra West',
    'Colaba',
    'Powai',
    'Borivali',
    'Dadar',
  ],
  Bengaluru: [
    'Koramangala',
    'Indiranagar',
    'Whitefield',
    'HSR Layout',
    'Jayanagar',
  ],
};

const ROUND_CATEGORY_ICONS: Record<string, any> = {
  hospitals: Building2,
  'repairs-services': Wrench,
  'real-estate': Building,
  'b2b-industrial': Package,
  restaurants: UtensilsCrossed,
  hotels: Building,
  'beauty-spa': Sparkles,
  'home-decor': Home,
  astrology: Compass,
  'wedding-planning': HeartHandshake,
  education: GraduationCap,
  'rent-and-hire': Key,
  contractors: HardHat,
  'pet-shops': Dog,
  'pg-hostels': Bed,
  'estate-agents': Briefcase,
  dentists: Activity,
  gym: Dumbbell,
  loans: Wallet,
  'event-organisers': CalendarCheck,
  'driving-schools': Car,
  'packers-and-movers': Truck,
  'ac-repair-services': Wrench,
  'eye-hospitals': Eye,
};

interface SubCategoryItem {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  tagline: string;
}

interface DynamicCategory {
  id: string;
  name: string;
  slug: string;
  mode: string;
  parentId?: string | null;
  tagline: string;
  iconName: string;
  popularItems: string[];
  displayOrder: number;
  count: string;
  vendorCount: number;
  subcategories?: SubCategoryItem[];
}

interface SpotlightVendor {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  category: string;
  city: string;
  rating: number;
  reviews: number;
  badge: string;
  phone: string;
  whatsappNumber?: string | null;
  distance: string;
  responseSpeed: string;
  image: string;
  services: Array<{ title: string; price: number; unit: string }>;
}

export default function UrbanMarketplaceShell() {
  // DYNAMIC LOCATION STATE
  const [selectedCity, setSelectedCity] = useState('Lucknow');
  const [locality, setLocality] = useState('Mathur Lane');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [localitySearchInput, setLocalitySearchInput] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);

  // SEARCH & REQUIREMENT STATE
  const [activeMode, setActiveMode] = useState<'B2C' | 'B2B'>('B2C');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('');

  // 100% Dynamic Database State (Zero Hardcoding)
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [spotlightVendors, setSpotlightVendors] = useState<SpotlightVendor[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Initialize location from localStorage if saved
  useEffect(() => {
    try {
      const saved = localStorage.getItem('urban_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.city) setSelectedCity(parsed.city);
        if (parsed.locality) setLocality(parsed.locality);
      }
    } catch {}
  }, []);

  // Fetch dynamic categories and spotlight vendors when city changes
  useEffect(() => {
    async function loadMarketplaceData() {
      try {
        setLoadingData(true);
        const [catRes, spotRes] = await Promise.all([
          fetch(`/api/marketplace/categories?city=${encodeURIComponent(selectedCity)}`),
          fetch(`/api/marketplace/spotlight?city=${encodeURIComponent(selectedCity)}`),
        ]);
        const catData = await catRes.json();
        const spotData = await spotRes.json();

        if (catData.success && Array.isArray(catData.categories)) {
          setCategories(catData.categories);
        }
        if (spotData.success && Array.isArray(spotData.vendors)) {
          setSpotlightVendors(spotData.vendors);
        }
      } catch (err) {
        console.error('Failed to load dynamic marketplace data:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadMarketplaceData();
  }, [selectedCity]);

  // Handle Location Change
  const updateLocation = (newLocality: string, newCity: string) => {
    setLocality(newLocality);
    setSelectedCity(newCity);
    setIsLocationModalOpen(false);
    try {
      localStorage.setItem('urban_location', JSON.stringify({ locality: newLocality, city: newCity }));
    } catch {}
  };

  // GPS Auto Detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectingGps(false);
        // Default to Lucknow or detected city
        updateLocation('Current Location (GPS)', selectedCity);
      },
      (err) => {
        setDetectingGps(false);
        alert('Could not access GPS. Please choose your city/locality from the list.');
      },
      { timeout: 8000 }
    );
  };

  const openRequirementModal = (catName?: string, mode?: 'B2C' | 'B2B') => {
    if (mode) setActiveMode(mode);
    setModalCategory(catName || '');
    setModalOpen(true);
  };

  // Major 4 Parent Categories with Subcategories (100% Database Driven)
  const majorCategories = categories.filter(
    (c) => !c.parentId && Array.isArray(c.subcategories) && c.subcategories.length > 0
  );

  // Quick Locality Presets
  const currentCityLocalities = LOCALITY_PRESETS[selectedCity] || LOCALITY_PRESETS['Lucknow'];

  return (
    <div className="min-h-screen bg-[#070b18] text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-20">
      {/* 1. TOP HEADER (Screenshot 1) */}
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

            {/* DYNAMIC SMART SEARCH BAR WITH INTERACTIVE LOCATION SELECTOR (Screenshot 1) */}
            <div className="hidden lg:flex items-center flex-1 max-w-2xl mx-4">
              <div className="flex items-center w-full border border-slate-700/80 rounded-full overflow-hidden bg-[#0c1427] shadow-inner hover:border-slate-600 transition-colors p-1">
                {/* Dynamic Location Button -> Opens Interactive Modal */}
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 border-r border-slate-700/80 text-xs font-bold text-white w-56 flex-shrink-0 hover:text-orange-400 transition-colors text-left cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{locality}, {selectedCity}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto flex-shrink-0" />
                </button>

                {/* Query Input */}
                <div className="flex items-center flex-1 px-3 py-1 text-xs">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search for Hospitals, Doctors, AC Repair, Hotels...`}
                    className="w-full bg-transparent outline-none text-white placeholder:text-slate-400 text-xs"
                  />
                  <Mic className="w-4 h-4 text-blue-400 hover:text-blue-300 mr-2 flex-shrink-0 cursor-pointer" />
                  <button
                    onClick={() => openRequirementModal(searchQuery, activeMode)}
                    className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors flex-shrink-0 shadow-md shadow-orange-500/40 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Badges matching Screenshot 1 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => openRequirementModal('', activeMode)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-amber-400 text-xs font-bold border border-slate-700/80 transition-all cursor-pointer"
              >
                <span>⚡ Leads</span>
              </button>

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

      {/* 2. JUSTDIAL HERO BANNER & 4 DISCOVERY CARDS WITH REAL IMAGERY (Screenshot 2 Fix) */}
      <section className="pt-6 pb-10 w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Main Hero Card (7 cols) - Dark chocolate & amber styling matching Screenshot 2 */}
          <div className="lg:col-span-7 rounded-3xl bg-gradient-to-r from-[#22140f] via-[#2e1811] to-[#1c0d08] border border-amber-900/40 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden min-h-[310px] shadow-2xl">
            <div className="relative z-10 max-w-md">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 border border-amber-500/40 px-3.5 py-1 rounded-full">
                Zero Commission Marketplace
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mt-4 text-white leading-tight">
                Search, compare prices &amp;<br className="hidden sm:inline" /> book verified experts
              </h2>
              <p className="text-xs sm:text-sm text-amber-200/80 mt-3 font-medium max-w-md">
                Hospitals, eye specialists, AC repairs, dentists &amp; contractors with authentic rate cards and photos.
              </p>
            </div>

            <div className="relative z-10 mt-6 flex items-center gap-3">
              <button
                onClick={() => openRequirementModal('', activeMode)}
                className="px-7 py-3 rounded-full bg-[#ff9900] hover:bg-[#ffaa00] text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/30 hover:scale-105 cursor-pointer"
              >
                GET BEST DEALS
              </button>
              <div className="flex gap-1.5 ml-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff9900] shadow-xs shadow-orange-500"></span>
                <span className="w-2 h-2 rounded-full bg-white/40"></span>
                <span className="w-2 h-2 rounded-full bg-white/40"></span>
              </div>
            </div>

            {/* Seamless Bedroom Background Photo matching Screenshot 2 */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=700&q=80"
                alt="Hotel deals"
                className="w-full h-full object-cover object-center opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#22140f] via-[#22140f]/60 to-transparent" />
            </div>
          </div>

          {/* 4 Quick Category Cards (Screenshot 2 Fix - Real Photography with Vibrant Gradient Overlays) */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
            {/* Card 1: B2B Quick Quotes (Warehouse / Logistics photo) */}
            <div
              onClick={() => openRequirementModal('B2B Industrial & Wholesale', 'B2B')}
              className="rounded-3xl relative overflow-hidden flex flex-col justify-between p-4.5 min-h-[310px] shadow-xl hover:scale-[1.03] transition-all cursor-pointer group border border-blue-500/30"
            >
              {/* Background Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80"
                alt="B2B Wholesale"
                className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#091538]/95 via-[#0e2154]/70 to-[#122e70]/50" />

              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">B2B</span>
                <h4 className="text-base sm:text-lg font-black text-white mt-1 leading-snug drop-shadow-sm">Quick Quotes</h4>
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-bold text-white/90">Suppliers</span>
                <div className="w-7 h-7 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shadow-md">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Card 2: REPAIRS Nearest Vendor (Technician photo) */}
            <Link
              href="/category/repairs-services"
              className="rounded-3xl relative overflow-hidden flex flex-col justify-between p-4.5 min-h-[310px] shadow-xl hover:scale-[1.03] transition-all group border border-indigo-500/30"
            >
              {/* Background Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80"
                alt="Repairs"
                className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#130f38]/95 via-[#1e1754]/70 to-[#2c2075]/50" />

              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">REPAIRS</span>
                <h4 className="text-base sm:text-lg font-black text-white mt-1 leading-snug drop-shadow-sm">Nearest Vendor</h4>
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-bold text-white/90">Doorstep</span>
                <div className="w-7 h-7 rounded-full bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shadow-md">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Card 3: ESTATE Finest Agents (Modern Architecture photo) */}
            <Link
              href="/category/real-estate"
              className="rounded-3xl relative overflow-hidden flex flex-col justify-between p-4.5 min-h-[310px] shadow-xl hover:scale-[1.03] transition-all group border border-purple-500/30"
            >
              {/* Background Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80"
                alt="Real Estate"
                className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#200438]/95 via-[#310854]/70 to-[#470f78]/50" />

              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">ESTATE</span>
                <h4 className="text-base sm:text-lg font-black text-white mt-1 leading-snug drop-shadow-sm">Finest Agents</h4>
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-bold text-white/90">{selectedCity}</span>
                <div className="w-7 h-7 rounded-full bg-purple-600 group-hover:bg-purple-500 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shadow-md">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Card 4: DOCTORS Book Now (Doctor with stethoscope photo) */}
            <Link
              href="/category/hospitals"
              className="rounded-3xl relative overflow-hidden flex flex-col justify-between p-4.5 min-h-[310px] shadow-xl hover:scale-[1.03] transition-all group border border-emerald-500/30"
            >
              {/* Background Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80"
                alt="Doctors"
                className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#021f17]/95 via-[#043326]/70 to-[#074d3a]/50" />

              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">DOCTORS</span>
                <h4 className="text-base sm:text-lg font-black text-white mt-1 leading-snug drop-shadow-sm">Book Now</h4>
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-bold text-white/90">Hospitals</span>
                <div className="w-7 h-7 rounded-full bg-emerald-600 group-hover:bg-emerald-500 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shadow-md">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>


      {/* 3. POPULAR SERVICES & CATEGORIES (Clean Justdial Icon Grid - "vcataoreis me sirf icon rakho") */}
      <section className="py-8 w-full px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-950/80 text-blue-400 border border-blue-800 mb-1.5">
              <span>Directory Categories</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              Popular Services &amp; Categories
            </h3>
            <p className="text-xs text-slate-400">
              Select any category to view specialized subcategories, doctors, rate cards &amp; verified vendors in {locality}, {selectedCity}.
            </p>
          </div>
        </div>

        {loadingData ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            Loading categories from database...
          </div>
        ) : (
          <div className="bg-[#0c1427] rounded-3xl border border-slate-800/80 p-6 sm:p-8 shadow-xl">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-4 sm:gap-6">
              {categories
                .filter((c) => !c.parentId)
                .map((cat) => {
                  const IconComp = ROUND_CATEGORY_ICONS[cat.slug] || Building2;
                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      className="flex flex-col items-center group text-center cursor-pointer"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#111c33] border border-slate-800/90 hover:border-blue-500/60 group-hover:bg-blue-950/40 text-blue-400 group-hover:text-blue-300 flex items-center justify-center group-hover:scale-110 shadow-lg group-hover:shadow-blue-500/10 transition-all duration-300">
                        <IconComp className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors line-clamp-2 mt-2.5 leading-snug max-w-[100px]">
                        {cat.name}
                      </span>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}
      </section>

      {/* 4. TRAVEL BOOKINGS & TRENDING SEARCHES NEAR YOU (Screenshot 2 Reference) */}
      <section className="py-8 w-full px-4 sm:px-6 lg:px-8 xl:px-12 space-y-6">
        {/* Travel Bookings Box */}
        <div className="rounded-3xl bg-[#0c1427] border border-slate-800/80 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <div>
              <h3 className="text-lg font-black text-white">Travel Bookings</h3>
              <p className="text-xs text-slate-400">Instant ticket bookings and rental fleet for your best travel experience</p>
            </div>
            <Link href="/services/rent-and-hire" className="text-xs font-bold text-blue-400 hover:underline">
              Explore More ↗
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            {[
              { title: 'Flight', subtitle: 'Powered by Techinpedia', icon: Plane, link: '/services/rent-and-hire' },
              { title: 'Bus', subtitle: 'Affordable Rides', icon: Bus, link: '/services/rent-and-hire' },
              { title: 'Train', subtitle: 'Ticket Updates', icon: Train, link: '/services/rent-and-hire' },
              { title: 'Hotel', subtitle: 'Budget-friendly Stay', icon: Building, link: '/services/hotels' },
              { title: 'Car Rentals', subtitle: 'Drive Easy Anywhere', icon: Car, link: '/services/rent-and-hire' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href={item.link}
                  className="p-4 rounded-2xl bg-[#111c33] border border-slate-800/80 hover:border-blue-500/50 transition-all flex flex-col items-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-950/80 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{item.title}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.subtitle}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Trending Searches Near You (Screenshot 2 Reference) */}
        <div className="rounded-3xl bg-[#0c1427] border border-slate-800/80 p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-lg font-black text-white">Trending Searches Near {locality}</h3>
            <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
              NEW
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Eye Hospitals & LASIK',
                slug: 'eye-hospitals',
                image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=400&q=80',
              },
              {
                title: 'Multispeciality Hospitals',
                slug: 'multispeciality-hospitals',
                image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80',
              },
              {
                title: 'AC Jet Cleaning & Gas Refill',
                slug: 'ac-repair-services',
                image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
              },
              {
                title: 'Super-Speciality Dentists',
                slug: 'dental-hospitals',
                image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80',
              },
            ].map((t, idx) => (
              <Link
                key={idx}
                href={`/services/${t.slug}`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#111c33] border border-slate-800/80 hover:border-blue-500/50 transition-all group"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.image}
                    alt={t.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                    {t.title}
                  </h4>
                  <span className="text-[11px] font-bold text-blue-400 mt-1 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Explore</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SPOTLIGHT VERIFIED VENDORS FROM DATABASE */}
      <section className="py-12 bg-[#070b18] border-t border-slate-800/80">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                100% Database-Driven
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                Top Rated Verified Vendors in {selectedCity}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Audited pricing, original rate cards, emergency response speeds, and verified customer reviews.
              </p>
            </div>

            <Link
              href="/category/hospitals"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View All Listings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingData ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
              Loading verified vendors from database...
            </div>
          ) : spotlightVendors.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No vendors found for {selectedCity}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
              {spotlightVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="rounded-3xl bg-[#0c1427] border border-slate-800/80 hover:border-blue-500/40 p-5 transition-all shadow-xl flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-800 mb-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={vendor.image}
                        alt={vendor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-xs">
                        {vendor.badge}
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[11px] font-bold">
                        ★ {vendor.rating.toFixed(1)} ({vendor.reviews})
                      </div>
                    </div>

                    <Link href={`/biz/${vendor.city.split(',')[0].trim()}/${vendor.slug}`}>
                      <h4 className="text-base font-bold text-white hover:text-blue-400 transition-colors">
                        {vendor.name}
                      </h4>
                    </Link>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {vendor.tagline || vendor.category}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{vendor.city} • {vendor.distance}</span>
                    </div>

                    {vendor.services.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-1">
                        {vendor.services.slice(0, 2).map((s, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] text-slate-300">
                            <span className="truncate">{s.title}</span>
                            <span className="font-bold text-emerald-400 ml-2">₹{s.price}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center gap-2">
                    <a
                      href={`tel:${vendor.phone}`}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>

                    <Link
                      href={`/biz/${vendor.city.split(',')[0].trim()}/${vendor.slug}`}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center shadow-xs transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* DYNAMIC LOCATION MODAL (Addresses Screenshot 1) */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c1427] rounded-3xl border border-slate-800 w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-black text-white">Select Location</h3>
              </div>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* GPS Auto-Detect Button */}
            <button
              onClick={handleDetectGps}
              disabled={detectingGps}
              className="w-full py-3 px-4 rounded-2xl bg-blue-950/60 border border-blue-800 text-blue-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-900/60 transition-colors cursor-pointer"
            >
              <Navigation className={`w-4 h-4 ${detectingGps ? 'animate-spin' : ''}`} />
              <span>{detectingGps ? 'Detecting Your Location...' : 'Detect My Exact Location (GPS)'}</span>
            </button>

            {/* Manual Locality / Area Search */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Search Area, Locality or Colony:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={localitySearchInput}
                  onChange={(e) => setLocalitySearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && localitySearchInput.trim()) {
                      updateLocation(localitySearchInput.trim(), selectedCity);
                    }
                  }}
                  placeholder="e.g. Hazratganj, Gomti Nagar, Aliganj..."
                  className="w-full pl-9 pr-20 py-2.5 rounded-xl border border-slate-800 bg-[#111c33] text-xs text-white outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                />
                {localitySearchInput.trim() && (
                  <button
                    onClick={() => updateLocation(localitySearchInput.trim(), selectedCity)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px]"
                  >
                    Select
                  </button>
                )}
              </div>
            </div>

            {/* Popular Localities in Selected City */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Popular Localities in {selectedCity}:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {currentCityLocalities.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => updateLocation(loc, selectedCity)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      locality === loc
                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                        : 'bg-[#111c33] text-slate-300 border-slate-800 hover:border-blue-400'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Indian Cities */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Change City:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      const defaultLoc = LOCALITY_PRESETS[c]?.[0] || 'Main Area';
                      updateLocation(defaultLoc, c);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selectedCity === c
                        ? 'bg-orange-500 text-white border-orange-500 font-bold'
                        : 'bg-[#111c33] text-slate-300 border-slate-800 hover:border-orange-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requirement Modal */}
      <PostRequirementModal
        isOpen={modalOpen}
        initialCategory={modalCategory}
        initialMode={activeMode}
        defaultCity={selectedCity}
        onClose={() => setModalOpen(false)}
      />

    </div>
  );
}
