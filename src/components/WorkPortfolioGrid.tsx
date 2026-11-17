'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ExternalLink, Globe, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import TechIcon from '@/components/TechIcons';
import { UnifiedProject } from '@/lib/portfolioData';

export default function WorkPortfolioGrid({ initialProjects }: { initialProjects: UnifiedProject[] }) {
  const [filter, setFilter] = useState<'all' | 'website' | 'app'>('all');

  const filtered = filter === 'all'
    ? initialProjects
    : initialProjects.filter((p) => p.type === filter);

  const websiteCount = initialProjects.filter((p) => p.type === 'website').length;
  const appCount = initialProjects.filter((p) => p.type === 'app').length;

  return (
    <div className="space-y-10">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
            filter === 'all'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25'
              : 'bg-white text-slate-600 hover:text-violet-600 hover:bg-violet-50 border border-violet-200 shadow-sm'
          }`}
        >
          All Engineering Projects ({initialProjects.length})
        </button>
        <button
          onClick={() => setFilter('website')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            filter === 'website'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25'
              : 'bg-white text-slate-600 hover:text-violet-600 hover:bg-violet-50 border border-violet-200 shadow-sm'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Live Production Websites ({websiteCount})</span>
        </button>
        <button
          onClick={() => setFilter('app')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            filter === 'app'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/25'
              : 'bg-white text-slate-600 hover:text-violet-600 hover:bg-violet-50 border border-violet-200 shadow-sm'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-violet-600" />
          <span>Mobile Apps on Google Play ({appCount})</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((project) => {
          const isWebsite = project.type === 'website';
          const domain = project.liveUrl
            ? project.liveUrl.replace('https://', '').replace('http://', '').replace(/\/$/, '')
            : '';

          return (
            <div
              key={project.slug}
              className="group rounded-3xl bg-white border border-violet-100 hover:border-violet-300 hover:shadow-[0_15px_35px_rgba(128,46,227,0.12)] transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm"
            >
              <div>
                {/* Browser top-bar for websites */}
                {isWebsite ? (
                  <div className="px-4 py-2.5 bg-violet-50/70 border-b border-violet-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                    </div>
                    <div className="px-2 py-0.5 rounded bg-white border border-violet-200 text-[10px] text-slate-600 font-mono truncate max-w-[170px] flex items-center gap-1 shadow-xs">
                      <span className="text-emerald-500">🔒</span>
                      <span className="truncate">{domain || 'production.live'}</span>
                    </div>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live</span>
                    </span>
                  </div>
                ) : (
                  <div className="p-5 pb-0 flex items-start justify-between gap-4">
                    <div className="relative w-16 h-16 rounded-2xl border border-violet-200 bg-violet-50/50 p-1.5 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                      <div className="relative w-full h-full rounded-xl overflow-hidden">
                        <Image
                          src={project.featuredImage}
                          alt={project.title}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-600 uppercase tracking-wider inline-flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        <span>Google Play</span>
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">{project.category.split('/')[0]}</p>
                    </div>
                  </div>
                )}

                {/* Real Preview Screenshot */}
                {isWebsite ? (
                  <div className="relative h-48 sm:h-52 w-full bg-slate-50 overflow-hidden border-b border-violet-100">
                    <Image
                      src={project.featuredImage}
                      alt={`${project.title} Screenshot`}
                      fill
                      className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold pointer-events-none">
                      <span className="px-2.5 py-0.5 rounded-md bg-white/95 border border-violet-200 text-violet-600 backdrop-blur-sm shadow-sm">
                        {project.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-white/95 border border-emerald-200 text-emerald-600 backdrop-blur-sm shadow-sm">
                        Web Platform
                      </span>
                    </div>
                  </div>
                ) : (
                  project.screenshots && project.screenshots.length > 0 && (
                    <div className="px-5 pt-3">
                      <Link href={`/work/${project.slug}`} className="block group/screen relative h-48 sm:h-52 w-full rounded-2xl overflow-hidden border border-violet-100 bg-violet-50/30 shadow-inner">
                        <Image
                          src={project.screenshots[0]}
                          alt={`${project.title} Screenshot`}
                          fill
                          className="object-cover object-top group-hover/screen:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold">
                          <span className="px-2 py-0.5 rounded-md bg-white/95 border border-emerald-200 text-emerald-600 backdrop-blur-sm shadow-sm">
                            Play Store App
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white/95 border border-violet-200 text-slate-700 backdrop-blur-sm shadow-sm">
                            {project.screenshots.length} Screens →
                          </span>
                        </div>
                      </Link>
                    </div>
                  )
                )}

                {/* Title & Short Description */}
                <div className="p-6 pt-4 space-y-2">
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-violet-600 transition-colors leading-snug">
                    {project.title}
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {project.shortDesc}
                  </p>

                  {/* Tech stack tags */}
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {project.technologies.slice(0, 4).map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-violet-50/60 border border-violet-100 text-[10px] text-slate-700 font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <TechIcon name={tech} className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{tech}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-violet-50/40 border-t border-violet-100 flex items-center justify-between">
                <Link
                  href={`/work/${project.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700"
                >
                  <span>Read Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-200 text-xs font-bold hover:bg-violet-600 hover:text-white transition-all shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Visit Live Site</span>
                  </a>
                ) : project.playStoreUrl ? (
                  <a
                    href={project.playStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Google Play</span>
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
