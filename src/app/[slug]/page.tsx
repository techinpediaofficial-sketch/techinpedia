export const dynamic = "force-dynamic";

import { notFound, permanentRedirect } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import ContactFormClient from '@/components/ContactFormClient';
import Link from 'next/link';
import { headers } from 'next/headers';
import { ncrLocations } from '@/lib/locations';
import JsonLd from '@/components/JsonLd';

// Helper to fetch the page or handle redirects
async function getSeoPage(slug: string) {
  const page = await db.seoLandingPage.findUnique({
    where: { slug }
  });

  if (page && page.status === 'PUBLISHED') {
    return page;
  }

  // If page not found or not published, check for redirects
  const pageRedirect = await db.seoPageRedirect.findUnique({
    where: { oldPath: slug }
  });

  if (pageRedirect) {
    permanentRedirect(`https://techinpedia.com/${pageRedirect.newPath}`);
  }

  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const headersList = await headers();
  const host = (headersList.get('x-forwarded-host') || headersList.get('host') || '').toLowerCase();
  if (
    host.includes('admin.techinpedia.com') ||
    host.includes('urban.techinpedia.com') ||
    process.env.NEXT_PUBLIC_SITE_CODE === 'MARKETPLACE_PUBLIC'
  ) {
    permanentRedirect(`https://techinpedia.com/${resolvedParams.slug}`);
  }

  const page = await getSeoPage(resolvedParams.slug);
  
  if (!page) return {};

  const url = page.canonicalUrl || `https://techinpedia.com/${page.slug}`;

  return {
    title: (page.metaTitle || page.title).includes('TechInPedia') ? { absolute: page.metaTitle || page.title } : (page.metaTitle || page.title),
    description: page.metaDescription,
    keywords: page.focusKeyword ? [page.focusKeyword] : [],
    alternates: {
      canonical: url,
    },
    robots: {
      index: page.robotsIndex,
      follow: page.robotsFollow,
    },
    openGraph: {
      title: page.ogTitle || page.metaTitle || page.title,
      description: page.ogDescription || page.metaDescription || undefined,
      url: url,
      images: page.ogImage ? [{ url: page.ogImage }] : [],
    },
  };
}

