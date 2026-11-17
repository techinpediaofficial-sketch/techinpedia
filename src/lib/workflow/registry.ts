// ============================================================
// Universal Trigger & Action Registry (All 12 Modules)
// ============================================================

export type WorkflowCategory =
  | 'Communication'
  | 'Leads & CRM'
  | 'Deals & Sales'
  | 'Tasks & Meetings'
  | 'Quotations & Finance'
  | 'Support'
  | 'Rental & AMC'
  | 'HRM'
  | 'Data & Integrations'
  | 'Logic & Branching'
  | 'Timing & Scheduling'
  | 'Advanced';

export interface WorkflowCategoryMeta {
  id: WorkflowCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const WORKFLOW_CATEGORIES: WorkflowCategoryMeta[] = [
  { id: 'Communication', name: 'Communication', description: 'WhatsApp, email notifications, and in-app staff alerts', icon: 'MessageSquare', color: 'emerald' },
  { id: 'Leads & CRM', name: 'Leads & CRM', description: 'Lead assignment, score adjustment, tags, and status automation', icon: 'Users', color: 'violet' },
  { id: 'Deals & Sales', name: 'Deals & Sales', description: 'Pipeline stage moves, proposals, contracts, and revenue updates', icon: 'TrendingUp', color: 'blue' },
  { id: 'Tasks & Meetings', name: 'Tasks & Meetings', description: 'Follow-ups, client meetings, project milestones, and tasks', icon: 'CheckSquare', color: 'amber' },
  { id: 'Quotations & Finance', name: 'Quotations & Finance', description: 'Invoices, quotations, payment logging, and expense tracking', icon: 'Receipt', color: 'indigo' },
  { id: 'Support', name: 'Support', description: 'Support tickets, SLA escalations, agent assignment, and comments', icon: 'LifeBuoy', color: 'rose' },
  { id: 'Rental & AMC', name: 'Rental & AMC', description: 'Laptop/hardware rentals, renewals, and maintenance visits', icon: 'Laptop', color: 'cyan' },
  { id: 'HRM', name: 'HRM', description: 'Employee announcements, leave approvals, and attendance logging', icon: 'Briefcase', color: 'orange' },
  { id: 'Data & Integrations', name: 'Data & Integrations', description: 'Google Sheets sync, outbound webhooks, and REST APIs', icon: 'Database', color: 'slate' },
  { id: 'Logic & Branching', name: 'Logic & Branching', description: 'IF/ELSE paths, multi-branch switch, filters, and approvals', icon: 'GitFork', color: 'purple' },
  { id: 'Timing & Scheduling', name: 'Timing & Scheduling', description: 'Delays, specific times, business hours, and relative dates', icon: 'Clock', color: 'teal' },
  { id: 'Advanced', name: 'Advanced', description: 'Variable calculations, sub-workflow triggers, and audit logging', icon: 'Cpu', color: 'pink' },
];

export interface ModuleField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select';
  options?: { label: string; value: any }[];
  placeholder?: string;
  description?: string;
}

export interface TriggerDefinition {
  code: string;
  name: string;
  category: WorkflowCategory;
  description: string;
  availableFields: ModuleField[];
}

export interface ActionParamDefinition {
  key: string;
  label: string;
  type:
    | 'string'
    | 'textarea'
    | 'number'
    | 'boolean'
    | 'select'
    | 'multiselect'
    | 'template'
    | 'date'
    | 'time'
    | 'key_value'
    | 'json';
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  options?: { label: string; value: any }[];
  optionsSource?: 'users' | 'teams' | 'pipeline_stages' | 'lead_statuses' | 'ticket_categories' | 'asset_types';
  description?: string;
  dependsOn?: { field: string; equals: any };
}

export interface ActionDefinition {
  code: string;
  name: string;
  category: WorkflowCategory;
  description: string;
  icon?: string;
  badge?: string;
  keywords?: string[];
  isLogicOrTiming?: boolean;
  params: ActionParamDefinition[];
}

