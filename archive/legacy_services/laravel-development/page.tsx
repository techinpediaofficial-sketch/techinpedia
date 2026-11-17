import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getGeneralWhatsAppLink } from '@/lib/whatsapp';
import JsonLd from '@/components/JsonLd';
import TechIcon from '@/components/TechIcons';
import {
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Zap,
  Code2,
  Server,
  Database,
  ExternalLink,
} from 'lucide-react';
import { ContentStatus } from '@prisma/client';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Laravel Development Company India | Custom PHP & Web App Services',
  description:
    'Hire expert Laravel developers in India for scalable enterprise web applications, REST APIs, SaaS platforms, and custom PHP backend solutions. Sub-second performance.',
  keywords: [
    'Laravel Development Company India',
    'Laravel Web Application Development',
    'Hire Laravel Developers India',
    'Custom PHP Development Company',
    'Laravel REST API Engineering',
    'Enterprise Laravel Services',
  ],
  alternates: {
    canonical: 'https://techinpedia.in/services/laravel-development',
  },
  openGraph: {
    title: 'Laravel Development Company India | TechInPedia',
    description:
      'Engineering high-performance Laravel web applications, REST APIs, multi-tenant SaaS platforms, and enterprise PHP solutions.',
    url: 'https://techinpedia.in/services/laravel-development',
    siteName: 'TechInPedia India',
    type: 'website',
    images: [{ url: 'https://techinpedia.in/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Laravel Development Company India | TechInPedia',
    description: 'Custom Laravel application development, API integrations, and cloud backend solutions.',
    images: ['https://techinpedia.in/og-image.jpg'],
  },
};

export default async function LaravelDevelopmentPage() {
  const whatsappLink = await getGeneralWhatsAppLink();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.in';

  // Fetch Laravel projects from DB with safe fallback
  const dbProjects = await db.project.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      technologies: { contains: 'Laravel' },
    },
    take: 3,
  }).catch(() => []);

  const fallbackProjects = [
    {
      id: 'fallback-ipl-bus-backend',
      slug: 'ipl-bus',
      title: 'IPL Bus Enterprise Booking API & Admin Portal',
      shortDesc: 'Robust Laravel REST backend with MySQL processing thousands of bus reservations and Razorpay transactions.',
      featuredImage: '/og-image.jpg',
    },
    {
      id: 'fallback-exam-sathi-api',
      slug: 'jagmohan-exam-sathi',
      title: 'Exam Sathi Content & Student Management Backend',
      shortDesc: 'High-speed Laravel API server powering thousands of live test submissions, questions bank, and automated scoring.',
      featuredImage: '/og-image.jpg',
    },
  ];

  const laravelProjects = dbProjects.length > 0 ? dbProjects : fallbackProjects;

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Laravel Web Application Development Services',
        serviceType: 'Software & Web Development',
        provider: {
          '@type': 'Organization',
          name: 'TechInPedia India',
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
        },
        areaServed: {
          '@type': 'Country',
          name: 'Worldwide',
        },
        description:
          'Enterprise Laravel web application development, custom PHP backend engineering, REST API development, and SaaS architecture built by TechInPedia India.',
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
            name: 'Services',
            item: `${siteUrl}/services`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Laravel Development',
            item: `${siteUrl}/services/laravel-development`,
          },
        ],
      },
    ],
  };

  const techStack = ['Laravel 11', 'PHP 8.3', 'MySQL 8.0', 'Redis', 'REST API', 'Docker', 'Tailwind CSS', 'Vue.js / React'];

  const laravelFeatures = [
    {
      title: 'Custom Enterprise Laravel Architectures',
      desc: 'Clean, modular MVC architecture designed for enterprise scalability, security compliance, and long-term maintainability.',
    },
    {
      title: 'High-Performance REST & GraphQL APIs',
      desc: 'Sub-second API endpoints crafted for mobile apps, third-party integrations, microservices, and single-page apps.',
    },
    {
      title: 'Multi-Tenant SaaS Engineering',
      desc: 'Complete SaaS backend engineering with database isolation, subscription billing (Stripe/Razorpay), and tenant management.',
    },
    {
      title: 'Database Optimization & Redis Caching',
      desc: 'Expert Eloquent ORM tuning, database indexing, query caching, and Redis queue management for massive user concurrency.',
    },
  ];

  return (
    <>
      <JsonLd data={schemaData} />
      <div className="bg-slate-950 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Breadcrumb Back Link */}
          <Link href="/services" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Services</span>
          </Link>

          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
                <TechIcon name="Laravel" className="w-4 h-4" />
                <span>Premier Laravel Agency India</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Custom <span className="bg-gradient-to-r from-rose-500 via-amber-400 to-rose-400 bg-clip-text text-transparent">Laravel Development</span> Services in India
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                TechInPedia India engineers secure, high-concurrency web applications, REST API backends, multi-tenant SaaS platforms, and enterprise software using Laravel & PHP 8.3.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/start-project"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
                >
                  <span>Hire Laravel Developers</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white font-bold text-sm flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Discuss Project</span>
                </a>
              </div>
            </div>

            {/* Right Card */}
            <div className="lg:col-span-5 p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-400" />
                <span>Why TechInPedia Laravel?</span>
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>PHP 8.3 & Laravel 11 Modern Codebase</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>100% Source Code & IP Ownership</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>Sub-Second Server Response Times</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>Built-in API Security & Rate Limiting</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tech Stack Pills */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white">Technologies We Combine With Laravel</h2>
            <div className="flex flex-wrap gap-2.5">
              {techStack.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold flex items-center gap-2"
                >
                  <TechIcon name={tech} className="w-4 h-4" />
                  <span>{tech}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Key Capabilities */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl font-extrabold text-white">Full-Spectrum Laravel Engineering</h2>
              <p className="text-sm text-slate-400">From custom web portals to high-load backend API engines.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {laravelFeatures.map((feat, idx) => (
                <div key={idx} className="p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 transition-all space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-rose-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Live Proof Projects */}
          {laravelProjects.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-slate-800">
              <h2 className="text-2xl font-bold text-white">Featured Projects Built With Laravel</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {laravelProjects.map((proj: any) => (
                  <Link
                    key={proj.id}
                    href={`/work/${proj.slug}`}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 transition-all space-y-3 group"
                  >
                    <div className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-950">
                      <Image src={proj.featuredImage || '/og-image.jpg'} alt={proj.title || 'Laravel Project'} fill className="object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">{proj.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{proj.shortDesc}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="p-10 rounded-3xl bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-900/50 text-center space-y-6">
            <h2 className="text-3xl font-extrabold text-white">Ready to Build Your Laravel Web App?</h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto">
              Get a custom architecture blueprint and cost estimate for your Laravel software project.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/start-project" className="px-7 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm">
                Start Your Project
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm inline-flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Talk on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
