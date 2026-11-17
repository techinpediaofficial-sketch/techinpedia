import React from 'react';
import { Metadata } from 'next';
import RequestQuoteModal from '@/components/RequestQuoteModal';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dell Desktop on Rent in Delhi NCR | OptiPlex Series',
  description: 'Looking for Dell Desktop on Rent in Delhi NCR? TechInPedia provides Dell Desktops with flexible daily and monthly rental plans across Delhi NCR.',
  alternates: {
    canonical: 'https://techinpedia.com/dell-desktop-on-rent',
  }
};

export default function SeoPage() {
  return (
    <>
      <section className="pt-32 pb-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6 mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Dell Desktop on Rent in Delhi NCR
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              Equip your workforce with premium Dell Desktops. We offer high-performance IT hardware on rent 
              across Delhi, Noida, Gurgaon, and the wider NCR region with flexible tenures.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <RequestQuoteModal serviceName="Dell Desktops Rental" />
              <Link 
                href="/desktop-rental-price"
                className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
              >
                View Pricing Plans
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-8">
            <div className="relative h-[400px] w-full rounded-3xl overflow-hidden shadow-xl">
              <Image 
                src="https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=1200&auto=format&fit=crop"
                alt="Dell Desktop on Rent in Delhi NCR"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900">Why Choose Our Dell Desktops?</h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                We maintain an enterprise-grade inventory of Dell Desktops optimized for performance, security, and reliability. 
                Enjoy zero maintenance costs and rapid hardware replacement guarantees.
              </p>
              <ul className="space-y-4 pt-2">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Flexible Configurations:</strong> Core i3, i5, i7, i9 & Apple Silicon with 8GB to 64GB RAM.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Same-Day Delivery:</strong> Fast deployment across Delhi, Noida, and Gurgaon.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Zero CapEx:</strong> 100% tax-deductible operational expense for corporate teams.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Linking */}
      <section className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-4">Popular Rental Categories</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/laptop-on-rent" className="text-slate-500 hover:text-blue-600 hover:underline">Laptop on Rent</Link>
                <Link href="/desktop-on-rent" className="text-slate-500 hover:text-blue-600 hover:underline">Desktop on Rent</Link>
                <Link href="/laptop-on-rent/delhi" className="text-slate-500 hover:text-blue-600 hover:underline">Laptops in Delhi</Link>
                <Link href="/desktop-on-rent/noida" className="text-slate-500 hover:text-blue-600 hover:underline">Desktops in Noida</Link>
                <Link href="/corporate-laptop-rental" className="text-slate-500 hover:text-blue-600 hover:underline">Corporate Laptops</Link>
                <Link href="/bpo-computer-rental" className="text-slate-500 hover:text-blue-600 hover:underline">BPO Computers</Link>
            </div>
        </div>
      </section>
    </>
  );
}
