import { Role } from '@prisma/client';
import { TokenPayload } from './auth';
import { AuthorizationError } from './auth-errors';

export type PermissionCode =
  // CRM
  | 'crm.leads.view'
  | 'crm.leads.create'
  | 'crm.leads.edit'
  | 'crm.leads.delete'
  | 'crm.leads.assign'
  | 'crm.leads.export'
  | 'crm.leads.import'
  | 'crm.kanban.view'
  | 'crm.customers.view'
  | 'crm.customers.manage'
  | 'crm.contacts.view'
  | 'crm.contacts.manage'
  | 'crm.companies.view'
  | 'crm.companies.manage'
  | 'crm.deals.view'
  | 'crm.deals.manage'
  | 'crm.followups.manage'
  // Portals & Cockpits
  | 'portal.ess.view'
  | 'cockpit.manager.view'
  | 'cockpit.hr.view'
  | 'cockpit.executive.view'
  // Communication & WhatsApp Business
  | 'comm.whatsapp.view'
  | 'comm.whatsapp.send'
  | 'comm.inbox.manage'
  | 'comm.chat.manage'
  | 'whatsapp.view'
  | 'whatsapp.configure'
  | 'whatsapp.send'
  | 'whatsapp.templates.manage'
  | 'whatsapp.campaigns.view'
  | 'whatsapp.campaigns.create'
  | 'whatsapp.campaigns.launch'
  | 'whatsapp.inbox.view'
  | 'whatsapp.inbox.assign'
  | 'whatsapp.logs.view'
  | 'whatsapp.suppression.manage'
  | 'contacts.view'
  | 'contacts.create'
  | 'contacts.edit'
  | 'contacts.delete'
  | 'contacts.export'
  | 'whatsapp.segments.manage'
  | 'whatsapp.single_send'
  | 'whatsapp.broadcasts.manage'
  | 'whatsapp.broadcasts.analytics'
  | 'whatsapp.drip.manage'
  | 'automation.manage'
  | 'automation.logs.view'
  | 'analytics.company.view'
  | 'analytics.team.view'
  // AI & Chatbot Suite
  | 'chatbot.view'
  | 'chatbot.manage'
  | 'chatbot.publish'
  | 'ai.brain.view'
  | 'ai.brain.manage'
  | 'ai.knowledge.manage'
  | 'ai.intents.manage'
  | 'ai.analytics.view'
  | 'ai.assist.use'
  | 'ai.conversation.pause'
  | 'ai.usage.view'
  // Google Sheets
  | 'google_sheets.view'
  | 'google_sheets.configure'
  | 'google_sheets.sync'
  | 'google_sheets.mapping.manage'
  // Sales & Finance
  | 'sales.quotations.view'
  | 'sales.quotations.manage'
  | 'sales.proposals.view'
  | 'sales.proposals.manage'
  | 'sales.contracts.view'
  | 'sales.contracts.manage'
  | 'finance.invoices.manage'
  | 'finance.invoice.view'
  | 'finance.payments.record'
  | 'finance.payment.view'
  | 'finance.payment_link.create'
  | 'finance.expenses.view'
  | 'finance.expenses.manage'
  | 'razorpay.configure'
  // Meetings & Calendar
  | 'meetings.create'
  | 'meetings.team.view'
  // Projects
  | 'projects.view'
  | 'projects.manage'
  | 'projects.tasks.manage'
  | 'projects.timesheets.manage'
  // HRM
  | 'hr.employees.view'
  | 'hr.employees.manage'
  | 'hr.employee.view'
  | 'hr.employee.edit'
  | 'hr.salary.view'
  | 'hr.attendance.manage'
  | 'attendance.self'
  | 'attendance.team'
  | 'attendance.manage'
  | 'hr.leaves.manage'
  | 'leave.self'
  | 'leave.team.approve'
  | 'leave.hr.approve'
  | 'hr.payroll.view'
  | 'hr.payroll.manage'
  | 'hr.payroll.approve'
  | 'hr.assignments.view'
  | 'hr.departments.manage'
  | 'hr.recruitment.manage'
  | 'hr.jobs.manage'
  | 'hr.candidates.manage'
  | 'hr.interviews.manage'
  | 'hr.performance.view'
  | 'hr.performance.manage'
  | 'hr.rewards.view'
  | 'hr.rewards.manage'
  | 'hr.promotions.view'
  | 'hr.promotions.manage'
  | 'hr.warnings.manage'
  // Support
  | 'support.tickets.view'
  | 'support.tickets.manage'
  | 'support.kb.manage'
  // Hardware & Rentals
  | 'hardware.assets.manage'
  | 'hardware.rentals.manage'
  | 'hardware.amc.manage'
  | 'hardware.maintenance.manage'
  // SaaS & Licensing
  | 'saas.products.manage'
  | 'saas.subscriptions.manage'
  | 'saas.licenses.manage'
  // Automation & Integrations
  | 'automation.workflows.manage'
  | 'integrations.sheets.manage'
  | 'integrations.webhooks.manage'
  | 'integrations.hub.manage'
  | 'ai.goals.manage'
  | 'analytics.reports.manage'
  // Content
  | 'content.services.manage'
  | 'content.projects.manage'
  | 'content.blog.manage'
  | 'content.news.manage'
  | 'content.testimonials.manage'
  | 'content.faqs.manage'
  | 'content.media.manage'
  // Administration
  | 'admin.users.manage'
  | 'admin.roles.manage'
  | 'admin.settings.manage'
  | 'admin.monitoring.view'
  | 'admin.jobs.manage'
  | 'admin.legal.manage'
  | 'admin.audit.view'
  | 'admin.business_units.manage'
  | 'admin.sites.manage'
  | 'admin.seo_pages.view'
  | 'admin.seo_pages.manage'
  // Urban Marketplace
  | 'marketplace.view'
  | 'marketplace.manage'
  | 'marketplace.leads.view'
  | 'marketplace.vendors.manage'
  | 'marketplace.categories.manage';

