import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | TechInPedia',
  description: 'Privacy policy and data protection disclosures for TechInPedia website, client enquiries, and software development services.',
  alternates: {
    canonical: 'https://techinpedia.com/privacy-policy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { db } from '@/lib/db';

export default async function PrivacyPolicyPage() {
  const setting = await db.setting.findUnique({
    where: { key: 'LEGAL_PRIVACY_POLICY' },
  }).catch(() => null);

  const content = setting?.value || `
    <section class="space-y-4 text-sm leading-relaxed">
      <h2 class="text-xl font-bold text-white">1. Information We Collect</h2>
      <p>When you submit a contact enquiry, start a project proposal, or interact with TechInPedia, we collect personal information such as your name, email address, phone number, company name, project requirements, and budget details.</p>
    </section>
    <section class="space-y-4 text-sm leading-relaxed mt-6">
      <h2 class="text-xl font-bold text-white">2. How We Use Your Information</h2>
      <p>We use your submitted data exclusively to evaluate your software development requests, provide technical proposals, deliver our engineering services, communicate project updates, and respond to your inquiries.</p>
    </section>
    <section class="space-y-4 text-sm leading-relaxed mt-6">
      <h2 class="text-xl font-bold text-white">3. Data Protection & Security</h2>
      <p>We enforce strict security practices including database encryption, secure HTTP-only cookies, and restricted administrative access to prevent unauthorized disclosure of client information. We do not sell, rent, or trade client data to third parties.</p>
    </section>
    <section class="space-y-4 text-sm leading-relaxed mt-6">
      <h2 class="text-xl font-bold text-white">4. Contact Us</h2>
      <p>If you have questions regarding this Privacy Policy, please contact us at <a href="mailto:contact@techinpedia.com" class="text-blue-400 underline">contact@techinpedia.com</a>.</p>
    </section>
  `;

  return (
    <div className="bg-slate-950 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-slate-300">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Last updated: {setting?.updatedAt ? setting.updatedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2026'}</p>
        
        <div className="legal-content prose prose-invert max-w-none text-slate-300" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}
