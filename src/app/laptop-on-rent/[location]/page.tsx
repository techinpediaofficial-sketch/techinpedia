import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RequestQuoteModal from '@/components/RequestQuoteModal';
import { CheckCircle2, MonitorSmartphone, Server, ShieldCheck, Cpu, HardDrive, HelpCircle, PhoneCall, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { db } from '@/lib/db';
import { getLocationData, ncrLocations } from '@/lib/locations';

export async function generateMetadata({ params }: { params: Promise<{ location: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const loc = getLocationData(resolvedParams.location.toLowerCase());
  if (!loc) return { title: 'Not Found' };
  
  return {
    title: `Laptop on Rent in ${loc.city} | Dell, HP, Lenovo & MacBook`,
    description: `Rent laptops in ${loc.city} from TechInPedia. Serving ${loc.areas.slice(0, 3).join(', ')} and more. Choose Dell, HP, Lenovo and MacBook laptops for offices, events, and corporates.`,
    alternates: {
      canonical: `https://techinpedia.com/laptop-on-rent/${loc.slug}`,
    }
  };
}

export default async function LaptopLocationPage({ params }: { params: Promise<{ location: string }> }) {
  const resolvedParams = await params;
  const loc = getLocationData(resolvedParams.location.toLowerCase());
  if (!loc) notFound();

  // Fetch product pages from DB
  const products = await db.seoLandingPage.findMany({
    where: { 
      internalName: { startsWith: 'PRODUCT:' },
      status: 'PUBLISHED'
    }
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com';
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` },
      { '@type': 'ListItem', position: 3, name: 'Laptop Rental', item: `${siteUrl}/services/laptop-rental` },
      { '@type': 'ListItem', position: 4, name: `Laptop on Rent ${loc.city}`, item: `${siteUrl}/laptop-on-rent/${loc.slug}` }
    ]
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-slate-50 to-white overflow-hidden relative">
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-violet-100/40 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Doorstep Delivery in {loc.city}</span>
              <span className="text-slate-300">•</span>
              <a href="tel:+919818768680" className="text-emerald-700 hover:text-emerald-950 underline flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" /> +91 98187 68680
              </a>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Laptop on Rent in <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">{loc.city}</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              {loc.description}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 pt-6">
              <a
                href="tel:+919818768680"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="w-4 h-4" /> Call: +91 98187 68680
              </a>
              <RequestQuoteModal serviceName={`Laptop Rental in ${loc.city}`} />
              <Link 
                href="/laptop-rental-price"
                className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:border-violet-300 hover:text-violet-600 transition-all shadow-sm flex items-center gap-2"
              >
                View Rental Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Available Models & Tech Specs */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900">Premium Laptops from Top Brands</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                We maintain an extensive inventory of enterprise-grade laptops ready to be deployed across <strong>{loc.city}</strong>. Whether you need an entry-level Core i3 for basic data entry or a powerhouse Apple Silicon MacBook for video rendering, we have you covered.
              </p>
              <ul className="space-y-4 pt-2">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Dell Laptops on Rent:</strong> Latitude, XPS, and Vostro series (Core i3/i5/i7)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>HP Laptops on Rent:</strong> EliteBook and ProBook commercial series</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Lenovo Laptops on Rent:</strong> ThinkPad robust enterprise laptops</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>MacBook on Rent:</strong> Apple MacBook Air & Pro (M1, M2, M3 chips)</span>
                </li>
              </ul>
            </div>
            <div className="relative h-[450px] w-full rounded-3xl overflow-hidden shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=1200&auto=format&fit=crop"
                alt={`Laptops on rent in ${loc.city}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience & Use Cases */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Who Can Rent & Use Cases</h2>
            <p className="mt-4 text-slate-600 text-lg">We cater to a wide variety of business requirements with customized rental tenures.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-violet-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-6">
                <MonitorSmartphone className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Corporate Offices</h3>
              <p className="text-slate-600 text-sm">Deploy laptops for new employees, temporary staff, and expanding teams without CapEx.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-violet-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                <Server className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Events & Exhibitions</h3>
              <p className="text-slate-600 text-sm">Short-term rentals for 1 to 7 days for event registrations, exhibitions, and conferences.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-violet-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Work From Home</h3>
              <p className="text-slate-600 text-sm">Reliable laptops delivered to employee homes with VPN and security tools pre-installed.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-violet-200 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mb-6">
                <Cpu className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Software Developers</h3>
              <p className="text-slate-600 text-sm">High RAM and fast NVMe SSD configurations for compiling code and running local environments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      {products.length > 0 && (
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Top Laptops on Rent in {loc.city}</h2>
              <p className="mt-4 text-slate-600 text-lg">Browse our premium fleet of ready-to-deploy laptops perfectly tailored for your business needs.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map(product => (
                <Link key={product.id} href={`/${product.slug}`} className="bg-white rounded-3xl shadow-sm border border-slate-100 hover:border-violet-300 hover:shadow-xl transition-all overflow-hidden flex flex-col group">
                  <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                    <img 
                      src={product.heroImage || 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop'} 
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
                      {product.heroHeading || product.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-3">
                      {product.metaDescription || product.heroSubheading}
                    </p>
                    <span className="text-violet-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      View Details &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      {products.length > 0 && (
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Top Laptops on Rent in {loc.city}</h2>
              <p className="mt-4 text-slate-600 text-lg">Browse our premium fleet of ready-to-deploy laptops perfectly tailored for your business needs.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map(product => (
                <Link key={product.id} href={`/${product.slug}`} className="bg-white rounded-3xl shadow-sm border border-slate-100 hover:border-violet-300 hover:shadow-xl transition-all overflow-hidden flex flex-col group">
                  <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                    <img 
                      src={product.heroImage || 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop'} 
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
                      {product.heroHeading || product.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-3">
                      {product.metaDescription || product.heroSubheading}
                    </p>
                    <span className="text-violet-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      View Details &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Local Delivery & Areas */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-violet-900 rounded-[3rem] p-10 lg:p-16 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600 rounded-full blur-[100px] opacity-50 -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Fast Delivery in {loc.city}</h2>
                <p className="text-violet-100 text-lg leading-relaxed">
                  {loc.addressContext} We guarantee <strong>{loc.deliveryTime.toLowerCase()}</strong> for standard configurations.
                </p>
                <div className="pt-4 space-y-4">
                  <h4 className="font-semibold text-violet-200 uppercase tracking-wider text-sm">Key Service Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {loc.areas.map(area => (
                      <span key={area} className="px-4 py-2 rounded-full bg-violet-800/50 border border-violet-700 text-sm">
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
                    <p className="mt-1 text-sm text-violet-100">Contact us with your configuration and quantity requirement.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">2</div>
                    <p className="mt-1 text-sm text-violet-100">Submit standard KYC documents (Company PAN, GST, Address Proof).</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">3</div>
                    <p className="mt-1 text-sm text-violet-100">Make the security deposit (if applicable) and advance rental payment.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">4</div>
                    <p className="mt-1 text-sm text-white font-semibold">Receive the sanitized, configured laptops at your location.</p>
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
                  <HelpCircle className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-slate-600 pl-7 leading-relaxed">{faq.a}</p>
              </div>
            ))}
            
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <span>What documents are required for corporate rentals?</span>
              </h3>
              <p className="text-slate-600 pl-7 leading-relaxed">We require the Company PAN Card, GST Registration Certificate, Director/Authorized Signatory ID Proof, and a signed Rental Agreement or Purchase Order.</p>
            </div>
            
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <span>Is a security deposit required?</span>
              </h3>
              <p className="text-slate-600 pl-7 leading-relaxed">Yes, a refundable security deposit is typically required. The amount depends on the laptop configuration and quantity. Corporate clients undergoing financial KYC may qualify for zero-deposit leases.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl font-extrabold text-slate-900">Ready to Rent a Laptop in {loc.city}?</h2>
          <p className="text-xl text-slate-600">Get an instant quote tailored to your configuration and rental duration.</p>
          <div className="flex justify-center">
             <RequestQuoteModal serviceName={`Laptop Rental in ${loc.city}`} />
          </div>
        </div>
      </section>
      
      {/* Internal Linking Helper */}
      <section className="py-12 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-4">Explore More TechInPedia Rental Services</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/laptop-on-rent" className="text-violet-600 hover:underline">Laptop on Rent in Delhi NCR</Link>
                <Link href="/desktop-on-rent" className="text-violet-600 hover:underline">Desktop on Rent in Delhi NCR</Link>
                <Link href="/laptop-rental-price" className="text-violet-600 hover:underline">Laptop Rental Pricing</Link>
                {ncrLocations.filter(k => k.slug !== loc.slug).slice(0, 15).map(other => (
                    <Link key={other.slug} href={`/laptop-on-rent/${other.slug}`} className="text-slate-500 hover:text-violet-600 hover:underline">
                        Laptop on Rent in {other.city}
                    </Link>
                ))}
            </div>
        </div>
      </section>

    </>
  );
}
