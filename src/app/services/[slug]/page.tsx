import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getServiceWhatsAppLink } from '@/lib/whatsapp';
import JsonLd from '@/components/JsonLd';
import { ArrowRight, CheckCircle2, MessageSquare, ChevronLeft, Sparkles, ShieldCheck, Zap, HelpCircle, MapPin } from 'lucide-react';
import RequestQuoteModal from '@/components/RequestQuoteModal';
import { ContentStatus } from '@prisma/client';
import { getCatalogService, ServiceDetail } from '@/lib/servicesCatalog';
import TechIcon from '@/components/TechIcons';
import HardwareRentalLanding from '@/components/HardwareRentalLanding';
import { ncrLocations } from '@/lib/locations';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const catalogService = getCatalogService(slug);
  const dbService = !catalogService
    ? await db.service.findUnique({ where: { slug } }).catch(() => null)
    : null;

  if (!catalogService && (!dbService || dbService.status !== ContentStatus.PUBLISHED)) {
    // If it's a marketplace category, return empty metadata so redirect takes precedence
    return {};
  }
  
  const service = catalogService || dbService!;
  const siteUrl = 'https://techinpedia.com';
  const pageUrl = `${siteUrl}/services/${service.slug}`;
  const baseTitle = (service as any).seoTitle || service.title;
  const title = baseTitle.includes('TechInPedia') ? { absolute: baseTitle } : baseTitle;
  const description = (service as any).seoDescription || service.shortDescription;

  const baseKeywords = [service.title, 'TechInPedia', 'Hardware Rental', 'Software Engineering', 'Digital Marketing'];
  
  if (slug === 'laptop-rental' || slug === 'laptop-on-rent') {
    baseKeywords.push(
      'laptop on rent', 'laptop rental', 'laptop for rent', 'laptop rental service',
      'laptop on rent Delhi', 'laptop on rent Noida', 'laptop on rent Gurgaon',
      'laptop on rent Faridabad', 'laptop on rent Ghaziabad', 'laptop on rent in Delhi NCR',
      'corporate laptop rental', 'bulk laptop rental Delhi NCR'
    );
  } else if (slug === 'computer-rental' || slug === 'desktop-on-rent') {
    baseKeywords.push(
      'desktop on rent', 'desktop rental', 'desktop for rent', 'desktop rental service',
      'desktop on rent Delhi', 'desktop on rent Noida', 'desktop on rent Gurgaon',
      'desktop on rent Faridabad', 'desktop on rent Ghaziabad', 'desktop on rent in Delhi NCR'
    );
  } else if (slug === 'macbook-rental' || slug === 'macbook-on-rent') {
    baseKeywords.push(
      'macbook on rent', 'macbook rental', 'apple macbook on rent', 'macbook air rental',
      'macbook pro on rent', 'macbook rental Delhi NCR', 'macbook rental Gurgaon', 'macbook rental Noida'
    );
  }

  return {
    title,
    description,
    keywords: baseKeywords,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'TechInPedia',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 1. If slug is an Urban marketplace category, 301 permanently redirect to Urban
  const dbCategory = await db.marketplaceCategory.findUnique({ where: { slug } }).catch(() => null);
  if (dbCategory) {
    permanentRedirect(`https://urban.techinpedia.com/category/${slug}`);
  }

  // 2. Resolve TechInPedia corporate service
  const catalogService = getCatalogService(slug);
  const dbService = !catalogService
    ? await db.service.findUnique({ where: { slug } }).catch(() => null)
    : null;

  if (!catalogService && (!dbService || dbService.status !== ContentStatus.PUBLISHED)) {
    notFound();
  }

  const rawService = catalogService || dbService!;
  let techList: string[] = [];
  let featureList: string[] = [];
  let deliverableList: string[] = [];
  let faqsList: { q: string; a: string }[] = [];

  if (catalogService) {
    techList = catalogService.technologies;
    featureList = catalogService.features;
    deliverableList = catalogService.deliverables;
    faqsList = catalogService.faqs;
  } else if (dbService) {
    try { techList = JSON.parse(dbService.technologies || '[]'); } catch { techList = []; }
    featureList = [
      'Architected for Enterprise Speed and High Reliability',
      'Dedicated Technical Account Manager & Support',
      'Data-Driven Reporting and Transparent Attribution',
      'Cross-Platform & Full-Stack Implementation',
    ];
    deliverableList = [
      'Initial Discovery & Architecture Roadmap',
      'Full Implementation & Integration',
      'Ongoing Performance Optimization',
    ];
  }

  const whatsappLink = await getServiceWhatsAppLink(rawService.title);
  const siteUrl = 'https://techinpedia.com';

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: rawService.title,
    serviceType: rawService.title,
    url: `${siteUrl}/services/${rawService.slug}`,
    provider: {
      '@type': 'Organization',
      name: 'TechInPedia',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
    },
    description: rawService.shortDescription,
    areaServed: {
      '@type': 'Country',
      name: 'India'
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` },
      { '@type': 'ListItem', position: 3, name: rawService.title, item: `${siteUrl}/services/${rawService.slug}` }
    ]
  };

  const faqSchema = faqsList.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqsList.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a
      }
    }))
  } : null;

  if ((rawService as any).category === 'Hardware & Rentals') {
    return (
      <>
        <JsonLd data={serviceSchema} />
        <JsonLd data={breadcrumbSchema} />
        {faqSchema && <JsonLd data={faqSchema} />}
        <HardwareRentalLanding service={rawService} whatsappLink={whatsappLink} />
      </>
    );
  }

  return (
    <>
      <JsonLd data={serviceSchema} />
      <JsonLd data={breadcrumbSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <div className="bg-[#faf8ff] py-16 min-h-screen text-slate-800">
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 space-y-12 ${(slug === 'laptop-rental' || slug === 'computer-rental') ? 'max-w-[1600px] w-full' : 'max-w-5xl'}`}>
          
          {/* Breadcrumb / Back Link */}
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Services</span>
          </Link>

          {/* Hero Section */}
          <div className="space-y-5">

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>{(rawService as any).category || 'Enterprise Service'}</span>
              </span>
              {(rawService as any).badge && (
                <span className="px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-extrabold uppercase tracking-wider shadow-sm">
                  {(rawService as any).badge}
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {rawService.title}
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-3xl">
              {rawService.shortDescription}
            </p>

            {/* Quick Action CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <RequestQuoteModal serviceName={rawService.title} />
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-xl bg-green-500 border border-transparent hover:bg-green-600 text-white text-sm font-bold shadow-xl shadow-green-500/20 transition-all hover:scale-105 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-white" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Detailed Overview */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-violet-100 shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Zap className="w-6 h-6 text-violet-600" />
              <span>Service Architecture & Approach</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base sm:text-lg">
                {rawService.description}
              </p>
              
              {/* Contextual Image */}
              {(slug === 'laptop-rental' || slug === 'computer-rental') && (
                <div className="relative w-full h-[300px] sm:h-[400px] rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                  <Image 
                    src={slug === 'laptop-rental' 
                      ? "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=1200&auto=format&fit=crop" 
                      : "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1200&auto=format&fit=crop"} 
                    alt={rawService.title} 
                    fill 
                    className="object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Key Capabilities & Deliverables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Features */}
            <div className="p-8 rounded-3xl bg-white border border-violet-100 space-y-5 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>What We Execute</span>
              </h3>
              <div className="space-y-3">
                {featureList.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-600 mt-2 flex-shrink-0" />
                    <span className="text-sm text-slate-600 font-medium leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables */}
            <div className="p-8 rounded-3xl bg-white border border-violet-100 space-y-5 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-violet-600" />
                <span>Guaranteed Deliverables</span>
              </h3>
              <div className="space-y-3">
                {deliverableList.map((deliv, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                    <span className="text-sm text-slate-600 font-medium leading-relaxed">{deliv}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Technologies Used */}
          {techList.length > 0 && (
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-violet-100 space-y-6 shadow-sm overflow-hidden">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <span>Technology Stack & Hardware Specifications</span>
              </h3>
              
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {(rawService as any).category === 'Hardware & Rentals' 
                  ? "We supply enterprise-grade, high-performance computing hardware backed by world-class software configurations. Our systems are rigorously tested for 24/7 uptime and peak performance for developers, designers, and BPO setups."
                  : "We leverage cutting-edge, scalable software stacks and modern architectural frameworks to ensure maximum performance, security, and reliability for your digital solutions."}
              </p>

              <div className="relative w-full h-[250px] sm:h-[350px] rounded-2xl overflow-hidden shadow-lg my-6 border border-slate-100">
                <Image 
                  src={
                    slug === 'laptop-rental' ? "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop" // MacBook stack
                    : slug === 'computer-rental' ? "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=1200&auto=format&fit=crop" // Desktop setup
                    : (rawService as any).category === 'Hardware & Rentals' ? "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop"
                    : "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop" // Code screen
                  } 
                  alt={`${rawService.title} Technologies`} 
                  fill 
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                {techList.map((tech, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100 flex items-center gap-3 hover:border-violet-300 transition-colors"
                  >
                    <TechIcon name={tech} className="w-6 h-6 text-violet-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700">{tech}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs Section */}
          {faqsList.length > 0 && (
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-violet-100 space-y-6 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-violet-600" />
                <span>Frequently Asked Questions</span>
              </h3>
              <div className="space-y-4">
                {faqsList.map((faq, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-violet-50/40 border border-violet-100 space-y-2">
                    <h4 className="text-base font-bold text-slate-900">{faq.q}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Locations Links for Laptop Rental */}
          {(slug === 'laptop-rental' || slug === 'computer-rental') && (
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-violet-100 space-y-6 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-violet-600" />
                <span>Available Across Delhi NCR</span>
              </h3>
              <p className="text-sm text-slate-600">
                We deliver high-performance hardware and provide on-site support across 50+ key commercial hubs in the National Capital Region.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {ncrLocations.map((loc) => (
                  <Link
                    key={loc.slug}
                    href={`/laptop-on-rent/${loc.slug}`}
                    className="text-xs font-semibold text-slate-700 hover:text-violet-600 hover:bg-violet-50 px-3 py-2 rounded-lg border border-transparent hover:border-violet-100 transition-colors truncate"
                  >
                    {loc.city}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Conversion CTA */}
          <div className="p-10 rounded-3xl bg-gradient-to-r from-violet-50 via-purple-50/60 to-indigo-50/70 border border-violet-200 text-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                Ready to Accelerate with {rawService.title}?
              </h2>
              <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
                Partner with TechInPedia for cutting-edge execution, rapid delivery, and dedicated account management.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <RequestQuoteModal serviceName={rawService.title} />
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-7 py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm shadow-sm transition-all hover:scale-105 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>Direct WhatsApp Consultation</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
