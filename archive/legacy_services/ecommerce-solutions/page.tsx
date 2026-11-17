import type { Metadata } from 'next';
import Link from 'next/link';
import { getServiceWhatsAppLink } from '@/lib/whatsapp';
import JsonLd from '@/components/JsonLd';
import TechIcon from '@/components/TechIcons';
import {
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  MessageSquare,
  ShoppingBag,
  Zap,
  ShieldCheck,
  CreditCard,
  Truck,
  Sparkles,
  Smartphone,
} from 'lucide-react';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Custom E-Commerce Development & Marketplace Solutions | TechInPedia',
  description:
    'Sub-second loading storefronts, multi-vendor marketplaces (like Admiles), and high-conversion checkouts built for scale by TechInPedia India.',
  keywords: [
    'E-commerce Development Company India',
    'Custom Next.js E-commerce Store',
    'Multi-Vendor Marketplace Development',
    'Razorpay Stripe Payment Integration',
    'Fast E-commerce Website Design',
  ],
  alternates: {
    canonical: 'https://techinpedia.in/services/ecommerce-solutions',
  },
  openGraph: {
    title: 'Custom E-Commerce Solutions & Marketplaces | TechInPedia',
    description: 'High-converting custom e-commerce stores, multi-vendor marketplaces, and secure payment checkout systems.',
    url: 'https://techinpedia.in/services/ecommerce-solutions',
    siteName: 'TechInPedia India',
    type: 'website',
  },
};

export default async function ECommerceServicePage() {
  const whatsappLink = await getServiceWhatsAppLink('E-Commerce Solutions');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.in';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Custom E-Commerce Store & Marketplace Solutions',
        serviceType: 'E-Commerce Software Engineering',
        provider: {
          '@type': 'Organization',
          name: 'TechInPedia India',
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
        },
        description: 'Bespoke high-speed e-commerce stores and multi-vendor on-demand platforms engineered for high transaction volume.',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` },
          { '@type': 'ListItem', position: 3, name: 'E-Commerce', item: `${siteUrl}/services/ecommerce-solutions` },
        ],
      },
    ],
  };

  const capabilities = [
    {
      title: 'Sub-Second Next.js Storefronts',
      desc: 'Server-Side Rendered (SSR) e-commerce storefronts that load in under 800ms, driving higher conversion rates and top Google Core Web Vitals scores.',
      icon: Zap,
      badge: 'Sub-Second Speed',
    },
    {
      title: 'Multi-Vendor Marketplace Platforms',
      desc: 'Architectures like our flagship Admiles Super App: multi-merchant dashboards, automated commission calculations, live order dispatch, and vendor payouts.',
      icon: ShoppingBag,
      badge: 'Multi-Vendor',
    },
    {
      title: 'Seamless Multi-Payment Gateways',
      desc: 'One-click checkout with Razorpay, Cashfree, Stripe, PhonePe, UPI QR codes, and Cash on Delivery (COD) with automated OTP fraud verification.',
      icon: CreditCard,
      badge: 'Payment Security',
    },
    {
      title: 'Automated Courier & Shipping APIs',
      desc: 'Real-time courier rate comparison and automated airway bill (AWB) generation with Shiprocket, Delhivery, Bluedart, and live GPS delivery tracking.',
      icon: Truck,
      badge: 'Logistics Sync',
    },
    {
      title: 'Mobile-First Progressive Web Apps (PWA)',
      desc: 'App-like smooth mobile shopping experiences with cart persistence, offline browsing capabilities, and direct home-screen installation.',
      icon: Smartphone,
      badge: 'Mobile First',
    },
    {
      title: 'WhatsApp & Email Recovery Triggers',
      desc: 'Automated multi-touch cart abandonment recovery via WhatsApp and email that reclaims up to 25%+ of dropped checkout sessions.',
      icon: MessageSquare,
      badge: 'Revenue Recovery',
    },
  ];

  return (
    <>
      <JsonLd data={schemaData} />
      <div className="bg-slate-950 py-16 text-slate-100 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Services</span>
          </Link>

          <div className="space-y-6 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>E-Commerce Architecture</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-extrabold uppercase tracking-wider">
                Storefronts & Marketplaces
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              High-Speed Custom E-Commerce Stores & Multi-Vendor Platforms
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
              Don’t let slow page loads kill your online sales. TechInPedia engineers custom D2C storefronts and multi-vendor marketplace engines optimized for lightning speed and frictionless checkouts.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/start-project"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-sm font-bold shadow-xl shadow-orange-500/25 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Build My Storefront</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-xl shadow-emerald-600/20 transition-all hover:scale-105 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Discuss Store Specs on WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-orange-500/40 transition-all hover:scale-[1.02] space-y-3 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-bold">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}
