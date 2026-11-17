'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Award,
  AlertCircle,
  Briefcase,
  Package,
  Wrench,
  UserCheck,
  Plus,
  Star,
  Image as ImageIcon,
  FileText,
  DollarSign,
  Edit3,
  Eye,
  Check,
  ChevronRight
} from 'lucide-react';

interface VendorItem {
  id: string;
  isFullProfile: boolean;
  slug?: string;
  businessName: string;
  tagline?: string | null;
  ownerName: string;
  phone?: string | null;
  whatsappNumber?: string | null;
  email: string;
  city: string;
  locality?: string | null;
  address?: string | null;
  businessType: string;
  primaryCategory?: string;
  categories: string[];
  tier: string;
  leadCredits: number;
  gstin?: string | null;
  status: string;
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  isClaimed: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  averageRating: number;
  ratingCount: number;
  reviewCount: number;
  mediaCount: number;
  servicesCount: number;
  reviewsCount: number;
  notesCount?: number;
  createdAt: string;
}

export default function MarketplaceVendorsPage() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // New Vendor Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    city: 'lucknow',
    locality: '',
    address: '',
    primaryCategory: 'AC Repair & Services',
    establishmentYear: '2020',
    gstin: '',
    membershipTier: 'STARTER',
    kycStatus: 'VERIFIED',
    isClaimed: true,
    isVerified: true,
    isFeatured: false,
  });

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(kycFilter ? { kycStatus: kycFilter } : {}),
      });

      const res = await fetch(`/api/admin/marketplace/vendors?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setVendors(data.vendors || []);
      }
    } catch (err) {
      console.error('Fetch vendors error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, kycFilter]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleUpdateKYC = async (id: string, newKycStatus: 'VERIFIED' | 'REJECTED' | 'PENDING') => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/marketplace/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kycStatus: newKycStatus,
          note: `KYC status updated to ${newKycStatus} by Admin`,
        }),
      });
      if (res.ok) {
        setVendors((prev) =>
          prev.map((v) => (v.id === id ? { ...v, kycStatus: newKycStatus, isVerified: newKycStatus === 'VERIFIED' } : v))
        );
      }
    } catch (err) {
      console.error('KYC update error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/marketplace/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !current }),
      });
      if (res.ok) {
        setVendors((prev) =>
          prev.map((v) => (v.id === id ? { ...v, isFeatured: !current } : v))
        );
      }
    } catch (err) {
      console.error('Toggle featured error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddCredits = async (id: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/marketplace/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addedCredits: 10,
          note: 'Allocated +10 bonus lead credits',
        }),
      });
      if (res.ok) {
        alert('Successfully added +10 lead credits to vendor wallet.');
        fetchVendors();
      }
    } catch (err) {
      console.error('Add credits error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/admin/marketplace/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categories: [formData.primaryCategory],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAddModalOpen(false);
        fetchVendors();
        alert('Vendor Profile created successfully! Opening 360 Studio...');
        window.location.href = `/admin/marketplace/vendors/${data.vendor.id}/editor`;
      } else {
        alert(data.error || 'Failed to create vendor');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating vendor');
    } finally {
      setCreating(false);
    }
  };

  const verifiedCount = vendors.filter((v) => v.kycStatus === 'VERIFIED').length;
  const pendingCount = vendors.filter((v) => v.kycStatus === 'PENDING').length;
  const fullProfilesCount = vendors.filter((v) => v.isFullProfile).length;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/marketplace"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Marketplace Cockpit
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">Vendor 360 Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Vendor 360 Profiles & Studio
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage complete Justdial/IndiaMART style business profiles, scanned rate-cards, photos, pricing cards & customer reviews ({vendors.length} vendors).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchVendors}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shadow-md shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Vendor 360</span>
          </button>

          <a
            href="https://urban.techinpedia.com/services/ac-repair-services"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all"
          >
            <span>Live Directory</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Vendors</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{vendors.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">360 Rich Profiles</span>
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400">{fullProfilesCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verified KYC (Active)</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{verifiedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Review</span>
            <div className="text-2xl font-black text-amber-500">{pendingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business, city, phone, category..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All KYC Statuses</option>
            <option value="VERIFIED">Verified Partners</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto text-teal-500 mb-2" />
            Loading vendor directory...
          </div>
        ) : vendors.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            No vendors found matching your filter criteria.
          </div>
        ) : (
          vendors.map((v) => (
            <div
              key={v.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl border ${
                v.isFeatured
                  ? 'border-amber-300 dark:border-amber-500/30 shadow-md shadow-amber-500/5'
                  : 'border-slate-200 dark:border-slate-800'
              } p-6 transition-all hover:border-teal-400 dark:hover:border-teal-600`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left Business Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {v.businessName}
                      {v.isFeatured && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 flex items-center gap-1 border border-amber-300">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Featured
                        </span>
                      )}
                    </h3>

                    {/* KYC Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        v.kycStatus === 'VERIFIED'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : v.kycStatus === 'REJECTED'
                          ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {v.kycStatus === 'VERIFIED' ? <ShieldCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span>{v.kycStatus === 'VERIFIED' ? 'Verified Partner' : v.kycStatus === 'REJECTED' ? 'KYC Rejected' : 'KYC Pending'}</span>
                    </span>

                    {/* Claimed Badge */}
                    {v.isClaimed && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Claimed
                      </span>
                    )}

                    {/* Plan Tier */}
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Tier: {v.tier}
                    </span>

                    {/* Wallet Credits */}
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">
                      Credits: {v.leadCredits}
                    </span>
                  </div>

                  {v.tagline && (
                    <p className="text-xs text-slate-500 italic line-clamp-1">{v.tagline}</p>
                  )}

                  {/* Rating + Counts Pill Strip */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[11px]">
                      <span>{v.averageRating.toFixed(1)}</span>
                      <Star className="w-3 h-3 fill-white" />
                    </div>
                    <span className="text-slate-500">{v.ratingCount} Ratings</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>

                    {/* 360 Studio Counters */}
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                      <ImageIcon className="w-3.5 h-3.5 text-teal-500" />
                      <strong>{v.mediaCount}</strong> Media/Cards
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      <strong>{v.servicesCount}</strong> Price Services
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <strong>{v.reviewsCount}</strong> Reviews
                    </span>
                  </div>

                  {/* Owner & Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <div>
                      <span className="text-slate-400">Owner:</span> <strong>{v.ownerName}</strong>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{v.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Location:</span>{' '}
                      <strong>{v.locality ? `${v.locality}, ` : ''}{v.city}</strong>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {v.categories.map((cat, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  {v.isFullProfile ? (
                    <>
                      <Link
                        href={`/admin/marketplace/vendors/${v.id}/editor`}
                        className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit 360 Studio</span>
                      </Link>

                      {v.slug && (
                        <a
                          href={`https://urban.techinpedia.com/biz/${v.city}/${v.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                          title="View Live Profile on Urban"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Live Profile</span>
                        </a>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setFormData({
                          ...formData,
                          businessName: v.businessName,
                          ownerName: v.ownerName,
                          phone: v.phone || '',
                          whatsappNumber: v.phone || '',
                          email: v.email,
                          city: v.city || 'lucknow',
                          address: v.address || '',
                          primaryCategory: v.categories[0] || 'AC Repair & Services',
                        });
                        setIsAddModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Convert to 360 Studio</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      disabled={updatingId === v.id}
                      onClick={() => handleToggleFeatured(v.id, v.isFeatured)}
                      className={`p-2.5 rounded-xl border text-xs transition-colors ${
                        v.isFeatured
                          ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500'
                      }`}
                      title={v.isFeatured ? 'Featured active' : 'Click to Feature on top'}
                    >
                      <Star className={`w-4 h-4 ${v.isFeatured ? 'fill-amber-500' : ''}`} />
                    </button>

                    <button
                      disabled={updatingId === v.id}
                      onClick={() => handleAddCredits(v.id)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-all"
                      title="Add 10 Bonus Lead Credits"
                    >
                      +10 Cr
                    </button>

                    {v.kycStatus !== 'VERIFIED' && (
                      <button
                        disabled={updatingId === v.id}
                        onClick={() => handleUpdateKYC(v.id, 'VERIFIED')}
                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50"
                        title="Approve KYC"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {v.phone && (
                      <a
                        href={`https://wa.me/${v.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(v.ownerName)}%2C%20greetings%20from%20Urban%20Market%20admin%20team%20regarding%20your%20vendor%20account%20${encodeURIComponent(v.businessName)}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                        title="WhatsApp Vendor"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create New Vendor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Create New Vendor 360 Profile</h3>
                <p className="text-xs text-slate-500">Create a database-driven vendor profile with photos, pricing cards & scanned rate cards.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Royal Cool Care Aircondition"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 08460240472"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="e.g. 918460240472"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. lucknow or delhi ncr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Locality / Sector</label>
                  <input
                    type="text"
                    value={formData.locality}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    placeholder="e.g. Aashiyana or Mathur Lane"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Category</label>
                  <select
                    value={formData.primaryCategory}
                    onChange={(e) => setFormData({ ...formData, primaryCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="AC Repair & Services">AC Repair & Services</option>
                    <option value="AC Installation Services">AC Installation Services</option>
                    <option value="Refrigerator Repair & Services">Refrigerator Repair & Services</option>
                    <option value="Washing Machine Repair">Washing Machine Repair</option>
                    <option value="Plumber & Sanitary">Plumber & Sanitary</option>
                    <option value="Electrician & Wiring">Electrician & Wiring</option>
                    <option value="Pest Control Services">Pest Control Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Establishment Year</label>
                  <input
                    type="number"
                    value={formData.establishmentYear}
                    onChange={(e) => setFormData({ ...formData, establishmentYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Business Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Shop No LG 9, Square One Complex, Near Bharat Petrol Pump..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-teal-600/20 disabled:opacity-50"
                >
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{creating ? 'Creating Profile...' : 'Save & Open 360 Studio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
