'use client';

import React, { useState } from 'react';
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
  Share2,
  ChevronLeft,
  Search,
  Upload,
  Sparkles,
  Send,
  Copy,
  Navigation,
  ThumbsUp,
  X,
  Video,
  Check,
  Building2
} from 'lucide-react';

interface VendorMedia {
  id: string;
  mediaType: string;
  sourceCategory: string;
  url: string;
  thumbnailUrl?: string | null;
  title?: string | null;
  displayOrder: number;
}

interface VendorService {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  priceUnit: string;
  duration?: string | null;
  imageUrl?: string | null;
  isPopular: boolean;
}

interface VendorReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  tags: string[];
  ownerReply?: string | null;
  createdAt: string;
}

interface VendorData {
  id: string;
  slug: string;
  businessName: string;
  tagline?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  ownerName?: string | null;
  phone: string;
  whatsappNumber?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  locality?: string | null;
  city: string;
  state?: string | null;
  pincode?: string | null;
  establishmentYear?: number | null;
  businessType: string;
  primaryCategory: string;
  categories: string[];
  openingHours?: Record<string, string> | null;
  quickInfo?: any;
  gstin?: string | null;
  isClaimed: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  averageRating: number;
  ratingCount: number;
  reviewCount: number;
  media: VendorMedia[];
  services: VendorService[];
  reviews: VendorReview[];
}

interface Props {
  initialVendor: VendorData;
  initialRelatedVendors: any[];
}