export interface PermissionDefinition {
  code: PermissionCode;
  name: string;
  category:
    | 'Portals & Cockpits'
    | 'CRM'
    | 'Urban Marketplace'
    | 'Communication'
    | 'Sales & Finance'
    | 'Meetings'
    | 'Projects'
    | 'HRM'
    | 'Support'
    | 'Hardware & Rental'
    | 'SaaS'
    | 'Automation'
    | 'Analytics & Reports'
    | 'Content'
    | 'Administration';
  description: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // Portals & Cockpits
  { code: 'portal.ess.view', name: 'My ESS Portal', category: 'Portals & Cockpits', description: 'Can access self-service employee portal, punch-in, and leaves' },
  { code: 'cockpit.manager.view', name: 'Manager Cockpit', category: 'Portals & Cockpits', description: 'Can view team dashboards, attendance rosters, and supervisor queues' },
  { code: 'cockpit.hr.view', name: 'HR Operations Cockpit', category: 'Portals & Cockpits', description: 'Can view centralized HR operations, workforce statistics, and staffing' },
  { code: 'cockpit.executive.view', name: 'Executive Cockpit', category: 'Portals & Cockpits', description: 'Can view C-Level executive revenue, pipeline velocity, and company KPIs' },

  // CRM
  { code: 'crm.leads.view', name: 'View Leads', category: 'CRM', description: 'Can view leads desk and details' },
  { code: 'crm.kanban.view', name: 'Leads Kanban Board', category: 'CRM', description: 'Can view visual pipeline kanban board' },
  { code: 'crm.customers.view', name: 'Customer 360', category: 'CRM', description: 'Can view unified 360° customer profiles and relationship history' },
  { code: 'crm.customers.manage', name: 'Manage Customer 360', category: 'CRM', description: 'Can edit customer details, tags, and lifecycle stages' },
  { code: 'crm.leads.create', name: 'Create Leads', category: 'CRM', description: 'Can add new leads manually' },
  { code: 'crm.leads.edit', name: 'Edit Leads', category: 'CRM', description: 'Can update lead status, details, notes' },
  { code: 'crm.leads.delete', name: 'Delete Leads', category: 'CRM', description: 'Can remove leads from the system' },
  { code: 'crm.leads.assign', name: 'Assign Leads', category: 'CRM', description: 'Can assign and reassign leads to executives' },
  { code: 'crm.leads.export', name: 'Export Leads', category: 'CRM', description: 'Can export lead data to CSV/Excel' },
  { code: 'crm.leads.import', name: 'Import Leads', category: 'CRM', description: 'Can bulk import lead records via spreadsheet or CSV' },
  { code: 'crm.contacts.view', name: 'View Contacts', category: 'CRM', description: 'Can view CRM contacts and accounts' },
  { code: 'crm.contacts.manage', name: 'Manage Contacts', category: 'CRM', description: 'Can create and update CRM contacts' },
  { code: 'crm.companies.view', name: 'View Companies', category: 'CRM', description: 'Can view client corporate accounts' },
  { code: 'crm.companies.manage', name: 'Manage Companies', category: 'CRM', description: 'Can create and update client companies' },
  { code: 'crm.deals.view', name: 'View Deals', category: 'CRM', description: 'Can view sales pipelines and deals' },
  { code: 'crm.deals.manage', name: 'Manage Deals', category: 'CRM', description: 'Can create, move, and close deals' },
  { code: 'crm.followups.manage', name: 'Manage Follow-ups', category: 'CRM', description: 'Can schedule and complete lead follow-ups' },
  { code: 'meetings.create', name: 'Schedule Meetings & Calendar', category: 'CRM', description: 'Can schedule client meetings and generate Meet links' },
  { code: 'meetings.team.view', name: 'View Team Meetings & Calendar', category: 'CRM', description: 'Can view departmental and team calendars' },

