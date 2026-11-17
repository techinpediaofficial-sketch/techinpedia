'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  Star,
  Image as ImageIcon,
  DollarSign,
  FileText,
  Clock,
  MapPin,
  Save,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  CheckCircle2,
  Upload,
  AlertCircle,
  HelpCircle,
  Eye,
  Check,
  Video,
  FileSpreadsheet
} from 'lucide-react';

interface Vendor360Data {
  id: string;
  slug: string;
  businessName: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  ownerName: string | null;
  phone: string;
  whatsappNumber: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  locality: string | null;
  city: string;
  state: string | null;
  pincode: string | null;
  establishmentYear: number | null;
  businessType: string;
  primaryCategory: string;
  categories: string[];
  openingHours: Record<string, string> | null;
  quickInfo: any | null;
  gstin: string | null;
  kycStatus: string;
  membershipTier: string;
  leadCredits: number;
  isClaimed: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  averageRating: number;
  ratingCount: number;
  reviewCount: number;
  status: string;
  media: Array<{
    id: string;
    mediaType: string;
    sourceCategory: string;
    url: string;
    thumbnailUrl: string | null;
    title: string | null;
    displayOrder: number;
  }>;
  services: Array<{
    id: string;
    title: string;
    description: string | null;
    price: number;
    priceUnit: string;
    duration: string | null;
    imageUrl: string | null;
    isPopular: boolean;
    displayOrder: number;
  }>;
  reviews: Array<{
    id: string;
    reviewerName: string;
    reviewerPhone: string | null;
    rating: number;
    comment: string;
    reviewTags: string | null;
    ownerReply: string | null;
    status: string;
    createdAt: string;
  }>;
}

