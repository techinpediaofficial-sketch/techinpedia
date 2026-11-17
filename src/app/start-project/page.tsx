import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import StartProjectWizardClient from '@/components/StartProjectWizardClient';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Start Your Project | Request a Quote | TechInPedia',
  description: 'Tell us about your hardware rental, custom software, or digital marketing requirements to receive an accurate scope estimation and proposal from TechInPedia.',
  alternates: {
    canonical: 'https://techinpedia.com/start-project',
  },
  openGraph: {
    title: 'Start Your Project & Request a Quote | TechInPedia',
    description: 'Get an accurate timeline and cost estimate for laptop rentals, custom software engineering, or marketing campaigns.',
    url: 'https://techinpedia.com/start-project',
    siteName: 'TechInPedia',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Request a Project Quote | TechInPedia',
    description: 'Tell us your requirements and receive a comprehensive proposal.',
  },
};

export default function StartProjectPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com';

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Start Your Project - Request a Quote',
    url: `${siteUrl}/start-project`,
    description: 'Request a project scope and cost estimation for hardware rentals, software development, or digital marketing.',
    publisher: {
      '@type': 'Organization',
      name: 'TechInPedia',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
    },
  };

  return (
    <>
      <JsonLd data={schemaData} />

      <div className="bg-[#faf8ff] py-16 text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-violet-50 border border-violet-200 text-violet-700 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>Interactive Scope & Quote Wizard</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Start Your Project With TechInPedia
            </h1>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Select your required services across Hardware Rentals, Custom Software, or Growth Marketing to receive a customized scope estimate and rapid kickoff proposal.
            </p>
          </div>

          <StartProjectWizardClient />

        </div>
      </div>
    </>
  );
}