  // Urban Marketplace
  { code: 'marketplace.view', name: 'Marketplace Cockpit', category: 'Urban Marketplace', description: 'Can view marketplace cockpit and overall GMV metrics' },
  { code: 'marketplace.leads.view', name: 'Marketplace Leads', category: 'Urban Marketplace', description: 'Can view consumer marketplace inquiries and service leads' },
  { code: 'marketplace.vendors.manage', name: 'Vendors & KYC Desk', category: 'Urban Marketplace', description: 'Can review, verify, and approve marketplace vendors' },
  { code: 'marketplace.categories.manage', name: 'Categories & Taxonomy', category: 'Urban Marketplace', description: 'Can manage category trees, service offerings, and icons' },
  { code: 'marketplace.manage', name: 'Full Marketplace Admin', category: 'Urban Marketplace', description: 'Full administrative control over marketplace ecosystem' },

  // Communication & WhatsApp Business Platform
  { code: 'comm.whatsapp.view', name: 'View WhatsApp Chats', category: 'Communication', description: 'Can view live WhatsApp conversations' },
  { code: 'comm.whatsapp.send', name: 'Send WhatsApp Messages', category: 'Communication', description: 'Can reply and send WhatsApp chat messages' },
  { code: 'comm.inbox.manage', name: 'Inbox Assignment', category: 'Communication', description: 'Can assign conversations to reps' },
  { code: 'comm.chat.manage', name: 'Website Live Chat', category: 'Communication', description: 'Can manage live chat widgets and transcripts' },
  { code: 'whatsapp.view', name: 'WhatsApp Module', category: 'Communication', description: 'Access to WhatsApp business hub' },
  { code: 'whatsapp.configure', name: 'WhatsApp Setup', category: 'Communication', description: 'Can configure Cloud API credentials' },
  { code: 'whatsapp.send', name: 'Direct WhatsApp', category: 'Communication', description: 'Can initiate outbound WhatsApp conversations' },
  { code: 'whatsapp.templates.manage', name: 'Message Templates', category: 'Communication', description: 'Can create and submit Meta templates' },
  { code: 'whatsapp.campaigns.view', name: 'View Campaigns', category: 'Communication', description: 'Can view broadcast analytics' },
  { code: 'whatsapp.campaigns.create', name: 'Create Campaigns', category: 'Communication', description: 'Can draft WhatsApp broadcasts' },
  { code: 'whatsapp.campaigns.launch', name: 'Launch Campaigns', category: 'Communication', description: 'Can trigger mass WhatsApp campaigns' },
  { code: 'whatsapp.inbox.view', name: 'View Team Inbox', category: 'Communication', description: 'Can view shared WhatsApp inbox' },
  { code: 'whatsapp.inbox.assign', name: 'Assign Conversations', category: 'Communication', description: 'Can route conversations to reps' },
  { code: 'whatsapp.logs.view', name: 'Delivery Logs', category: 'Communication', description: 'Can view WhatsApp delivery receipts' },
  { code: 'whatsapp.suppression.manage', name: 'Opt-Out List', category: 'Communication', description: 'Can manage DND and unsubscribe lists' },
  { code: 'contacts.view', name: 'View Audience Contacts', category: 'Communication', description: 'Can view marketing contacts directory' },
  { code: 'contacts.create', name: 'Add Contact', category: 'Communication', description: 'Can create audience contacts' },
  { code: 'contacts.edit', name: 'Edit Contact', category: 'Communication', description: 'Can update audience contacts' },
  { code: 'contacts.delete', name: 'Delete Contact', category: 'Communication', description: 'Can remove audience contacts' },
  { code: 'contacts.export', name: 'Export Contacts', category: 'Communication', description: 'Can export audience contacts to CSV' },
  { code: 'whatsapp.segments.manage', name: 'Smart Segments', category: 'Communication', description: 'Can create and manage dynamic segments' },
  { code: 'whatsapp.single_send', name: 'Single Message Console', category: 'Communication', description: 'Can dispatch targeted single messages' },
  { code: 'whatsapp.broadcasts.manage', name: 'Broadcast Campaigns', category: 'Communication', description: 'Can create and manage broadcast campaigns' },
  { code: 'whatsapp.broadcasts.analytics', name: 'Campaign Analytics', category: 'Communication', description: 'Can view delivery and read telemetry' },
  { code: 'whatsapp.drip.manage', name: 'Drip Sequences', category: 'Communication', description: 'Can configure automated contact drip journeys' },
  { code: 'automation.manage', name: 'Workflow Automation', category: 'Automation', description: 'Can build and activate trigger rules' },
  { code: 'automation.logs.view', name: 'Automation Execution Logs', category: 'Automation', description: 'Can view automation execution telemetry' },
  { code: 'analytics.company.view', name: 'Company Analytics', category: 'Analytics & Reports', description: 'Can view company executive dashboards' },
  { code: 'analytics.team.view', name: 'Team Analytics', category: 'Analytics & Reports', description: 'Can view departmental productivity' },
  { code: 'analytics.reports.manage', name: 'Performance Reports', category: 'Analytics & Reports', description: 'Can generate and export departmental and executive reports' },

