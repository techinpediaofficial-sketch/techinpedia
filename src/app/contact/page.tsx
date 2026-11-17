import type { Metadata } from 'next';
import { Suspense } from 'react';
import JsonLd from '@/components/JsonLd';
import ContactFormClient from '@/components/ContactFormClient';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: 'Contact Us | Inquire About Hardware Rentals, Software & Marketing | TechInPedia' },
  description: 'Connect with TechInPedia for enterprise laptop/computer rentals, IT AMC maintenance, custom web & mobile apps, and ROI-focused digital marketing.',
  alternates: {
    canonical: 'https://techinpedia.com/contact',
  },
  openGraph: {
    title: 'Contact TechInPedia | Hardware, Software & Marketing',
    description: 'Get in touch with TechInPedia for hardware rentals, custom software engineering, and digital growth marketing.',
    url: 'https://techinpedia.com/contact',
    siteName: 'TechInPedia',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact TechInPedia',
    description: 'Get in touch for enterprise hardware rentals, software engineering, and digital marketing.',
  },
};

export default function ContactPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com';

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact TechInPedia',
    url: `${siteUrl}/contact`,
    description: 'Contact TechInPedia for laptop rentals, software development, and growth marketing.',
    mainEntity: {
      '@type': 'Organization',
      name: 'TechInPedia',
      url: siteUrl,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91 98765 43210',
        contactType: 'customer service',
        email: 'contact@techinpedia.com',
      },
    },
  };

  return (
    <>
      <JsonLd data={schemaData} />

      <div className="bg-[#faf8ff] py-16 text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 border border-violet-200 text-violet-700">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>Get In Touch</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Let&apos;s Build & Scale Together
            </h1>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Need bulk laptop rentals, a high-converting mobile/web application, or a viral marketing campaign? Send us your requirements or reach out on WhatsApp.
            </p>
          </div>

          <Suspense fallback={<div className="py-12 text-center text-violet-600">Loading inquiry form...</div>}>
            <ContactFormClient />
          </Suspense>

        </div>
      </div>
    </>
  );
}
