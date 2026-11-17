import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & SLA Policy | TechInPedia',
  description: 'Refund policy, project cancellation, and service level agreement terms for TechInPedia freelancing development projects.',
  alternates: {
    canonical: 'https://techinpedia.com/refund-policy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { db } from '@/lib/db';

export default async function RefundPolicyPage() {
  const setting = await db.setting.findUnique({
    where: { key: 'LEGAL_REFUND_POLICY' },
  }).catch(() => null);

  const content = setting?.value || `
    <section class="space-y-4 text-sm leading-relaxed">
      <h2 class="text-xl font-bold text-white">1. Milestone & Discovery Refunds</h2>
      <p>Initial project discovery fees and completed milestone payments are non-refundable once development deliverables have been reviewed and accepted by the client.</p>
    </section>
    <section class="space-y-4 text-sm leading-relaxed mt-6">
      <h2 class="text-xl font-bold text-white">2. Cancellation Policy</h2>
      <p>Clients may cancel a project with written notice. In the event of cancellation, the client will only be billed for completed sprint work and billable hours accrued up to the date of cancellation notice.</p>
    </section>
    <section class="space-y-4 text-sm leading-relaxed mt-6">
      <h2 class="text-xl font-bold text-white">3. Bug Fix Guarantee</h2>
      <p>All custom software projects include a standard 30-day post-launch warranty period during which any technical bugs or deviations from agreed project specifications are fixed at no extra charge.</p>
    </section>
  `;

  return (
    <div className="bg-slate-950 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-slate-300">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Refund & Service Level Policy</h1>
        <p className="text-xs text-slate-400">Last updated: {setting?.updatedAt ? setting.updatedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2026'}</p>

        <div className="legal-content prose prose-invert max-w-none text-slate-300" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}