  // AI & Chatbot Suite
  { code: 'chatbot.view', name: 'View Chatbot Flows', category: 'Automation', description: 'Can view visual chatbot flow builder' },
  { code: 'chatbot.manage', name: 'Manage Chatbots', category: 'Automation', description: 'Can edit chatbot nodes and transitions' },
  { code: 'chatbot.publish', name: 'Publish Chatbots', category: 'Automation', description: 'Can activate chatbots on live WhatsApp stream' },
  { code: 'ai.brain.view', name: 'View AI Brain', category: 'Automation', description: 'Can view AI assistant settings & playground' },
  { code: 'ai.brain.manage', name: 'Configure AI Brain', category: 'Automation', description: 'Can update LLM provider and personas' },
  { code: 'ai.goals.manage', name: 'AI Business Goals', category: 'Automation', description: 'Can configure automated AI sales and customer support objectives' },
  { code: 'ai.knowledge.manage', name: 'Manage RAG Knowledge', category: 'Automation', description: 'Can manage company documents & chunks' },
  { code: 'ai.intents.manage', name: 'Manage Intent Routing', category: 'Automation', description: 'Can configure intent trigger keywords & actions' },
  { code: 'ai.analytics.view', name: 'AI Quota & Cost Telemetry', category: 'Automation', description: 'Can view token and AI cost telemetry' },
  { code: 'ai.assist.use', name: 'Use Live AI Co-Pilot', category: 'Communication', description: 'Can use suggestions & rewriting in Inbox' },
  { code: 'ai.conversation.pause', name: 'Pause / Resume AI Bot', category: 'Communication', description: 'Can override AI with human takeover' },
  { code: 'ai.usage.view', name: 'View AI Usage Logs', category: 'Automation', description: 'Can inspect raw LLM request audit traces' },

  // Google Sheets Integration
  { code: 'google_sheets.view', name: 'View Sheets Integration', category: 'Automation', description: 'Can view sheet connections' },
  { code: 'google_sheets.configure', name: 'Configure Sheets', category: 'Automation', description: 'Can connect Google service accounts' },
  { code: 'google_sheets.sync', name: 'Trigger Sheets Sync', category: 'Automation', description: 'Can run manual spreadsheet synchronization' },
  { code: 'google_sheets.mapping.manage', name: 'Column Mapping', category: 'Automation', description: 'Can map spreadsheet columns to CRM fields' },

  // Sales & Finance
  { code: 'sales.quotations.view', name: 'View Quotations', category: 'Sales & Finance', description: 'Can view quotations list and PDF previews' },
  { code: 'sales.quotations.manage', name: 'Manage Quotations', category: 'Sales & Finance', description: 'Can create and export formal quotations' },
  { code: 'sales.proposals.view', name: 'View Proposals', category: 'Sales & Finance', description: 'Can view sales proposals and acceptance statuses' },
  { code: 'sales.proposals.manage', name: 'Manage Proposals', category: 'Sales & Finance', description: 'Can author and send sales proposals' },
  { code: 'sales.contracts.view', name: 'View Contracts', category: 'Sales & Finance', description: 'Can view customer signed contracts and SLAs' },
  { code: 'sales.contracts.manage', name: 'Manage Contracts', category: 'Sales & Finance', description: 'Can manage pre-sales and client agreements' },
  { code: 'finance.invoice.view', name: 'View Invoices', category: 'Sales & Finance', description: 'Can view issued invoices and statuses' },
  { code: 'finance.invoices.manage', name: 'Manage Invoices', category: 'Sales & Finance', description: 'Can create, edit, and void invoices' },
  { code: 'finance.payment.view', name: 'View Payments', category: 'Sales & Finance', description: 'Can view payment collections and transactions' },
  { code: 'finance.payments.record', name: 'Record Payments', category: 'Sales & Finance', description: 'Can record offline payments and view logs' },
  { code: 'finance.payment_link.create', name: 'Generate Payment Links', category: 'Sales & Finance', description: 'Can generate Razorpay payment links for clients' },
  { code: 'finance.expenses.view', name: 'View Expenses', category: 'Sales & Finance', description: 'Can view logged company expense records' },
  { code: 'finance.expenses.manage', name: 'Manage Expenses', category: 'Sales & Finance', description: 'Can log and approve business expenses' },
  { code: 'razorpay.configure', name: 'Configure Razorpay', category: 'Sales & Finance', description: 'Can manage Razorpay credentials and webhooks' },

