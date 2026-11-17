'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Play,
  Bot,
  CheckCircle2,
  GitBranch,
  Terminal,
  Activity,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Plus,
  Layers,
  Database,
  Globe,
  MessageSquare,
  Server,
  Code,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Smartphone,
  Stethoscope,
  Cloud,
  Lock,
  Cpu,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface NodeItem {
  id: string;
  title: string;
  subtitle: string;
  typeBadge: string;
  icon: React.ReactNode;
  shape: 'pill' | 'rect' | 'circle' | 'diamond';
  status?: 'idle' | 'executing' | 'success';
  params: Record<string, string>;
  inputSample: Record<string, any>;
  outputSample: Record<string, any>;
}

interface CustomWorkflow {
  id: string;
  title: string;
  category: string;
  badge: string;
  sla: string;
  throughput: string;
  description: string;
  nodes: NodeItem[];
  connections: { from: string; to: string; label?: string; isDashed?: boolean }[];
  stagesSummary: {
    stepNumber: number;
    title: string;
    subtitle: string;
    description: string;
    techStack: string[];
    specs: { latency: string; protocol: string; database: string };
  }[];
}

const customWorkflows: CustomWorkflow[] = [
  {
    id: 'e-commerce-marketplace',
    title: 'E-Commerce & Multi-Vendor Marketplace Pipeline',
    category: 'E-Commerce',
    badge: 'High-Scale Retail Architecture',
    sla: '99.99% Checkout Uptime',
    throughput: '50,000 req/sec',
    description:
      'Multi-vendor transaction flow: Storefront Webhook → Redis Inventory Mutex Lock → Stripe Escrow Payment → AI Warehouse Dispatch Router → Live WhatsApp GPS Tracking.',
    nodes: [
      {
        id: 'ec-1',
        title: 'Shopify Webhook Ingestion',
        subtitle: '/webhooks/order-created',
        typeBadge: 'Trigger Node',
        icon: <Globe className="w-5 h-5 text-emerald-400" />,
        shape: 'pill',
        params: { path: '/webhooks/order-created', method: 'POST', auth: 'HMAC-SHA256' },
        inputSample: { order_id: 'ORD-98421', customer: 'Rahul Sharma', total: 14999 },
        outputSample: { order_id: 'ORD-98421', status: 'ingested' },
      },
      {
        id: 'ec-2',
        title: 'Redis Inventory Mutex Lock',
        subtitle: 'redis-lock:stock:JEWEL-01',
        typeBadge: 'Lock Service',
        icon: <Lock className="w-5 h-5 text-rose-400" />,
        shape: 'rect',
        params: { lockTTL: '600s', key: 'stock:JEWEL-01' },
        inputSample: { sku: 'JEWEL-01', qty: 1 },
        outputSample: { lock_acquired: true, remaining_stock: 13 },
      },
      {
        id: 'ec-3',
        title: 'Stripe Escrow Gateway',
        subtitle: 'stripe.charge.create',
        typeBadge: 'Payment Service',
        icon: <CreditCard className="w-5 h-5 text-blue-400" />,
        shape: 'rect',
        params: { currency: 'inr', capture: 'true' },
        inputSample: { amount: 14999, currency: 'inr' },
        outputSample: { payment_intent: 'pi_3M89012', status: 'succeeded' },
      },
      {
        id: 'ec-4',
        title: 'VIP Express Order Router',
        subtitle: 'order.total > ₹25,000',
        typeBadge: 'Router Node',
        icon: <GitBranch className="w-5 h-5 text-amber-400" />,
        shape: 'diamond',
        params: { condition: 'order.is_vip == true' },
        inputSample: { is_vip: true },
        outputSample: { route: 'express_air' },
      },
      {
        id: 'ec-5a',
        title: 'FedEx Air Express Dispatch',
        subtitle: 'create: expressShipment',
        typeBadge: 'Express Action',
        icon: <Server className="w-5 h-5 text-emerald-400" />,
        shape: 'rect',
        params: { priority: 'EXPRESS_AIR' },
        inputSample: { order_id: 'ORD-98421' },
        outputSample: { courier: 'FedEx Air', eta: 'Same Day' },
      },
      {
        id: 'ec-5b',
        title: 'Delhivery Ground Dispatch',
        subtitle: 'create: groundShipment',
        typeBadge: 'Standard Action',
        icon: <Server className="w-5 h-5 text-indigo-400" />,
        shape: 'rect',
        params: { priority: 'GROUND' },
        inputSample: { order_id: 'ORD-98421' },
        outputSample: { courier: 'Delhivery Ground', eta: '3 Days' },
      },
      {
        id: 'ec-6',
        title: 'WhatsApp GPS Live Stream',
        subtitle: 'whatsapp.message.send',
        typeBadge: 'Notification Action',
        icon: <MessageSquare className="w-5 h-5 text-emerald-400" />,
        shape: 'rect',
        params: { template: 'live_tracking_v1' },
        inputSample: { phone: '+919876543210', tracking_url: 'https://track.techinpedia.com/ORD-98421' },
        outputSample: { message_id: 'wamid_88192', status: 'delivered' },
      },
    ],
    connections: [
      { from: 'ec-1', to: 'ec-2' },
      { from: 'ec-2', to: 'ec-3' },
      { from: 'ec-3', to: 'ec-4' },
      { from: 'ec-4', to: 'ec-5a', label: 'true' },
      { from: 'ec-4', to: 'ec-5b', label: 'false' },
      { from: 'ec-5a', to: 'ec-6' },
    ],
    stagesSummary: [
      {
        stepNumber: 1,
        title: 'User Discovery & Cart Reservation',
        subtitle: 'Next.js SSR + Edge Redis Lock',
        description: 'Next.js App Router renders storefront. Adding item triggers temporary Redis lock to prevent double-booking.',
        techStack: ['Next.js 15', 'Redis Cache', 'GraphQL'],
        specs: { latency: '< 120ms', protocol: 'HTTP/3 / REST', database: 'Redis Cluster' },
      },
      {
        stepNumber: 2,
        title: 'Payment Gateway & Escrow Processing',
        subtitle: 'Stripe / Razorpay Webhooks',
        description: 'Processes payment payload through Stripe SDKs. Webhook receivers verify HMAC signatures before order creation.',
        techStack: ['Stripe API', 'Razorpay', 'Node.js'],
        specs: { latency: '340ms', protocol: 'HTTPS Webhook', database: 'PostgreSQL Ledger' },
      },
      {
        stepNumber: 3,
        title: 'Multi-Warehouse Order Routing Engine',
        subtitle: 'Kafka / RabbitMQ Event Dispatch',
        description: 'OrderCreated event published to Kafka. Microservices evaluate nearest warehouse and route pick tickets.',
        techStack: ['Apache Kafka', 'Node.js', 'Docker'],
        specs: { latency: '< 40ms', protocol: 'gRPC / AMQP', database: 'MySQL Replica' },
      },
      {
        stepNumber: 4,
        title: 'Inventory Mutex Commit & Ledger Audit',
        subtitle: 'ACID Transactional Update',
        description: 'Reservation lock converts to permanent stock reduction. Double-entry accounting registers vendor commission and GST.',
        techStack: ['Prisma ORM', 'MySQL 8.0'],
        specs: { latency: '24ms', protocol: 'DB Connection Pool', database: 'Relational DB' },
      },
      {
        stepNumber: 5,
        title: 'Live GPS Delivery Tracking & WebSockets',
        subtitle: 'WebSockets + Google Maps SDK',
        description: 'Driver location streams every 3 seconds to customer mobile app via WebSockets rendering live movement.',
        techStack: ['WebSockets', 'Socket.io', 'Google Maps'],
        specs: { latency: '15ms Stream', protocol: 'WSS (WebSockets)', database: 'Redis Timeseries' },
      },
      {
        stepNumber: 6,
        title: 'GST Tax Invoicing & Vendor Payout Release',
        subtitle: 'Automated PDF & Payout API',
        description: 'Delivery confirmation triggers automated GST invoice PDF generation and releases escrow funds to vendor.',
        techStack: ['PDFKit', 'AWS S3', 'Stripe Connect'],
        specs: { latency: 'Batch / Instant API', protocol: 'REST / Banking API', database: 'Encrypted S3' },
      },
    ],
  },
  {
    id: 'enterprise-crm-automation',
    title: 'Enterprise CRM & Lead Qualification Pipeline',
    category: 'CRM',
    badge: 'Sales Lead Engine',
    sla: 'Sub-second Routing',
    throughput: '100% Lead Capture',
    description:
      'Omnichannel lead capture pipeline converting cold inbound traffic into qualified sales opportunities using AI lead scoring, dynamic sales assignment, and e-signature contracts.',
    nodes: [
      {
        id: 'crm-1',
        title: 'Omnichannel Lead Capture',
        subtitle: 'Webform / WhatsApp / Meta Ads',
        typeBadge: 'Ingestion Trigger',
        icon: <FileText className="w-5 h-5 text-teal-300" />,
        shape: 'pill',
        params: { formId: 'inbound_lead_form_v2' },
        inputSample: { name: 'Vikram Mehta', email: 'vikram@finedge.com', company: 'FinEdge Solutions' },
        outputSample: { lead_id: 'lead_77192', captured: true },
      },
      {
        id: 'crm-2',
        title: 'Clearbit + GPT-4o Scoring',
        subtitle: 'enrich & intent score',
        typeBadge: 'AI Intelligence Node',
        icon: <Bot className="w-5 h-5 text-yellow-400" />,
        shape: 'rect',
        params: { model: 'gpt-4o', clearbit: 'enabled' },
        inputSample: { domain: 'finedge.com' },
        outputSample: { company_size: '250+ employees', intent_score: 88 },
      },
      {
        id: 'crm-3',
        title: 'Round-Robin Rep Assignment',
        subtitle: 'assign: salesRep',
        typeBadge: 'Load Balancer',
        icon: <Users className="w-5 h-5 text-cyan-400" />,
        shape: 'rect',
        params: { algorithm: 'weighted-round-robin' },
        inputSample: { lead_score: 88 },
        outputSample: { assigned_rep: 'Aditya V.', status: 'assigned' },
      },
      {
        id: 'crm-4',
        title: 'Intent Score > 80?',
        subtitle: 'score >= 80',
        typeBadge: 'Decision Router',
        icon: <GitBranch className="w-5 h-5 text-amber-400" />,
        shape: 'diamond',
        params: { threshold: '80' },
        inputSample: { intent_score: 88 },
        outputSample: { route: 'priority_meeting' },
      },
      {
        id: 'crm-5a',
        title: 'Calendly VIP Booking Link',
        subtitle: 'invite: priorityCall',
        typeBadge: 'Hot Lead Action',
        icon: <Calendar className="w-5 h-5 text-emerald-400" />,
        shape: 'rect',
        params: { link: 'https://calendly.com/techinpedia' },
        inputSample: { lead: 'Vikram Mehta' },
        outputSample: { calendar_sent: true },
      },
      {
        id: 'crm-5b',
        title: 'SendGrid 7-Day Drip Sequence',
        subtitle: 'send: dripEmail',
        typeBadge: 'Nurture Action',
        icon: <MessageSquare className="w-5 h-5 text-indigo-400" />,
        shape: 'rect',
        params: { sequence: 'nurture_7day' },
        inputSample: { lead: 'Vikram Mehta' },
        outputSample: { email_queued: true },
      },
      {
        id: 'crm-6',
        title: 'DocuSign E-Signature Release',
        subtitle: 'docusign.contract.create',
        typeBadge: 'Contract Action',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        shape: 'rect',
        params: { templateId: 'enterprise_saas_contract' },
        inputSample: { lead_email: 'vikram@finedge.com' },
        outputSample: { envelope_id: 'env_881920', sent: true },
      },
    ],
    connections: [
      { from: 'crm-1', to: 'crm-2' },
      { from: 'crm-2', to: 'crm-3' },
      { from: 'crm-3', to: 'crm-4' },
      { from: 'crm-4', to: 'crm-5a', label: 'true' },
      { from: 'crm-4', to: 'crm-5b', label: 'false' },
      { from: 'crm-5a', to: 'crm-6' },
    ],
    stagesSummary: [
      {
        stepNumber: 1,
        title: 'Omnichannel Lead Capture',
        subtitle: 'Webforms, Meta Ads, WhatsApp API',
        description: 'Inbound lead data ingested concurrently from website contact forms, Meta ads, and WhatsApp Business API.',
        techStack: ['Next.js API', 'WhatsApp API', 'SendGrid'],
        specs: { latency: '< 150ms', protocol: 'HTTPS Webhook', database: 'Staging Queue' },
      },
      {
        stepNumber: 2,
        title: 'AI Lead Scoring & Enrichment',
        subtitle: 'Clearbit API + GPT-4o Classifier',
        description: 'Lead profile enriched with company revenue, tech stack, and employee count. LLM scores lead buy-intent.',
        techStack: ['OpenAI GPT-4o', 'Clearbit API'],
        specs: { latency: '800ms', protocol: 'REST API', database: 'Redis Vector' },
      },
      {
        stepNumber: 3,
        title: 'Round-Robin Rep Assignment',
        subtitle: 'Dynamic Load Balancing Algorithm',
        description: 'High-value leads routed to active sales reps based on timezone, industry expertise, and current deal load.',
        techStack: ['TypeScript', 'Prisma ORM'],
        specs: { latency: '30ms', protocol: 'Internal Event Bus', database: 'MySQL DB' },
      },
      {
        stepNumber: 4,
        title: 'Automated Multi-Channel Nurture',
        subtitle: 'WhatsApp API + Drip Email Engine',
        description: 'Triggers personalized WhatsApp message and introduction email containing assigned rep Calendly link.',
        techStack: ['WhatsApp API', 'Resend Email API'],
        specs: { latency: 'Instant / Scheduled', protocol: 'REST API', database: 'BullMQ Job Store' },
      },
      {
        stepNumber: 5,
        title: 'Dynamic Proposal & E-Signature',
        subtitle: 'Automated PDF Engine & DocuSign API',
        description: 'Reps generate custom proposals in 1-click. Platform populates scope and dispatches DocuSign link.',
        techStack: ['React-PDF', 'DocuSign API', 'AWS S3'],
        specs: { latency: '2.5s PDF Render', protocol: 'HTTPS Webhook', database: 'S3 Document Bucket' },
      },
      {
        stepNumber: 6,
        title: 'Sales Funnel Analytics & Forecasting',
        subtitle: 'Real-Time Dashboard & Revenue Forecasting',
        description: 'Monitors sales cycle velocity, rep conversion ratios, and CAC on interactive chart dashboards.',
        techStack: ['Recharts', 'ClickHouse Analytics'],
        specs: { latency: '< 100ms Query', protocol: 'GraphQL Analytics', database: 'ClickHouse Warehouse' },
      },
    ],
  },
  {
    id: 'saas-multi-tenant-billing',
    title: 'SaaS Subscription & Multi-Tenant Infrastructure',
    category: 'SaaS',
    badge: 'Multi-Tenant Architecture',
    sla: '99.999% High Availability',
    throughput: '100,000+ Concurrent Tenants',
    description:
      'Cloud multi-tenant SaaS platform architecture: self-serve organization domain provisioning, SAML/Okta Single Sign-On (SSO), granular Role-Based Access Control (RBAC), Stripe metered billing, and zero-downtime tier scaling.',
    nodes: [
      {
        id: 'saas-1',
        title: 'Tenant Domain Provisioning',
        subtitle: 'subdomain.app.com + SSL',
        typeBadge: 'Provisioning Trigger',
        icon: <Cloud className="w-5 h-5 text-blue-400" />,
        shape: 'pill',
        params: { domain: 'acme.app.com', ssl: 'letsencrypt' },
        inputSample: { tenant_name: 'Acme Corp', plan: 'Enterprise Scale' },
        outputSample: { tenant_id: 'org_acme_corp', status: 'provisioned' },
      },
      {
        id: 'saas-2',
        title: 'SAML 2.0 / Okta SSO & RBAC',
        subtitle: 'auth0.saml.authenticate',
        typeBadge: 'Auth & Security',
        icon: <Lock className="w-5 h-5 text-purple-400" />,
        shape: 'rect',
        params: { provider: 'Okta SAML 2.0', rbacEngine: 'Casbin' },
        inputSample: { sso_token: 'saml_99182' },
        outputSample: { user_role: 'Super Admin', authorized: true },
      },
      {
        id: 'saas-3',
        title: 'Redis Real-Time Usage Meter',
        subtitle: 'redis.timeseries.hgetall',
        typeBadge: 'Telemetry Engine',
        icon: <Database className="w-5 h-5 text-red-400" />,
        shape: 'rect',
        params: { key: 'tenant:usage:org_acme_corp' },
        inputSample: { tenant_id: 'org_acme_corp' },
        outputSample: { api_calls: 154200, storage_gb: 42 },
      },
      {
        id: 'saas-4',
        title: 'Quota Exceeded 90%?',
        subtitle: 'usage > 90%',
        typeBadge: 'Quota Router',
        icon: <GitBranch className="w-5 h-5 text-amber-400" />,
        shape: 'diamond',
        params: { threshold: '90%' },
        inputSample: { usage_percentage: 95 },
        outputSample: { route: 'trigger_upgrade' },
      },
      {
        id: 'saas-5a',
        title: 'Stripe Metered Billing Upgrade',
        subtitle: 'stripe.subscription.update',
        typeBadge: 'Billing Action',
        icon: <CreditCard className="w-5 h-5 text-emerald-400" />,
        shape: 'rect',
        params: { targetTier: 'ENTERPRISE_SCALE' },
        inputSample: { subscription_item: 'si_88192', overage_qty: 54200 },
        outputSample: { total_due_usd: 271.0, upgraded: true },
      },
      {
        id: 'saas-5b',
        title: 'Audit DB Log Entry',
        subtitle: 'postgres.auditLog.insert',
        typeBadge: 'Audit Action',
        icon: <Server className="w-5 h-5 text-cyan-400" />,
        shape: 'rect',
        params: { logType: 'USAGE_METERING' },
        inputSample: { tenant_id: 'org_acme_corp' },
        outputSample: { logged: true },
      },
      {
        id: 'saas-6',
        title: 'Outbound HMAC Webhook Engine',
        subtitle: 'webhook.dispatch.post',
        typeBadge: 'Webhook Dispatcher',
        icon: <Globe className="w-5 h-5 text-emerald-400" />,
        shape: 'rect',
        params: { endpoint: 'https://api.acme.com/webhooks' },
        inputSample: { event: 'invoice.paid', amount_usd: 271.0 },
        outputSample: { delivered: true, response_code: 200 },
      },
    ],
    connections: [
      { from: 'saas-1', to: 'saas-2' },
      { from: 'saas-2', to: 'saas-3' },
      { from: 'saas-3', to: 'saas-4' },
      { from: 'saas-4', to: 'saas-5a', label: 'true' },
      { from: 'saas-4', to: 'saas-5b', label: 'false' },
      { from: 'saas-5a', to: 'saas-6' },
    ],
    stagesSummary: [
      {
        stepNumber: 1,
        title: 'Self-Serve Tenant Provisioning',
        subtitle: 'Automated Subdomain DNS & SSL',
        description: 'Registration provisions dedicated tenant ID, custom subdomain, and isolated DB schema with SSL.',
        techStack: ['Next.js 15', 'Cloudflare API', 'Prisma'],
        specs: { latency: '1.2s Provisioning', protocol: 'HTTPS / DNS API', database: 'Schema Isolation' },
      },
      {
        stepNumber: 2,
        title: 'Enterprise SSO & Granular RBAC',
        subtitle: 'SAML 2.0 / Okta / OAuth2 + JWT Auth',
        description: 'Enterprise users authenticate via company SSO (Okta, Azure AD). RBAC permissions enforce API access control.',
        techStack: ['NextAuth.js', 'SAML 2.0', 'Casbin RBAC'],
        specs: { latency: '< 30ms Auth', protocol: 'OAuth2 / SAML', database: 'Encrypted Vault' },
      },
      {
        stepNumber: 3,
        title: 'Metered Billing & Usage Metering',
        subtitle: 'Stripe Subscription Billing + Redis',
        description: 'API calls and storage gigabytes tracked in real-time. Usage events stream into Redis and push to Stripe.',
        techStack: ['Stripe Billing API', 'Redis Timeseries'],
        specs: { latency: '5ms Non-blocking', protocol: 'gRPC Async Stream', database: 'Redis Event Log' },
      },
      {
        stepNumber: 4,
        title: 'Outbound Webhook Delivery Engine',
        subtitle: 'Event-Driven Webhook Dispatch',
        description: 'Allows tenant developers to subscribe to platform events. Delivery worker signs payload with HMAC.',
        techStack: ['Node.js BullMQ', 'Redis', 'Crypto HMAC'],
        specs: { latency: '100ms Delivery', protocol: 'HTTPS Webhook Post', database: 'Attempt Log' },
      },
      {
        stepNumber: 5,
        title: 'Zero-Downtime Migration & Feature Flags',
        subtitle: 'Custom Feature Flags + DB Migrations',
        description: 'Features rolled out safely using tenant feature flags. Database schema migrations execute seamlessly.',
        techStack: ['Prisma Migrations', 'Feature Flags', 'Docker'],
        specs: { latency: '0ms Downtime', protocol: 'Continuous Deployment', database: 'Zero-Lock DB' },
      },
      {
        stepNumber: 6,
        title: 'SOC2 Security Audit Logging',
        subtitle: 'Immutable Event Log & Backup System',
        description: 'Every admin action and permission modification is recorded in an immutable append-only audit log bucket.',
        techStack: ['AWS CloudWatch', 'AWS S3 Glacier'],
        specs: { latency: 'Async Logging', protocol: 'Encrypted Syslog', database: 'S3 Glacier Vault' },
      },
    ],
  },
];

