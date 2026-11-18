import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RequestQuoteModal from '@/components/RequestQuoteModal';
import { CheckCircle2, Monitor, HardDrive, HelpCircle, Building2, Zap, Server, PhoneCall, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { getLocationData, ncrLocations } from '@/lib/locations';

export async function generateMetadata({ params }: { params: Promise<{ location: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const loc = getLocationData(resolvedParams.location.toLowerCase());
  if (!loc) return { title: 'Not Found' };
  
  return {
    title: `Desktop on Rent in ${loc.city} | Dell, HP & Lenovo Computers`,
    description: `Rent desktops and computers in ${loc.city} from TechInPedia. Choose high-performance Dell, HP, Lenovo PCs for offices, BPOs, and events. Serving ${loc.areas.slice(0, 3).join(', ')}.`,
    alternates: {
      canonical: `https://techinpedia.com/desktop-on-rent/${loc.slug}`,
    }
  };
}

export default async function DesktopLocationPage({ params }: { params: Promise<{ location: string }> }) {
  const resolvedParams = await params;
  const loc = getLocationData(resolvedParams.location.toLowerCase());
  if (!loc) notFound();

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-blue-50 to-white overflow-hidden relative">
        <div className="absolute top-0 left-0 -translate-y-1/4 -translate-x-1/4 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-300 text-blue-900 text-xs sm:text-sm font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Doorstep Delivery & Setup in {loc.city}</span>
              <span className="text-slate-300">•</span>
              <a href="tel:+919211729690" className="text-blue-700 hover:text-blue-950 underline flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" /> +91 92117 29690
              </a>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Desktop on Rent in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{loc.city}</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              {loc.description}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 pt-6">
              <a
                href="tel:+919211729690"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="w-4 h-4" /> Call: +91 92117 29690
              </a>
              <RequestQuoteModal serviceName={`Desktop Rental in ${loc.city}`} />
              <Link 
                href="/desktop-rental-price"
                className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2"
              >
                View Desktop Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Available Models & Tech Specs */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[450px] w-full rounded-3xl overflow-hidden shadow-2xl order-2 lg:order-1">
              <Image 
                src="https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=1200&auto=format&fit=crop"
                alt={`Desktops and computers on rent in ${loc.city}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-slate-900">High-Performance Workstations</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                We supply complete computer setups across <strong>{loc.city}</strong> including the CPU tower, high-resolution monitor, and peripherals. Perfect for heavy compute loads, creative design, and 24/7 BPO operations.
              </p>
              <ul className="space-y-4 pt-2">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Dell OptiPlex on Rent:</strong> Reliable business-class desktops for standard office work</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>HP EliteDesk & ProDesk:</strong> Compact form factors for space-saving setups</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>GPU Workstations:</strong> Custom-built PCs with Nvidia RTX series for Video Editing & CAD</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Apple iMacs:</strong> Premium Retina display iMacs for media and design agencies</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience & Use Cases */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Who Should Rent Desktops?</h2>
            <p className="mt-4 text-slate-600 text-lg">Computers offer higher performance-to-cost ratios for stationary office teams.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">BPOs & Call Centers</h3>
              <p className="text-slate-600 text-sm">Bulk desktop deployments (20 to 500+ units) engineered for 24/7 continuous operation.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-6">
                <Monitor className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Design & VFX Studios</h3>
              <p className="text-slate-600 text-sm">High-end graphic rendering PCs equipped with Core i7/i9 processors and dedicated GPUs.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                <Server className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Finance & Trading</h3>
              <p className="text-slate-600 text-sm">Dual and triple monitor desktop configurations specifically optimized for trading floors.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Temporary Projects</h3>
              <p className="text-slate-600 text-sm">Short-term computer rentals for training institutes, workshops, and election campaigns.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Local Delivery & Areas */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-900 rounded-[3rem] p-10 lg:p-16 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[100px] opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Installation in {loc.city}</h2>
                <p className="text-blue-100 text-lg leading-relaxed">
                  {loc.addressContext} We guarantee <strong>{loc.deliveryTime.toLowerCase()}</strong> including full desk-side setup.
                </p>
                <div className="pt-4 space-y-4">
                  <h4 className="font-semibold text-blue-200 uppercase tracking-wider text-sm">Key Service Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {loc.areas.map(area => (
                      <span key={area} className="px-4 py-2 rounded-full bg-blue-800/50 border border-blue-700 text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-sm border border-white/20">
                <h3 className="text-2xl font-bold mb-4">How Rental Works</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">1</div>
                    <p className="mt-1 text-sm text-blue-100">Contact us with your configuration and quantity requirement.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">2</div>
                    <p className="mt-1 text-sm text-blue-100">Submit standard KYC documents (Company PAN, GST, Address Proof).</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">3</div>
                    <p className="mt-1 text-sm text-blue-100">Make the security deposit (if applicable) and advance rental payment.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">4</div>
                    <p className="mt-1 text-sm text-white font-semibold">Our engineers deliver and install the computers at your office.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Local FAQs */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="mt-4 text-slate-600">Local queries for {loc.city}</p>
          </div>
          
          <div className="space-y-4">
            {loc.faqs.map((faq, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-slate-600 pl-7 leading-relaxed">{faq.a}</p>
              </div>
            ))}
            
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span>What documents are required for corporate computer rentals?</span>
              </h3>
              <p className="text-slate-600 pl-7 leading-relaxed">We require the Company PAN Card, GST Registration Certificate, Director/Authorized Signatory ID Proof, and a signed Rental Agreement or Purchase Order.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span>Does the rental include maintenance?</span>
              </h3>
              <p className="text-slate-600 pl-7 leading-relaxed">Yes, all our desktop rentals come with a comprehensive maintenance SLA. If a hardware part fails, we replace it at your office immediately without any extra charge.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl font-extrabold text-slate-900">Ready to Rent Computers in {loc.city}?</h2>
          <p className="text-xl text-slate-600">Get an instant quote tailored to your configuration and rental duration.</p>
          <div className="flex justify-center">
             <RequestQuoteModal serviceName={`Desktop Rental in ${loc.city}`} />
          </div>
        </div>
      </section>

      {/* Internal Linking Helper */}
      <section className="py-12 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-4">Explore More TechInPedia Rental Services</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/desktop-on-rent" className="text-blue-600 hover:underline">Desktop on Rent in Delhi NCR</Link>
                <Link href="/laptop-on-rent" className="text-blue-600 hover:underline">Laptop on Rent in Delhi NCR</Link>
                <Link href="/desktop-rental-price" className="text-blue-600 hover:underline">Desktop Rental Pricing</Link>
                {ncrLocations.filter(k => k.slug !== loc.slug).slice(0, 15).map(other => (
                    <Link key={other.slug} href={`/desktop-on-rent/${other.slug}`} className="text-slate-500 hover:text-blue-600 hover:underline">
                        Desktop on Rent in {other.city}
                    </Link>
                ))}
            </div>
        </div>
      </section>

    </>
  );
}