  // Projects
  { code: 'projects.view', name: 'View Projects', category: 'Projects', description: 'Can view projects, tasks, and milestones' },
  { code: 'projects.manage', name: 'Manage Projects', category: 'Projects', description: 'Can create projects and configure milestones' },
  { code: 'projects.tasks.manage', name: 'Manage Tasks', category: 'Projects', description: 'Can assign tasks and update statuses' },
  { code: 'projects.timesheets.manage', name: 'Timesheets', category: 'Projects', description: 'Can track and approve work hours' },

  // HRM
  { code: 'hr.employees.view', name: 'View Employees', category: 'HRM', description: 'Can view employee directory' },
  { code: 'hr.employee.view', name: 'View Employee Profile', category: 'HRM', description: 'Can view individual employee details' },
  { code: 'hr.employees.manage', name: 'Manage Employees', category: 'HRM', description: 'Can add/edit employees, departments and roles' },
  { code: 'hr.employee.edit', name: 'Edit Employee', category: 'HRM', description: 'Can update employee profiles, passwords, and designations' },
  { code: 'hr.salary.view', name: 'View Salary Info', category: 'HRM', description: 'Can view compensation and salary structures' },
  { code: 'hr.attendance.manage', name: 'Manage Attendance', category: 'HRM', description: 'Can review, correct, and adjust attendance logs' },
  { code: 'attendance.self', name: 'Self Attendance', category: 'HRM', description: 'Can clock in/out and view personal attendance' },
  { code: 'attendance.team', name: 'Team Attendance', category: 'HRM', description: 'Can view attendance for direct reports' },
  { code: 'attendance.manage', name: 'Company Attendance', category: 'HRM', description: 'Can administer company-wide attendance' },
  { code: 'hr.leaves.manage', name: 'Manage Leaves', category: 'HRM', description: 'Can configure leave quotas and policies' },
  { code: 'leave.self', name: 'Request Leave', category: 'HRM', description: 'Can apply for personal leave' },
  { code: 'leave.team.approve', name: 'Approve Team Leave', category: 'HRM', description: 'Team leader / manager leave approval' },
  { code: 'leave.hr.approve', name: 'HR Final Leave Approval', category: 'HRM', description: 'Final HR authorization for leaves' },
  { code: 'hr.payroll.view', name: 'View Payroll', category: 'HRM', description: 'Can view salary structures and monthly payroll' },
  { code: 'hr.payroll.manage', name: 'Manage Payroll', category: 'HRM', description: 'Can generate draft payroll runs' },
  { code: 'hr.payroll.approve', name: 'Approve Payroll', category: 'HRM', description: 'Can authorize and lock monthly payroll payouts' },
  { code: 'hr.assignments.view', name: 'Assignment Monitor & SLA', category: 'HRM', description: 'Can monitor lead & ticket routing queues and SLA acceptance timers' },
  { code: 'hr.departments.manage', name: 'Manage Departments & Teams', category: 'HRM', description: 'Can configure corporate departments and departmental teams' },
  { code: 'hr.recruitment.manage', name: 'Manage Recruitment', category: 'HRM', description: 'Can manage job openings, candidates, and interviews' },
  { code: 'hr.jobs.manage', name: 'Job Openings', category: 'HRM', description: 'Can create and publish recruitment job openings' },
  { code: 'hr.candidates.manage', name: 'Candidates Pipeline', category: 'HRM', description: 'Can manage candidate profiles and recruitment stages' },
  { code: 'hr.interviews.manage', name: 'Interview Schedules', category: 'HRM', description: 'Can schedule interviews and record interviewer scorecards' },
  { code: 'hr.performance.view', name: 'View Performance', category: 'HRM', description: 'Can view employee performance scores and growth' },
  { code: 'hr.performance.manage', name: 'Manage Performance', category: 'HRM', description: 'Can configure KPIs and submit performance reviews' },
  { code: 'hr.rewards.view', name: 'View Rewards', category: 'HRM', description: 'Can view appreciations and reward history' },
  { code: 'hr.rewards.manage', name: 'Manage Rewards', category: 'HRM', description: 'Can recommend and approve rewards and bonuses' },
  { code: 'hr.promotions.view', name: 'View Promotions', category: 'HRM', description: 'Can view employee promotion history' },
  { code: 'hr.promotions.manage', name: 'Manage Promotions', category: 'HRM', description: 'Can recommend and approve employee promotions' },
  { code: 'hr.warnings.manage', name: 'Manage Warnings & PIPs', category: 'HRM', description: 'Can issue performance warnings and manage PIPs' },

