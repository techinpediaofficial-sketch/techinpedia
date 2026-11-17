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
  Database,
  ShieldCheck,
  Zap,
  Layers,
  Users2,
  Lock,
} from 'lucide-react';

export const revalidate = 120;

export const metadata: Metadata = {
  title: 'Custom CRM & ERP System Development | TechInPedia India',
  description:
    'Architect custom enterprise CRM and ERP software tailored strictly to your business workflows. Zero monthly per-user fees, multi-branch operations, and total data privacy.',
  keywords: [
    'Custom CRM Development India',
    'Custom ERP Software Development',
    'Business Process Automation',
    'Enterprise Workflow Management',
    'Inventory & Billing Software',
  ],
  alternates: {
    canonical: 'https://techinpedia.in/services/crm-erp-development',
  },
  openGraph: {
    title: 'Custom CRM & ERP Software Engineering | TechInPedia',
    description: 'Custom business management software, automated lead pipelines, and enterprise ERP systems engineered by TechInPedia India.',
    url: 'https://techinpedia.in/services/crm-erp-development',
    siteName: 'TechInPedia India',
    type: 'website',
  },
};

export default async function CrmErpServicePage() {
  const whatsappLink = await getServiceWhatsAppLink('Custom CRM & ERP Systems');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.in';

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: 'Custom CRM & ERP Development',
        serviceType: 'Enterprise Software Engineering',
        provider: {
          '@type': 'Organization',
          name: 'TechInPedia India',
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
        },
        description: 'Bespoke enterprise CRM & ERP solutions with multi-branch management, billing, and role-based access control.',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Services', item: `${siteUrl}/services` },
          { '@type': 'ListItem', position: 3, name: 'CRM & ERP', item: `${siteUrl}/services/crm-erp-development` },
        ],
      },
    ],
  };

  const capabilities = [
    {
      title: 'Bespoke Sales Lead Pipelines',
      desc: 'Automate customer lead capture from Meta Ads, Google Ads, website forms, and WhatsApp directly into dynamic visual Kanban deal boards.',
      icon: Layers,
      badge: 'Sales Funnel',
    },
    {
      title: 'Multi-Branch Inventory & Stock Tracking',
      desc: 'Real-time stock auditing, barcode scanning, purchase orders, vendor invoices, and automated low-stock reorder warnings across warehouses.',
      icon: Database,
      badge: 'Inventory',
    },
    {
      title: 'Automated GST Billing & Invoicing',
      desc: 'Instant GST-compliant invoice generation, e-way bill readiness, recurring customer retainers, and integrated payment gateway links.',
      icon: Zap,
      badge: 'Finance',
    },
    {
      title: 'Role-Based Access Control (RBAC)',
      desc: 'Granular permissions for admins, branch managers, accountants, and field executives with comprehensive audit trails and data masking.',
      icon: Lock,
      badge: 'Security',
    },
    {
      title: 'WhatsApp & SMS Automated Triggers',
      desc: 'Send instant booking confirmations, delivery dispatches, pending payment reminders, and OTPs automatically via official Meta APIs.',
      icon: MessageSquare,
      badge: 'Instant Alerts',
    },
    {
      title: 'Zero Monthly Per-User SaaS Tax',
      desc: 'Own your source code and database 100%. Never pay exorbitant monthly per-seat fees to Salesforce or Zoho as your headcount expands.',
      icon: ShieldCheck,
      badge: '100% Ownership',
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
              <span className="px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Enterprise Software</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-extrabold uppercase tracking-wider">
                Zero Per-User SaaS Fees
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Custom CRM & ERP Systems Tailored Strictly to Your Company Workflows
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
              Stop forcing your business into rigid off-the-shelf software. TechInPedia designs bespoke enterprise CRM and ERP platforms that adapt 100% to your unique operational processes.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href="/start-project"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>Request System Architecture Call</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-xl shadow-emerald-600/20 transition-all hover:scale-105 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Discuss Requirements on WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all hover:scale-[1.02] space-y-3 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
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