export default function Vendor360ClientView({
  initialVendor,
}: Props) {
  const [vendor] = useState<VendorData>(initialVendor);
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'pricing' | 'quickinfo' | 'services' | 'reviews'>('overview');
  const [photoFilter, setPhotoFilter] = useState<'ALL' | 'OWNER' | 'CUSTOMER' | 'VIDEO'>('ALL');
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  // Rate card carousel index
  const scannedCards = vendor.media.filter(
    (m) => m.mediaType === 'SCANNED_RATE_CARD' || m.mediaType === 'DOCUMENT'
  );
  const [rateCardIndex, setRateCardIndex] = useState(0);

  // Interactive AI Ask Anything Box
  const [questionInput, setQuestionInput] = useState('');
  const [aiAnswers, setAiAnswers] = useState<Array<{ q: string; a: string }>>([
    {
      q: 'Can you send me your latest price list? 📄',
      a: `Yes! Our AC Deep Cleaning starts at ₹599, and full AC Installation is ₹799 onwards. You can also view our scanned rate cards in the Price List tab above.`,
    },
  ]);

  // Lead Enquiry Modal
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [selectedServiceTitle, setSelectedServiceTitle] = useState('');
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    phone: '',
    acType: 'Window Ac',
    message: '',
  });
  const [enquirySending, setEnquirySending] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  // Customer Photo Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFileState, setUploadFileState] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Review Submission Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userReviewName, setUserReviewName] = useState('');
  const [userReviewComment, setUserReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Filtered Photos
  const filteredPhotos = vendor.media.filter((m) => {
    if (photoFilter === 'ALL') return m.mediaType === 'PHOTO' || m.mediaType === 'VIDEO';
    if (photoFilter === 'OWNER') return m.mediaType === 'PHOTO' && m.sourceCategory === 'OWNER';
    if (photoFilter === 'CUSTOMER') return m.mediaType === 'PHOTO' && m.sourceCategory === 'CUSTOMER';
    if (photoFilter === 'VIDEO') return m.mediaType === 'VIDEO';
    return true;
  });

  const photosCountAll = vendor.media.filter((m) => m.mediaType === 'PHOTO' || m.mediaType === 'VIDEO').length;
  const photosCountOwner = vendor.media.filter((m) => m.mediaType === 'PHOTO' && m.sourceCategory === 'OWNER').length;
  const photosCountCustomer = vendor.media.filter((m) => m.mediaType === 'PHOTO' && m.sourceCategory === 'CUSTOMER').length;
  const videosCount = vendor.media.filter((m) => m.mediaType === 'VIDEO').length;

  // Ask AI handler
  const handleAskQuestion = (qText: string) => {
    const q = qText || questionInput;
    if (!q.trim()) return;

    let reply = `Thanks for asking about ${vendor.businessName}! We operate from ${vendor.locality || vendor.city} with verified technicians and genuine warranty. For immediate booking call ${vendor.phone}.`;
    const qLower = q.toLowerCase();
    if (qLower.includes('price') || qLower.includes('rate') || qLower.includes('cost')) {
      reply = `Our standard AC Deep Cleaning is ₹599 onwards / visit and AC Installation is ₹799 onwards. Check the Price List section for full items.`;
    } else if (qLower.includes('wholesale') || qLower.includes('product')) {
      reply = `We provide wholesale spare parts, copper tubes, capacitors, R32/R410A refrigerant gas and new AC units. Please call ${vendor.phone} for wholesale quotation.`;
    } else if (qLower.includes('delivery') || qLower.includes('doorstep') || qLower.includes('home')) {
      reply = `Yes, we provide 100% doorstep services within 60 minutes across ${vendor.locality || vendor.city}.`;
    }

    setAiAnswers((prev) => [...prev, { q, a: reply }]);
    setQuestionInput('');
  };

  // Submit Lead
  const handleSendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryForm.name || !enquiryForm.phone) return alert('Name and phone required');

    setEnquirySending(true);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: enquiryForm.name,
          phone: enquiryForm.phone,
          email: `${enquiryForm.phone.replace(/[^0-9]/g, '')}@lead.techinpedia.com`,
          service: selectedServiceTitle || vendor.primaryCategory,
          projectType: 'MARKETPLACE_REQUIREMENT',
          budget: 'Standard',
          source: `Urban Vendor Profile: ${vendor.businessName}`,
          message: `Vendor: ${vendor.businessName} (${vendor.phone})\nAC Type: ${enquiryForm.acType}\nNote: ${enquiryForm.message || 'Customer requested immediate quote'}`,
        }),
      });

      if (res.ok) {
        setEnquirySuccess(true);
        setTimeout(() => {
          setIsEnquiryModalOpen(false);
          setEnquirySuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnquirySending(false);
    }
  };

  // Upload Customer Photo
  const handleUploadCustomerPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileState) return;

    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFileState);
      const uploadRes = await fetch('/api/media', {
        method: 'POST',
        body: fd,
      });
      const uploadJson = await uploadRes.json();
      if (uploadRes.ok && uploadJson.success && uploadJson.media) {
        // Link to vendor media
        await fetch(`/api/admin/marketplace/vendors/${vendor.id}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: uploadJson.media.url,
            mediaType: 'PHOTO',
            sourceCategory: 'CUSTOMER',
            title: 'Customer uploaded photo',
          }),
        });
        alert('Photo uploaded successfully! It is now part of the vendor profile.');
        setIsUploadModalOpen(false);
        setUploadFileState(null);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userReviewName || !userReviewComment) return alert('Name and review required');

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/admin/marketplace/vendors/${vendor.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName: userReviewName,
          rating: userRating,
          comment: userReviewComment,
          reviewTags: ['Reasonably priced', 'Verified customer'],
        }),
      });
      if (res.ok) {
        alert('Thank you for rating! Your review is published.');
        setIsReviewModalOpen(false);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const copyAddressToClipboard = () => {
    if (vendor.address) {
      navigator.clipboard.writeText(vendor.address);
      alert('Address copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b18] text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-24">
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
                  <span className="truncate">{vendor.locality || 'Mathur Lane'}, {vendor.city.toUpperCase()}</span>
                </Link>

                <div className="flex items-center flex-1 px-3 py-1 text-xs">
                  <input
                    type="text"
                    defaultValue={`${vendor.primaryCategory} Near ${vendor.locality || vendor.city}`}
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

              <button
                onClick={() => {
                  setSelectedServiceTitle('');
                  setIsEnquiryModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Enquire Now</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BREADCRUMB STRIP */}
      <div className="bg-[#0c1427]/80 border-b border-slate-800/80 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center gap-1.5 text-[11px] text-slate-400 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-blue-400 capitalize">{vendor.city}</Link>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <Link href={`/services/${vendor.primaryCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="hover:text-blue-400">
            {vendor.primaryCategory} in {vendor.city.toUpperCase()}
          </Link>
          {vendor.locality && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="text-slate-300">{vendor.locality}</span>
            </>
          )}
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="font-bold text-white truncate">{vendor.businessName}</span>
        </div>
      </div>

      {/* 3. HERO BUSINESS HEADER */}
      <section className="bg-[#0c1427] border-b border-slate-800 py-6 sm:py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Left Header Info */}
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-600/30">
                  <ThumbsUp className="w-4 h-4 fill-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {vendor.businessName}
                </h1>
              </div>

              {/* Rating + Badges line */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-extrabold bg-emerald-600 text-white text-xs shadow-xs">
                  <span>{vendor.averageRating.toFixed(1)}</span>
                  <Star className="w-3 h-3 fill-white" />
                </span>

                <span className="font-bold text-slate-300">
                  {vendor.ratingCount} Ratings
                </span>

                {vendor.isClaimed && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-950/80 text-blue-400 border border-blue-800">
                    <CheckCircle2 className="w-3 h-3 text-blue-400" />
                    Claimed
                  </span>
                )}

                {vendor.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verified Listing
                  </span>
                )}
              </div>

              {/* Meta details subline */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <strong className="text-white">{vendor.locality || vendor.city}</strong>, {vendor.city.toUpperCase()}
                </span>
                <span className="text-slate-600">•</span>
                <span>{vendor.quickInfo?.distance || '1.2 km'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Open until {vendor.quickInfo?.openUntil || '8:30 pm'}
                </span>
                <span className="text-slate-600">•</span>
                <span>{vendor.establishmentYear ? `${new Date().getFullYear() - vendor.establishmentYear} Years in Business` : '7 Years in Business'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-medium">
                  {vendor.quickInfo?.tagSuggestion || '"Reasonably priced"'}
                </span>
              </div>

              {/* Action Buttons Strip */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <a
                  href={`tel:${vendor.phone}`}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{vendor.phone}</span>
                </a>

                <button
                  onClick={() => {
                    setSelectedServiceTitle('');
                    setIsEnquiryModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all hover:scale-105"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <div className="text-left">
                    <div>Enquire Now</div>
                    <div className="text-[9px] font-normal text-blue-200">{vendor.quickInfo?.responseSpeed || 'Responds in 10 Mins'}</div>
                  </div>
                </button>

                <a
                  href={`https://wa.me/${(vendor.whatsappNumber || vendor.phone).replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(vendor.businessName)}%2C%20I%20found%20your%20profile%20on%20UrbanMarket%20and%20want%20to%20enquire%20about%20services.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl border border-emerald-800 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Profile link copied to clipboard!');
                  }}
                  className="p-2.5 rounded-xl border border-slate-800 bg-[#111c33] hover:bg-slate-800 text-slate-300 transition-all"
                  title="Share profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Category tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {vendor.categories.map((cat, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#111c33] text-slate-300 border border-slate-800"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Interactive Click to Rate Widget */}
            <div className="flex flex-col items-start lg:items-end justify-between self-stretch flex-shrink-0 space-y-3">
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="p-3.5 rounded-2xl border border-slate-800 hover:border-blue-500/50 bg-[#111c33] text-left transition-all group shadow-md"
              >
                <div className="text-[11px] font-bold text-slate-400 mb-1">Click to Rate</div>
                <div className="flex items-center gap-1 text-slate-600 group-hover:text-amber-400 transition-colors">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5 hover:fill-amber-400 cursor-pointer" />
                  ))}
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NAVIGATION TABS */}
      <nav className="sticky top-20 z-30 bg-[#0c1427]/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center gap-6 overflow-x-auto whitespace-nowrap text-xs font-bold">
          {(['overview', 'photos', 'pricing', 'quickinfo', 'services', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 border-b-2 capitalize transition-all ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'reviews' ? (
                <span className="flex items-center gap-1.5">
                  <span>Reviews</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-400 border border-blue-800 font-bold">{vendor.reviews.length}</span>
                </span>
              ) : tab === 'quickinfo' ? 'Quick Info' : tab}
            </button>
          ))}
        </div>
      </nav>

      {/* 5. MAIN CONTENT + SIDEBAR SPLIT */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT 8 COLS: PHOTOS, PRICE LIST, AI ASSISTANT, REVIEWS */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-8 space-y-10">
            {/* PHOTOS SECTION */}
            <div id="photos-section" className="bg-[#0c1427] rounded-3xl border border-slate-800/80 p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-white">Photos</h2>
                  <p className="text-xs text-slate-400">Live work photos, technician equipment &amp; shop gallery.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photos</span>
                  </button>
                </div>
              </div>

              {/* Photo Filter Tabs (All, By Owner, By User, Video) */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setPhotoFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    photoFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[#111c33] text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  All ({photosCountAll})
                </button>

                <button
                  onClick={() => setPhotoFilter('OWNER')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    photoFilter === 'OWNER'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[#111c33] text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  By Owner ({photosCountOwner})
                </button>

                <button
                  onClick={() => setPhotoFilter('CUSTOMER')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    photoFilter === 'CUSTOMER'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[#111c33] text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  By User ({photosCountCustomer})
                </button>

                <button
                  onClick={() => setPhotoFilter('VIDEO')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    photoFilter === 'VIDEO'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[#111c33] text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Video ({videosCount})
                </button>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {filteredPhotos.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActivePhotoModal(item.url)}
                    className="relative aspect-4/3 rounded-2xl overflow-hidden bg-[#111c33] cursor-pointer group shadow-md border border-slate-800 hover:border-blue-500/50 transition-all"
                  >
                    {item.mediaType === 'VIDEO' ? (
                      <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumbnailUrl || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400'}
                          alt={item.title || 'Video'}
                          className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Video className="w-5 h-5 fill-white" />
                        </div>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.url}
                        alt={item.title || 'Gallery'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white text-[10px] font-bold">
                      <span className="truncate">{item.title || 'View Photo'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRICE LIST & SCANNED RATE CARDS */}
            <div id="pricing-section" className="bg-[#0c1427] rounded-3xl border border-slate-800/80 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Price List</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </h2>
                  <p className="text-xs text-slate-400">Transparent rates verified with technician visit guarantee.</p>
                </div>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className="text-xs font-bold text-blue-400 hover:underline"
                >
                  View all ({vendor.services.length})
                </button>
              </div>

              {/* Service Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {vendor.services.slice(0, 3).map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 rounded-2xl border border-slate-800 hover:border-blue-500/50 bg-[#111c33] flex flex-col justify-between space-y-3 transition-all group"
                  >
                    <div>
                      <h3 className="text-sm font-black text-white line-clamp-1 group-hover:text-blue-400 transition-colors">{srv.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {srv.description || 'Professional service by certified technician with 30-day warranty.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <div className="text-sm font-black text-white">
                        ₹ {srv.price} <span className="text-[10px] font-normal text-slate-400">{srv.priceUnit}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-3">
                        <button
                          onClick={() => {
                            setSelectedServiceTitle(srv.title);
                            setIsEnquiryModalOpen(true);
                          }}
                          className="text-[11px] font-bold text-blue-400 hover:underline"
                        >
                          View Details
                        </button>

                        <button
                          onClick={() => {
                            setSelectedServiceTitle(srv.title);
                            setIsEnquiryModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors"
                        >
                          Enquire Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* SCANNED RATE CARDS CAROUSEL */}
              {scannedCards.length > 0 && (
                <div className="pt-6 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Scanned Physical Rate-Card Documents ({scannedCards.length})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setRateCardIndex((prev) => Math.max(0, prev - 1))}
                        disabled={rateCardIndex === 0}
                        className="p-1.5 rounded-lg border border-slate-800 text-slate-300 bg-[#111c33] disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRateCardIndex((prev) => Math.min(scannedCards.length - 1, prev + 1))}
                        disabled={rateCardIndex === scannedCards.length - 1}
                        className="p-1.5 rounded-lg border border-slate-800 text-slate-300 bg-[#111c33] disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {scannedCards.map((rc, idx) => (
                      <div
                        key={rc.id}
                        onClick={() => setActivePhotoModal(rc.url)}
                        className={`relative aspect-3/4 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all shadow-md bg-[#111c33] ${
                          idx === rateCardIndex ? 'border-orange-500 scale-[1.02]' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={rc.url} alt={rc.title || 'Rate Card'} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 p-2 text-white text-[10px] font-bold line-clamp-1 border-t border-slate-800">
                          {rc.title || `Price Card ${idx + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ASK ANYTHING ABOUT THIS PLACE */}
            <div className="p-6 rounded-3xl border border-indigo-500/30 bg-[#0c1427] shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                <span>Ask anything about this place</span>
              </div>

              {/* Chat input box */}
              <div className="relative">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion(questionInput)}
                  placeholder="Ask anything..."
                  className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-700 bg-[#111c33] text-xs text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                />
                <button
                  onClick={() => handleAskQuestion(questionInput)}
                  className="absolute right-2 top-2 p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Suggestion prompt chips */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  'What kind of wholesale products do you have? 📦',
                  'Can you send me your latest price list? 📄',
                  'Do you offer home delivery for orders? 🚚',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(chip)}
                    className="px-3 py-1.5 rounded-xl border border-slate-800 bg-[#111c33] hover:border-indigo-400 text-[11px] font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1 shadow-xs"
                  >
                    <span>{chip}</span>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </button>
                ))}
              </div>

              {/* AI Answers list */}
              {aiAnswers.length > 0 && (
                <div className="space-y-2 pt-2">
                  {aiAnswers.map((item, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-[#111c33] border border-slate-800 text-xs space-y-1">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-blue-400">Q:</span>
                        <span>{item.q}</span>
                      </div>
                      <div className="text-slate-300 pl-4 border-l-2 border-indigo-500">
                        {item.a}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QUICK INFORMATION */}
            <div id="quickinfo-section" className="bg-[#0c1427] rounded-3xl border border-slate-800/80 p-6 shadow-xl space-y-4">
              <h2 className="text-base font-black text-white">Quick Information</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-2xl bg-[#111c33] border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Year of Establishment</span>
                  <strong className="text-white text-sm">{vendor.establishmentYear || 2019}</strong>
                </div>

                <div className="p-3 rounded-2xl bg-[#111c33] border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Primary Domain</span>
                  <strong className="text-white text-sm">{vendor.primaryCategory}</strong>
                </div>
              </div>

              {/* Amenities & Badges */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-300">Key Features &amp; Amenities:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {['Sanitised Equipment', 'Same Day Service Guarantee', 'Doorstep Repair', 'Verified Technicians', '30 Days Warranty'].map((amenity, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* OUR HAPPY CUSTOMERS */}
            <div className="bg-[#0c1427] rounded-3xl border border-slate-800/80 p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-white">Our Happy Customers</h2>
                  <p className="text-xs text-slate-400">Verified feedback and ratings from direct bookings.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {vendor.reviews.slice(0, 3).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-[#111c33] border border-slate-800 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center">
                          {rev.reviewerName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{rev.reviewerName}</div>
                          <div className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 italic line-clamp-3">
                        &#34;{rev.comment}&#34;
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400 pt-2 border-t border-slate-800">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* REVIEWS & RATINGS COMPREHENSIVE */}
            <div id="reviews-section" className="bg-[#0c1427] rounded-3xl border border-slate-800/80 p-6 shadow-xl space-y-6">
              <h2 className="text-lg font-black text-white">Reviews &amp; Ratings</h2>

              {/* Big Score Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-black px-4 py-2 rounded-2xl bg-emerald-600 text-white flex items-center gap-1 shadow-md">
                    <span>{vendor.averageRating.toFixed(1)}</span>
                    <Star className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">
                      {vendor.ratingCount} Ratings
                    </div>
                    <div className="text-xs text-slate-400">
                      Urban rating index based on verified customer surveys
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all flex-shrink-0"
                >
                  <Star className="w-3.5 h-3.5 fill-white" />
                  <span>Write a Review</span>
                </button>
              </div>

              {/* Start your review widget */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-[#111c33] flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Start your Review</span>
                <div
                  onClick={() => setIsReviewModalOpen(true)}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-amber-400 cursor-pointer transition-colors"
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5" />
                  ))}
                </div>
              </div>

              {/* Recent rating trend chips */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-300">Recent rating trend</span>
                <div className="flex flex-wrap items-center gap-2">
                  {['5.0', '5.0', '5.0', '5.0', '4.0', '5.0', '4.0', '5.0', '3.0'].map((r, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#111c33] text-slate-200 flex items-center gap-1 border border-slate-800"
                    >
                      <span>{r}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                  ))}
                </div>
              </div>

              {/* Review Highlights Chips */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-300">Review Highlights</span>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    'Reasonably priced (4)',
                    'Sanitised equipment (3)',
                    'Value for money (3)',
                    'Appliances in good condition (3)',
                    'Excellent service (3)',
                  ].map((hl, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-[#111c33] text-slate-300 border border-slate-800"
                    >
                      {hl}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reviews Detailed List */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                {vendor.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-[#111c33] border border-slate-800 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{rev.reviewerName}</span>
                        <div className="flex items-center gap-0.5 text-xs font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                          <span>{rev.rating}.0</span>
                          <Star className="w-2.5 h-2.5 fill-white" />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-slate-300">{rev.comment}</p>

                    {rev.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rev.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300 border border-slate-700/50"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {rev.ownerReply && (
                      <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border-l-2 border-emerald-500 text-xs">
                        <strong className="text-emerald-400">Owner Response: </strong>
                        <span className="text-slate-300">{rev.ownerReply}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT RAIL (4 COLS) */}
          <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-4 space-y-6">
            {/* Contact & Address Card */}
            <div className="bg-[#0c1427] rounded-3xl border border-slate-800/80 p-6 shadow-xl space-y-5">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact</span>
                <a
                  href={`tel:${vendor.phone}`}
                  className="text-base font-black text-blue-400 flex items-center gap-2 hover:underline"
                >
                  <Phone className="w-4 h-4" />
                  <span>{vendor.phone}</span>
                </a>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Address</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {vendor.address || 'Shop No LG 9, Square One Complex, Near Bharat Petrol Pump, Rajni Khand Road, Aashiyana, Lucknow-226012, Uttar Pradesh'}
                </p>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(vendor.address || `${vendor.businessName} ${vendor.city}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Get Directions</span>
                  </a>

                  <button
                    onClick={copyAddressToClipboard}
                    className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* Timings */}
              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Open until {vendor.quickInfo?.openUntil || '8:30 pm'}</span>
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Actual hours may differ on holidays</div>
              </div>
            </div>

            {/* RIGHT RAIL LEAD CAPTURE FORM */}
            <div className="bg-[#0c1427] rounded-3xl border-2 border-blue-500/40 p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">
                  Get the List of Top <span className="text-blue-400">{vendor.primaryCategory}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  We&#39;ll send you verified contacts in seconds for free.
                </p>
              </div>

              <form onSubmit={handleSendEnquiry} className="space-y-3.5">
                {/* AC Type Radios */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                    Select your requirement type
                  </label>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
                    {['Window Ac', 'Split Ac', 'Others'].map((type) => (
                      <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="acType"
                          checked={enquiryForm.acType === type}
                          onChange={() => setEnquiryForm({ ...enquiryForm, acType: type })}
                          className="text-blue-600 focus:ring-blue-500 bg-[#111c33] border-slate-700"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={enquiryForm.name}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                    placeholder="Your Name *"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#111c33] text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    required
                    value={enquiryForm.phone}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                    placeholder="Mobile Number *"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#111c33] text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-start gap-2 pt-1 text-[10px] text-slate-400">
                  <input type="checkbox" defaultChecked className="mt-0.5 rounded text-blue-600 bg-[#111c33]" />
                  <span>I Agree to T&amp;C and Privacy Policy</span>
                </div>

                <button
                  type="submit"
                  disabled={enquirySending}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <span>{enquirySending ? 'Sending Request...' : 'Send Enquiry >>>'}</span>
                </button>
              </form>
            </div>

            {/* ALSO LISTED IN */}
            <div className="bg-[#0c1427] rounded-3xl border border-slate-800/80 p-6 shadow-xl space-y-3">
              <span className="text-xs font-bold text-white block">Also listed in</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'AC Repair & Services',
                  'AC Installation Services',
                  'Split AC Repair & Services',
                  'Split AC Installation Services',
                  'Window AC Repair & Services',
                  'AC AMC',
                  'Cassette AC Repair & Services',
                  'Ductable AC Installation Services',
                  'Central AC Installation Services',
                ].map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-[#111c33] text-slate-300 border border-slate-800"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#070b18]/95 backdrop-blur-md border-t border-slate-800 py-3 px-4 shadow-2xl">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="font-black text-sm text-white truncate">
              {vendor.businessName}
            </span>
            <span className="hidden sm:inline-flex items-center gap-0.5 text-xs font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-md">
              <span>{vendor.averageRating.toFixed(1)}</span>
              <Star className="w-3 h-3 fill-white" />
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={`tel:${vendor.phone}`}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{vendor.phone}</span>
              <span className="sm:hidden">Call</span>
            </a>

            <button
              onClick={() => {
                setSelectedServiceTitle('');
                setIsEnquiryModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enquire Now</span>
            </button>

            <a
              href={`https://wa.me/${(vendor.whatsappNumber || vendor.phone).replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(vendor.businessName)}%2C%20I%20want%20to%20enquire%20about%20AC%20repair%20services.`}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900 border border-emerald-800"
              title="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* 7. PHOTO PREVIEW / ZOOM LIGHTBOX */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300"
            >
              <X className="w-7 h-7" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhotoModal}
              alt="Preview"
              className="max-h-[80vh] w-auto rounded-2xl shadow-2xl object-contain border border-slate-800"
            />
          </div>
        </div>
      )}

      {/* 8. LEAD ENQUIRY MODAL */}
      {isEnquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#0c1427] rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">Send Direct Enquiry</h3>
                <p className="text-xs text-slate-400">To {vendor.businessName}</p>
              </div>
              <button onClick={() => setIsEnquiryModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {enquirySuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Enquiry Sent!</h4>
                <p className="text-xs text-slate-400">The vendor team will reach out to you within 10-15 minutes.</p>
              </div>
            ) : (
              <form onSubmit={handleSendEnquiry} className="space-y-3">
                {selectedServiceTitle && (
                  <div className="p-2.5 rounded-xl bg-blue-950/60 text-blue-300 border border-blue-800 text-xs font-bold">
                    Selected Service: {selectedServiceTitle}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.name}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#111c33] text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={enquiryForm.phone}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#111c33] text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Appliance / Service Type</label>
                  <select
                    value={enquiryForm.acType}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, acType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#111c33] text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Window Ac">Window AC</option>
                    <option value="Split Ac">Split AC</option>
                    <option value="Cassette Ac">Cassette AC</option>
                    <option value="Tower / Ductable">Tower / Ductable AC</option>
                    <option value="Refrigerator">Refrigerator</option>
                    <option value="Washing Machine">Washing Machine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Issue / Service Required</label>
                  <textarea
                    rows={2}
                    value={enquiryForm.message}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                    placeholder="e.g. Not cooling properly, water leakage..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#111c33] text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={enquirySending}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {enquirySending ? 'Sending...' : 'Confirm & Request Call Back'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 9. CUSTOMER PHOTO UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#0c1427] rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">Upload Your Photo / Video</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadCustomerPhoto} className="space-y-4">
              <p className="text-xs text-slate-400">
                Have you received service from {vendor.businessName}? Upload your appliance or work photo here to appear in &#34;By User&#34; gallery!
              </p>

              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center bg-[#111c33]">
                <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={(e) => setUploadFileState(e.target.files?.[0] || null)}
                  className="text-xs text-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingPhoto || !uploadFileState}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
              >
                {uploadingPhoto ? 'Uploading to Server...' : 'Upload & Publish to Gallery'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 10. WRITE A REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#0c1427] rounded-3xl border border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-white">Write a Review</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-slate-400">Your Rating</span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="p-1 transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= userRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={userReviewName}
                  onChange={(e) => setUserReviewName(e.target.value)}
                  placeholder="e.g. Rahul Pal"
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#111c33] text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Your Feedback / Review *</label>
                <textarea
                  rows={3}
                  required
                  value={userReviewComment}
                  onChange={(e) => setUserReviewComment(e.target.value)}
                  placeholder="Tell others about technician behavior, punctuality, pricing..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#111c33] text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