  // Support
  { code: 'support.tickets.view', name: 'View Tickets', category: 'Support', description: 'Can view support tickets' },
  { code: 'support.tickets.manage', name: 'Manage Tickets', category: 'Support', description: 'Can respond to and resolve support tickets' },
  { code: 'support.kb.manage', name: 'Knowledge Base', category: 'Support', description: 'Can author articles and documentation' },

  // Hardware & Rental
  { code: 'hardware.assets.manage', name: 'Asset Inventory', category: 'Hardware & Rental', description: 'Can track hardware assets and inventory' },
  { code: 'hardware.rentals.manage', name: 'Rental Orders', category: 'Hardware & Rental', description: 'Can manage rental orders and asset returns' },
  { code: 'hardware.amc.manage', name: 'AMC Contracts', category: 'Hardware & Rental', description: 'Can manage IT AMC service agreements' },
  { code: 'hardware.maintenance.manage', name: 'Maintenance Logs', category: 'Hardware & Rental', description: 'Can create and inspect hardware maintenance service logs' },

  // SaaS
  { code: 'saas.products.manage', name: 'SaaS Products', category: 'SaaS', description: 'Can manage SaaS catalog and pricing plans' },
  { code: 'saas.subscriptions.manage', name: 'Subscriptions', category: 'SaaS', description: 'Can manage customer subscriptions and renewals' },
  { code: 'saas.licenses.manage', name: 'Licenses', category: 'SaaS', description: 'Can issue and revoke software license keys' },

  // Automation & Integrations
  { code: 'automation.workflows.manage', name: 'Workflows & Triggers', category: 'Automation', description: 'Can configure automated triggers and actions' },
  { code: 'integrations.sheets.manage', name: 'Google Sheets CRM', category: 'Automation', description: 'Can configure Google Sheet lead syncing' },
  { code: 'integrations.webhooks.manage', name: 'Webhooks & Connectors', category: 'Automation', description: 'Can configure inbound and outbound webhooks' },
  { code: 'integrations.hub.manage', name: 'Integrations Hub', category: 'Automation', description: 'Can manage third-party API keys and integration connectors' },

  // Content
  { code: 'admin.seo_pages.view', name: 'View SEO Pages', category: 'Content', description: 'Can view SEO landing pages' },
  { code: 'admin.seo_pages.manage', name: 'Manage SEO Pages', category: 'Content', description: 'Can create and edit SEO landing pages' },
  { code: 'content.services.manage', name: 'Services Catalog', category: 'Content', description: 'Can edit public services catalog' },
  { code: 'content.projects.manage', name: 'Portfolio Showcase', category: 'Content', description: 'Can manage portfolio projects' },
  { code: 'content.blog.manage', name: 'Blog Posts', category: 'Content', description: 'Can publish and edit blog articles' },
  { code: 'content.news.manage', name: 'News Updates', category: 'Content', description: 'Can publish company announcements and news articles' },
  { code: 'content.testimonials.manage', name: 'Testimonials', category: 'Content', description: 'Can manage client reviews' },
  { code: 'content.faqs.manage', name: 'FAQs', category: 'Content', description: 'Can manage FAQs' },
  { code: 'content.media.manage', name: 'Media Library', category: 'Content', description: 'Can upload and delete media files' },

