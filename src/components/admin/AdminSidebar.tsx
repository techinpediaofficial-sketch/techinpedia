'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  UserCheck,
  Building2,
  Users2,
  TrendingUp,
  CalendarCheck,
  MessageSquare,
  MessageCircle,
  Send,
  Mail,
  FileSpreadsheet,
  FileCheck,
  FileText,
  CreditCard,
  DollarSign,
  Receipt,
  FolderKanban,
  CheckSquare,
  Clock,
  UserCog,
  Briefcase,
  UserCheck2,
  CalendarDays,
  Timer,
  BadgePercent,
  LifeBuoy,
  BookOpen,
  Laptop,
  Boxes,
  ShieldCheck,
  Wrench,
  Sparkles,
  RefreshCw,
  KeyRound,
  Workflow,
  Webhook,
  BarChart3,
  Layers,
  Image as ImageIcon,
  Video,
  HelpCircle,
  Settings,
  Users,
  ShieldAlert,
  Activity,
  Code2,
  LogOut,
  ChevronDown,
  Search,
  Award,
  ArrowUpCircle,
  AlertOctagon,
  Globe,
  ShoppingBag,
  Store,
  X,
  Bot,
  Brain,
  Target,
  Route,
  LineChart,
} from 'lucide-react';
import OmniboxSearchModal from '@/components/admin/OmniboxSearchModal';
import { PermissionCode, hasPermission } from '@/lib/permissions';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  permission?: PermissionCode;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  userRole?: string;
  appRoleName?: string;
  userEmail?: string;
  userPermissions?: string[];
  isTenant?: boolean;
  companyName?: string;
  companyRole?: string;
  allowedModules?: string[];
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({
  userRole,
  appRoleName,
  userEmail,
  userPermissions = [],
  isTenant = false,
  companyName,
  companyRole,
  allowedModules = [],
  isOpen = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isOmniboxOpen, setIsOmniboxOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOmniboxOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  // Base sections definition with required permissions mapped
  const allSections: NavSection[] = [
    {
      title: 'PORTALS & COCKPITS',
      items: [
        { name: 'My ESS Portal', href: '/admin/portal', icon: UserCheck2, badge: 'Self', badgeColor: 'bg-violet-600', permission: 'portal.ess.view' },
        { name: 'Manager Cockpit', href: '/admin/dashboards/manager', icon: Users, badge: 'Team', badgeColor: 'bg-indigo-600', permission: 'cockpit.manager.view' },
        { name: 'HR Operations', href: '/admin/dashboards/hr', icon: ShieldCheck, permission: 'cockpit.hr.view' },
        { name: 'Executive Cockpit', href: '/admin/dashboards/executive', icon: BarChart3, badge: 'C-Level', badgeColor: 'bg-amber-600', permission: 'cockpit.executive.view' },
      ],
    },
    {
      title: 'CORE CRM',
      items: [
        { name: 'Leads', href: '/admin/leads', icon: Inbox, badge: 'Live', badgeColor: 'bg-blue-600', permission: 'crm.leads.view' },
        { name: 'Leads Kanban', href: '/admin/enquiries', icon: FolderKanban, badge: 'Kanban', badgeColor: 'bg-violet-600', permission: 'crm.kanban.view' },
        { name: 'Follow-up Engine', href: '/admin/follow-ups', icon: CalendarCheck, permission: 'crm.followups.manage' },
        { name: 'Meetings & Calendar', href: '/admin/meetings', icon: Video, badge: 'Meet', badgeColor: 'bg-emerald-600', permission: 'meetings.create' },
        { name: 'Customer 360', href: '/admin/customers', icon: Users2, permission: 'crm.customers.view' },
        { name: 'Companies', href: '/admin/companies', icon: Building2, permission: 'crm.companies.view' },
        { name: 'Sales Deals', href: '/admin/deals', icon: TrendingUp, permission: 'crm.deals.view' },
        { name: 'Contacts', href: '/admin/contacts', icon: UserCheck, permission: 'crm.contacts.view' },
      ],
    },
    {
      title: 'URBAN MARKETPLACE',
      items: [
        { name: 'Marketplace Cockpit', href: '/admin/marketplace', icon: BarChart3, badge: 'Urban', badgeColor: 'bg-emerald-600', permission: 'marketplace.view' },
        { name: 'Marketplace Leads', href: '/admin/marketplace/leads', icon: ShoppingBag, badge: 'Live', badgeColor: 'bg-teal-600', permission: 'marketplace.leads.view' },
        { name: 'Vendors & KYC Desk', href: '/admin/marketplace/vendors', icon: Store, badge: 'KYC', badgeColor: 'bg-amber-600', permission: 'marketplace.vendors.manage' },
        { name: 'Categories & Tree', href: '/admin/marketplace/categories', icon: Layers, badge: 'Tree', badgeColor: 'bg-blue-600', permission: 'marketplace.categories.manage' },
      ],
    },
    {
      title: 'WHATSAPP & MARKETING',
      items: [
        { name: 'WhatsApp Inbox', href: '/admin/whatsapp?tab=inbox', icon: MessageSquare, badge: 'Live', badgeColor: 'bg-emerald-600', permission: 'comm.whatsapp.view' },
        { name: 'Contacts', href: '/admin/whatsapp/contacts', icon: Users, permission: 'contacts.view' },
        { name: 'Smart Segments', href: '/admin/whatsapp/segments', icon: Layers, permission: 'whatsapp.segments.manage' },
        { name: 'Single Send', href: '/admin/whatsapp/single-send', icon: MessageCircle, permission: 'whatsapp.single_send' },
        { name: 'Broadcast Manager', href: '/admin/whatsapp/broadcasts', icon: Send, permission: 'whatsapp.campaigns.view' },
        { name: 'Drip Campaigns', href: '/admin/whatsapp/drip-campaigns', icon: Workflow, permission: 'whatsapp.drip.manage' },
        { name: 'Messages Log', href: '/admin/whatsapp/messages', icon: MessageSquare, permission: 'whatsapp.logs.view' },
        { name: 'Blacklist', href: '/admin/whatsapp/blacklist', icon: ShieldAlert, permission: 'whatsapp.suppression.manage' },
        { name: 'Automation', href: '/admin/automation', icon: Workflow, badge: 'Rules', badgeColor: 'bg-indigo-600', permission: 'automation.manage' },
        { name: 'Meta API Desk', href: '/admin/whatsapp', icon: LayoutDashboard, permission: 'whatsapp.configure' },
      ],
    },
    {
      title: 'AI & AUTOMATION',
      items: [
        { name: 'Chatbot Builder', href: '/admin/whatsapp/chatbot', icon: Bot, badge: 'Flow', badgeColor: 'bg-emerald-600', permission: 'chatbot.view' },
        { name: 'AI Brain', href: '/admin/ai/brain', icon: Brain, badge: 'AI', badgeColor: 'bg-violet-600', permission: 'ai.brain.view' },
        { name: 'AI Goals', href: '/admin/ai/goals', icon: Target, permission: 'ai.goals.manage' },
        { name: 'Knowledge Base', href: '/admin/ai/knowledge', icon: BookOpen, badge: 'RAG', badgeColor: 'bg-blue-600', permission: 'ai.knowledge.manage' },
        { name: 'Intent Routing', href: '/admin/ai/intents', icon: Route, permission: 'ai.intents.manage' },
        { name: 'AI Analytics', href: '/admin/ai/analytics', icon: LineChart, permission: 'ai.analytics.view' },
      ],
    },
    {
      title: 'SALES & FINANCE',
      items: [
        { name: 'Quotations', href: '/admin/quotations', icon: FileSpreadsheet, permission: 'sales.quotations.view' },
        { name: 'Proposals', href: '/admin/proposals', icon: FileCheck, permission: 'sales.proposals.view' },
        { name: 'Contracts', href: '/admin/contracts', icon: FileText, permission: 'sales.contracts.view' },
        { name: 'Invoices', href: '/admin/invoices', icon: CreditCard, permission: 'finance.invoice.view' },
        { name: 'Payments', href: '/admin/payments', icon: DollarSign, permission: 'finance.payment.view' },
        { name: 'Expenses', href: '/admin/expenses', icon: Receipt, permission: 'finance.expenses.view' },
      ],
    },
    {
      title: 'PROJECTS & WORK',
      items: [
        { name: 'Projects', href: '/admin/projects', icon: FolderKanban, permission: 'projects.view' },
        { name: 'Tasks & Milestones', href: '/admin/tasks', icon: CheckSquare, permission: 'projects.tasks.manage' },
        { name: 'Timesheets', href: '/admin/timesheets', icon: Clock, permission: 'projects.timesheets.manage' },
      ],
    },
    {
      title: 'HRM & WORKFORCE',
      items: [
        { name: 'Employees', href: '/admin/hr/employees', icon: UserCog, permission: 'hr.employees.view' },
        { name: 'Roles & Permissions', href: '/admin/roles', icon: ShieldCheck, permission: 'admin.roles.manage' },
        { name: 'Assignment Monitor', href: '/admin/assignments', icon: Users, permission: 'hr.assignments.view', badge: 'SLA', badgeColor: 'bg-rose-500' },
        { name: 'Departments & Teams', href: '/admin/hr/departments', icon: Building2, permission: 'hr.departments.manage' },
        { name: 'Attendance', href: '/admin/hr/attendance', icon: UserCheck2, permission: 'hr.attendance.manage' },
        { name: 'Leaves', href: '/admin/hr/leaves', icon: CalendarDays, permission: 'hr.leaves.manage' },
        { name: 'Payroll', href: '/admin/hr/payroll', icon: BadgePercent, permission: 'hr.payroll.view' },
        { name: 'Recruitment', href: '/admin/hr/jobs', icon: Briefcase, permission: 'hr.jobs.manage', badge: 'New', badgeColor: 'bg-emerald-500' },
        { name: 'Candidates', href: '/admin/hr/candidates', icon: Users, permission: 'hr.candidates.manage' },
        { name: 'Interviews', href: '/admin/hr/interviews', icon: CalendarCheck, permission: 'hr.interviews.manage' },
        { name: 'Performance', href: '/admin/hr/performance', icon: TrendingUp, permission: 'hr.performance.view', badge: 'New', badgeColor: 'bg-amber-500' },
        { name: 'Appreciations & Rewards', href: '/admin/hr/rewards', icon: Award, permission: 'hr.rewards.view' },
        { name: 'Promotions', href: '/admin/hr/promotions', icon: ArrowUpCircle, permission: 'hr.promotions.view' },
        { name: 'Warnings & PIPs', href: '/admin/hr/warnings', icon: AlertOctagon, permission: 'hr.warnings.manage' },
      ],
    },
    {
      title: 'SUPPORT & DESK',
      items: [
        { name: 'Tickets & SLA', href: '/admin/tickets', icon: LifeBuoy, permission: 'support.tickets.view' },
        { name: 'Knowledge Base', href: '/admin/kb', icon: BookOpen, permission: 'support.kb.manage' },
      ],
    },
    {
      title: 'HARDWARE & RENTAL',
      items: [
        { name: 'Asset Inventory', href: '/admin/assets', icon: Laptop, permission: 'hardware.assets.manage' },
        { name: 'Rental Orders', href: '/admin/rental-orders', icon: Boxes, permission: 'hardware.rentals.manage' },
        { name: 'AMC Contracts', href: '/admin/amc', icon: ShieldCheck, permission: 'hardware.amc.manage' },
        { name: 'Maintenance Logs', href: '/admin/maintenance', icon: Wrench, permission: 'hardware.maintenance.manage' },
      ],
    },
    {
      title: 'SAAS & LICENSING',
      items: [
        { name: 'SaaS Products', href: '/admin/saas-products', icon: Sparkles, permission: 'saas.products.manage' },
        { name: 'Subscriptions', href: '/admin/subscriptions', icon: RefreshCw, permission: 'saas.subscriptions.manage' },
        { name: 'Software Licenses', href: '/admin/licenses', icon: KeyRound, permission: 'saas.licenses.manage' },
      ],
    },
    {
      title: 'AUTOMATION & INTEGRATIONS',
      items: [
        { name: 'Workflows & Triggers', href: '/admin/workflows', icon: Workflow, permission: 'automation.workflows.manage' },
        { name: 'Google Sheets CRM', href: '/admin/integrations/google-sheets', icon: FileSpreadsheet, permission: 'integrations.sheets.manage' },
        { name: 'Webhooks & Connectors', href: '/admin/webhooks', icon: Webhook, permission: 'integrations.webhooks.manage' },
        { name: 'Integrations Hub', href: '/admin/settings/integrations', icon: Settings, permission: 'integrations.hub.manage' },
      ],
    },
    {
      title: 'ANALYTICS & REPORTS',
      items: [
        { name: 'Business Analytics', href: '/admin/analytics', icon: BarChart3, permission: 'analytics.company.view' },
        { name: 'Performance Reports', href: '/admin/reports', icon: FileSpreadsheet, permission: 'analytics.reports.manage' },
      ],
    },
    {
      title: 'WEBSITE CONTENT',
      items: [
        { name: 'SEO Pages', href: '/admin/seo-pages', icon: FileText, permission: 'admin.seo_pages.view', badge: 'New', badgeColor: 'bg-emerald-600' },
        { name: 'Services Catalog', href: '/admin/services', icon: Layers, permission: 'content.services.manage' },
        { name: 'Portfolio Showcase', href: '/admin/portfolio', icon: FolderKanban, permission: 'content.projects.manage' },
        { name: 'Blog Posts', href: '/admin/blog', icon: FileText, permission: 'content.blog.manage' },
        { name: 'News Updates', href: '/admin/news', icon: FileText, permission: 'content.news.manage', badge: 'New', badgeColor: 'bg-emerald-600' },
        { name: 'Testimonials', href: '/admin/testimonials', icon: MessageSquare, permission: 'content.testimonials.manage' },
        { name: 'FAQs', href: '/admin/faqs', icon: HelpCircle, permission: 'content.faqs.manage' },
        { name: 'Media Library', href: '/admin/media', icon: ImageIcon, permission: 'content.media.manage' },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { name: 'System Monitoring', href: '/admin/monitoring', icon: Activity, badge: 'Live', badgeColor: 'bg-emerald-600', permission: 'admin.monitoring.view' },
        { name: 'Background Jobs', href: '/admin/system/jobs', icon: Activity, badge: 'Queue', badgeColor: 'bg-blue-600', permission: 'admin.jobs.manage' },
        { name: 'Admin Users', href: '/admin/users', icon: Users, permission: 'admin.users.manage' },
        { name: 'Roles & RBAC', href: '/admin/roles', icon: ShieldAlert, permission: 'admin.roles.manage' },
        { name: 'Business Units', href: '/admin/settings/business-units', icon: Building2, badge: 'BU', badgeColor: 'bg-violet-600', permission: 'admin.business_units.manage' },
        { name: 'Sites & Domains', href: '/admin/settings/sites', icon: Globe, permission: 'admin.sites.manage' },
        { name: 'Legal Policies', href: '/admin/settings/legal', icon: FileText, permission: 'admin.legal.manage' },
        { name: 'Global Settings', href: '/admin/settings', icon: Settings, permission: 'admin.settings.manage' },
        { name: 'Audit Activity', href: '/admin/activity', icon: Clock, permission: 'admin.audit.view' },
        { name: 'Audit Trail & Diffs', href: '/admin/audit', icon: ShieldCheck, badge: 'Diffs', badgeColor: 'bg-indigo-600', permission: 'admin.audit.view' },
      ],
    },
  ];

  // Filter sections and items based on permissions and tenant isolation
  const sections = useMemo(() => {
    if (isTenant) {
      if (companyRole === 'INBOX_ONLY' || companyRole === 'AGENT') {
        return [
          {
            title: 'COMMUNICATION',
            items: [
              {
                name: 'WhatsApp Inbox',
                href: '/admin/whatsapp?tab=inbox',
                icon: MessageSquare,
                badge: 'Live',
                badgeColor: 'bg-emerald-600',
              },
            ],
          },
        ];
      }

      // Tenant Owner or Admin
      const tenantSections: NavSection[] = [];

      // WhatsApp section (default for all tenants)
      if (allowedModules.includes('whatsapp') || allowedModules.length === 0) {
        tenantSections.push({
          title: 'WHATSAPP & MARKETING',
          items: [
            {
              name: 'WhatsApp Inbox',
              href: '/admin/whatsapp?tab=inbox',
              icon: MessageSquare,
              badge: 'Live',
              badgeColor: 'bg-emerald-600',
            },
            {
              name: 'Contacts',
              href: '/admin/whatsapp/contacts',
              icon: Users,
            },
            {
              name: 'Smart Segments',
              href: '/admin/whatsapp/segments',
              icon: Layers,
            },
            {
              name: 'Single Send',
              href: '/admin/whatsapp/single-send',
              icon: MessageCircle,
            },
            {
              name: 'Broadcast Manager',
              href: '/admin/whatsapp/broadcasts',
              icon: Send,
            },
            {
              name: 'Drip Campaigns',
              href: '/admin/whatsapp/drip-campaigns',
              icon: Workflow,
            },
            {
              name: 'Messages Log',
              href: '/admin/whatsapp/messages',
              icon: MessageSquare,
            },
            {
              name: 'Blacklist',
              href: '/admin/whatsapp/blacklist',
              icon: ShieldAlert,
            },
            {
              name: 'Automation',
              href: '/admin/automation',
              icon: Workflow,
            },
            {
              name: 'Message Templates',
              href: '/admin/whatsapp?tab=templates',
              icon: FileText,
            },
            {
              name: 'Meta API Dashboard',
              href: '/admin/whatsapp',
              icon: LayoutDashboard,
            },
            {
              name: 'Connection & Health',
              href: '/admin/whatsapp?tab=status',
              icon: ShieldCheck,
            },
          ],
        });
      }

      // AI & Automation Suite (Tenant Owner / Admin / Manager / when entitled)
      if (
        companyRole === 'OWNER' ||
        companyRole === 'ADMIN' ||
        companyRole === 'MANAGER' ||
        allowedModules.includes('ai') ||
        allowedModules.includes('automation') ||
        allowedModules.length === 0
      ) {
        tenantSections.push({
          title: 'AI & AUTOMATION',
          items: [
            {
              name: 'AI Brain & API Keys',
              href: '/admin/ai/brain',
              icon: Brain,
              badge: 'AI',
              badgeColor: 'bg-violet-600',
            },
            {
              name: 'Chatbot Builder',
              href: '/admin/whatsapp/chatbot',
              icon: Bot,
              badge: 'Flow',
              badgeColor: 'bg-emerald-600',
            },
            {
              name: 'Automation Rules',
              href: '/admin/automation',
              icon: Workflow,
              badge: 'Rules',
              badgeColor: 'bg-indigo-600',
            },
            {
              name: 'AI Goals',
              href: '/admin/ai/goals',
              icon: Target,
            },
            {
              name: 'Knowledge Base',
              href: '/admin/ai/knowledge',
              icon: BookOpen,
              badge: 'RAG',
              badgeColor: 'bg-blue-600',
            },
            {
              name: 'Intent Routing',
              href: '/admin/ai/intents',
              icon: Route,
            },
            {
              name: 'AI Analytics',
              href: '/admin/ai/analytics',
              icon: LineChart,
            },
          ],
        });
      }

      // CRM Leads (if entitled)
      const crmItems: NavItem[] = [];
      if (allowedModules.includes('crm.leads') || allowedModules.includes('leads')) {
        crmItems.push(
          { name: 'Leads', href: '/admin/leads', icon: Inbox, badge: 'Live', badgeColor: 'bg-blue-600' },
          { name: 'Leads Kanban', href: '/admin/enquiries', icon: FolderKanban, badge: 'Kanban', badgeColor: 'bg-violet-600' },
          { name: 'Follow-up Engine', href: '/admin/follow-ups', icon: CalendarCheck }
        );
      }
      if (allowedModules.includes('crm.deals') || allowedModules.includes('deals')) {
        crmItems.push({ name: 'Sales Deals', href: '/admin/deals', icon: TrendingUp });
      }
      if (allowedModules.includes('crm.contacts') || allowedModules.includes('contacts')) {
        crmItems.push({ name: 'Contacts', href: '/admin/contacts', icon: UserCheck });
      }

      if (crmItems.length > 0) {
        tenantSections.push({
          title: 'CORE CRM',
          items: crmItems,
        });
      }

      // Sales & Quotations (if entitled)
      if (allowedModules.includes('sales.proposals') || allowedModules.includes('proposals')) {
        tenantSections.push({
          title: 'SALES & BILLING',
          items: [
            { name: 'Quotations', href: '/admin/quotations', icon: FileSpreadsheet },
            { name: 'Proposals', href: '/admin/proposals', icon: FileCheck },
          ],
        });
      }

      // Support Tickets (if entitled)
      if (allowedModules.includes('support.tickets') || allowedModules.includes('tickets')) {
        tenantSections.push({
          title: 'SUPPORT & DESK',
          items: [
            { name: 'Tickets & SLA', href: '/admin/tickets', icon: LifeBuoy },
          ],
        });
      }

      // Company Profile & Team Management (Tenant Owner / Admin / Manager)
      const companyItems: NavItem[] = [];
      if (companyRole === 'OWNER' || companyRole === 'ADMIN') {
        companyItems.push({
          name: 'Company Profile',
          href: '/admin/company/profile',
          icon: Building2,
        });
      }
      if (companyRole === 'OWNER' || companyRole === 'ADMIN' || companyRole === 'MANAGER') {
        companyItems.push(
          {
            name: 'Employees & Team',
            href: '/admin/company/employees',
            icon: Users,
            badge: 'Team',
            badgeColor: 'bg-emerald-600',
          },
          {
            name: 'Roles & Permissions',
            href: '/admin/company/roles',
            icon: ShieldCheck,
          },
          {
            name: 'SLA Rules & Policies',
            href: '/admin/company/sla',
            icon: Clock,
            badge: 'SLA',
            badgeColor: 'bg-amber-600',
          }
        );
      }
      if (companyItems.length > 0) {
        tenantSections.push({
          title: 'COMPANY & TEAM',
          items: companyItems,
        });
      }

      return tenantSections;
    }

    return allSections.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (isSuperAdmin) return true;
        if (!item.permission) return true;
        // Mock a TokenPayload for hasPermission logic which expects an object with role and permissions
        const mockSession = { role: userRole, permissions: userPermissions, appRoleName };
        return hasPermission(mockSession as any, item.permission);
      })
    })).filter(section => section.items.length > 0);
  }, [allSections, isSuperAdmin, userPermissions, userRole, appRoleName, isTenant, companyRole, allowedModules]);


  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => {
      const isCurrentlyCollapsed = prev[title] ?? (title !== 'CORE CRM');
      return {
        ...prev,
        [title]: !isCurrentlyCollapsed,
      };
    });
  };

  // Filter items by search query if user searches
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.name.toLowerCase().includes(q)),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchQuery, sections]);

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between h-screen w-72 md:w-64 max-w-[85vw] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 select-none transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none md:sticky md:top-0 md:z-30 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <Link
              href={isTenant ? (companyRole === 'INBOX_ONLY' ? '/admin/whatsapp?tab=inbox' : '/admin/whatsapp') : '/admin'}
              onClick={onClose}
              className="flex items-center gap-2.5 group min-w-0"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform shrink-0">
                {isTenant ? <Building2 className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1 truncate">
                  <span className="truncate">{isTenant && companyName ? companyName : 'TechIn'}</span>
                  {!isTenant && <span className="text-violet-600 dark:text-violet-400">Pedia</span>}
                </div>
                <div className="text-[9px] font-mono uppercase tracking-wider text-violet-600 dark:text-violet-400 font-bold truncate">
                  {isTenant ? (companyRole === 'INBOX_ONLY' ? 'Inbox Portal' : 'Tenant Workspace') : 'Business OS'}
                </div>
              </div>
            </Link>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="md:hidden p-1.5 -mr-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Global Dashboard Link */}
          <div className="p-2.5 pb-0">
            <Link
              href={isTenant ? (companyRole === 'INBOX_ONLY' ? '/admin/whatsapp?tab=inbox' : '/admin/whatsapp') : '/admin'}
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                (!isTenant && pathname === '/admin') || (isTenant && pathname.startsWith('/admin/whatsapp'))
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isTenant ? <MessageSquare className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                <span>{isTenant ? (companyRole === 'INBOX_ONLY' ? 'Live Team Inbox' : 'WhatsApp Workspace') : 'Main Dashboard'}</span>
              </div>
            </Link>
          </div>

          {/* Quick Menu & Omnibox Global Search */}
          {(!isTenant || companyRole !== 'INBOX_ONLY') && (
            <div className="p-2.5">
              <button
                type="button"
                onClick={() => setIsOmniboxOpen(true)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 hover:border-violet-500/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>Search {isTenant ? 'Workspace' : 'Business OS'}...</span>
                </div>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[9px] font-mono font-bold text-slate-500">
                  ⌘K
                </kbd>
              </button>
            </div>
          )}

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-4 text-xs thin-scrollbar">
          {filteredSections.map((section) => {
            const isCollapsed = !searchQuery && !isTenant && (collapsedSections[section.title] ?? (section.title !== 'CORE CRM'));
            return (
              <div key={section.title} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className={`w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                    isTenant 
                      ? 'text-slate-800 dark:text-slate-300 pointer-events-none' 
                      : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <span>{section.title}</span>
                  {!isTenant && (
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        isCollapsed ? '-rotate-90 text-slate-400 dark:text-slate-600' : 'rotate-0'
                      }`}
                    />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 pl-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const baseHref = item.href.split('?')[0];
                      const active =
                        pathname === baseHref ||
                        (baseHref !== '/admin' && pathname.startsWith(baseHref));
                      
                      const isWhatsApp = item.name.toLowerCase().includes('whatsapp');

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={onClose}
                          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                            active
                              ? isWhatsApp
                                ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-600/25'
                                : 'bg-violet-600 text-white font-semibold shadow-sm shadow-violet-600/25'
                              : isWhatsApp
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon
                              className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                                active
                                  ? 'text-white'
                                  : isWhatsApp
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400'
                              }`}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-extrabold text-white ${
                                item.badgeColor || 'bg-slate-600 dark:bg-slate-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Status & Sign Out Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/80 space-y-2">
        <div className="flex items-center justify-between px-1 text-[11px]">
          <div className="truncate">
            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{userEmail || 'admin@techinpedia.com'}</div>
            <div className="text-[10px] text-violet-600 dark:text-violet-400 font-mono font-medium uppercase truncate">
              {isTenant ? `${companyName || 'Company'} • ${companyRole || 'TENANT'}` : (appRoleName || userRole || 'SUPER_ADMIN')}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer border border-rose-200 dark:border-rose-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Omnibox Global Search Modal */}
      <OmniboxSearchModal
        isOpen={isOmniboxOpen}
        onClose={() => setIsOmniboxOpen(false)}
      />
    </aside>
    </>
  );
}