export default async function SeoLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const headersList = await headers();
  const host = (headersList.get('x-forwarded-host') || headersList.get('host') || '').toLowerCase();
  if (
    host.includes('admin.techinpedia.com') ||
    host.includes('urban.techinpedia.com') ||
    process.env.NEXT_PUBLIC_SITE_CODE === 'MARKETPLACE_PUBLIC'
  ) {
    permanentRedirect(`https://techinpedia.com/${resolvedParams.slug}`);
  }

  const page = await getSeoPage(resolvedParams.slug);
  console.log("=== SEO Landing Page Result ===", !!page);
  
  if (!page) {
    notFound();
  }

  let blocks: any[] = [];
  try {
    blocks = JSON.parse(page.blocks || '[]');
  } catch (e) {
    console.error('Error parsing blocks for page', page.slug, e);
  }

  // Ensure there's always an Enquiry block at the end if not explicitly added
  if (!blocks.some(b => b.type === 'ENQUIRY')) {
    blocks.push({
      id: 'default-enquiry',
      type: 'ENQUIRY',
      data: {
        heading: 'Ready to Get Started?',
        subheading: 'Request a free consultation and customized quote.'
      }
    });
  }

  // Extract FAQ items if FAQ block exists
  const faqBlock = blocks.find((b) => b.type === 'FAQ');
  let faqList: { q: string; a: string }[] = [];
  if (faqBlock) {
    try {
      faqList = JSON.parse(faqBlock.data.items || '[]');
    } catch {}
  }

  const pageCanonical = page.canonicalUrl || `https://techinpedia.com/${page.slug}`;

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.heroHeading || page.title,
    serviceType: (page as any).serviceType || page.title,
    url: pageCanonical,
    provider: {
      '@type': 'Organization',
      name: 'TechInPedia',
      url: 'https://techinpedia.com',
      logo: 'https://techinpedia.com/logo.png',
    },
    description: page.metaDescription || page.heroSubheading || page.title,
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://techinpedia.com' },
      { '@type': 'ListItem', position: 2, name: page.title, item: pageCanonical },
    ],
  };

  const faqSchema =
    faqList.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqList.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a,
            },
          })),
        }
      : null;

  return (
    <>
      <JsonLd data={serviceSchema} />
      <JsonLd data={breadcrumbSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      {page.heroImage ? (
        <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden py-16 sm:py-24 border-b border-slate-800/80">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none -z-0"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Content Column */}
              <div className="lg:col-span-7 text-left space-y-6">
                {page.focusKeyword && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    {page.focusKeyword}
                  </div>
                )}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                  {page.heroHeading || page.title}
                </h1>
                {page.heroSubheading && (
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                    {page.heroSubheading}
                  </p>
                )}

                {/* Action CTAs */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <a
                    href={page.primaryCtaLink || '#enquiry'}
                    className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5"
                  >
                    {page.primaryCtaText || 'Request Instant Quote'}
                  </a>
                  <a
                    href={page.secondaryCtaLink || 'https://wa.me/919818768680?text=Hi%2C%20I%20am%20interested%20in%20your%20services'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/80 hover:border-slate-600 transition-all"
                  >
                    {page.secondaryCtaText || '💬 WhatsApp Us'}
                  </a>
                </div>

                {/* Quick Trust Highlights */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span> Instant Delivery in NCR
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span> Tested Hardware
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span> Free Technical Support
                  </span>
                </div>
              </div>

              {/* Right Hero Image Column */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md lg:max-w-none">
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500/30 to-violet-600/30 rounded-3xl blur-xl opacity-75"></div>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700/70 bg-slate-900/90 backdrop-blur shadow-2xl p-4 sm:p-6 flex items-center justify-center">
                    <img
                      src={page.heroImage}
                      alt={page.heroImageAlt || page.title}
                      className="w-full h-auto max-h-[420px] object-contain rounded-xl drop-shadow-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden py-20 sm:py-28 border-b border-slate-800/80">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none -z-0"></div>
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            {page.focusKeyword && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide mx-auto">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                {page.focusKeyword}
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {page.heroHeading || page.title}
            </h1>
            {page.heroSubheading && (
              <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                {page.heroSubheading}
              </p>
            )}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <a
                href={page.primaryCtaLink || '#enquiry'}
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5"
              >
                {page.primaryCtaText || 'Request Instant Quote'}
              </a>
              <a
                href={page.secondaryCtaLink || 'https://wa.me/919818768680?text=Hi%2C%20I%20am%20interested%20in%20your%20services'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/80 hover:border-slate-600 transition-all"
              >
                {page.secondaryCtaText || '💬 WhatsApp Us'}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Blocks */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        {blocks.map((block) => {
          if (block.type === 'RICH_TEXT') {
            return (
              <section key={block.id} className="prose prose-lg prose-slate max-w-4xl mx-auto">
                {block.data.heading && <h2 className="text-3xl font-bold mb-6 text-slate-900 text-center">{block.data.heading}</h2>}
                {/* Normally we'd use a markdown parser or dangerouslySetInnerHTML safely. Assuming HTML string for now. */}
                <div dangerouslySetInnerHTML={{ __html: block.data.content || '' }} />
              </section>
            );
          }

          if (block.type === 'FEATURES') {
            let items: any[] = [];
            try { items = JSON.parse(block.data.items || '[]'); } catch {}
            return (
              <section key={block.id} className="space-y-12">
                {block.data.heading && <h2 className="text-3xl font-bold text-center text-slate-900">{block.data.heading}</h2>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {items.map((item, i) => (
                    <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-center space-y-4">
                      {item.icon && (
                        <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto text-xl font-bold">
                          {item.icon[0]}
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (block.type === 'FAQ') {
            let faqs: any[] = [];
            try { faqs = JSON.parse(block.data.items || '[]'); } catch {}
            return (
              <section key={block.id} className="max-w-4xl mx-auto space-y-8">
                {block.data.heading && <h2 className="text-3xl font-bold text-center text-slate-900">{block.data.heading}</h2>}
                <div className="space-y-4">
                  {faqs.map((faq, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h4>
                      <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (block.type === 'IMAGE_TEXT') {
            const isRight = block.data.imagePosition !== 'left';
            return (
              <section key={block.id} className="max-w-7xl mx-auto">
                <div className={`flex flex-col gap-12 items-center ${isRight ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  <div className="flex-1 space-y-6">
                    {block.data.heading && <h2 className="text-3xl font-bold text-slate-900">{block.data.heading}</h2>}
                    {block.data.content && <div className="prose prose-lg prose-slate" dangerouslySetInnerHTML={{ __html: block.data.content }} />}
                  </div>
                  {block.data.image && (
                    <div className="flex-1">
                      <img src={block.data.image} alt={block.data.heading || 'Image'} className="rounded-2xl shadow-lg w-full object-cover" />
                    </div>
                  )}
                </div>
              </section>
            );
          }

          if (block.type === 'SERVICE_CARDS') {
            let items: any[] = [];
            try { items = JSON.parse(block.data.items || '[]'); } catch {}
            return (
              <section key={block.id} className="space-y-12">
                {block.data.heading && <h2 className="text-3xl font-bold text-center text-slate-900">{block.data.heading}</h2>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {items.map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group">
                      {item.image && <img src={item.image} alt={item.title} className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                        <p className="text-slate-600 leading-relaxed mb-6 flex-1">{item.description}</p>
                        {item.link && (
                          <Link href={item.link} className="text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1">
                            Learn More →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (block.type === 'PROCESS') {
            let items: any[] = [];
            try { items = JSON.parse(block.data.items || '[]'); } catch {}
            return (
              <section key={block.id} className="space-y-12 bg-slate-900 text-white rounded-3xl p-12 my-12">
                {block.data.heading && <h2 className="text-3xl font-bold text-center">{block.data.heading}</h2>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                  {items.map((item, i) => (
                    <div key={i} className="relative z-10 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto border-4 border-slate-900 shadow-xl">
                        {item.step || i + 1}
                      </div>
                      <h3 className="text-xl font-bold">{item.title}</h3>
                      <p className="text-slate-400">{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (block.type === 'WHY_CHOOSE_US') {
            let items: any[] = [];
            try { items = JSON.parse(block.data.items || '[]'); } catch {}
            return (
              <section key={block.id} className="space-y-12">
                {block.data.heading && <h2 className="text-3xl font-bold text-center text-slate-900">{block.data.heading}</h2>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-4 items-start p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex-shrink-0 flex items-center justify-center text-xl">✓</div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h4>
                        <p className="text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (block.type === 'GALLERY') {
            let items: string[] = [];
            try { items = JSON.parse(block.data.items || '[]'); } catch {}
            return (
              <section key={block.id} className="space-y-12">
                {block.data.heading && <h2 className="text-3xl font-bold text-center text-slate-900">{block.data.heading}</h2>}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((imgUrl, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-xl bg-slate-200">
                      <img src={imgUrl} alt={`Gallery image ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500 cursor-pointer" />
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (block.type === 'CTA') {
            return (
              <section key={block.id} className="bg-blue-600 rounded-3xl p-12 text-center text-white space-y-6 my-12 shadow-2xl shadow-blue-900/20">
                {block.data.heading && <h2 className="text-4xl font-extrabold">{block.data.heading}</h2>}
                {block.data.subheading && <p className="text-blue-100 text-xl max-w-2xl mx-auto">{block.data.subheading}</p>}
                {block.data.buttonText && block.data.buttonLink && (
                  <Link href={block.data.buttonLink} className="inline-block bg-white text-blue-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    {block.data.buttonText}
                  </Link>
                )}
              </section>
            );
          }

          if (block.type === 'ENQUIRY') {
            return (
              <section key={block.id} id="enquiry" className="max-w-6xl mx-auto bg-slate-100 p-6 md:p-12 rounded-3xl space-y-8 scroll-mt-20">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-bold text-slate-900">{block.data.heading || 'Let\'s Discuss Your Requirements'}</h2>
                  {block.data.subheading && <p className="text-slate-600 max-w-2xl mx-auto">{block.data.subheading}</p>}
                </div>
                <ContactFormClient />
              </section>
            );
          }

          return null;
        })}
      </div>

      {/* Locations Links Grid (Only for Products/Rentals) */}
      {(page.internalName?.startsWith('PRODUCT:') || page.internalName?.startsWith('RENTAL:')) && (
        <section className="bg-white py-12 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4">
              <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">Available Across Delhi NCR</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 text-center">
              {ncrLocations.map((loc) => (
                  <Link
                  key={loc.slug}
                  href={`/laptop-on-rent/${loc.slug}`}
                  className="text-sm font-semibold text-slate-600 hover:text-violet-600 hover:bg-violet-50 px-3 py-2 rounded-lg border border-transparent hover:border-violet-100 transition-colors truncate"
                  >
                  {loc.city}
                  </Link>
              ))}
              </div>
          </div>
        </section>
      )}
    </div>
    </>
  );
}