  // Administration
  { code: 'admin.users.manage', name: 'User Management', category: 'Administration', description: 'Can create and manage admin user accounts' },
  { code: 'admin.roles.manage', name: 'Roles & Permissions', category: 'Administration', description: 'Can configure granular role permissions' },
  { code: 'admin.settings.manage', name: 'Global Settings', category: 'Administration', description: 'Can update website and system settings' },
  { code: 'admin.monitoring.view', name: 'System Monitoring', category: 'Administration', description: 'Can view server metrics, PM2 process statuses, and system uptime' },
  { code: 'admin.jobs.manage', name: 'Background Jobs', category: 'Administration', description: 'Can inspect background queue jobs and retry failed tasks' },
  { code: 'admin.legal.manage', name: 'Legal Policies', category: 'Administration', description: 'Can edit terms of service, privacy policy, and disclaimers' },
  { code: 'admin.audit.view', name: 'Audit Logs', category: 'Administration', description: 'Can view immutable activity audit logs' },
  { code: 'admin.business_units.manage', name: 'Business Units', category: 'Administration', description: 'Can manage business units' },
  { code: 'admin.sites.manage', name: 'Sites & Domains', category: 'Administration', description: 'Can manage trusted site context' },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS.map((p) => p.code),
  ADMIN: ALL_PERMISSIONS.filter((p) => p.code !== 'admin.users.manage' && p.code !== 'admin.roles.manage').map((p) => p.code),
  MANAGER: ALL_PERMISSIONS.filter((p) => !p.code.startsWith('admin.') && p.code !== 'crm.leads.delete').map((p) => p.code),
  AGENT: [
    'crm.leads.view',
    'crm.leads.create',
    'crm.leads.edit',
    'crm.followups.manage',
    'comm.whatsapp.view',
    'comm.whatsapp.send',
    'whatsapp.view',
    'whatsapp.send',
    'whatsapp.inbox.view',
    'whatsapp.inbox.assign',
    'comm.inbox.manage',
    'comm.chat.manage',
    'support.tickets.view',
    'support.tickets.manage',
    'support.kb.manage',
    'projects.view',
    'projects.tasks.manage',
    'hr.attendance.manage',
    'attendance.self',
  ],
  MEMBER: [
    'projects.view',
    'projects.tasks.manage',
    'projects.timesheets.manage',
    'hr.attendance.manage',
    'attendance.self',
    'hr.leaves.manage',
    'leave.self',
    'support.kb.manage',
  ],
};

/**
 * Checks if a session has permission.
 * Evaluates in order:
 * 1. SUPER_ADMIN bypasses all checks.
 * 2. Database-backed dynamic permissions assigned to user's AppRole.
 * 3. Fallback to legacy role permissions for backward compatibility.
 */
