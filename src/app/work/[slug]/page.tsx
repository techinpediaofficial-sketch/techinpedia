import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getProjectWhatsAppLink } from '@/lib/whatsapp';
import { ArrowRight, ChevronLeft, CheckCircle2, MessageSquare, Layers, ExternalLink } from 'lucide-react';
import { ContentStatus } from '@prisma/client';
import { getStaticProject } from '@/lib/portfolioData';

import JsonLd from '@/components/JsonLd';
import AppScreenshotsCarousel from '@/components/AppScreenshotsCarousel';
import TechIcon from '@/components/TechIcons';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const staticProj = getStaticProject(slug);
  const dbProject = await db.project.findUnique({ where: { slug } }).catch(() => null);
  const project = staticProj || dbProject;
  if (!project) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com';
  const pageUrl = `${siteUrl}/work/${project.slug}`;
  const title = `${project.title} Case Study | TechInPedia`;
  const description = project.shortDesc;

  return {
    title,
    description,
    keywords: [project.title, project.category, 'TechInPedia', 'Case Study'],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'TechInPedia',
      type: 'article',
      images: [
        {
          url: project.featuredImage,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [project.featuredImage],
    },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const staticProj = getStaticProject(slug);
  const dbProject = await db.project.findUnique({
    where: { slug },
  }).catch(() => null);

  const rawProject = staticProj || dbProject;

  if (!rawProject) {
    notFound();
  }

  let techList: string[] = [];
  let featureList: string[] = [];
  let resultList: string[] = [];
  let rawGallery: string[] = [];

  if (staticProj) {
    techList = staticProj.technologies || [];
    featureList = staticProj.features || [];
    resultList = staticProj.results || [];
    rawGallery = staticProj.screenshots || [];
  } else if (dbProject) {
    try { techList = JSON.parse(dbProject.technologies || '[]'); } catch { techList = []; }
    try { featureList = JSON.parse(dbProject.features || '[]'); } catch { featureList = []; }
    try { resultList = JSON.parse(dbProject.results || '[]'); } catch { resultList = []; }
    try { rawGallery = JSON.parse(dbProject.gallery || '[]'); } catch { rawGallery = []; }
  }

  const websiteUrl = staticProj?.liveUrl || rawGallery.find((g: string) => typeof g === 'string' && (g.startsWith('http://') || g.startsWith('https://')) && !g.includes('play.google.com'));
  const playStoreUrl = staticProj?.playStoreUrl || rawGallery.find((g: string) => typeof g === 'string' && g.includes('play.google.com'));
  const galleryList = rawGallery.filter((g: string) => typeof g === 'string' && !g.startsWith('http://') && !g.startsWith('https://') || g.includes('play-lh.googleusercontent.com'));
  const isWebsite = staticProj?.type === 'website' || !!websiteUrl || rawProject.featuredImage.includes('/screenshots/');
  const domain = websiteUrl ? websiteUrl.replace('https://', '').replace('http://', '').replace(/\/$/, '') : '';

  const project = {
    title: rawProject.title,
    slug: rawProject.slug,
    category: rawProject.category,
    clientType: (rawProject as any).clientType || (staticProj ? staticProj.clientType : ''),
    shortDesc: rawProject.shortDesc,
    description: rawProject.description || rawProject.shortDesc,
    featuredImage: rawProject.featuredImage,
    problem: (rawProject as any).problem || (isWebsite ? 'Client required a high-converting, sub-second loading web architecture with modern UX to expand reach.' : 'Users needed an intuitive, native-speed mobile interface to access on-demand services on the go.'),
    solution: (rawProject as any).solution || (isWebsite ? 'Engineered a modern web system with optimized backend APIs, instant UI responses, and clear conversion funnels.' : 'Developed an enterprise-grade mobile application deployed on Google Play Store with real-time responsiveness.'),
  };

  const whatsappLink = await getProjectWhatsAppLink(project.title);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: project.title,
        applicationCategory: project.category,
        operatingSystem: 'Android, Web, Cross-Platform',
        description: project.shortDesc,
        image: project.featuredImage,
        author: {
          '@type': 'Organization',
          name: 'TechInPedia',
          url: siteUrl,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Portfolio',
            item: `${siteUrl}/work`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: project.title,
            item: `${siteUrl}/work/${project.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={schemaData} />
      <div className="bg-[#faf8ff] py-16 text-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link href="/work" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Portfolio</span>
        </Link>

        {/* Header */}
        <div className="space-y-4 mb-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-xs font-semibold">
                {project.category}
              </span>
              {project.clientType && (
                <span className="text-xs text-slate-500 font-medium">
                  Client: {project.clientType}
                </span>
              )}
            </div>

            {websiteUrl ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 font-bold text-xs inline-flex items-center gap-2 transition-all hover:scale-105 shadow-xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Visit Live Website</span>
              </a>
            ) : playStoreUrl ? (
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 font-bold text-xs inline-flex items-center gap-2 transition-all hover:scale-105 shadow-xs"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View on Google Play</span>
              </a>
            ) : null}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            {project.title}
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            {project.shortDesc}
          </p>
        </div>

        {/* Hero Featured Image */}
        {isWebsite ? (
          <div className="rounded-3xl overflow-hidden mb-12 border border-violet-100 bg-white shadow-xl">
            <div className="px-4 py-3 bg-violet-50/70 border-b border-violet-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              </div>
              <div className="px-3 py-1 rounded-md bg-white border border-violet-200 text-xs text-slate-600 font-mono flex items-center gap-2 shadow-xs">
                <span className="text-emerald-500">🔒</span>
                <span>{domain || 'production.live'}</span>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Client Website</span>
              </span>
            </div>
            <div className="relative h-80 sm:h-[480px] w-full bg-slate-50">
              <Image
                src={project.featuredImage}
                alt={project.title}
                fill
                className="object-cover object-top"
              />
            </div>
          </div>
        ) : (
          <div className="relative h-96 w-full rounded-2xl overflow-hidden mb-12 border border-violet-100 shadow-xl bg-violet-50/30">
            <Image
              src={project.featuredImage}
              alt={project.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Problem vs Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {project.problem && (
            <div className="p-8 rounded-2xl bg-white border border-rose-100 space-y-3 shadow-sm">
              <h2 className="text-xl font-bold text-rose-500">The Problem</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{project.problem}</p>
            </div>
          )}
          {project.solution && (
            <div className="p-8 rounded-2xl bg-white border border-emerald-100 space-y-3 shadow-sm">
              <h2 className="text-xl font-bold text-emerald-600">The Solution</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{project.solution}</p>
            </div>
          )}
        </div>

        {/* Full Description */}
        <div className="p-8 rounded-2xl bg-white border border-violet-100 mb-12 space-y-4 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Project Case Study</h2>
          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>
        </div>

        {/* Key Features & Tech Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {featureList.length > 0 && (
            <div className="p-8 rounded-2xl bg-white border border-violet-100 space-y-4 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Key Features</h2>
              <div className="space-y-2.5">
                {featureList.map((f: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-violet-600 mt-1 flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-8 rounded-2xl bg-white border border-violet-100 space-y-4 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Tech Stack</h2>
            <div className="flex flex-wrap gap-2.5">
              {techList.map((tech: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3.5 py-2 rounded-xl bg-violet-50/60 border border-violet-100 text-slate-800 text-sm font-semibold flex items-center gap-2 shadow-xs hover:border-violet-300 transition-colors"
                >
                  <TechIcon name={tech} className="w-4 h-4 flex-shrink-0" />
                  <span>{tech}</span>
                </span>
              ))}
            </div>

            {resultList.length > 0 && (
              <div className="pt-6 border-t border-violet-100 space-y-3">
                <h3 className="text-base font-bold text-slate-900">Impact & Results</h3>
                <div className="space-y-2">
                  {resultList.map((res: string, rIdx: number) => (
                    <div key={rIdx} className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      ✓ {res}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Phone Mockup Image Gallery */}
        <AppScreenshotsCarousel screenshots={galleryList} title={project.title} />

        {/* Call to Action */}
        <div className="p-10 rounded-2xl bg-gradient-to-r from-violet-50 via-purple-50/50 to-indigo-50/60 border border-violet-200 text-center space-y-6 shadow-xl relative overflow-hidden">
          <h2 className="text-3xl font-extrabold text-slate-900">Want to Build Something Similar?</h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Discuss your goals with TechInPedia. We will architect a solution tailored to your business requirements.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/start-project"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-violet-500/25 transition-all"
            >
              Start Your Project
            </Link>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm inline-flex items-center gap-2 shadow-md shadow-emerald-600/20"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Discuss on WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
