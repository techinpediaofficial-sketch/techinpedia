import React from 'react';
import { Metadata } from 'next';
import RequestQuoteModal from '@/components/RequestQuoteModal';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, Code2, Smartphone, Monitor } from 'lucide-react';

export const metadata: Metadata = {
  title: 'E-Commerce App Development | TechInPedia',
  description: 'Mobile commerce applications for retail and D2C brands. TechInPedia provides scalable software, web, and mobile app solutions across India.',
  alternates: {
    canonical: 'https://techinpedia.com/ecommerce-app-development',
  }
};

export default function SeoPage() {
  return (
    <>
      <section className="pt-32 pb-20 bg-gradient-to-b from-slate-50 to-white overflow-hidden relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-100 blur-[100px] rounded-full pointer-events-none -z-0"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6 mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              E-Commerce App Development
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              Mobile commerce applications for retail and D2C brands. We deliver cutting-edge digital solutions tailored to your business goals. 
              Accelerate your growth with scalable, secure, and modern applications.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <RequestQuoteModal serviceName="E-Commerce App Development" />
              <Link
                href="/contact"
                className="px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all flex items-center gap-2"
              >
                Schedule Consultation
              </Link>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Custom Architecture</h3>
              <p className="text-slate-600">Built from scratch using modern tech stacks ensuring high scalability and security.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Responsive & Fast</h3>
              <p className="text-slate-600">Optimized for speed and seamless experience across all devices and platforms.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-6">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Dedicated Support</h3>
              <p className="text-slate-600">Post-deployment AMC, continuous monitoring, and quick issue resolution.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
