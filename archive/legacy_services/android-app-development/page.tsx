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
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { ContentStatus } from '@prisma/client';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Android App Development Company in India | Play Store Live Apps',
  description:
    'Custom Android mobile app development company in India. Expert Flutter & native Android developers with 8+ published Google Play Store applications.',
  keywords: [
    'Android App Development Company in India',
    'Hire Android Developers India',
    'Flutter Android App Development',
    'Google Play Store Publishing Agency',
    'Mobile Application Development India',
    'Custom Mobile App Developers',
  ],
  alternates: {
    canonical: 'https://techinpedia.in/services/android-app-development',
  },
  openGraph: {
    title: 'Android App Development Company in India | TechInPedia',
    description:
      'Engineering top-rated Android applications, REST API integrations, and Flutter mobile apps published on Google Play Store.',
    url: 'https://techinpedia.in/services/android-app-development',
    siteName: 'TechInPedia India',
    type: 'website',
    images: [{ url: 'https://techinpedia.in/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Android App Development Company in India | TechInPedia',
    description: 'High-performance Android mobile apps with Google Play Store deployment.',
    images: ['https://techinpedia.in/og-image.jpg'],
  },
};

export default async function AndroidAppDevelopmentPage() {
  const whatsappLink = await getGeneralWhatsAppLink();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.in';

  // Fetch Android published apps from DB with safe fallback
  const dbProjects = await db.project.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
    },
    take: 6,
    orderBy: { displayOrder: 'asc' },
  }).catch(() => []);

  const fallbackProjects = [
    {
      id: 'fallback-ipl-bus',
      slug: 'ipl-bus',
      title: 'IPL Bus Ticket Booking App',
      shortDesc: 'Live Android app for real-time bus tracking, seat selection, and digital ticket bookings across India.',
      featuredImage: '/og-image.jpg',
      gallery: '["https://play.google.com/store/apps/details?id=com.iplbus.bmnaveen"]',
    },
    {
      id: 'fallback-jagmohan',
      slug: 'jagmohan-exam-sathi',
      title: 'Jagmohan Exam Sathi Educational App',
      shortDesc: 'Comprehensive exam preparation Android application with mock tests, video lectures, and live rank tracking.',
      featuredImage: '/og-image.jpg',
      gallery: '[]',
    },
    {
      id: 'fallback-naveen-taxi',
      slug: 'naveen-taxi',
      title: 'Naveen Taxi Driver & Passenger App',
      shortDesc: 'GPS-enabled cab booking mobile application with real-time driver dispatch and Razorpay fare settlements.',
      featuredImage: '/og-image.jpg',
      gallery: '[]',
    },
  ];

  const androidProjects = dbProjects.length > 0 ? dbProjects : fallbackProjects;

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Android Mobile Application Development Services',
        serviceType: 'Mobile App Development',
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
          'Custom Android app development, Flutter cross-platform mobile apps, REST API integration, and Google Play Store publishing engineered by TechInPedia India.',
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
            name: 'Android App Development',
            item: `${siteUrl}/services/android-app-development`,
          },
        ],
      },
    ],
  };

  const techStack = ['Android SDK', 'Flutter 3', 'Java 21', 'PHP / Laravel Backend', 'MySQL 8.0', 'REST API', 'Push Notifications'];

  return (
    <>
      <JsonLd data={schemaData} />
      <div className="bg-slate-950 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <Link href="/services" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Services</span>
          </Link>

          {/* Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Smartphone className="w-4 h-4" />
                <span>Premier Android App Agency India</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Custom <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent">Android App Development</span> Services
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                We engineer high-performance, top-rated Android applications. From Flutter cross-platform architecture to backend REST APIs and Google Play Store deployment, we handle the full product lifecycle.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/start-project"
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                >
                  <span>Build Your Android App</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white font-bold text-sm flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Discuss Requirements</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Play Store Success Rate</span>
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>8+ Live Published Google Play Apps</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Flutter Cross-Platform Efficiency</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Real-Time Push Alerts & Analytics</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Complete Source Code & Play Store Ownership</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-white">Android Mobile Technologies We Use</h2>
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

          {/* Live Android Apps Showcase */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl font-extrabold text-white">Our Live Published Android Apps</h2>
              <p className="text-sm text-slate-400">Explore real Android applications engineered for our clients and published on Google Play.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {androidProjects.map((proj: any) => {
                let galleryList: string[] = [];
                try { galleryList = JSON.parse(proj.gallery || '[]'); } catch { galleryList = []; }
                const playStoreUrl = galleryList.find((g: string) => typeof g === 'string' && g.includes('play.google.com'));

                return (
                  <div key={proj.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="relative h-40 w-full rounded-xl overflow-hidden bg-slate-950">
                        <Image src={proj.featuredImage || '/og-image.jpg'} alt={proj.title || 'Android App'} fill className="object-contain" />
                      </div>
                      <h3 className="text-lg font-bold text-white">{proj.title}</h3>
                      <p className="text-xs text-slate-300 line-clamp-3">{proj.shortDesc}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <Link href={`/work/${proj.slug}`} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                        <span>Case Study</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      {playStoreUrl && (
                        <a
                          href={playStoreUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Google Play</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="p-10 rounded-3xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-900/50 text-center space-y-6">
            <h2 className="text-3xl font-extrabold text-white">Have an Android App Idea?</h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto">
              We guide you from UI design to Play Store approval and maintenance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/start-project" className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm">
                Start Your App Project
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-sm inline-flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Talk on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
