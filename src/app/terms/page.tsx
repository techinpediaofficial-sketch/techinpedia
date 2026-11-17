import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | TechInPedia',
  description: 'Terms of service and engineering contract disclosures for TechInPedia freelancing software development agency.',
  alternates: {
    canonical: 'https://techinpedia.com/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { db } from '@/lib/db';

export default async function TermsPage() {
  const setting = await db.setting.findUnique({
    where: { key: 'LEGAL_TERMS_OF_SERVICE' },
  }).catch(() => null);

  const content = setting?.value || `
    <section class="space-y-4 text-sm leading-relaxed">
      <h2 class="text-xl font-bold text-white">1. Engagement & Services</h2>
      <p>TechInPedia provides software engineering, web application development, mobile development, and digital consulting services based on agreed Statements of Work (SOW) or project proposals.</p>
    </section>
    <section class="space-y-4 text-sm leading-relaxed mt-6">
      <h2 class="text-xl font-bold text-white">2. Intellectual Property Ownership</h2>
      <p>Upon full payment of project invoices, the client receives 100% full ownership of all custom source code, software architecture, database designs, and assets created specifically for the project.</p>
    </section>
    <section class="space-y-4 text-sm leading-relaxed mt-6">
      <h2 class="text-xl font-bold text-white">3. Payment Terms</h2>
      <p>Projects operate on milestone-based or hourly billing terms defined prior to kickoff. Deposits and milestone payments must be settled according to invoice schedules.</p>
    </section>
  `;

  return (
    <div className="bg-slate-950 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-slate-300">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Terms of Service</h1>
        <p className="text-xs text-slate-400">Last updated: {setting?.updatedAt ? setting.updatedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2026'}</p>

        <div className="legal-content prose prose-invert max-w-none text-slate-300" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}