export default function WorkflowsPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('e-commerce-marketplace');
  const [activeNodeId, setActiveNodeId] = useState<string>('ec-1');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'output' | 'params'>('input');
  const [copied, setCopied] = useState<boolean>(false);

  const currentWorkflow =
    customWorkflows.find((w) => w.id === selectedWorkflowId) || customWorkflows[0];
  const currentNode =
    currentWorkflow.nodes.find((n) => n.id === activeNodeId) || currentWorkflow.nodes[0];

  // Set initial active node on workflow change
  useEffect(() => {
    setActiveNodeId(currentWorkflow.nodes[0].id);
    setIsExecuting(false);
    setExecutingNodeId(null);
  }, [selectedWorkflowId, currentWorkflow]);

  // Execute workflow animation loop
  const handleExecute = () => {
    if (isExecuting) return;
    setIsExecuting(true);

    currentWorkflow.nodes.forEach((node, idx) => {
      setTimeout(() => {
        setExecutingNodeId(node.id);
        setActiveNodeId(node.id);
      }, idx * 800);

      setTimeout(() => {
        if (idx === currentWorkflow.nodes.length - 1) {
          setIsExecuting(false);
          setExecutingNodeId(null);
        }
      }, idx * 800 + 700);
    });
  };

  const handleCopyJson = (data: object) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen relative overflow-hidden select-none pb-24 font-sans">
      {/* Background Volumetric Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 relative z-10 space-y-10">
        
        {/* HEADER SECTION */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest">
            <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>Interactive Node Automation Canvas</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Enterprise System Workflows &{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Node Architecture
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Multi-stage enterprise software execution workflows engineered by TechInPedia. Rendered in a sleek graphical node canvas. Click on any node, trigger, or router branch to inspect live JSON payloads and technical specs.
          </p>
        </div>

        {/* WORKFLOW SELECTOR TABS */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {customWorkflows.map((wf) => {
            const isSelected = wf.id === selectedWorkflowId;
            return (
              <button
                key={wf.id}
                onClick={() => setSelectedWorkflowId(wf.id)}
                className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 border flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-lg shadow-blue-500/25 scale-105'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <GitBranch className="w-4 h-4 text-blue-400" />
                <span>{wf.title}</span>
              </button>
            );
          })}
        </div>

        {/* GRAPHICAL NODE CANVAS & INSPECTOR CONTAINER */}
        <div className="bg-[#121316] border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl">
          
          {/* CANVAS TOP TOOLBAR */}
          <div className="bg-[#181a1f] border-b border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <div className="h-4 w-[1px] bg-slate-800 mx-1" />
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-400" />
                <span>Node Canvas: {currentWorkflow.title}</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                SLA: {currentWorkflow.sla}
              </span>
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <Activity className="w-4 h-4 text-white animate-spin" />
                    <span>Executing Flow...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-white fill-white" />
                    <span>Execute Workflow</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* MAIN VISUAL NODE CANVAS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
            
            {/* LEFT 8 COLUMNS: GRAPHICAL CANVAS NODE RENDER */}
            <div className="lg:col-span-8 bg-[#16171b] bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [bg-size:20px_20px] p-6 sm:p-10 relative overflow-x-auto min-w-[780px] flex flex-col justify-between">
              
              <div className="space-y-8 relative z-10">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                    <Activity className="w-4 h-4" />
                    <span>Custom Graph Topology ({currentWorkflow.nodes.length} Nodes)</span>
                  </span>
                  <span>Click any node card to inspect JSON payload</span>
                </div>

                {/* GRAPH NODES FLEX GRID FLOW */}
                <div className="flex flex-wrap items-center gap-6 pt-4">
                  {currentWorkflow.nodes.map((node, nIdx) => {
                    const isSelected = node.id === activeNodeId;
                    const isExecutingThis = node.id === executingNodeId;
                    const hasNext = nIdx < currentWorkflow.nodes.length - 1;

                    return (
                      <React.Fragment key={node.id}>
                        <div
                          onClick={() => setActiveNodeId(node.id)}
                          className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer min-w-[200px] flex flex-col justify-between space-y-3 ${
                            node.shape === 'pill'
                              ? 'rounded-l-full rounded-r-3xl bg-[#1f232b]'
                              : node.shape === 'diamond'
                              ? 'bg-[#262117] border-amber-500/80'
                              : 'bg-[#1f232b]'
                          } ${
                            isSelected
                              ? 'border-blue-500 ring-4 ring-blue-500/30 scale-105 z-10 shadow-2xl'
                              : isExecutingThis
                              ? 'border-emerald-500 bg-emerald-950/60 ring-4 ring-emerald-500/40 animate-pulse'
                              : 'border-slate-800 hover:border-slate-600 hover:bg-[#252a35]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                              {node.typeBadge}
                            </span>
                            {isExecutingThis ? (
                              <span className="text-[9px] font-bold text-emerald-400 animate-pulse">
                                Executing...
                              </span>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:scale-110 transition-transform">
                              {node.icon}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white leading-tight group-hover:text-blue-300">
                                {node.title}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                {node.subtitle}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CONNECTOR ARROW BETWEEN NODES */}
                        {hasNext && (
                          <div className="flex items-center gap-1 text-slate-600 font-extrabold text-xs">
                            <div className="w-4 h-[2px] bg-slate-700" />
                            <span>→</span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                <span>Architecture Engine: Enterprise Custom Node Graph</span>
                <span className="text-emerald-400 font-bold">
                  SLA Target: {currentWorkflow.sla}
                </span>
              </div>
            </div>

            {/* RIGHT 4 COLUMNS: NODE INSPECTOR DRAWER */}
            {currentNode && (
              <div className="lg:col-span-4 bg-[#181a1f] border-l border-slate-800/80 p-6 flex flex-col justify-between space-y-6">
                
                <div className="space-y-6">
                  {/* Inspector Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        Node Inspector
                      </span>
                      <h3 className="text-base font-extrabold text-white mt-0.5">
                        {currentNode.title}
                      </h3>
                    </div>

                    <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] font-bold text-emerald-400 font-mono">
                      {currentNode.typeBadge}
                    </span>
                  </div>

                  {/* Tabs: Input JSON / Output JSON / Parameters */}
                  <div className="flex items-center gap-1 bg-[#121316] p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setActiveTab('input')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'input'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Input JSON
                    </button>
                    <button
                      onClick={() => setActiveTab('output')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'output'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Output JSON
                    </button>
                    <button
                      onClick={() => setActiveTab('params')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'params'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Parameters
                    </button>
                  </div>

                  {/* TAB 1: INPUT JSON */}
                  {activeTab === 'input' && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-blue-400" />
                          <span>Input Payload JSON</span>
                        </span>
                        <button
                          onClick={() => handleCopyJson(currentNode.inputSample)}
                          className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <pre className="p-4 rounded-2xl bg-[#121316] border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[300px]">
                        {JSON.stringify(currentNode.inputSample, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* TAB 2: OUTPUT JSON */}
                  {activeTab === 'output' && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Output Result JSON</span>
                        </span>
                        <button
                          onClick={() => handleCopyJson(currentNode.outputSample)}
                          className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-700"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <pre className="p-4 rounded-2xl bg-[#121316] border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-[300px]">
                        {JSON.stringify(currentNode.outputSample, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* TAB 3: PARAMETERS */}
                  {activeTab === 'params' && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        Node Config Parameters
                      </span>
                      <div className="space-y-2">
                        {Object.entries(currentNode.params).map(([k, v], pIdx) => (
                          <div key={pIdx} className="p-3 rounded-xl bg-[#121316] border border-slate-800 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
                              {k}
                            </span>
                            <span className="text-xs font-mono text-cyan-300 block break-all">
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Custom Graphical Node Canvas by TechInPedia.</span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* COMPREHENSIVE 6-STAGE STEP-BY-STEP BREAKDOWN SECTION */}
        <div className="mt-16 space-y-8 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Detailed 6-Stage Execution Plan
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {currentWorkflow.title} Breakdown
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
                Throughput: {currentWorkflow.throughput}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentWorkflow.stagesSummary.map((stage) => (
              <div
                key={stage.stepNumber}
                className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
                      Stage {stage.stepNumber}
                    </span>
                    <span className="text-[10px] font-bold text-amber-400">
                      {stage.specs.latency}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-snug">{stage.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{stage.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {stage.techStack.map((tech, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px] font-semibold"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>{stage.specs.protocol}</span>
                    <span>{stage.specs.database}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CALL TO ACTION SECTION */}
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 p-8 sm:p-12 border border-blue-500/30 text-center space-y-6 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Custom Enterprise Architecture Engineering
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
              Need a Custom System Automation Workflow Built for Your Business?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              We design, build, and deploy self-hosted automation servers, AI Agents, Slack/WhatsApp bots, and custom SaaS API pipelines for enterprise clients globally.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/start-project"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-105"
              >
                <span>Build Custom System Workflow</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-slate-900/90 border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold text-sm transition-all"
              >
                <span>Talk to Automation Architect</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
