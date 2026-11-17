'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  Star,
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Filter,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Zap,
  Users,
  Search,
  Bell,
  RefreshCw,
  AlertCircle,
  X,
  Lock,
  Download,
  Check
} from 'lucide-react';

interface VendorLead {
  id: string;
  customerName: string;
  company?: string | null;
  category: string;
  mode: 'B2C' | 'B2B';
  city: string;
  locality: string;
  timeAgo: string;
  description: string;
  budget: string;
  phone: string;
  email: string;
  unlocked: boolean;
  score: number;
}

interface PurchaseSuccessInfo {
  packName: string;
  credits: number;
  paymentId: string;
  invoiceRef: string;
}

export default function VendorHubPage() {
  const [leads, setLeads] = useState<VendorLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'B2C' | 'B2B'>('ALL');
  const [leadCredits, setLeadCredits] = useState(18);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');

  // Checkout states
  const [selectedPack, setSelectedPack] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<PurchaseSuccessInfo | null>(null);

  // Fetch real leads from API
  const fetchLeads = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (activeTab !== 'ALL') params.set('mode', activeTab);
      if (selectedCity) params.set('city', selectedCity);

      const res = await fetch(`/api/vendor/leads?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.leads)) {
        setLeads(data.leads);
        if (typeof data.vendorCredits === 'number') {
          setLeadCredits(data.vendorCredits);
        }
      }
    } catch (err) {
      console.error('Failed to fetch vendor leads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedCity]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Unlock contact handler
  const handleUnlockLead = async (leadId: string) => {
    if (leadCredits <= 0) {
      setShowRechargeModal(true);
      return;
    }

    setUnlockingId(leadId);

    try {
      const res = await fetch('/api/vendor/leads/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, vendorId: 'Apex Aircon Systems' }),
      });

      const data = await res.json();

      if (data.success && data.lead) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  unlocked: true,
                  customerName: data.lead.customerName,
                  phone: data.lead.phone,
                  email: data.lead.email,
                }
              : l
          )
        );
        setLeadCredits((prev) => Math.max(0, prev - 1));
      } else {
        alert(data.error || 'Failed to unlock lead. Please try again.');
      }
    } catch (err) {
      console.error('Error unlocking lead:', err);
      alert('Network error while unlocking contact.');
    } finally {
      setUnlockingId(null);
    }
  };

  // Razorpay Checkout handler
  const handleRazorpayCheckout = async () => {
    setPurchasing(true);
    try {
      // 1. Create Order on Backend
      const orderRes = await fetch('/api/marketplace/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: selectedPack,
          vendorId: 'Apex Aircon Systems',
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Order creation failed');
      }

      // Check if Razorpay JS SDK can be loaded
      let razorpayLoaded = false;
      if (typeof window !== 'undefined') {
        if ((window as any).Razorpay) {
          razorpayLoaded = true;
        } else {
          try {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://checkout.razorpay.com/v1/checkout.js';
              script.onload = () => resolve(true);
              script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
              document.body.appendChild(script);
            });
            razorpayLoaded = true;
          } catch (e) {
            razorpayLoaded = false;
          }
        }
      }

      // 2. Open Razorpay Checkout or Sandbox Flow
      if (razorpayLoaded && !orderData.isSimulated && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay({
          key: orderData.keyId,
          amount: Math.round(orderData.amount * 100),
          currency: orderData.currency,
          name: 'Urban Marketplace',
          description: orderData.pack.name,
          order_id: orderData.orderId,
          prefill: {
            name: 'Apex Aircon Systems',
            email: 'billing@apexaircon.com',
            contact: '9818628880',
          },
          theme: { color: '#10b981' },
          handler: async (response: any) => {
            await verifyAndCredit(response);
          },
          modal: {
            ondismiss: () => setPurchasing(false),
          },
        });
        rzp.open();
      } else {
        // High-Fidelity Sandbox / Direct Test Flow
        const simulatedPaymentId = `pay_sim_${Date.now().toString().slice(-8)}`;
        const simulatedSignature = 'simulated_valid_sig';
        await verifyAndCredit({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: simulatedPaymentId,
          razorpay_signature: simulatedSignature,
        });
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(err.message || 'Payment initiation failed.');
      setPurchasing(false);
    }
  };

  const verifyAndCredit = async (paymentResponse: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    try {
      const res = await fetch('/api/marketplace/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentResponse,
          packId: selectedPack,
          vendorId: 'Apex Aircon Systems',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLeadCredits((prev) => prev + data.addedCredits);
        setPurchaseSuccess({
          packName: data.packName,
          credits: data.addedCredits,
          paymentId: data.paymentId,
          invoiceRef: data.invoiceRef,
        });
      } else {
        alert(data.error || 'Payment verification failed.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      alert('Network error while verifying payment.');
    } finally {
      setPurchasing(false);
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (activeTab === 'B2C') return l.mode === 'B2C';
    if (activeTab === 'B2B') return l.mode === 'B2B';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-3">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 bg-emerald-500 text-slate-950 rounded-xl flex items-center justify-center font-black text-lg">
                  U
                </div>
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Urban<span className="text-emerald-400">Market</span>
                </span>
              </Link>
              <div className="h-4 w-px bg-slate-800"></div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Vendor Workspace
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs shadow-inner">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">Credits Remaining:</span>
                <span className="font-bold text-emerald-400">{leadCredits} Leads</span>
              </div>

              <button
                onClick={() => {
                  setPurchaseSuccess(null);
                  setShowRechargeModal(true);
                }}
                className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
              >
                + Top Up
              </button>

              <Link
                href="/"
                className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors"
              >
                Marketplace View
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Vendor Profile Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 rounded-3xl border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20 flex-shrink-0">
              A
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">Apex Aircon Systems & Spares</h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Gold Verified Partner
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-amber-400" /> 4.9 (342 Reviews)
                </span>
              </div>
              <p className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Noida Sector 63, Delhi NCR
                </span>
                <span>•</span>
                <span>
                  Active Plan: <strong className="text-slate-200">Pro Growth</strong>
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">Lead Fanout Active</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => {
                setPurchaseSuccess(null);
                setShowRechargeModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>+ Buy Lead Credits</span>
            </button>
          </div>
        </div>

        {/* Operational KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <span className="text-xs text-slate-400 font-medium">Available Lead Credits</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{leadCredits} Leads</div>
            <div className="text-[11px] text-slate-500 mt-1">Instant 1-credit unlock</div>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <span className="text-xs text-slate-400 font-medium">Live Matching Leads</span>
            <div className="text-2xl font-black text-white mt-1">{leads.length}</div>
            <div className="text-[11px] text-emerald-400 mt-1">Real-time CRM stream</div>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <span className="text-xs text-slate-400 font-medium">Average Response Time</span>
            <div className="text-2xl font-black text-cyan-400 mt-1">11 Mins</div>
            <div className="text-[11px] text-slate-500 mt-1">Ranked Top 5% in Region</div>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
            <span className="text-xs text-slate-400 font-medium">Platform Commission</span>
            <div className="text-2xl font-black text-amber-400 mt-1">0%</div>
            <div className="text-[11px] text-slate-500 mt-1">Direct buyer deals</div>
          </div>
        </div>

        {/* Live Marketplace Leads Feed */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h2 className="text-xl font-bold text-white">Live Inbound Leads Matching Your Category</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time enquiries posted by buyers in your configured service categories and cities.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Refresh button */}
              <button
                onClick={() => fetchLeads(true)}
                disabled={refreshing}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1.5"
                title="Refresh leads feed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Filter Tabs */}
              <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    activeTab === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({leads.length})
                </button>
                <button
                  onClick={() => setActiveTab('B2C')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    activeTab === 'B2C' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  B2C Services
                </button>
                <button
                  onClick={() => setActiveTab('B2B')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    activeTab === 'B2B' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  B2B Wholesale
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-400">Loading live marketplace leads...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredLeads.length === 0 && (
            <div className="py-16 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 p-8 space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No active leads in this view</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Inbound customer requirements will appear here as soon as buyers post requests on Urban Marketplace.
              </p>
            </div>
          )}

          {/* Leads List */}
          {!loading && filteredLeads.length > 0 && (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-slate-950 rounded-2xl border border-slate-800/90 p-5 sm:p-6 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        {lead.id.slice(0, 10).toUpperCase()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          lead.mode === 'B2B'
                            ? 'bg-blue-950/80 text-blue-400 border border-blue-800'
                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {lead.mode === 'B2B' ? 'B2B RFQ' : 'B2C Service'}
                      </span>
                      <span className="text-xs font-bold text-white">{lead.category}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {lead.timeAgo}
                      </span>
                      <span className="ml-auto md:ml-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400">
                        Score: {lead.score}/100
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      &ldquo;{lead.description}&rdquo;
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1 text-slate-300 font-semibold">
                        Customer: {lead.customerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {lead.locality}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-emerald-400 font-semibold">
                        <Phone className="w-3.5 h-3.5" />
                        {lead.phone}
                      </span>
                      {lead.unlocked && lead.email && (
                        <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                          ✉ {lead.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-850">
                    {lead.unlocked ? (
                      <>
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(
                            lead.customerName
                          )}%2C%20this%20is%20Apex%20Aircon%20Systems%20regarding%20your%20requirement%20for%20${encodeURIComponent(
                            lead.category
                          )}%20on%20Urban%20Market.`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp Quote</span>
                        </a>
                        <a
                          href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      </>
                    ) : (
                      <button
                        onClick={() => handleUnlockLead(lead.id)}
                        disabled={unlockingId === lead.id}
                        className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                      >
                        {unlockingId === lead.id ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                            <span>Unlocking...</span>
                          </>
                        ) : (
                          <>
                            <span>Unlock Contact (1 Credit)</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Credit Recharge Modal (Razorpay Standard Online Checkout) */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowRechargeModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {purchaseSuccess ? (
              /* Success State */
              <div className="py-6 text-center space-y-5 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Payment Successful!</h3>
                  <p className="text-sm text-emerald-400 font-semibold mt-1">
                    +{purchaseSuccess.credits} Lead Credits Added to Your Wallet
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Package: {purchaseSuccess.packName} • Invoice: {purchaseSuccess.invoiceRef}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment ID:</span>
                    <span className="font-mono text-emerald-400">{purchaseSuccess.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">New Available Balance:</span>
                    <span className="font-bold text-white">{leadCredits} Credits</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowRechargeModal(false)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
                >
                  Continue to Leads Feed
                </button>
              </div>
            ) : (
              /* Package Selection & Razorpay Checkout */
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Purchase Lead Credits</h3>
                      <p className="text-xs text-slate-400">
                        Instant credit unlock via Razorpay (UPI, NetBanking, Cards)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Starter Pack */}
                  <div
                    onClick={() => setSelectedPack('starter')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedPack === 'starter'
                        ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-500/10'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedPack === 'starter' ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-700'
                      }`}>
                        {selectedPack === 'starter' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">Starter Pack</div>
                        <div className="text-xs text-slate-400">10 Verified Leads (₹100/lead)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-white text-base">₹999</div>
                      <span className="text-[10px] text-slate-500">+18% GST (₹1,179)</span>
                    </div>
                  </div>

                  {/* Growth Pack */}
                  <div
                    onClick={() => setSelectedPack('growth')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between relative ${
                      selectedPack === 'growth'
                        ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-500/20'
                        : 'border-emerald-500/40 bg-slate-950 hover:border-emerald-500'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                      Most Popular
                    </span>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedPack === 'growth' ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-700'
                      }`}>
                        {selectedPack === 'growth' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">Growth Pack</div>
                        <div className="text-xs text-slate-400">30 Verified Leads (₹83/lead)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-emerald-400 text-base">₹2,499</div>
                      <span className="text-[10px] text-slate-500">+18% GST (₹2,949)</span>
                    </div>
                  </div>

                  {/* Enterprise Pack */}
                  <div
                    onClick={() => setSelectedPack('enterprise')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedPack === 'enterprise'
                        ? 'border-blue-500 bg-blue-950/20 shadow-md shadow-blue-500/10'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedPack === 'enterprise' ? 'border-blue-500 bg-blue-500 text-slate-950' : 'border-slate-700'
                      }`}>
                        {selectedPack === 'enterprise' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">Enterprise Wholesale Pack</div>
                        <div className="text-xs text-slate-400">100 Verified Leads (₹70/lead)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-white text-base">₹6,999</div>
                      <span className="text-[10px] text-slate-500">+18% GST (₹8,259)</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Trigger */}
                <div className="space-y-3 pt-1">
                  <button
                    onClick={handleRazorpayCheckout}
                    disabled={purchasing}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-60"
                  >
                    {purchasing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing Secure Checkout...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>
                          Pay ₹{selectedPack === 'starter' ? '1,179' : selectedPack === 'growth' ? '2,949' : '8,259'} via Razorpay
                        </span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>256-Bit Encrypted Razorpay Gateway • 100% Secure Checkout</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
