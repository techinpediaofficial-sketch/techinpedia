// ============================================================
// Production Workflow Templates Gallery
// ============================================================

import { WorkflowDefinition } from './types';

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  trigger: string;
  definition: WorkflowDefinition;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // 1. New Lead Auto Response
  {
    id: 'tpl-lead-auto-response',
    name: 'New Lead Auto-Response & Round-Robin Routing',
    category: 'LEADS',
    description: 'Instantly sends a WhatsApp welcome message, notifies the client via email, and distributes the lead to the sales team using Round-Robin.',
    trigger: 'crm.lead.created',
    definition: {
      nodes: [
        {
          id: 'node-trigger',
          name: 'New Lead Submitted',
          type: 'TRIGGER',
          config: { event: 'crm.lead.created' },
        },
        {
          id: 'node-action-whatsapp',
          name: 'Send Instant WhatsApp Greeting',
          type: 'ACTION',
          config: {
            actionType: 'SEND_WHATSAPP',
            params: {
              recipientPhone: '{{lead.phone}}',
              messageText: 'Hello {{lead.name}}, thank you for contacting TechInPedia! We received your enquiry for {{lead.service}}. Our technical team will get in touch shortly.',
            },
          },
        },
        {
          id: 'node-action-assign',
          name: 'Round-Robin Lead Assignment',
          type: 'ACTION',
          config: {
            actionType: 'ASSIGN_ROUND_ROBIN',
            params: { targetRole: 'ADMIN', notifyAssignee: true },
          },
        },
        {
          id: 'node-action-followup',
          name: 'Create Call Follow-Up Task',
          type: 'ACTION',
          config: {
            actionType: 'CREATE_FOLLOW_UP',
            params: {
              title: 'First Discovery Call with {{lead.name}} ({{lead.company}})',
              delayHours: 2,
              type: 'CALL',
            },
          },
        },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-trigger', targetNodeId: 'node-action-whatsapp', branchType: 'DEFAULT' },
        { id: 'e2', sourceNodeId: 'node-action-whatsapp', targetNodeId: 'node-action-assign', branchType: 'DEFAULT' },
        { id: 'e3', sourceNodeId: 'node-action-assign', targetNodeId: 'node-action-followup', branchType: 'DEFAULT' },
      ],
    },
  },

  // 2. High-Value Lead VIP Fast-Track
  {
    id: 'tpl-vip-lead-escalation',
    name: 'High-Value Lead VIP Fast-Track',
    category: 'LEADS',
    description: 'Evaluates lead score and budget. If high value (Score >= 60), tags as VIP, alerts leadership and assigns priority follow-up.',
    trigger: 'crm.lead.created',
    definition: {
      nodes: [
        {
          id: 'node-trigger',
          name: 'New Lead Inbound',
          type: 'TRIGGER',
          config: { event: 'crm.lead.created' },
        },
        {
          id: 'node-branch-high-value',
          name: 'Is High Value Lead?',
          type: 'BRANCH',
          config: {
            conditionGroup: {
              id: 'cond-vip',
              logicalOperator: 'OR',
              rules: [
                { id: 'r1', field: 'lead.score', operator: 'greater_than_or_equal', value: 60 },
                { id: 'r2', field: 'lead.budget', operator: 'contains', value: 'Lakh' },
              ],
            },
          },
        },
        {
          id: 'node-action-tag-vip',
          name: 'Attach VIP Tag',
          type: 'ACTION',
          config: {
            actionType: 'ADD_LEAD_TAG',
            params: { tag: 'VIP Prospect' },
          },
        },
        {
          id: 'node-action-email-alert',
          name: 'Notify Leadership Desk',
          type: 'ACTION',
          config: {
            actionType: 'SEND_EMAIL',
            params: {
              recipientEmail: 'admin@techinpedia.com',
              subject: '🔥 HIGH-VALUE LEAD: {{lead.name}} ({{lead.company}})',
              htmlBody: '<p>A high-value lead has arrived with score {{lead.score}}/100 for {{lead.service}}.</p>',
            },
          },
        },
        {
          id: 'node-action-standard-assign',
          name: 'Standard Lead Route',
          type: 'ACTION',
          config: {
            actionType: 'ASSIGN_ROUND_ROBIN',
            params: { targetRole: 'ADMIN' },
          },
        },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-trigger', targetNodeId: 'node-branch-high-value', branchType: 'DEFAULT' },
        { id: 'e2', sourceNodeId: 'node-branch-high-value', targetNodeId: 'node-action-tag-vip', branchType: 'TRUE' },
        { id: 'e3', sourceNodeId: 'node-action-tag-vip', targetNodeId: 'node-action-email-alert', branchType: 'DEFAULT' },
        { id: 'e4', sourceNodeId: 'node-branch-high-value', targetNodeId: 'node-action-standard-assign', branchType: 'FALSE' },
      ],
    },
  },

  // 3. Multi-Day Lead Nurture & Follow-up
  {
    id: 'tpl-multi-day-nurture',
    name: '3-Step Lead Nurture Sequence',
    category: 'CRM',
    description: 'Multi-day automated follow-up sequence: Sends intro WhatsApp, waits 24 hours, sends follow-up email, then schedules sales task.',
    trigger: 'crm.lead.created',
    definition: {
      nodes: [
        {
          id: 'node-trigger',
          name: 'Lead Created',
          type: 'TRIGGER',
          config: { event: 'crm.lead.created' },
        },
        {
          id: 'node-action-intro',
          name: 'Day 1: Welcome WhatsApp',
          type: 'ACTION',
          config: {
            actionType: 'SEND_WHATSAPP',
            params: {
              recipientPhone: '{{lead.phone}}',
              messageText: 'Hi {{lead.name}}, TechInPedia here! We would love to understand your requirements for {{lead.service}}.',
            },
          },
        },
        {
          id: 'node-delay-24h',
          name: 'Wait 24 Hours (Business Hours)',
          type: 'DELAY',
          config: {
            delayType: 'RELATIVE',
            duration: 24,
            unit: 'HOURS',
            businessHoursOnly: true,
          },
        },
        {
          id: 'node-action-email',
          name: 'Day 2: Portfolio Case Studies Email',
          type: 'ACTION',
          config: {
            actionType: 'SEND_EMAIL',
            params: {
              recipientEmail: '{{lead.email}}',
              subject: 'Case Studies & Tech Solutions for {{lead.company}}',
              htmlBody: '<p>Hi {{lead.name}}, here are recent projects we delivered in {{lead.service}}.</p>',
            },
          },
        },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-trigger', targetNodeId: 'node-action-intro', branchType: 'DEFAULT' },
        { id: 'e2', sourceNodeId: 'node-action-intro', targetNodeId: 'node-delay-24h', branchType: 'DEFAULT' },
        { id: 'e3', sourceNodeId: 'node-delay-24h', targetNodeId: 'node-action-email', branchType: 'DEFAULT' },
      ],
    },
  },

  // 4. Deal Stage Won Deliverable Creation
  {
    id: 'tpl-deal-won-onboarding',
    name: 'Deal Closed Won Client Onboarding',
    category: 'SALES',
    description: 'When a deal moves to Closed Won, automatically sends a congratulations WhatsApp, creates deliverable project task, and tags client as ACTIVE.',
    trigger: 'crm.deal.won',
    definition: {
      nodes: [
        {
          id: 'node-trigger',
          name: 'Deal Won',
          type: 'TRIGGER',
          config: { event: 'crm.deal.won' },
        },
        {
          id: 'node-action-congrats-wa',
          name: 'Send WhatsApp Welcome & Thank You',
          type: 'ACTION',
          config: {
            actionType: 'SEND_WHATSAPP',
            params: {
              recipientPhone: '{{deal.customer.phone}}',
              messageText: 'Congratulations! Deal for {{deal.title}} is confirmed. Welcome to the TechInPedia family!',
            },
          },
        },
        {
          id: 'node-action-task',
          name: 'Create Project Onboarding Deliverable',
          type: 'ACTION',
          config: {
            actionType: 'CREATE_PROJECT_TASK',
            params: {
              title: 'Project Kickoff & Tech Architecture for {{deal.title}}',
              priority: 'HIGH',
              estimatedHours: 8,
            },
          },
        },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-trigger', targetNodeId: 'node-action-congrats-wa', branchType: 'DEFAULT' },
        { id: 'e2', sourceNodeId: 'node-action-congrats-wa', targetNodeId: 'node-action-task', branchType: 'DEFAULT' },
      ],
    },
  },

  // 5. Overdue Invoice Reminder
  {
    id: 'tpl-invoice-overdue',
    name: 'Invoice Overdue Escalation Sequence',
    category: 'FINANCE',
    description: 'Triggers when client invoice passes due date. Sends reminder WhatsApp, waits 48 hours, and schedules phone call reminder.',
    trigger: 'finance.invoice.overdue',
    definition: {
      nodes: [
        {
          id: 'node-trigger',
          name: 'Invoice Overdue',
          type: 'TRIGGER',
          config: { event: 'finance.invoice.overdue' },
        },
        {
          id: 'node-action-wa-reminder',
          name: 'Send Payment Reminder WhatsApp',
          type: 'ACTION',
          config: {
            actionType: 'SEND_WHATSAPP',
            params: {
              recipientPhone: '{{customer.phone}}',
              messageText: 'Friendly reminder: Invoice #{{invoice.number}} for INR {{invoice.amount}} was due on {{invoice.dueDate}}. Kindly clear the outstanding payment.',
            },
          },
        },
        {
          id: 'node-delay-48h',
          name: 'Wait 48 Hours',
          type: 'DELAY',
          config: {
            delayType: 'RELATIVE',
            duration: 48,
            unit: 'HOURS',
          },
        },
        {
          id: 'node-action-call-followup',
          name: 'Schedule Finance Desk Call',
          type: 'ACTION',
          config: {
            actionType: 'CREATE_FOLLOW_UP',
            params: {
              title: 'Payment Escalation Call for Invoice #{{invoice.number}} ({{customer.name}})',
              delayHours: 1,
              type: 'CALL',
            },
          },
        },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-trigger', targetNodeId: 'node-action-wa-reminder', branchType: 'DEFAULT' },
        { id: 'e2', sourceNodeId: 'node-action-wa-reminder', targetNodeId: 'node-delay-48h', branchType: 'DEFAULT' },
        { id: 'e3', sourceNodeId: 'node-delay-48h', targetNodeId: 'node-action-call-followup', branchType: 'DEFAULT' },
      ],
    },
  },

  // 6. Hardware Rental Return & Renewal Reminder
  {
    id: 'tpl-rental-renewal-notice',
    name: 'Hardware Rental Return & Renewal Reminder',
    category: 'HARDWARE',
    description: 'Triggers 2 days before business laptop or computer rental period ends. Offers renewal extension via WhatsApp.',
    trigger: 'hardware.rental.due_soon',
    definition: {
      nodes: [
        {
          id: 'node-trigger',
          name: 'Rental Due Soon',
          type: 'TRIGGER',
          config: { event: 'hardware.rental.due_soon' },
        },
        {
          id: 'node-action-wa-renewal',
          name: 'Send Rental Extension Notice',
          type: 'ACTION',
          config: {
            actionType: 'SEND_WHATSAPP',
            params: {
              recipientPhone: '{{rental.customerPhone}}',
              messageText: 'Hello {{rental.customerName}}, your IT equipment rental (Order #{{rental.orderNumber}}) is expiring in {{rental.daysRemaining}} days. Reply YES to extend your rental seamlessly.',
            },
          },
        },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-trigger', targetNodeId: 'node-action-wa-renewal', branchType: 'DEFAULT' },
      ],
    },
  },

  // 7. Support Ticket Priority Escalation
  {
    id: 'tpl-ticket-sla-escalation',
    name: 'Support Ticket Urgent SLA Escalation',
    category: 'SUPPORT',
    description: 'When an urgent priority support ticket is opened, instantly notifies support lead via email and schedules an SLA reminder.',
    trigger: 'support.ticket.created',
    definition: {
      nodes: [
        {
          id: 'node-trigger',
          name: 'Support Ticket Logged',
          type: 'TRIGGER',
          config: { event: 'support.ticket.created' },
        },
        {
          id: 'node-branch-priority',
          name: 'Is Ticket Urgent?',
          type: 'BRANCH',
          config: {
            conditionGroup: {
              id: 'cond-ticket',
              logicalOperator: 'AND',
              rules: [{ id: 'tr1', field: 'ticket.priority', operator: 'equals', value: 'URGENT' }],
            },
          },
        },
        {
          id: 'node-action-alert-lead',
          name: 'Alert Support Manager',
          type: 'ACTION',
          config: {
            actionType: 'SEND_EMAIL',
            params: {
              recipientEmail: 'admin@techinpedia.com',
              subject: '🚨 URGENT SLA TICKET: {{ticket.subject}}',
              htmlBody: '<p>An urgent ticket has been logged by {{ticket.creatorEmail}}.</p>',
            },
          },
        },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-trigger', targetNodeId: 'node-branch-priority', branchType: 'DEFAULT' },
        { id: 'e2', sourceNodeId: 'node-branch-priority', targetNodeId: 'node-action-alert-lead', branchType: 'TRUE' },
      ],
    },
  },

  // 8. Least-Loaded Sales Representative Distribution
  {
    id: 'tpl-least-loaded-distribution',
    name: 'Fair Workload Sales Routing (Least-Loaded)',
    category: 'LEADS',
    description: 'Calculates active open lead workloads and assigns incoming inquiries to the sales executive with the fewest open leads.',
    trigger: 'crm.lead.created',
    definition: {
      nodes: [
        {
          id: 'node-trigger',
          name: 'New Lead Inbound',
          type: 'TRIGGER',
          config: { event: 'crm.lead.created' },
        },
        {
          id: 'node-action-least-loaded',
          name: 'Assign to Least-Loaded Executive',
          type: 'ACTION',
          config: {
            actionType: 'ASSIGN_LEAST_LOADED',
            params: { targetRole: 'ADMIN' },
          },
        },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-trigger', targetNodeId: 'node-action-least-loaded', branchType: 'DEFAULT' },
      ],
    },
  },

  // 9. Lead Lost Win-Back Automation
  {
    id: 'tpl-lead-lost-winback',
    name: 'Lead Lost Win-Back & Archive',
    category: 'CRM',
    description: 'When a lead status changes to LOST, wait 30 days and automatically trigger a check-in message to re-engage the prospect.',
    trigger: 'crm.lead.status_changed',
    definition: {
      nodes: [
        {
          id: 'node-trigger',
          name: 'Lead Status Changed',
          type: 'TRIGGER',
          config: { event: 'crm.lead.status_changed' },
        },
        {
          id: 'node-branch-lost',
          name: 'Is Status LOST?',
          type: 'BRANCH',
          config: {
            conditionGroup: {
              id: 'cond-lost',
              logicalOperator: 'AND',
              rules: [{ id: 'lr1', field: 'lead.status', operator: 'equals', value: 'LOST' }],
            },
          },
        },
        {
          id: 'node-delay-30d',
          name: 'Wait 30 Days',
          type: 'DELAY',
          config: {
            delayType: 'RELATIVE',
            duration: 30,
            unit: 'DAYS',
          },
        },
        {
          id: 'node-action-winback-wa',
          name: 'Send Check-In Message',
          type: 'ACTION',
          config: {
            actionType: 'SEND_WHATSAPP',
            params: {
              recipientPhone: '{{lead.phone}}',
              messageText: 'Hi {{lead.name}}, checking in from TechInPedia. We would love to know if your tech requirements have reopened or if we can support you.',
            },
          },
        },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-trigger', targetNodeId: 'node-branch-lost', branchType: 'DEFAULT' },
        { id: 'e2', sourceNodeId: 'node-branch-lost', targetNodeId: 'node-delay-30d', branchType: 'TRUE' },
        { id: 'e3', sourceNodeId: 'node-delay-30d', targetNodeId: 'node-action-winback-wa', branchType: 'DEFAULT' },
      ],
    },
  },

  // 10. External Webhook Sync to Zapier / Third-Party
  {
    id: 'tpl-outbound-webhook-sync',
    name: 'Real-Time Lead Webhook Sync to External Systems',
    category: 'INTEGRATIONS',
    description: 'Fires an outbound HTTP POST webhook containing the complete sanitized lead data to external CRM or analytics tools.',
    trigger: 'crm.lead.created',
    definition: {
      nodes: [
        {
          id: 'node-trigger',
          name: 'Lead Created',
          type: 'TRIGGER',
          config: { event: 'crm.lead.created' },
        },
        {
          id: 'node-action-webhook',
          name: 'Dispatch Outbound Webhook',
          type: 'ACTION',
          config: {
            actionType: 'OUTBOUND_WEBHOOK',
            params: {
              url: 'https://webhook.site/sample-destination',
              method: 'POST',
            },
          },
        },
      ],
      edges: [
        { id: 'e1', sourceNodeId: 'node-trigger', targetNodeId: 'node-action-webhook', branchType: 'DEFAULT' },
      ],
    },
  },

  // 11. Hello Mam – WhatsApp Package & Booking Flow
  {
    id: 'tpl-hello-mam-whatsapp-package-booking',
    name: 'Hello Mam – WhatsApp Package & Booking Flow',
    category: 'WHATSAPP',
    description: 'Dynamic database-driven WhatsApp package selection and salon booking workflow for Hello Mam. Supports Welcome Greeting, Package Menu (1-9), single/multi selection dispatch, Book Now action, and preferred booking details capture.',
    trigger: 'comm.whatsapp.received',
    definition: {
      nodes: [
        {
          id: 'node-trigger-wa-inbound',
          name: 'WhatsApp Inbound Trigger',
          type: 'TRIGGER',
          description: 'Triggers when a WhatsApp message or button callback is received from a customer',
          config: {
            event: 'comm.whatsapp.received',
          },
        },

        // ── PHASE 1: GREETING & WELCOME ──
        {
          id: 'node-gate-welcome',
          name: 'IF: Greeting or First Contact?',
          type: 'BRANCH',
          description: 'Checks if message is a greeting keyword (Hi, Hello) or new contact',
          config: {
            conditionGroup: {
              id: 'cond-welcome-check',
              logicalOperator: 'OR',
              rules: [
                { id: 'r1', field: 'message.isNewContact', operator: 'equals', value: true },
                { id: 'r2', field: 'message.text', operator: 'contains', value: 'Hi' },
                { id: 'r3', field: 'message.text', operator: 'contains', value: 'Hello' },
              ],
            },
            trueNextNodeId: 'node-send-welcome',
            falseNextNodeId: 'node-gate-menu',
          },
        },
        {
          id: 'node-send-welcome',
          name: 'Send WhatsApp: Welcome Greeting',
          type: 'ACTION',
          description: 'Dispatches dynamic WELCOME template mapped in Purpose Registry',
          config: {
            actionType: 'SEND_WHATSAPP',
            params: {
              messageType: 'TEMPLATE_PURPOSE',
              purposeKey: 'WELCOME',
              recipientPhone: '{{message.from}}',
              messageText: 'Welcome to Hello Mam Salon! Tap below to view packages.',
            },
            continueOnFailure: false,
          },
        },
        {
          id: 'node-stop-welcome',
          name: 'Awaiting Customer Action',
          type: 'STOP_WORKFLOW',
          description: 'Turn completed: Sent welcome message, waiting for customer to tap View Packages',
          config: {
            status: 'COMPLETED',
            reason: 'Welcome greeting dispatched. Paused for customer turn.',
          },
        },

        // ── PHASE 2: PACKAGE MENU ──
        {
          id: 'node-gate-menu',
          name: 'IF: View Packages Request?',
          type: 'BRANCH',
          description: 'Checks if customer clicked View Packages or typed menu keywords',
          config: {
            conditionGroup: {
              id: 'cond-menu-check',
              logicalOperator: 'OR',
              rules: [
                { id: 'r-btn-menu', field: 'last_button_action', operator: 'equals', value: 'OPEN_PACKAGE_MENU' },
                { id: 'r-txt-menu', field: 'message.text', operator: 'contains', value: 'Packages' },
                { id: 'r-txt-menu2', field: 'message.text', operator: 'contains', value: 'packages' },
              ],
            },
            trueNextNodeId: 'node-send-package-menu',
            falseNextNodeId: 'node-gate-selection',
          },
        },
        {
          id: 'node-send-package-menu',
          name: 'Send WhatsApp: Package Menu Selector',
          type: 'ACTION',
          description: 'Dispatches PACKAGE_MENU template containing all 9 packages',
          config: {
            actionType: 'SEND_WHATSAPP',
            params: {
              messageType: 'TEMPLATE_PURPOSE',
              purposeKey: 'PACKAGE_MENU',
              recipientPhone: '{{message.from}}',
              messageText: 'Choose your favorite package from 1 to 9.',
            },
            continueOnFailure: false,
          },
        },
        {
          id: 'node-stop-menu',
          name: 'Awaiting Package Selection',
          type: 'STOP_WORKFLOW',
          description: 'Turn completed: Sent package menu, waiting for customer package number (1-9)',
          config: {
            status: 'COMPLETED',
            reason: 'Package menu dispatched. Paused for package selection reply.',
          },
        },

        // ── PHASE 3: PACKAGE DISPATCH ──
        {
          id: 'node-gate-selection',
          name: 'IF: Package Number Selection (1-9)?',
          type: 'BRANCH',
          description: 'Checks if incoming reply is a valid package selection key',
          config: {
            conditionGroup: {
              id: 'cond-selection-check',
              logicalOperator: 'AND',
              rules: [
                { id: 'r-has-keys', field: 'parsed_selection_keys', operator: 'is_not_empty', value: '' },
              ],
            },
            trueNextNodeId: 'node-dispatch-package-templates',
            falseNextNodeId: 'node-gate-booking',
          },
        },
        {
          id: 'node-dispatch-package-templates',
          name: 'Multi-Package Dynamic Dispatch',
          type: 'ACTION',
          description: 'Iterates and dispatches approved package templates via PACKAGE_TEMPLATE resolution',
          config: {
            actionType: 'SEND_WHATSAPP',
            params: {
              messageType: 'PACKAGE_TEMPLATE',
              packageId: '{{selected_package_ids}}',
              recipientPhone: '{{message.from}}',
              messageText: 'Here are the details for your selected packages:',
            },
            continueOnFailure: true,
          },
        },
        {
          id: 'node-stop-package',
          name: 'Awaiting Book Now Action',
          type: 'STOP_WORKFLOW',
          description: 'Turn completed: Dispatched package card, waiting for customer to tap Book Now',
          config: {
            status: 'COMPLETED',
            reason: 'Package template dispatched. Paused for customer booking action.',
          },
        },

        // ── PHASE 4: BOOK NOW ACTION ──
        {
          id: 'node-gate-booking',
          name: 'IF: Book Now Action Clicked?',
          type: 'BRANCH',
          description: 'Checks if customer clicked Book Now on a package template',
          config: {
            conditionGroup: {
              id: 'cond-book-check',
              logicalOperator: 'OR',
              rules: [
                { id: 'r-btn-book', field: 'last_button_action', operator: 'equals', value: 'BOOK_NOW' },
                { id: 'r-txt-book', field: 'message.text', operator: 'contains', value: 'Book' },
                { id: 'r-txt-book2', field: 'message.text', operator: 'contains', value: 'book' },
              ],
            },
            trueNextNodeId: 'node-send-booking-details',
            falseNextNodeId: 'node-gate-confirm',
          },
        },
        {
          id: 'node-send-booking-details',
          name: 'Send WhatsApp: Booking Details Template',
          type: 'ACTION',
          description: 'Dispatches preferred_booking_details template (Date, Time, Address)',
          config: {
            actionType: 'SEND_WHATSAPP',
            params: {
              messageType: 'TEMPLATE_PURPOSE',
              purposeKey: 'BOOKING_DETAILS',
              recipientPhone: '{{message.from}}',
              messageText: 'Please provide your preferred Date, Time, and Complete Address.',
            },
            continueOnFailure: false,
          },
        },
        {
          id: 'node-stop-booking',
          name: 'Awaiting Customer Appointment Details',
          type: 'STOP_WORKFLOW',
          description: 'Turn completed: Sent booking details template, waiting for customer reply',
          config: {
            status: 'COMPLETED',
            reason: 'Booking details requested. Paused for appointment details reply.',
          },
        },

        // ── PHASE 5: BOOKING CONFIRMATION ──
        {
          id: 'node-gate-confirm',
          name: 'Capture Details & Confirm Booking',
          type: 'ACTION',
          description: 'Updates CRM lead with customer appointment reply',
          config: {
            actionType: 'UPDATE_LEAD',
            params: {
              leadStatus: 'BOOKING_REQUESTED',
              notes: 'Customer booked package via WhatsApp: {{message.text}}',
            },
          },
        },
        {
          id: 'node-schedule-followup',
          name: 'Schedule Dispatch Follow-Up Task',
          type: 'ACTION',
          description: 'Schedules a call task for salon team within 30 minutes',
          config: {
            actionType: 'CREATE_FOLLOW_UP',
            params: {
              title: 'Confirm Salon Slot with {{lead.name}} ({{message.from}})',
              delayHours: 0.5,
              type: 'CALL',
            },
          },
        },
        {
          id: 'node-send-confirmation',
          name: 'Send WhatsApp: Booking Confirmation',
          type: 'ACTION',
          description: 'Sends confirmation message to customer via WhatsApp',
          config: {
            actionType: 'SEND_WHATSAPP',
            params: {
              messageType: 'CUSTOM_TEXT',
              recipientPhone: '{{message.from}}',
              messageText: 'Thank you! Your salon booking request has been received. Our salon manager will call you shortly to confirm your appointment.',
            },
          },
        },
        {
          id: 'node-stop-confirmed',
          name: 'Booking Completed Gracefully',
          type: 'STOP_WORKFLOW',
          description: 'Flow completed: Appointment recorded and confirmation sent',
          config: {
            status: 'COMPLETED',
            reason: 'Booking completed successfully.',
          },
        },
      ],
      edges: [
        // Phase 1: Greeting
        { id: 'e-1', sourceNodeId: 'node-trigger-wa-inbound', targetNodeId: 'node-gate-welcome', branchType: 'DEFAULT' },
        { id: 'e-2', sourceNodeId: 'node-gate-welcome', targetNodeId: 'node-send-welcome', branchType: 'TRUE' },
        { id: 'e-3', sourceNodeId: 'node-send-welcome', targetNodeId: 'node-stop-welcome', branchType: 'DEFAULT' },

        // Phase 2: Menu
        { id: 'e-4', sourceNodeId: 'node-gate-welcome', targetNodeId: 'node-gate-menu', branchType: 'FALSE' },
        { id: 'e-5', sourceNodeId: 'node-gate-menu', targetNodeId: 'node-send-package-menu', branchType: 'TRUE' },
        { id: 'e-6', sourceNodeId: 'node-send-package-menu', targetNodeId: 'node-stop-menu', branchType: 'DEFAULT' },

        // Phase 3: Package Dispatch
        { id: 'e-7', sourceNodeId: 'node-gate-menu', targetNodeId: 'node-gate-selection', branchType: 'FALSE' },
        { id: 'e-8', sourceNodeId: 'node-gate-selection', targetNodeId: 'node-dispatch-package-templates', branchType: 'TRUE' },
        { id: 'e-9', sourceNodeId: 'node-dispatch-package-templates', targetNodeId: 'node-stop-package', branchType: 'DEFAULT' },

        // Phase 4: Book Now
        { id: 'e-10', sourceNodeId: 'node-gate-selection', targetNodeId: 'node-gate-booking', branchType: 'FALSE' },
        { id: 'e-11', sourceNodeId: 'node-gate-booking', targetNodeId: 'node-send-booking-details', branchType: 'TRUE' },
        { id: 'e-12', sourceNodeId: 'node-send-booking-details', targetNodeId: 'node-stop-booking', branchType: 'DEFAULT' },

        // Phase 5: Confirmation
        { id: 'e-13', sourceNodeId: 'node-gate-booking', targetNodeId: 'node-gate-confirm', branchType: 'FALSE' },
        { id: 'e-14', sourceNodeId: 'node-gate-confirm', targetNodeId: 'node-schedule-followup', branchType: 'DEFAULT' },
        { id: 'e-15', sourceNodeId: 'node-schedule-followup', targetNodeId: 'node-send-confirmation', branchType: 'DEFAULT' },
        { id: 'e-16', sourceNodeId: 'node-send-confirmation', targetNodeId: 'node-stop-confirmed', branchType: 'DEFAULT' },
      ],
    },
  },
];