// ------------------------------------------------------------
// Registered Triggers
// ------------------------------------------------------------
export const TRIGGER_REGISTRY: Record<string, TriggerDefinition> = {
  'crm.lead.created': {
    code: 'crm.lead.created',
    name: 'New Lead / Enquiry Submitted',
    category: 'Leads & CRM',
    description: 'Triggers immediately when a new client inquiry or lead is captured via website, chat or WhatsApp.',
    availableFields: [
      { key: 'lead.name', label: 'Lead Name', type: 'string' },
      { key: 'lead.email', label: 'Lead Email', type: 'string' },
      { key: 'lead.phone', label: 'Lead Phone', type: 'string' },
      { key: 'lead.company', label: 'Company Name', type: 'string' },
      { key: 'lead.service', label: 'Requested Service', type: 'string' },
      { key: 'lead.budget', label: 'Budget Range', type: 'string' },
      { key: 'lead.timeline', label: 'Target Timeline', type: 'string' },
      { key: 'lead.score', label: 'Calculated Lead Score', type: 'number' },
      { key: 'lead.source', label: 'Lead Source', type: 'string' },
      {
        key: 'lead.status',
        label: 'Lead Status',
        type: 'select',
        options: [
          { label: 'New', value: 'NEW' },
          { label: 'Contacted', value: 'CONTACTED' },
          { label: 'Qualified', value: 'QUALIFIED' },
          { label: 'Lost', value: 'LOST' },
        ],
      },
    ],
  },

  'crm.lead.status_changed': {
    code: 'crm.lead.status_changed',
    name: 'Lead Status Changed',
    category: 'Leads & CRM',
    description: 'Triggers when a lead status moves (e.g. from NEW to QUALIFIED).',
    availableFields: [
      { key: 'lead.id', label: 'Lead ID', type: 'string' },
      { key: 'lead.name', label: 'Lead Name', type: 'string' },
      { key: 'lead.status', label: 'New Status', type: 'string' },
      { key: 'lead.previousStatus', label: 'Previous Status', type: 'string' },
      { key: 'lead.score', label: 'Lead Score', type: 'number' },
      { key: 'lead.assignedUserId', label: 'Assigned User ID', type: 'string' },
    ],
  },

  'crm.lead.score_threshold': {
    code: 'crm.lead.score_threshold',
    name: 'Lead Score Threshold Reached',
    category: 'Leads & CRM',
    description: 'Triggers when lead score passes a milestone (e.g. >= 80 for VIP qualification).',
    availableFields: [
      { key: 'lead.id', label: 'Lead ID', type: 'string' },
      { key: 'lead.name', label: 'Lead Name', type: 'string' },
      { key: 'lead.score', label: 'Lead Score', type: 'number' },
      { key: 'lead.budget', label: 'Budget Range', type: 'string' },
    ],
  },

  'crm.deal.created': {
    code: 'crm.deal.created',
    name: 'Sales Deal Created',
    category: 'Deals & Sales',
    description: 'Triggers when a new opportunity or deal is opened in a pipeline.',
    availableFields: [
      { key: 'deal.id', label: 'Deal ID', type: 'string' },
      { key: 'deal.title', label: 'Deal Title', type: 'string' },
      { key: 'deal.amount', label: 'Deal Value (INR)', type: 'number' },
      { key: 'deal.stage', label: 'Pipeline Stage', type: 'string' },
      { key: 'deal.customer.name', label: 'Customer Name', type: 'string' },
      { key: 'deal.customer.email', label: 'Customer Email', type: 'string' },
    ],
  },

  'crm.deal.stage_changed': {
    code: 'crm.deal.stage_changed',
    name: 'Deal Stage Changed',
    category: 'Deals & Sales',
    description: 'Triggers when a deal advances in the sales pipeline (e.g. Proposal Sent, Negotiation, Closed Won).',
    availableFields: [
      { key: 'deal.id', label: 'Deal ID', type: 'string' },
      { key: 'deal.title', label: 'Deal Title', type: 'string' },
      { key: 'deal.amount', label: 'Deal Value (INR)', type: 'number' },
      { key: 'deal.stage', label: 'New Pipeline Stage', type: 'string' },
      { key: 'deal.previousStage', label: 'Previous Stage', type: 'string' },
      { key: 'deal.probability', label: 'Win Probability (%)', type: 'number' },
      { key: 'deal.customer.name', label: 'Customer Name', type: 'string' },
    ],
  },

  'crm.deal.won': {
    code: 'crm.deal.won',
    name: 'Deal Closed Won',
    category: 'Deals & Sales',
    description: 'Triggers when a contract or project deal is marked WON.',
    availableFields: [
      { key: 'deal.id', label: 'Deal ID', type: 'string' },
      { key: 'deal.title', label: 'Deal Title', type: 'string' },
      { key: 'deal.amount', label: 'Deal Value (INR)', type: 'number' },
      { key: 'deal.customer.name', label: 'Customer Name', type: 'string' },
      { key: 'deal.customer.email', label: 'Customer Email', type: 'string' },
    ],
  },

  'crm.deal.lost': {
    code: 'crm.deal.lost',
    name: 'Deal Closed Lost',
    category: 'Deals & Sales',
    description: 'Triggers when a deal is marked LOST with reason.',
    availableFields: [
      { key: 'deal.id', label: 'Deal ID', type: 'string' },
      { key: 'deal.title', label: 'Deal Title', type: 'string' },
      { key: 'deal.lostReason', label: 'Lost Reason', type: 'string' },
      { key: 'deal.customer.name', label: 'Customer Name', type: 'string' },
    ],
  },

  'finance.invoice.issued': {
    code: 'finance.invoice.issued',
    name: 'Invoice Issued to Client',
    category: 'Quotations & Finance',
    description: 'Triggers when a new invoice is generated and issued.',
    availableFields: [
      { key: 'invoice.id', label: 'Invoice ID', type: 'string' },
      { key: 'invoice.number', label: 'Invoice Number', type: 'string' },
      { key: 'invoice.amount', label: 'Invoice Total', type: 'number' },
      { key: 'invoice.dueDate', label: 'Due Date', type: 'date' },
      { key: 'invoice.status', label: 'Status', type: 'string' },
      { key: 'customer.name', label: 'Client Name', type: 'string' },
      { key: 'customer.email', label: 'Client Email', type: 'string' },
    ],
  },

  'finance.invoice.overdue': {
    code: 'finance.invoice.overdue',
    name: 'Invoice Overdue Threshold',
    category: 'Quotations & Finance',
    description: 'Triggers when an invoice passes its payment due date without being settled.',
    availableFields: [
      { key: 'invoice.id', label: 'Invoice ID', type: 'string' },
      { key: 'invoice.number', label: 'Invoice Number', type: 'string' },
      { key: 'invoice.amount', label: 'Amount Due', type: 'number' },
      { key: 'invoice.daysOverdue', label: 'Days Overdue', type: 'number' },
      { key: 'customer.name', label: 'Client Name', type: 'string' },
      { key: 'customer.phone', label: 'Client Phone', type: 'string' },
    ],
  },

  'finance.payment.received': {
    code: 'finance.payment.received',
    name: 'Payment Recorded',
    category: 'Quotations & Finance',
    description: 'Triggers when a payment is logged against an invoice.',
    availableFields: [
      { key: 'payment.id', label: 'Payment ID', type: 'string' },
      { key: 'payment.amount', label: 'Payment Amount', type: 'number' },
      { key: 'payment.method', label: 'Payment Method', type: 'string' },
      { key: 'invoice.number', label: 'Invoice Number', type: 'string' },
      { key: 'customer.name', label: 'Client Name', type: 'string' },
    ],
  },

  'projects.task.created': {
    code: 'projects.task.created',
    name: 'Project Task Created',
    category: 'Tasks & Meetings',
    description: 'Triggers when a new task is added to a project board.',
    availableFields: [
      { key: 'task.id', label: 'Task ID', type: 'string' },
      { key: 'task.title', label: 'Task Title', type: 'string' },
      { key: 'task.priority', label: 'Task Priority', type: 'string' },
      { key: 'task.project.name', label: 'Project Name', type: 'string' },
    ],
  },

  'projects.task.completed': {
    code: 'projects.task.completed',
    name: 'Project Task Completed',
    category: 'Tasks & Meetings',
    description: 'Triggers when a project milestone or task is marked DONE.',
    availableFields: [
      { key: 'task.id', label: 'Task ID', type: 'string' },
      { key: 'task.title', label: 'Task Title', type: 'string' },
      { key: 'task.assignedToName', label: 'Completed By', type: 'string' },
    ],
  },

  'support.ticket.created': {
    code: 'support.ticket.created',
    name: 'Support Ticket Created',
    category: 'Support',
    description: 'Triggers when an internal or external support ticket is logged.',
    availableFields: [
      { key: 'ticket.id', label: 'Ticket ID', type: 'string' },
      { key: 'ticket.number', label: 'Ticket Number', type: 'string' },
      { key: 'ticket.subject', label: 'Subject', type: 'string' },
      {
        key: 'ticket.priority',
        label: 'Priority',
        type: 'select',
        options: [
          { label: 'Low', value: 'LOW' },
          { label: 'Medium', value: 'MEDIUM' },
          { label: 'High', value: 'HIGH' },
          { label: 'Urgent', value: 'URGENT' },
        ],
      },
      { key: 'ticket.category', label: 'Category', type: 'string' },
      { key: 'ticket.clientEmail', label: 'Client Email', type: 'string' },
    ],
  },

  'hardware.rental.due_soon': {
    code: 'hardware.rental.due_soon',
    name: 'Rental Return / Renewal Due Soon',
    category: 'Rental & AMC',
    description: 'Triggers before a laptop or equipment rental period expires.',
    availableFields: [
      { key: 'rental.id', label: 'Rental Order ID', type: 'string' },
      { key: 'rental.orderNumber', label: 'Rental Order Number', type: 'string' },
      { key: 'rental.endDate', label: 'Rental Return Date', type: 'date' },
      { key: 'rental.customerName', label: 'Client Name', type: 'string' },
      { key: 'rental.customerPhone', label: 'Client Phone', type: 'string' },
      { key: 'rental.daysRemaining', label: 'Days Remaining', type: 'number' },
    ],
  },

  'hr.leave.requested': {
    code: 'hr.leave.requested',
    name: 'Employee Leave Requested',
    category: 'HRM',
    description: 'Triggers when an employee submits a leave request.',
    availableFields: [
      { key: 'leave.id', label: 'Leave Request ID', type: 'string' },
      { key: 'leave.employeeName', label: 'Employee Name', type: 'string' },
      { key: 'leave.leaveType', label: 'Leave Type', type: 'string' },
      { key: 'leave.daysCount', label: 'Days Count', type: 'number' },
      { key: 'leave.startDate', label: 'Start Date', type: 'date' },
    ],
  },

  'comm.whatsapp.received': {
    code: 'comm.whatsapp.received',
    name: 'Inbound WhatsApp Message',
    category: 'Communication',
    description: 'Triggers when an inbound WhatsApp message is received from a client or prospect.',
    availableFields: [
      { key: 'message.from', label: 'Sender Phone', type: 'string' },
      { key: 'message.text', label: 'Message Body', type: 'string' },
      { key: 'message.isNewContact', label: 'Is First Time Contact', type: 'boolean' },
    ],
  },

  'integration.webhook.received': {
    code: 'integration.webhook.received',
    name: 'External Webhook Inbound',
    category: 'Data & Integrations',
    description: 'Triggers when an external system posts a payload to TechInPedia automation webhook URL.',
    availableFields: [
      { key: 'webhook.event', label: 'Event Name', type: 'string' },
      { key: 'webhook.source', label: 'Payload Source', type: 'string' },
    ],
  },

  'schedule.cron': {
    code: 'schedule.cron',
    name: 'Scheduled Cron Trigger',
    category: 'Timing & Scheduling',
    description: 'Fires on a periodic recurring schedule (e.g. daily 9 AM, weekly Monday).',
    availableFields: [
      { key: 'schedule.time', label: 'Trigger Timestamp', type: 'date' },
    ],
  },
};