export default function Vendor360StudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<Vendor360Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'media' | 'services' | 'hours' | 'reviews'>('profile');

  // New Media Form
  const [mediaForm, setMediaForm] = useState({
    url: '',
    mediaType: 'PHOTO',
    sourceCategory: 'OWNER',
    title: '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  // New Service Form
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    price: '599',
    priceUnit: 'onwards / visit',
    duration: '45 mins',
    isPopular: true,
  });

  // New Review Form
  const [reviewForm, setReviewForm] = useState({
    reviewerName: '',
    reviewerPhone: '',
    rating: 5,
    comment: '',
    tagsString: 'Reasonably priced, Sanitised equipment',
    ownerReply: '',
  });

  const fetchVendorData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/marketplace/vendors/${id}`);
      const json = await res.json();
      if (res.ok && json.success && json.vendor) {
        setData(json.vendor);
      } else {
        alert(json.error || 'Failed to load vendor data');
      }
    } catch (err) {
      console.error('Fetch vendor 360 error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  // Save General Profile
  const handleSaveProfile = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/marketplace/vendors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        alert('Vendor profile saved successfully!');
        fetchVendorData();
      } else {
        alert(json.error || 'Failed to save');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  // Upload Media File directly via /api/media
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/media', {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (res.ok && json.success && json.media) {
        setMediaForm((prev) => ({ ...prev, url: json.media.url }));
        alert('File uploaded to server! Now click "Add Media Item" to link it.');
      } else {
        alert(json.error || 'File upload failed');
      }
    } catch (err: any) {
      alert(err.message || 'Upload error');
    } finally {
      setUploadingFile(false);
    }
  };

  // Add Media Item
  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaForm.url) return alert('Media URL is required');

    try {
      const res = await fetch(`/api/admin/marketplace/vendors/${id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaForm),
      });
      if (res.ok) {
        setMediaForm({ url: '', mediaType: 'PHOTO', sourceCategory: 'OWNER', title: '' });
        fetchVendorData();
      } else {
        const j = await res.json();
        alert(j.error || 'Failed to add media');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Media
  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media item?')) return;
    try {
      const res = await fetch(`/api/admin/marketplace/vendors/${id}/media?mediaId=${mediaId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchVendorData();
    } catch (err) {
      console.error(err);
    }
  };

  // Add Service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.title) return alert('Title is required');

    try {
      const res = await fetch(`/api/admin/marketplace/vendors/${id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      });
      if (res.ok) {
        setServiceForm({
          title: '',
          description: '',
          price: '599',
          priceUnit: 'onwards / visit',
          duration: '45 mins',
          isPopular: false,
        });
        fetchVendorData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Service
  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const res = await fetch(`/api/admin/marketplace/vendors/${id}/services?serviceId=${serviceId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchVendorData();
    } catch (err) {
      console.error(err);
    }
  };

  // Add Review
  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.reviewerName || !reviewForm.comment) return alert('Name & comment required');

    const tags = reviewForm.tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/admin/marketplace/vendors/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewForm,
          reviewTags: tags,
        }),
      });
      if (res.ok) {
        setReviewForm({
          reviewerName: '',
          reviewerPhone: '',
          rating: 5,
          comment: '',
          tagsString: 'Reasonably priced, Sanitised equipment',
          ownerReply: '',
        });
        fetchVendorData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`/api/admin/marketplace/vendors/${id}/reviews?reviewId=${reviewId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchVendorData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mb-3" />
        <p className="text-sm font-semibold">Loading Vendor 360 Studio...</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/marketplace/vendors"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Vendors</span>
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">360 Studio Editor</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.businessName}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300">
              {data.city.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Edit full Justdial/IndiaMART style profile, rate card scans, service cards, timings & ratings. Zero hardcoding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`https://urban.techinpedia.com/biz/${data.city}/${data.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Live 360</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shadow-md shadow-teal-600/20 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'profile'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Business Info & Badges</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'media'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>2. Photos & Scanned Rate Cards ({data.media.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'services'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>3. Price List & Services ({data.services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hours')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'hours'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>4. Timings & Quick Info</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'reviews'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>5. Reviews & Ratings ({data.reviews.length})</span>
        </button>
      </div>

      {/* TAB 1: Profile & Badges */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            Business Details & Verification Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Business Name *</label>
              <input
                type="text"
                value={data.businessName}
                onChange={(e) => setData({ ...data, businessName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">URL Slug *</label>
              <input
                type="text"
                value={data.slug}
                onChange={(e) => setData({ ...data, slug: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Owner Name</label>
              <input
                type="text"
                value={data.ownerName || ''}
                onChange={(e) => setData({ ...data, ownerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
              <input
                type="text"
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">WhatsApp Number</label>
              <input
                type="text"
                value={data.whatsappNumber || ''}
                onChange={(e) => setData({ ...data, whatsappNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={data.email || ''}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City (lowercase)</label>
              <input
                type="text"
                value={data.city}
                onChange={(e) => setData({ ...data, city: e.target.value.toLowerCase() })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Locality / Area</label>
              <input
                type="text"
                value={data.locality || ''}
                onChange={(e) => setData({ ...data, locality: e.target.value })}
                placeholder="e.g. Aashiyana or Mathur Lane"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Pincode</label>
              <input
                type="text"
                value={data.pincode || ''}
                onChange={(e) => setData({ ...data, pincode: e.target.value })}
                placeholder="226012"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tagline / Catchphrase</label>
            <input
              type="text"
              value={data.tagline || ''}
              onChange={(e) => setData({ ...data, tagline: e.target.value })}
              placeholder="e.g. Reasonable AC repair & sanitised equipment specialists"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Address</label>
            <textarea
              rows={2}
              value={data.address || ''}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Detailed About / Description</label>
            <textarea
              rows={3}
              value={data.description || ''}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Verification Badges Toggles */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">Verification & Listing Badges</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.isVerified}
                  onChange={(e) => setData({ ...data, isVerified: e.target.checked, kycStatus: e.target.checked ? 'VERIFIED' : 'PENDING' })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Jd Verified / Verified Partner</div>
                  <div className="text-[10px] text-slate-500">Show blue/green verified checkmark</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.isClaimed}
                  onChange={(e) => setData({ ...data, isClaimed: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Claimed Business Listing</div>
                  <div className="text-[10px] text-slate-500">Show &#34;Claimed&#34; badge next to title</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.isFeatured}
                  onChange={(e) => setData({ ...data, isFeatured: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Featured Top Search</div>
                  <div className="text-[10px] text-slate-500">Pin at the top of category searches</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Media, Photos & Scanned Rate Cards */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          {/* Add Media Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-600" />
              Upload Photos, Videos or Scanned Rate Cards
            </h2>
            <p className="text-xs text-slate-500">
              Upload local image/PDF files or paste direct URLs. Tag them as &#34;Owner Photo&#34;, &#34;Customer Photo&#34;, &#34;Video&#34;, or &#34;Scanned Rate Card&#34;.
            </p>

            <form onSubmit={handleAddMedia} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Image / PDF / Video URL *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={mediaForm.url}
                      onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })}
                      placeholder="https://... or upload below"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <label className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1 flex-shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingFile ? 'Uploading...' : 'Browse'}</span>
                      <input type="file" onChange={handleFileUpload} accept="image/*,application/pdf" className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Media Type</label>
                  <select
                    value={mediaForm.mediaType}
                    onChange={(e) => setMediaForm({ ...mediaForm, mediaType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="PHOTO">Photo</option>
                    <option value="SCANNED_RATE_CARD">Scanned Rate Card Document</option>
                    <option value="VIDEO">Video</option>
                    <option value="DOCUMENT">KYC Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Source Category</label>
                  <select
                    value={mediaForm.sourceCategory}
                    onChange={(e) => setMediaForm({ ...mediaForm, sourceCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="OWNER">By Owner</option>
                    <option value="CUSTOMER">By User / Customer</option>
                    <option value="WORK_PORTFOLIO">Portfolio Job</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Media Title / Caption</label>
                <input
                  type="text"
                  value={mediaForm.title}
                  onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                  placeholder="e.g. AC Outdoor Condenser Jet Cleaning"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Media to Vendor Profile</span>
              </button>
            </form>
          </div>

          {/* Media Grid Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.media.map((m) => (
              <div
                key={m.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  {m.mediaType === 'VIDEO' ? (
                    <div className="flex flex-col items-center gap-1 text-slate-500">
                      <Video className="w-8 h-8 text-teal-600" />
                      <span className="text-[10px] font-bold">Video Clip</span>
                    </div>
                  ) : m.mediaType === 'SCANNED_RATE_CARD' ? (
                    <div className="flex flex-col items-center gap-1 text-slate-500">
                      <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                      <span className="text-[10px] font-bold">Rate Card Scan</span>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.url} alt={m.title || 'Media'} className="w-full h-full object-cover" />
                  )}

                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-950/80 text-white">
                    {m.mediaType}
                  </span>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-600/90 text-white">
                    {m.sourceCategory}
                  </span>
                </div>

                <div className="p-3 space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {m.title || 'Untitled item'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{m.url}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-teal-600 hover:underline flex items-center gap-1"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => handleDeleteMedia(m.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Structured Services & Pricing Cards */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Add Service Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Add Structured Service & Pricing Card
            </h2>
            <p className="text-xs text-slate-500">
              Create interactive price cards matching Screenshot 3 (e.g. &#34;AC Installation - ₹ 799 onwards / unit&#34;).
            </p>

            <form onSubmit={handleAddService} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Service Title *</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    placeholder="e.g. AC Deep Cleaning Service"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    placeholder="599"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Price Unit</label>
                  <input
                    type="text"
                    value={serviceForm.priceUnit}
                    onChange={(e) => setServiceForm({ ...serviceForm, priceUnit: e.target.value })}
                    placeholder="e.g. onwards / visit or per unit"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Service Description</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="e.g. Complete foam jet wash cleaning of cooling coils and blower wheel..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceForm.isPopular}
                    onChange={(e) => setServiceForm({ ...serviceForm, isPopular: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span>Mark as Popular / Most Booked</span>
                </label>
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Service Pricing Card</span>
              </button>
            </form>
          </div>

          {/* Existing Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.services.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-400 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{s.title}</h3>
                    {s.isPopular && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{s.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      ₹ {s.price}
                    </div>
                    <div className="text-[10px] text-slate-400">{s.priceUnit}</div>
                  </div>

                  <button
                    onClick={() => handleDeleteService(s.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                    title="Delete service"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Timings & Quick Info */}
      {activeTab === 'hours' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            Opening Hours & Quick Information Attributes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Opening Hours */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">Weekly Business Timings</h3>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <div key={day} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold capitalize text-slate-600 dark:text-slate-400 w-24">{day}</span>
                  <input
                    type="text"
                    value={data.openingHours?.[day] || '09:00 AM - 08:30 PM'}
                    onChange={(e) => {
                      const newHours = { ...(data.openingHours || {}), [day]: e.target.value };
                      setData({ ...data, openingHours: newHours });
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ))}
            </div>

            {/* Quick Info & Suggestions */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">Quick Info & Suggestion Tag</h3>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Tag Suggestion Chip (Screenshot 1 & 2)
                </label>
                <input
                  type="text"
                  value={data.quickInfo?.tagSuggestion || '"Reasonably priced" 4 Suggestions'}
                  onChange={(e) => {
                    const qi = { ...(data.quickInfo || {}), tagSuggestion: e.target.value };
                    setData({ ...data, quickInfo: qi });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Response Speed Tag
                </label>
                <input
                  type="text"
                  value={data.quickInfo?.responseSpeed || 'Responds in 10 Mins'}
                  onChange={(e) => {
                    const qi = { ...(data.quickInfo || {}), responseSpeed: e.target.value };
                    setData({ ...data, quickInfo: qi });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Distance Tag
                </label>
                <input
                  type="text"
                  value={data.quickInfo?.distance || '6.44 km'}
                  onChange={(e) => {
                    const qi = { ...(data.quickInfo || {}), distance: e.target.value };
                    setData({ ...data, quickInfo: qi });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Reviews & Ratings */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Add Review Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Add Customer Review & Testimonial
            </h2>

            <form onSubmit={handleAddReview} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reviewer Name *</label>
                  <input
                    type="text"
                    required
                    value={reviewForm.reviewerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                    placeholder="e.g. Rahul Pal"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Star Rating (1 - 5) *</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                  >
                    <option value={5}>5.0 ★★★★★</option>
                    <option value={4}>4.0 ★★★★☆</option>
                    <option value={3}>3.0 ★★★☆☆</option>
                    <option value={2}>2.0 ★★☆☆☆</option>
                    <option value={1}>1.0 ★☆☆☆☆</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Highlight Tags (comma separated)</label>
                  <input
                    type="text"
                    value={reviewForm.tagsString}
                    onChange={(e) => setReviewForm({ ...reviewForm, tagsString: e.target.value })}
                    placeholder="Reasonably priced, Sanitised equipment"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Review Comment *</label>
                <textarea
                  rows={3}
                  required
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Dhairya Enterprises is great! They use sanitised equipment, which makes me feel safe..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Owner Reply (optional)</label>
                <input
                  type="text"
                  value={reviewForm.ownerReply}
                  onChange={(e) => setReviewForm({ ...reviewForm, ownerReply: e.target.value })}
                  placeholder="Thank you for choosing us!"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Review</span>
              </button>
            </form>
          </div>

          {/* Existing Reviews List */}
          <div className="space-y-3">
            {data.reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{r.reviewerName}</span>
                    <span className="flex items-center gap-0.5 text-xs font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                      {r.rating}.0 <Star className="w-3 h-3 fill-white" />
                    </span>
                    <span className="text-[11px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 italic">{r.comment}</p>

                  {r.ownerReply && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-xs">
                      <span className="font-bold text-teal-600">Response from Owner: </span>
                      <span className="text-slate-600 dark:text-slate-300">{r.ownerReply}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteReview(r.id)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 self-end sm:self-start"
                  title="Delete review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