export function hasPermission(
  session: TokenPayload | null,
  permission: PermissionCode
): boolean {
  if (!session) return false;

  // 1. SUPER_ADMIN bypasses all permission checks
  if (session.role === 'SUPER_ADMIN' || session.appRoleName === 'SUPER_ADMIN') {
    return true;
  }

  // 2. Check dynamic database-backed permissions
  // If a user has an AppRole assigned or has permissions array, we strictly respect it
  // and do NOT fallback to legacy role checks.
  if (session.appRoleName || (session.permissions && session.permissions.length > 0)) {
    if (session.permissions?.includes(permission)) return true;

    // Direct Exact Synonyms (where database or legacy code uses alternative naming)
    if (permission === 'hr.employee.view' && session.permissions?.includes('hr.employees.view')) return true;
    if (permission === 'hr.employees.view' && session.permissions?.includes('hr.employee.view')) return true;
    if (permission === 'attendance.manage' && session.permissions?.includes('hr.attendance.manage')) return true;
    if (permission === 'hr.attendance.manage' && session.permissions?.includes('attendance.manage')) return true;
    if (permission === 'leave.hr.approve' && session.permissions?.includes('hr.leaves.manage')) return true;
    if (permission === 'hr.leaves.manage' && session.permissions?.includes('leave.hr.approve')) return true;
    if (permission === 'hr.payroll.approve' && session.permissions?.includes('hr.payroll.manage')) return true;
    if (permission === 'hr.employee.edit' && (session.permissions?.includes('hr.employees.manage') || session.permissions?.includes('admin.roles.manage'))) return true;

    // Same-Resource Manage implies View ONLY (A manage permission implies its own view permission)
    if (permission === 'crm.customers.view' && session.permissions?.includes('crm.customers.manage')) return true;
    if (permission === 'crm.contacts.view' && session.permissions?.includes('crm.contacts.manage')) return true;
    if (permission === 'crm.companies.view' && session.permissions?.includes('crm.companies.manage')) return true;
    if (permission === 'crm.leads.view' && (session.permissions?.includes('crm.leads.edit') || session.permissions?.includes('crm.leads.create'))) return true;
    if (permission === 'sales.quotations.view' && session.permissions?.includes('sales.quotations.manage')) return true;
    if (permission === 'sales.proposals.view' && session.permissions?.includes('sales.proposals.manage')) return true;
    if (permission === 'sales.contracts.view' && session.permissions?.includes('sales.contracts.manage')) return true;
    if (permission === 'finance.expenses.view' && session.permissions?.includes('finance.expenses.manage')) return true;
    if (permission === 'finance.invoice.view' && session.permissions?.includes('finance.invoices.manage')) return true;
    if (permission === 'finance.payment.view' && session.permissions?.includes('finance.payments.record')) return true;
    if (permission === 'marketplace.view' && session.permissions?.includes('marketplace.manage')) return true;
    if (permission === 'marketplace.vendors.manage' && session.permissions?.includes('marketplace.manage')) return true;
    if (permission === 'marketplace.categories.manage' && session.permissions?.includes('marketplace.manage')) return true;
    if (permission === 'admin.business_units.manage' && session.permissions?.includes('admin.settings.manage')) return true;
    if (permission === 'admin.sites.manage' && session.permissions?.includes('admin.settings.manage')) return true;
    if (permission === 'admin.audit.view' && session.permissions?.includes('admin.settings.manage')) return true;
    if (permission === 'admin.monitoring.view' && session.permissions?.includes('admin.settings.manage')) return true;
    if (permission === 'admin.jobs.manage' && session.permissions?.includes('admin.settings.manage')) return true;
    if (permission === 'admin.legal.manage' && session.permissions?.includes('admin.settings.manage')) return true;
    if (permission === 'integrations.hub.manage' && session.permissions?.includes('admin.settings.manage')) return true;
    if (permission === 'whatsapp.single_send' && session.permissions?.includes('whatsapp.send')) return true;
    if (permission === 'whatsapp.broadcasts.manage' && session.permissions?.includes('whatsapp.campaigns.create')) return true;
    if (permission === 'whatsapp.campaigns.view' && session.permissions?.includes('whatsapp.broadcasts.manage')) return true;
    if (permission === 'hr.jobs.manage' && session.permissions?.includes('hr.recruitment.manage')) return true;
    if (permission === 'hr.candidates.manage' && session.permissions?.includes('hr.recruitment.manage')) return true;
    if (permission === 'hr.interviews.manage' && session.permissions?.includes('hr.recruitment.manage')) return true;

    // Harmonize tenant owner/admin access to their own company's AI, WhatsApp, and automation suite ONLY for true tenants
    if (session.isTenant && session.companyId && (session.companyRole === 'OWNER' || session.companyRole === 'ADMIN')) {
      if (
        permission.startsWith('ai.') ||
        permission.startsWith('chatbot.') ||
        permission.startsWith('automation.') ||
        permission.startsWith('whatsapp.') ||
        permission.startsWith('comm.')
      ) {
        return true;
      }
    }

    return false; // Strictly enforce dynamic permissions - NEVER fall through!
  }

  // 3. Fallback to legacy role checks (Only for users WITHOUT an AppRole)
  if (session.companyId && (session.companyRole === 'OWNER' || session.companyRole === 'ADMIN')) {
    if (
      permission.startsWith('ai.') ||
      permission.startsWith('chatbot.') ||
      permission.startsWith('automation.') ||
      permission.startsWith('whatsapp.') ||
      permission.startsWith('comm.')
    ) {
      return true;
    }
  }

  if (session.role === 'ADMIN') {
    if (permission === 'admin.users.manage' || permission === 'admin.roles.manage') {
      return false;
    }
    return true;
  }

  if (session.role === 'EDITOR') {
    return (
      permission.startsWith('content.') ||
      permission === 'crm.leads.view' ||
      permission === 'support.kb.manage'
    );
  }

  if (session.role === 'EMPLOYEE' || session.role === 'MEMBER' || session.role === 'AGENT') {
    const employeePermissions: PermissionCode[] = [
      'projects.view',
      'projects.tasks.manage',
      'projects.timesheets.manage',
      'hr.attendance.manage',
      'attendance.self',
      'leave.self',
      'comm.whatsapp.view',
      'comm.whatsapp.send',
      'whatsapp.view',
      'whatsapp.send',
      'whatsapp.inbox.view',
      'comm.inbox.manage',
      'comm.chat.manage',
      'support.kb.manage',
      'ai.assist.use',
      'ai.conversation.pause',
    ];
    return employeePermissions.includes(permission);
  }

  return false;
}

export function requirePermission(
  session: TokenPayload | null,
  permission: PermissionCode
): void {
  if (!hasPermission(session, permission)) {
    throw new AuthorizationError(`Forbidden: Missing required permission [${permission}]`);
  }
}
