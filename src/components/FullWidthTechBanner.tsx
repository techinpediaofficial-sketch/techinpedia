'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Cpu, Zap, Server } from 'lucide-react';

export default function FullWidthTechBanner() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-white via-violet-50/40 to-white border-y border-violet-100 overflow-hidden select-none">
      {/* Background Technology Image with Subtle Light Violet Overlay */}
      <div className="absolute inset-0 z-0 opacity-15">
        <Image
          src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=2000&q=80"
          alt="High Speed Cloud Server Infrastructure"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-violet-50/80" />
      </div>

      {/* Volumetric Glows */}
      <div className="absolute top-1/2 left-10 -translate-y-1/2 w-[500px] h-[500px] bg-violet-200/30 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-10 w-[450px] h-[450px] bg-purple-200/25 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Main Banner Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column Text & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100/80 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider">
              <Server className="w-4 h-4 text-violet-600" />
              <span>Enterprise Cloud Infrastructure & Engineering</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Architected for Ultra Speed, Security & Scalability
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              We deploy custom web applications, SaaS platforms, and mobile backends on high-performance cloud infrastructure — backed by Hostinger, MilesWeb, Serverbyt, and AWS for 99.9% uptime SLA (OWNER VERIFICATION REQUIRED).
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-white border border-violet-200/80 flex items-center gap-3 shadow-sm">
                <Zap className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-800">Sub-Second Speeds</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-violet-200/80 flex items-center gap-3 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-800">JWT & CSRF Hardened</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-violet-200/80 flex items-center gap-3 col-span-2 sm:col-span-1 shadow-sm">
                <Cpu className="w-5 h-5 text-violet-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-800">Auto-Scaling Nodes</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/start-project"
                className="px-7 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-violet-500/25 transition-all hover:scale-105 inline-flex items-center gap-2"
              >
                <span>Start Your Project</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="px-7 py-4 rounded-xl bg-white border border-violet-200 text-slate-700 hover:text-violet-600 hover:border-violet-300 font-bold text-sm transition-all hover:bg-violet-50/70 shadow-sm"
              >
                Explore Services
              </Link>
            </div>
          </div>

          {/* Right Column Showcase Graphic / Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-violet-200 bg-white shadow-xl p-2 group hover:border-violet-300 transition-all duration-500">
              <div className="relative h-72 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-100">
                <Image
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
                  alt="High Performance Dashboard & Analytics"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
                
                {/* Floating Glassmorphism Metric Badge */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-violet-200 flex items-center justify-between shadow-lg">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">Benchmark Performance</div>
                    <div className="text-lg font-black text-violet-600">100/100 Lighthouse Score</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-violet-100 border border-violet-300 flex items-center justify-center text-violet-700 font-extrabold text-xs">
                    99.9%
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