// ------------------------------------------------------------
// Registered Actions Across All 12 Categories
// ------------------------------------------------------------
export const ACTION_REGISTRY: Record<string, ActionDefinition> = {
  // 1. COMMUNICATION
  'SEND_WHATSAPP': {
    code: 'SEND_WHATSAPP',
    name: 'Send WhatsApp Message',
    category: 'Communication',
    description: 'Dispatches an instant WhatsApp message or template via Meta Cloud API.',
    icon: 'MessageSquare',
    badge: 'Meta Cloud',
    keywords: ['whatsapp', 'message', 'chat', 'template', 'sms', 'text'],
    params: [
      {
        key: 'recipientPhone',
        label: 'Recipient Phone Number',
        type: 'template',
        required: true,
        defaultValue: '{{lead.phone}}',
        placeholder: '{{lead.phone}} or +919818768680',
        description: 'Supports dynamic variable tags like {{lead.phone}} or {{customer.phone}}',
      },
      {
        key: 'messageType',
        label: 'Message Format',
        type: 'select',
        defaultValue: 'CUSTOM_TEXT',
        options: [
          { label: 'Custom Text Message', value: 'CUSTOM_TEXT' },
          { label: 'Approved Meta Template', value: 'TEMPLATE' },
          { label: 'Dynamic Purpose Template (WELCOME, PACKAGE_MENU, BOOKING_DETAILS)', value: 'TEMPLATE_PURPOSE' },
          { label: 'Dynamic Package Template (1–9 Selection)', value: 'PACKAGE_TEMPLATE' },
        ],
      },
      {
        key: 'purposeKey',
        label: 'Template Purpose Key',
        type: 'select',
        defaultValue: 'WELCOME',
        options: [
          { label: 'Welcome Greeting (WELCOME)', value: 'WELCOME' },
          { label: 'Package Menu Selector (PACKAGE_MENU)', value: 'PACKAGE_MENU' },
          { label: 'Booking Details (BOOKING_DETAILS)', value: 'BOOKING_DETAILS' },
        ],
        dependsOn: { field: 'messageType', equals: 'TEMPLATE_PURPOSE' },
        description: 'Resolves dynamically to the company\'s approved template mapped in Purpose Registry.',
      },
      {
        key: 'packageId',
        label: 'Package Selection Key / ID',
        type: 'string',
        defaultValue: '{{selected_package_ids}}',
        placeholder: '{{selected_package_ids}} or 1',
        dependsOn: { field: 'messageType', equals: 'PACKAGE_TEMPLATE' },
        description: 'Dynamic package number (1-9) or array resolved from PackageWhatsAppConfig.',
      },
      {
        key: 'templateName',
        label: 'Approved Template Name',
        type: 'select',
        defaultValue: '',
        options: [],
        dependsOn: { field: 'messageType', equals: 'TEMPLATE' },
        description: 'Select an approved WhatsApp template belonging to your business account.',
      },
      {
        key: 'messageText',
        label: 'Message Content',
        type: 'textarea',
        required: true,
        defaultValue: 'Hi {{lead.name}}, thanks for reaching out! Our team will contact you shortly on {{lead.phone}}.',
        placeholder: 'Hi {{lead.name}}, thanks for reaching out to TechInPedia! Our sales team will get in touch with you shortly.',
        description: 'Supports dynamic variable tags like {{lead.name}}, {{lead.phone}}, {{lead.company}}, {{deal.amount}}',
      },
      {
        key: 'mediaUrl',
        label: 'Optional Attachment / PDF URL',
        type: 'string',
        placeholder: 'https://techinpedia.com/brochure.pdf',
        description: 'Direct link to PDF or image attachment to include in message.',
      },
    ],
  },

  'SEND_EMAIL': {
    code: 'SEND_EMAIL',
    name: 'Send Email Notification',
    category: 'Communication',
    description: 'Sends an email via configured SMTP to client or internal team members.',
    icon: 'Mail',
    badge: 'SMTP',
    keywords: ['email', 'mail', 'notification', 'smtp'],
    params: [
      {
        key: 'recipientEmail',
        label: 'Recipient Email Address',
        type: 'template',
        required: true,
        placeholder: '{{lead.email}} or admin@techinpedia.com',
      },
      {
        key: 'subject',
        label: 'Email Subject',
        type: 'string',
        required: true,
        placeholder: 'TechInPedia — Proposal & Project Update for {{lead.company}}',
      },
      {
        key: 'senderName',
        label: 'Sender Display Name',
        type: 'string',
        defaultValue: 'TechInPedia Client Desk',
      },
      {
        key: 'htmlBody',
        label: 'Email Body (HTML / Text)',
        type: 'textarea',
        required: true,
        placeholder: '<p>Hello {{lead.name}},</p><p>We have received your enquiry regarding {{lead.service}}.</p>',
      },
    ],
  },

  'SEND_NOTIFICATION': {
    code: 'SEND_NOTIFICATION',
    name: 'Send In-App Staff Notification',
    category: 'Communication',
    description: 'Pushes an in-app alert banner to staff dashboards.',
    icon: 'Bell',
    badge: 'Internal',
    keywords: ['notification', 'alert', 'staff', 'bell'],
    params: [
      {
        key: 'targetAudience',
        label: 'Target Staff Audience',
        type: 'select',
        defaultValue: 'ALL_ADMINS',
        options: [
          { label: 'All Administrators', value: 'ALL_ADMINS' },
          { label: 'Assigned User Only', value: 'ASSIGNED_USER' },
          { label: 'Super Admins Only', value: 'SUPER_ADMIN' },
        ],
      },
      {
        key: 'title',
        label: 'Notification Title',
        type: 'string',
        required: true,
        placeholder: 'High-Value Lead Alert: {{lead.name}}',
      },
      {
        key: 'message',
        label: 'Alert Message',
        type: 'textarea',
        required: true,
        placeholder: 'New inquiry for {{lead.service}} with budget {{lead.budget}} requires immediate review.',
      },
      {
        key: 'link',
        label: 'Action Link URL',
        type: 'string',
        placeholder: '/admin/leads',
      },
    ],
  },

  // 2. LEADS & CRM
  'ASSIGN_LEAD': {
    code: 'ASSIGN_LEAD',
    name: 'Assign Lead / Sales Routing',
    category: 'Leads & CRM',
    description: 'Distributes leads using Round-Robin, Least-Loaded, Weighted, or Direct assignment.',
    icon: 'Users',
    badge: 'Routing',
    keywords: ['assign', 'lead', 'round-robin', 'least-loaded', 'sales', 'route'],
    params: [
      {
        key: 'strategy',
        label: 'Distribution Strategy',
        type: 'select',
        defaultValue: 'ROUND_ROBIN',
        options: [
          { label: 'Round-Robin (Fair Rotation)', value: 'ROUND_ROBIN' },
          { label: 'Least-Loaded (Smallest Active Workload)', value: 'LEAST_LOADED' },
          { label: 'Specific User', value: 'SPECIFIC_USER' },
        ],
      },
      {
        key: 'targetRole',
        label: 'Target User Role',
        type: 'select',
        defaultValue: 'ADMIN',
        options: [
          { label: 'Sales Executives & Admins', value: 'ADMIN' },
          { label: 'Super Admins Only', value: 'SUPER_ADMIN' },
        ],
        dependsOn: { field: 'strategy', equals: 'ROUND_ROBIN' },
      },
      {
        key: 'specificUserId',
        label: 'Specific Team Member ID',
        type: 'string',
        placeholder: 'Enter User ID or email',
        dependsOn: { field: 'strategy', equals: 'SPECIFIC_USER' },
      },
      {
        key: 'notifyAssignee',
        label: 'Notify Assigned Executive via WhatsApp & Email',
        type: 'boolean',
        defaultValue: true,
      },
    ],
  },

  'UPDATE_LEAD': {
    code: 'UPDATE_LEAD',
    name: 'Update Lead Details',
    category: 'Leads & CRM',
    description: 'Updates CRM lead status, priority, temperature, or service in the database.',
    icon: 'Edit3',
    badge: 'CRM',
    keywords: ['update', 'lead', 'status', 'priority', 'temperature', 'budget'],
    params: [
      {
        key: 'status',
        label: 'Update Status',
        type: 'select',
        defaultValue: '',
        options: [
          { label: '— No Change —', value: '' },
          { label: 'New', value: 'NEW' },
          { label: 'Contacted', value: 'CONTACTED' },
          { label: 'Qualified', value: 'QUALIFIED' },
          { label: 'Proposal Sent', value: 'PROPOSAL_SENT' },
          { label: 'Converted', value: 'CONVERTED' },
          { label: 'Lost', value: 'LOST' },
        ],
      },
      {
        key: 'priority',
        label: 'Update Priority',
        type: 'select',
        defaultValue: '',
        options: [
          { label: '— No Change —', value: '' },
          { label: 'Low', value: 'LOW' },
          { label: 'Medium', value: 'MEDIUM' },
          { label: 'High', value: 'HIGH' },
          { label: 'Urgent (VIP)', value: 'URGENT' },
        ],
      },
      {
        key: 'temperature',
        label: 'Update Temperature',
        type: 'select',
        defaultValue: '',
        options: [
          { label: '— No Change —', value: '' },
          { label: 'Cold', value: 'COLD' },
          { label: 'Warm', value: 'WARM' },
          { label: 'Hot', value: 'HOT' },
        ],
      },
    ],
  },

  'ADD_LEAD_TAG': {
    code: 'ADD_LEAD_TAG',
    name: 'Add Tag to Lead',
    category: 'Leads & CRM',
    description: 'Attaches a label or tag to the lead (e.g. VIP, Hardware-Rental, High-Budget).',
    icon: 'Tag',
    keywords: ['tag', 'label', 'lead'],
    params: [
      {
        key: 'tag',
        label: 'Tag Name',
        type: 'string',
        required: true,
        placeholder: 'VIP Client',
      },
      {
        key: 'color',
        label: 'Badge Color (Hex)',
        type: 'string',
        defaultValue: '#802ee3',
      },
    ],
  },

  'REMOVE_LEAD_TAG': {
    code: 'REMOVE_LEAD_TAG',
    name: 'Remove Tag from Lead',
    category: 'Leads & CRM',
    description: 'Detaches a specific tag from the current lead record.',
    icon: 'Tag',
    keywords: ['untag', 'remove', 'tag', 'lead'],
    params: [
      {
        key: 'tag',
        label: 'Tag to Remove',
        type: 'string',
        required: true,
        placeholder: 'VIP Client',
      },
    ],
  },

  'ADJUST_LEAD_SCORE': {
    code: 'ADJUST_LEAD_SCORE',
    name: 'Adjust Lead Score',
    category: 'Leads & CRM',
    description: 'Increments, decrements, or sets the lead score based on buyer actions.',
    icon: 'Award',
    badge: 'Scoring',
    keywords: ['score', 'lead', 'points', 'qualification'],
    params: [
      {
        key: 'operation',
        label: 'Score Operation',
        type: 'select',
        defaultValue: 'ADD',
        options: [
          { label: 'Add Points (+)', value: 'ADD' },
          { label: 'Subtract Points (-)', value: 'SUBTRACT' },
          { label: 'Set Exact Score', value: 'SET' },
        ],
      },
      {
        key: 'points',
        label: 'Score Points',
        type: 'number',
        required: true,
        defaultValue: 20,
      },
      {
        key: 'reason',
        label: 'Scoring Reason',
        type: 'string',
        placeholder: 'High budget tier selected',
      },
    ],
  },

  'CONVERT_LEAD': {
    code: 'CONVERT_LEAD',
    name: 'Convert Lead to Customer & Deal',
    category: 'Leads & CRM',
    description: 'Promotes an Enquiry to a formal Customer and opens a Deal in the sales pipeline.',
    icon: 'UserCheck',
    badge: 'CRM',
    keywords: ['convert', 'customer', 'deal', 'won'],
    params: [
      {
        key: 'dealTitle',
        label: 'Initial Deal Title',
        type: 'string',
        required: true,
        placeholder: '{{lead.company}} — {{lead.service}} Project',
      },
      {
        key: 'dealValue',
        label: 'Deal Value (INR)',
        type: 'number',
        defaultValue: 100000,
      },
    ],
  },

  'ADD_LEAD_NOTE': {
    code: 'ADD_LEAD_NOTE',
    name: 'Add Internal Lead Note',
    category: 'Leads & CRM',
    description: 'Appends a timestamped internal note to the CRM lead timeline.',
    icon: 'FileText',
    keywords: ['note', 'timeline', 'lead', 'comment'],
    params: [
      {
        key: 'noteText',
        label: 'Note Text',
        type: 'textarea',
        required: true,
        placeholder: 'Automated note: Lead qualified by automation workflow on {{today}}.',
      },
    ],
  },

  // 3. DEALS & SALES
  'CREATE_DEAL': {
    code: 'CREATE_DEAL',
    name: 'Create Sales Deal',
    category: 'Deals & Sales',
    description: 'Opens a new deal in a pipeline stage with estimated value.',
    icon: 'TrendingUp',
    badge: 'Pipeline',
    keywords: ['deal', 'sales', 'pipeline', 'opportunity'],
    params: [
      {
        key: 'title',
        label: 'Deal Title',
        type: 'string',
        required: true,
        placeholder: '{{lead.company}} — Contract',
      },
      {
        key: 'value',
        label: 'Deal Value (INR)',
        type: 'number',
        required: true,
        defaultValue: 250000,
      },
      {
        key: 'probability',
        label: 'Win Probability (%)',
        type: 'number',
        defaultValue: 60,
      },
    ],
  },

  'UPDATE_DEAL': {
    code: 'UPDATE_DEAL',
    name: 'Update Deal Pipeline Stage',
    category: 'Deals & Sales',
    description: 'Advances a deal to another pipeline stage or updates deal value.',
    icon: 'MoveRight',
    keywords: ['deal', 'stage', 'pipeline', 'advance'],
    params: [
      {
        key: 'stageName',
        label: 'Move to Stage Name',
        type: 'string',
        required: true,
        placeholder: 'Proposal Sent, Negotiation, Closed Won',
      },
      {
        key: 'probability',
        label: 'Updated Probability (%)',
        type: 'number',
        defaultValue: 80,
      },
    ],
  },

  'MARK_DEAL_STATUS': {
    code: 'MARK_DEAL_STATUS',
    name: 'Mark Deal Won / Lost',
    category: 'Deals & Sales',
    description: 'Formally closes a deal as Won or Lost with an explanation note.',
    icon: 'Award',
    keywords: ['deal', 'won', 'lost', 'close'],
    params: [
      {
        key: 'status',
        label: 'Outcome Status',
        type: 'select',
        required: true,
        defaultValue: 'WON',
        options: [
          { label: 'Closed Won (Victory)', value: 'WON' },
          { label: 'Closed Lost', value: 'LOST' },
        ],
      },
      {
        key: 'reason',
        label: 'Closing Note / Lost Reason',
        type: 'string',
        placeholder: 'Client agreed to proposal terms',
      },
    ],
  },

  'CREATE_PROPOSAL': {
    code: 'CREATE_PROPOSAL',
    name: 'Generate Commercial Proposal',
    category: 'Deals & Sales',
    description: 'Creates a formal proposal document linked to the deal.',
    icon: 'FileSpreadsheet',
    keywords: ['proposal', 'commercial', 'scope', 'pricing'],
    params: [
      {
        key: 'title',
        label: 'Proposal Title',
        type: 'string',
        required: true,
        placeholder: 'Full-Stack Solution for {{lead.company}}',
      },
      {
        key: 'totalBudget',
        label: 'Total Budget (INR)',
        type: 'number',
        defaultValue: 500000,
      },
      {
        key: 'deliverables',
        label: 'Deliverables Summary',
        type: 'textarea',
        placeholder: 'Design, Mobile App, Web Portal, Deployment & 1-Year Support.',
      },
    ],
  },

  'CREATE_CONTRACT': {
    code: 'CREATE_CONTRACT',
    name: 'Generate Service Contract / SLA',
    category: 'Deals & Sales',
    description: 'Drafts a service agreement or hardware rental contract.',
    icon: 'ShieldCheck',
    keywords: ['contract', 'sla', 'agreement'],
    params: [
      {
        key: 'contractType',
        label: 'Contract Type',
        type: 'select',
        defaultValue: 'SOFTWARE_DEV',
        options: [
          { label: 'Software Development', value: 'SOFTWARE_DEV' },
          { label: 'IT Rental Agreement', value: 'IT_RENTAL' },
          { label: 'AMC Maintenance', value: 'AMC' },
        ],
      },
      {
        key: 'durationMonths',
        label: 'Contract Duration (Months)',
        type: 'number',
        defaultValue: 12,
      },
      {
        key: 'totalValue',
        label: 'Total Contract Value (INR)',
        type: 'number',
        defaultValue: 300000,
      },
    ],
  },

  // 4. TASKS & MEETINGS
  'CREATE_FOLLOW_UP': {
    code: 'CREATE_FOLLOW_UP',
    name: 'Schedule CRM Follow-up / Call',
    category: 'Tasks & Meetings',
    description: 'Creates a scheduled phone call, WhatsApp touchpoint, or meeting.',
    icon: 'Calendar',
    badge: 'Tasks',
    keywords: ['followup', 'call', 'meeting', 'task', 'schedule'],
    params: [
      {
        key: 'title',
        label: 'Follow-up Title',
        type: 'string',
        required: true,
        placeholder: 'Follow up with {{lead.name}} regarding quotation',
      },
      {
        key: 'type',
        label: 'Touchpoint Type',
        type: 'select',
        defaultValue: 'CALL',
        options: [
          { label: 'Phone Call', value: 'CALL' },
          { label: 'WhatsApp Chat', value: 'WHATSAPP' },
          { label: 'Email Follow-up', value: 'EMAIL' },
          { label: 'Meeting / Demo', value: 'MEETING' },
        ],
      },
      {
        key: 'delayHours',
        label: 'Schedule After (Hours)',
        type: 'number',
        required: true,
        defaultValue: 24,
      },
      {
        key: 'description',
        label: 'Instructions for Sales Executive',
        type: 'textarea',
        placeholder: 'Check if client had questions regarding project scope and timeline.',
      },
    ],
  },

  'CREATE_PROJECT_TASK': {
    code: 'CREATE_PROJECT_TASK',
    name: 'Create Deliverable Project Task',
    category: 'Tasks & Meetings',
    description: 'Adds a task to a project board with priority and estimation.',
    icon: 'CheckSquare',
    keywords: ['task', 'project', 'todo', 'milestone'],
    params: [
      {
        key: 'title',
        label: 'Task Title',
        type: 'string',
        required: true,
        placeholder: 'Setup Onboarding & Architecture for {{lead.company}}',
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        defaultValue: 'MEDIUM',
        options: [
          { label: 'Low', value: 'LOW' },
          { label: 'Medium', value: 'MEDIUM' },
          { label: 'High', value: 'HIGH' },
          { label: 'Urgent', value: 'URGENT' },
        ],
      },
      {
        key: 'estimatedHours',
        label: 'Estimated Hours',
        type: 'number',
        defaultValue: 4,
      },
    ],
  },

  'COMPLETE_PROJECT_TASK': {
    code: 'COMPLETE_PROJECT_TASK',
    name: 'Mark Project Task Done',
    category: 'Tasks & Meetings',
    description: 'Marks an existing project task as COMPLETED.',
    icon: 'CheckCircle2',
    keywords: ['complete', 'done', 'task'],
    params: [
      {
        key: 'taskKeyword',
        label: 'Task Title Keyword Match',
        type: 'string',
        required: true,
        placeholder: 'Onboarding',
      },
    ],
  },

  // 5. QUOTATIONS & FINANCE
  'CREATE_QUOTATION': {
    code: 'CREATE_QUOTATION',
    name: 'Generate Client Quotation',
    category: 'Quotations & Finance',
    description: 'Drafts a commercial quotation with line item, subtotal, and tax.',
    icon: 'Receipt',
    badge: 'Finance',
    keywords: ['quotation', 'quote', 'estimate', 'price'],
    params: [
      {
        key: 'clientName',
        label: 'Client Name',
        type: 'template',
        required: true,
        placeholder: '{{lead.name}}',
      },
      {
        key: 'clientEmail',
        label: 'Client Email',
        type: 'template',
        required: true,
        placeholder: '{{lead.email}}',
      },
      {
        key: 'itemDescription',
        label: 'Line Item Description',
        type: 'string',
        required: true,
        placeholder: 'Software Architecture & Development Services',
      },
      {
        key: 'subtotal',
        label: 'Subtotal Amount (INR)',
        type: 'number',
        required: true,
        defaultValue: 150000,
      },
      {
        key: 'taxRate',
        label: 'GST Tax Rate (%)',
        type: 'number',
        defaultValue: 18,
      },
      {
        key: 'validDays',
        label: 'Validity Period (Days)',
        type: 'number',
        defaultValue: 14,
      },
    ],
  },

  'CREATE_INVOICE': {
    code: 'CREATE_INVOICE',
    name: 'Generate Client Invoice',
    category: 'Quotations & Finance',
    description: 'Generates and issues an official invoice with payment due date.',
    icon: 'CreditCard',
    badge: 'Billing',
    keywords: ['invoice', 'bill', 'payment', 'finance'],
    params: [
      {
        key: 'clientName',
        label: 'Client Name',
        type: 'template',
        required: true,
        placeholder: '{{lead.name}}',
      },
      {
        key: 'clientEmail',
        label: 'Client Email',
        type: 'template',
        required: true,
        placeholder: '{{lead.email}}',
      },
      {
        key: 'itemDescription',
        label: 'Invoice Item Description',
        type: 'string',
        required: true,
        placeholder: 'Milestone 1 — Frontend & API Implementation',
      },
      {
        key: 'totalAmount',
        label: 'Invoice Total (INR)',
        type: 'number',
        required: true,
        defaultValue: 75000,
      },
      {
        key: 'dueDays',
        label: 'Due in (Days)',
        type: 'number',
        defaultValue: 7,
      },
    ],
  },

  'RECORD_PAYMENT': {
    code: 'RECORD_PAYMENT',
    name: 'Record Invoice Payment',
    category: 'Quotations & Finance',
    description: 'Logs a payment receipt against an outstanding invoice.',
    icon: 'DollarSign',
    keywords: ['payment', 'receipt', 'settle', 'paid'],
    params: [
      {
        key: 'amount',
        label: 'Payment Amount (INR)',
        type: 'number',
        required: true,
        placeholder: '75000',
      },
      {
        key: 'paymentMethod',
        label: 'Payment Method',
        type: 'select',
        defaultValue: 'BANK_TRANSFER',
        options: [
          { label: 'Bank Transfer (NEFT/RTGS)', value: 'BANK_TRANSFER' },
          { label: 'UPI / QR', value: 'UPI' },
          { label: 'Credit Card', value: 'CARD' },
          { label: 'Cheque', value: 'CHEQUE' },
        ],
      },
      {
        key: 'referenceId',
        label: 'Transaction / UTR Reference',
        type: 'string',
        placeholder: 'UTR-987654321',
      },
    ],
  },

  'SEND_PAYMENT_REMINDER': {
    code: 'SEND_PAYMENT_REMINDER',
    name: 'Send Invoice Payment Reminder',
    category: 'Quotations & Finance',
    description: 'Sends automated payment reminder via WhatsApp or Email.',
    icon: 'Clock',
    keywords: ['reminder', 'invoice', 'overdue', 'payment'],
    params: [
      {
        key: 'channel',
        label: 'Delivery Channel',
        type: 'select',
        defaultValue: 'WHATSAPP',
        options: [
          { label: 'WhatsApp Only', value: 'WHATSAPP' },
          { label: 'Email Only', value: 'EMAIL' },
          { label: 'Both WhatsApp & Email', value: 'BOTH' },
        ],
      },
      {
        key: 'tone',
        label: 'Message Tone',
        type: 'select',
        defaultValue: 'FRIENDLY',
        options: [
          { label: 'Friendly Upcoming Notice (3 days before)', value: 'FRIENDLY' },
          { label: 'Due Date Notification (Today)', value: 'DUE_TODAY' },
          { label: 'Urgent Overdue Escalation', value: 'OVERDUE' },
        ],
      },
    ],
  },

  'LOG_EXPENSE': {
    code: 'LOG_EXPENSE',
    name: 'Log Business Expense',
    category: 'Quotations & Finance',
    description: 'Records an outgoing expenditure in the expense ledger.',
    icon: 'TrendingDown',
    keywords: ['expense', 'cost', 'spend'],
    params: [
      {
        key: 'category',
        label: 'Expense Category',
        type: 'select',
        defaultValue: 'INFRASTRUCTURE',
        options: [
          { label: 'Cloud Infrastructure', value: 'INFRASTRUCTURE' },
          { label: 'Hardware Acquisition', value: 'HARDWARE' },
          { label: 'Software Subscriptions', value: 'SOFTWARE_SUBSCRIPTIONS' },
          { label: 'Marketing & Ads', value: 'MARKETING' },
          { label: 'Office & Travel', value: 'OFFICE' },
        ],
      },
      {
        key: 'amount',
        label: 'Amount (INR)',
        type: 'number',
        required: true,
        defaultValue: 5000,
      },
      {
        key: 'vendorName',
        label: 'Vendor / Merchant',
        type: 'string',
        placeholder: 'AWS, Google Cloud, Dell',
      },
    ],
  },

  // 6. SUPPORT
  'CREATE_TICKET': {
    code: 'CREATE_TICKET',
    name: 'Create Support Ticket',
    category: 'Support',
    description: 'Logs a client support ticket with SLA priority.',
    icon: 'LifeBuoy',
    badge: 'Support',
    keywords: ['ticket', 'support', 'helpdesk', 'sla', 'bug'],
    params: [
      {
        key: 'subject',
        label: 'Ticket Subject',
        type: 'string',
        required: true,
        placeholder: 'Urgent: Issue reported by {{lead.name}}',
      },
      {
        key: 'category',
        label: 'Ticket Category',
        type: 'select',
        defaultValue: 'TECHNICAL',
        options: [
          { label: 'Technical / Bug', value: 'SOFTWARE_BUG' },
          { label: 'Hardware Rental Replacement', value: 'HARDWARE_RENTAL' },
          { label: 'Billing & Invoicing', value: 'BILLING' },
          { label: 'General Assistance', value: 'GENERAL' },
        ],
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        defaultValue: 'HIGH',
        options: [
          { label: 'Low (48h SLA)', value: 'LOW' },
          { label: 'Medium (24h SLA)', value: 'MEDIUM' },
          { label: 'High (4h SLA)', value: 'HIGH' },
          { label: 'Urgent (1h SLA)', value: 'URGENT' },
        ],
      },
      {
        key: 'description',
        label: 'Ticket Details',
        type: 'textarea',
        placeholder: 'Client encountered issue: {{message.text}}',
      },
    ],
  },

  'UPDATE_TICKET': {
    code: 'UPDATE_TICKET',
    name: 'Update Support Ticket SLA / Priority',
    category: 'Support',
    description: 'Escalates ticket priority, assigns technician, or marks resolved.',
    icon: 'AlertCircle',
    keywords: ['escalate', 'ticket', 'priority', 'resolve'],
    params: [
      {
        key: 'priority',
        label: 'Escalate Priority To',
        type: 'select',
        defaultValue: 'URGENT',
        options: [
          { label: 'Low', value: 'LOW' },
          { label: 'Medium', value: 'MEDIUM' },
          { label: 'High', value: 'HIGH' },
          { label: 'Urgent', value: 'URGENT' },
        ],
      },
      {
        key: 'status',
        label: 'Change Status',
        type: 'select',
        defaultValue: '',
        options: [
          { label: '— No Change —', value: '' },
          { label: 'In Progress', value: 'IN_PROGRESS' },
          { label: 'Resolved', value: 'RESOLVED' },
          { label: 'Closed', value: 'CLOSED' },
        ],
      },
    ],
  },

  'ADD_TICKET_COMMENT': {
    code: 'ADD_TICKET_COMMENT',
    name: 'Add Ticket Comment / Resolution',
    category: 'Support',
    description: 'Appends a resolution note or internal comment to a support ticket.',
    icon: 'MessageSquare',
    keywords: ['comment', 'ticket', 'note'],
    params: [
      {
        key: 'message',
        label: 'Comment Content',
        type: 'textarea',
        required: true,
        placeholder: 'Automated update: Ticket escalated to Lead Engineer.',
      },
      {
        key: 'isInternal',
        label: 'Internal Staff Only (Hide from Customer)',
        type: 'boolean',
        defaultValue: true,
      },
    ],
  },

  // 7. RENTAL & AMC
  'CREATE_RENTAL_ORDER': {
    code: 'CREATE_RENTAL_ORDER',
    name: 'Create Hardware Rental Order',
    category: 'Rental & AMC',
    description: 'Issues a rental booking for laptops, workstations, or servers.',
    icon: 'Laptop',
    badge: 'Hardware',
    keywords: ['rental', 'laptop', 'hardware', 'macbook', 'equipment'],
    params: [
      {
        key: 'deviceType',
        label: 'Equipment Category',
        type: 'select',
        defaultValue: 'LAPTOP',
        options: [
          { label: 'Apple MacBook Pro', value: 'LAPTOP' },
          { label: 'High-End Workstation / PC', value: 'WORKSTATION' },
          { label: 'Developer Monitor', value: 'MONITOR' },
          { label: 'Cloud / On-prem Server', value: 'SERVER' },
        ],
      },
      {
        key: 'durationMonths',
        label: 'Rental Duration (Months)',
        type: 'number',
        defaultValue: 6,
      },
      {
        key: 'monthlyRate',
        label: 'Monthly Rate per Device (INR)',
        type: 'number',
        defaultValue: 4500,
      },
    ],
  },

  'UPDATE_RENTAL_STATUS': {
    code: 'UPDATE_RENTAL_STATUS',
    name: 'Update Rental Order Status',
    category: 'Rental & AMC',
    description: 'Updates rental order status to Renewed, Returned, or Overdue.',
    icon: 'RefreshCw',
    keywords: ['rental', 'return', 'renew', 'overdue'],
    params: [
      {
        key: 'newStatus',
        label: 'Target Status',
        type: 'select',
        required: true,
        options: [
          { label: 'Active / Renewed', value: 'ACTIVE' },
          { label: 'Returned Successfully', value: 'RETURNED' },
          { label: 'Flag Overdue', value: 'OVERDUE' },
        ],
      },
    ],
  },

  'SCHEDULE_AMC_MAINTENANCE': {
    code: 'SCHEDULE_AMC_MAINTENANCE',
    name: 'Schedule AMC Maintenance Visit',
    category: 'Rental & AMC',
    description: 'Logs a routine maintenance or hardware servicing task.',
    icon: 'Wrench',
    keywords: ['amc', 'maintenance', 'service', 'hardware'],
    params: [
      {
        key: 'issueDescription',
        label: 'Service Task Description',
        type: 'string',
        required: true,
        placeholder: 'Quarterly hardware diagnostic & thermal check for client fleet',
      },
      {
        key: 'technicianName',
        label: 'Assigned Technician',
        type: 'string',
        placeholder: 'Field Engineer',
      },
    ],
  },

  // 8. HRM
  'HR_SEND_ANNOUNCEMENT': {
    code: 'HR_SEND_ANNOUNCEMENT',
    name: 'Send Staff Announcement',
    category: 'HRM',
    description: 'Broadcasts an internal bulletin or policy update to employees.',
    icon: 'Megaphone',
    badge: 'HRM',
    keywords: ['hr', 'announcement', 'staff', 'employee'],
    params: [
      {
        key: 'title',
        label: 'Announcement Title',
        type: 'string',
        required: true,
        placeholder: 'Upcoming Public Holiday Notice',
      },
      {
        key: 'message',
        label: 'Announcement Body',
        type: 'textarea',
        required: true,
        placeholder: 'Please note that offices will remain closed on Monday.',
      },
    ],
  },

  'HR_UPDATE_LEAVE': {
    code: 'HR_UPDATE_LEAVE',
    name: 'Approve / Reject Leave Request',
    category: 'HRM',
    description: 'Automatically approves or flags employee leave requests.',
    icon: 'CheckCircle',
    keywords: ['leave', 'vacation', 'approve', 'hr'],
    params: [
      {
        key: 'decision',
        label: 'Leave Decision',
        type: 'select',
        defaultValue: 'APPROVED',
        options: [
          { label: 'Approve Request', value: 'APPROVED' },
          { label: 'Reject Request', value: 'REJECTED' },
        ],
      },
      {
        key: 'note',
        label: 'Manager Note',
        type: 'string',
        placeholder: 'Approved under annual casual leave entitlement.',
      },
    ],
  },

  'HR_FLAG_ATTENDANCE': {
    code: 'HR_FLAG_ATTENDANCE',
    name: 'Flag Staff Attendance Status',
    category: 'HRM',
    description: 'Records half-day, late arrival, or leave flag in staff attendance log.',
    icon: 'Clock',
    keywords: ['attendance', 'late', 'halfday', 'hr'],
    params: [
      {
        key: 'status',
        label: 'Attendance Status',
        type: 'select',
        defaultValue: 'LATE',
        options: [
          { label: 'Mark Late', value: 'LATE' },
          { label: 'Mark Half-Day', value: 'HALF_DAY' },
          { label: 'Mark Absent', value: 'ABSENT' },
        ],
      },
      {
        key: 'notes',
        label: 'Audit Notes',
        type: 'string',
        placeholder: 'Late check-in past 10:15 AM grace period',
      },
    ],
  },

  // 9. DATA & INTEGRATIONS
  'APPEND_GOOGLE_SHEET': {
    code: 'APPEND_GOOGLE_SHEET',
    name: 'Append to Google Sheet',
    category: 'Data & Integrations',
    description: 'Appends lead or deal details as a new row in an integrated Google Sheet.',
    icon: 'Sheet',
    badge: 'Sheets',
    keywords: ['sheets', 'google', 'spreadsheet', 'sync'],
    params: [
      {
        key: 'sheetTabName',
        label: 'Sheet Tab Name',
        type: 'string',
        defaultValue: 'Sheet1',
      },
      {
        key: 'columns',
        label: 'Row Columns to Export',
        type: 'select',
        defaultValue: 'ALL_FIELDS',
        options: [
          { label: 'All Lead Fields (Name, Phone, Email, Budget, Service)', value: 'ALL_FIELDS' },
          { label: 'Contact Info Only (Name, Phone, Email)', value: 'CONTACT_ONLY' },
        ],
      },
    ],
  },

  'OUTBOUND_WEBHOOK': {
    code: 'OUTBOUND_WEBHOOK',
    name: 'Call Outbound Webhook / REST API',
    category: 'Data & Integrations',
    description: 'Dispatches an HTTP POST/GET request to an external third-party API endpoint.',
    icon: 'Globe',
    badge: 'API',
    keywords: ['webhook', 'api', 'http', 'post', 'zapier', 'make'],
    params: [
      {
        key: 'url',
        label: 'Webhook Destination URL',
        type: 'string',
        required: true,
        placeholder: 'https://api.thirdparty.com/webhook',
      },
      {
        key: 'method',
        label: 'HTTP Method',
        type: 'select',
        defaultValue: 'POST',
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'GET', value: 'GET' },
        ],
      },
      {
        key: 'customHeaders',
        label: 'Custom HTTP Headers (JSON)',
        type: 'textarea',
        placeholder: '{"Authorization": "Bearer YOUR_SECRET_KEY"}',
      },
    ],
  },

  // 10. LOGIC & BRANCHING
  'BRANCH': {
    code: 'BRANCH',
    name: 'IF / ELSE Branch',
    category: 'Logic & Branching',
    description: 'Splits execution into True and False pathways based on conditions.',
    icon: 'GitFork',
    isLogicOrTiming: true,
    keywords: ['if', 'else', 'condition', 'branch', 'split'],
    params: [],
  },

  'MULTI_BRANCH': {
    code: 'MULTI_BRANCH',
    name: 'Multi-Branch Switch',
    category: 'Logic & Branching',
    description: 'Evaluates multiple condition cases with dedicated pathways plus default fallback.',
    icon: 'GitPullRequest',
    isLogicOrTiming: true,
    keywords: ['switch', 'case', 'multi-branch', 'pathway'],
    params: [],
  },

  'FILTER': {
    code: 'FILTER',
    name: 'Filter / Gatekeeper',
    category: 'Logic & Branching',
    description: 'Only allows execution to continue if conditions match; otherwise stops gracefully.',
    icon: 'Filter',
    isLogicOrTiming: true,
    keywords: ['filter', 'gatekeeper', 'guard', 'only'],
    params: [],
  },

  'WAIT_APPROVAL': {
    code: 'WAIT_APPROVAL',
    name: 'Wait for Human Approval',
    category: 'Logic & Branching',
    description: 'Pauses workflow in WAITING status until an administrator approves via dashboard.',
    icon: 'CheckSquare',
    isLogicOrTiming: true,
    keywords: ['approval', 'human', 'manager', 'pause', 'wait'],
    params: [
      {
        key: 'title',
        label: 'Approval Request Title',
        type: 'string',
        required: true,
        placeholder: 'Approve Quotation Discount for {{lead.company}}',
      },
      {
        key: 'timeoutHours',
        label: 'Auto-Expire Timeout (Hours)',
        type: 'number',
        defaultValue: 48,
      },
    ],
  },

  'STOP_WORKFLOW': {
    code: 'STOP_WORKFLOW',
    name: 'Stop Workflow Execution',
    category: 'Logic & Branching',
    description: 'Formally terminates the workflow execution immediately.',
    icon: 'Octagon',
    isLogicOrTiming: true,
    keywords: ['stop', 'exit', 'terminate', 'cancel', 'halt'],
    params: [
      {
        key: 'status',
        label: 'Final Execution Status',
        type: 'select',
        defaultValue: 'COMPLETED',
        options: [
          { label: 'Completed Gracefully', value: 'COMPLETED' },
          { label: 'Cancelled Early', value: 'CANCELLED' },
        ],
      },
      {
        key: 'reason',
        label: 'Termination Reason',
        type: 'string',
        placeholder: 'Lead did not meet qualification criteria.',
      },
    ],
  },

  // 11. TIMING & SCHEDULING
  'DELAY': {
    code: 'DELAY',
    name: 'Wait / Delay',
    category: 'Timing & Scheduling',
    description: 'Pauses workflow for minutes, hours, days, specific time, or relative CRM date.',
    icon: 'Clock',
    isLogicOrTiming: true,
    keywords: ['wait', 'delay', 'pause', 'timer', 'schedule', 'hold'],
    params: [
      {
        key: 'delayType',
        label: 'Delay Mode',
        type: 'select',
        defaultValue: 'RELATIVE',
        options: [
          { label: 'Wait Duration (Minutes/Hours/Days)', value: 'RELATIVE' },
          { label: 'Wait Until Next Business Hours (9am-6pm)', value: 'BUSINESS_HOURS' },
          { label: 'Relative to CRM Date (e.g. 2 days before Due Date)', value: 'DATE_RELATIVE' },
        ],
      },
      {
        key: 'duration',
        label: 'Duration Amount',
        type: 'number',
        defaultValue: 24,
        dependsOn: { field: 'delayType', equals: 'RELATIVE' },
      },
      {
        key: 'unit',
        label: 'Duration Unit',
        type: 'select',
        defaultValue: 'HOURS',
        options: [
          { label: 'Minutes', value: 'MINUTES' },
          { label: 'Hours', value: 'HOURS' },
          { label: 'Days', value: 'DAYS' },
        ],
        dependsOn: { field: 'delayType', equals: 'RELATIVE' },
      },
      {
        key: 'dateField',
        label: 'CRM Date Field Reference',
        type: 'string',
        placeholder: 'invoice.dueDate or rental.endDate',
        dependsOn: { field: 'delayType', equals: 'DATE_RELATIVE' },
      },
      {
        key: 'relativeOffsetDays',
        label: 'Offset Days (+/-)',
        type: 'number',
        defaultValue: -2,
        description: 'Negative means days before, positive means days after.',
        dependsOn: { field: 'delayType', equals: 'DATE_RELATIVE' },
      },
    ],
  },

  // 12. ADVANCED
  'SET_VARIABLE': {
    code: 'SET_VARIABLE',
    name: 'Set Variable / Calculation',
    category: 'Advanced',
    description: 'Stores a computed value or math calculation in the workflow context.',
    icon: 'Calculator',
    badge: 'Logic',
    keywords: ['variable', 'calculation', 'math', 'compute', 'set'],
    params: [
      {
        key: 'variableName',
        label: 'Variable Key',
        type: 'string',
        required: true,
        placeholder: 'custom_discount_rate',
      },
      {
        key: 'valueExpression',
        label: 'Value or Expression',
        type: 'string',
        required: true,
        placeholder: '15 or {{lead.budget}} * 0.1',
      },
    ],
  },

  'TRIGGER_WORKFLOW': {
    code: 'TRIGGER_WORKFLOW',
    name: 'Trigger Another Workflow',
    category: 'Advanced',
    description: 'Spawns and executes another published workflow rule asynchronously.',
    icon: 'Zap',
    keywords: ['sub-workflow', 'trigger', 'chain', 'call'],
    params: [
      {
        key: 'targetWorkflowName',
        label: 'Target Workflow Title or ID',
        type: 'string',
        required: true,
        placeholder: 'Client Onboarding Sequence',
      },
    ],
  },

  'LOG_AUDIT': {
    code: 'LOG_AUDIT',
    name: 'Log System Audit Event',
    category: 'Advanced',
    description: 'Writes an immutable event record into the system ActivityLog database.',
    icon: 'ShieldCheck',
    keywords: ['audit', 'log', 'security', 'record'],
    params: [
      {
        key: 'action',
        label: 'Audit Action Code',
        type: 'string',
        required: true,
        placeholder: 'WORKFLOW_AUTOMATION_COMPLETED',
      },
      {
        key: 'metadata',
        label: 'Audit Log Details',
        type: 'textarea',
        placeholder: 'Workflow executed for {{lead.company}} with outcome SUCCESS.',
      },
    ],
  },
};

/**
 * Returns all registered action definitions grouped by category.
 */
export function getActionsGroupedByCategory(): Record<WorkflowCategory, ActionDefinition[]> {
  const grouped: Record<WorkflowCategory, ActionDefinition[]> = {
    'Communication': [],
    'Leads & CRM': [],
    'Deals & Sales': [],
    'Tasks & Meetings': [],
    'Quotations & Finance': [],
    'Support': [],
    'Rental & AMC': [],
    'HRM': [],
    'Data & Integrations': [],
    'Logic & Branching': [],
    'Timing & Scheduling': [],
    'Advanced': [],
  };

  for (const action of Object.values(ACTION_REGISTRY)) {
    if (grouped[action.category]) {
      grouped[action.category].push(action);
    }
  }

  return grouped;
}
