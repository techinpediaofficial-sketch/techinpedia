import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

const AVAILABLE_PERMISSIONS = [
  {
    category: 'WhatsApp Business Suite',
    items: [
      { code: 'whatsapp.view', label: 'View WhatsApp Workspace & Metrics' },
      { code: 'whatsapp.inbox.view', label: 'Access Shared Team Inbox' },
      { code: 'whatsapp.send', label: 'Send Live WhatsApp Messages' },
      { code: 'whatsapp.templates.manage', label: 'Create & Manage Meta HSM Templates' },
      { code: 'whatsapp.campaigns.view', label: 'View Marketing Broadcast Campaigns' },
      { code: 'whatsapp.campaigns.create', label: 'Draft & Schedule Broadcast Campaigns' },
      { code: 'whatsapp.campaigns.launch', label: 'Launch WhatsApp Bulk Broadcasts' },
      { code: 'whatsapp.configure', label: 'Configure Meta Cloud API Credentials & Webhook' },
      { code: 'whatsapp.logs.view', label: 'View Webhook Event Logs & Delivery Reports' },
    ],
  },
  {
    category: 'CRM & Sales Pipeline',
    items: [
      { code: 'crm.leads.view', label: 'View Inbound Leads & Buyer Enquiries' },
      { code: 'crm.leads.create', label: 'Create New Leads & Prospects' },
      { code: 'crm.leads.edit', label: 'Edit Lead Status, Score & Priority' },
      { code: 'crm.leads.assign', label: 'Assign Leads to Team Executives' },
      { code: 'crm.deals.view', label: 'View Sales Deals & Pipeline Board' },
      { code: 'crm.deals.manage', label: 'Manage Deal Stages, Value & Closes' },
      { code: 'crm.contacts.manage', label: 'Manage Contacts & Directory' },
    ],
  },
  {
    category: 'Company Administration',
    items: [
      { code: 'company.profile.edit', label: 'Edit Company Profile & Business Details' },
      { code: 'company.employees.manage', label: 'Invite, Edit & Remove Team Members' },
    ],
  },
];

const DEFAULT_ROLES = [
  {
    id: 'ADMIN',
    name: 'Company Administrator / Owner',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    description: 'Complete operational control across all enabled modules, team management, and billing settings.',
    capabilities: [
      'Full access to WhatsApp Business Cloud API & Webhooks',
      'Manage, submit, and sync Meta HSM message templates',
      'Launch marketing broadcast campaigns',
      'Manage company profile, contact details, and GSTIN',
      'Invite, edit, and remove team members / employees',
      'Manage role assignments and employee status',
      'Access all CRM modules enabled in company subscription plan',
    ],
    permissions: [
      'whatsapp.view',
      'whatsapp.inbox.view',
      'whatsapp.inbox.assign',
      'whatsapp.send',
      'whatsapp.templates.manage',
      'whatsapp.campaigns.view',
      'whatsapp.campaigns.create',
      'whatsapp.campaigns.launch',
      'whatsapp.configure',
      'whatsapp.logs.view',
      'comm.whatsapp.view',
      'comm.whatsapp.send',
      'crm.leads.view',
      'crm.leads.create',
      'crm.leads.edit',
      'crm.leads.assign',
      'crm.contacts.manage',
      'crm.deals.view',
      'crm.deals.manage',
      'company.profile.edit',
      'company.employees.manage',
    ],
    isSystem: true,
  },
  {
    id: 'MANAGER',
    name: 'Company Operations Manager',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    description: 'Operational lead with message broadcasting, template approvals, and CRM pipeline assignment rights.',
    capabilities: [
      'Access Shared Team Inbox and assign conversations to agents',
      'Create and draft WhatsApp broadcast campaigns',
      'Submit message templates for Meta verification',
      'Access CRM leads, deals, contacts, and proposals',
      'View performance metrics and response times',
    ],
    permissions: [
      'whatsapp.view',
      'whatsapp.inbox.view',
      'whatsapp.inbox.assign',
      'whatsapp.send',
      'whatsapp.templates.manage',
      'whatsapp.campaigns.view',
      'whatsapp.campaigns.create',
      'whatsapp.campaigns.launch',
      'comm.whatsapp.view',
      'comm.whatsapp.send',
      'crm.leads.view',
      'crm.leads.create',
      'crm.leads.edit',
      'crm.leads.assign',
      'crm.contacts.manage',
      'crm.deals.view',
      'crm.deals.manage',
    ],
    isSystem: true,
  },
  {
    id: 'WHATSAPP_CAMPAIGNS',
    name: 'WhatsApp Marketing Specialist',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    description: 'Dedicated to WhatsApp marketing, broadcast campaigns, template submissions, and customer engagement.',
    capabilities: [
      'Full access to WhatsApp Broadcast Campaigns engine',
      'Create, customize, and launch WhatsApp bulk marketing campaigns',
      'Submit and synchronize Meta HSM message templates',
      'Access Shared Team Inbox for campaign replies',
      'View campaign delivery, read receipts, and response analytics',
      'Zero access to billing, employee roster, or company security credentials',
    ],
    permissions: [
      'whatsapp.view',
      'whatsapp.inbox.view',
      'whatsapp.send',
      'whatsapp.templates.manage',
      'whatsapp.campaigns.view',
      'whatsapp.campaigns.create',
      'whatsapp.campaigns.launch',
      'comm.whatsapp.view',
      'comm.whatsapp.send',
    ],
    isSystem: true,
  },
  {
    id: 'AGENT',
    name: 'Support & Sales Agent',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    description: 'Frontline agent communicating with customers and managing assigned CRM leads.',
    capabilities: [
      'Live 2-way customer conversations in Shared Team Inbox',
      'Send approved WhatsApp HSM templates within 24h window',
      'Add internal team notes to conversation timeline',
      'View and update assigned CRM leads and customer records',
    ],
    permissions: [
      'whatsapp.view',
      'whatsapp.inbox.view',
      'whatsapp.send',
      'comm.whatsapp.view',
      'comm.whatsapp.send',
      'crm.leads.view',
      'crm.leads.edit',
    ],
    isSystem: true,
  },
  {
    id: 'LEADS_MANAGER',
    name: 'CRM & Leads Executive',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
    description: 'Focused on lead qualification, deal pipeline management, contact stages, and direct WhatsApp follow-ups.',
    capabilities: [
      'Full access to CRM Leads, Deals, Pipelines, and Contacts',
      'Create, qualify, edit, and assign leads to team members',
      'Send 1-on-1 direct WhatsApp follow-up messages to leads',
      'Manage deal value, stages, proposals, and customer notes',
      'Zero access to company administrative settings or billing',
    ],
    permissions: [
      'whatsapp.view',
      'whatsapp.inbox.view',
      'whatsapp.send',
      'comm.whatsapp.view',
      'comm.whatsapp.send',
      'crm.leads.view',
      'crm.leads.create',
      'crm.leads.edit',
      'crm.leads.assign',
      'crm.deals.view',
      'crm.deals.manage',
      'crm.contacts.manage',
    ],
    isSystem: true,
  },
  {
    id: 'INBOX_ONLY',
    name: 'Restricted Inbox Responder',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    description: 'Restricted single-window responder. Cannot see API tokens, campaigns, or company settings.',
    capabilities: [
      'Single-window access strictly to WhatsApp Shared Team Inbox',
      'View and reply to customer inquiries in real time',
      'Zero access to Meta API credentials or webhook keys',
      'Zero access to company settings or employee rosters',
    ],
    permissions: [
      'whatsapp.view',
      'whatsapp.inbox.view',
      'whatsapp.send',
      'comm.whatsapp.view',
      'comm.whatsapp.send',
    ],
    isSystem: true,
  },
  {
    id: 'VIEWER',
    name: 'Read-Only Auditor',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
    description: 'Auditor or stakeholder with read-only visibility into customer chats and CRM performance.',
    capabilities: [
      'View WhatsApp conversation history in read-only mode',
      'View CRM leads, status reports, and response logs',
      'Cannot send messages or modify lead statuses',
      'Zero access to security keys, billing, or employee rosters',
    ],
    permissions: [
      'whatsapp.view',
      'whatsapp.inbox.view',
      'whatsapp.logs.view',
      'comm.whatsapp.view',
      'crm.leads.view',
    ],
    isSystem: true,
  },
];

// Helper to get company roles from DB or default
export async function getCompanyRoles(companyId: string) {
  const settingKey = `company_roles_${companyId}`;
  const setting = await db.setting.findUnique({
    where: { key: settingKey },
  });

  if (setting && setting.value) {
    try {
      const parsed = JSON.parse(setting.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
  }
  return DEFAULT_ROLES;
}

// 1. GET: Fetch Roles, Available Permissions & Module Entitlements
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const queryCompanyId = searchParams.get('companyId');

    const companyId = session.isTenant || session.companyId
      ? session.companyId
      : (queryCompanyId && queryCompanyId !== 'master' ? queryCompanyId : session.companyId);

    if (!companyId) {
      return NextResponse.json({ error: 'No company associated with this account' }, { status: 400 });
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        allowedModules: true,
        planName: true,
        maxEmployees: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const roles = await getCompanyRoles(companyId);

    let allowedModules: string[] = ['whatsapp'];
    if (company.allowedModules) {
      try {
        const parsed = JSON.parse(company.allowedModules);
        if (Array.isArray(parsed)) allowedModules = parsed;
      } catch {}
    }

    const allPlatformModules = [
      {
        id: 'whatsapp',
        name: 'WhatsApp Business Platform & Shared Inbox',
        description: 'Real-time 2-way chat, Cloud API integration, HSM templates, and broadcast marketing campaigns.',
        enabled: allowedModules.includes('whatsapp') || allowedModules.length === 0,
        core: true,
      },
      {
        id: 'crm.leads',
        name: 'CRM Leads & Kanban Pipeline',
        description: 'Multi-stage lead tracking, automated distribution, follow-ups, and activity audit timeline.',
        enabled: allowedModules.includes('crm.leads') || allowedModules.includes('leads'),
        core: false,
      },
      {
        id: 'crm.deals',
        name: 'Sales Deals & Pipelines',
        description: 'Deal pipeline forecasting, stages from quotation to won, and revenue tracking.',
        enabled: allowedModules.includes('crm.deals') || allowedModules.includes('deals'),
        core: false,
      },
      {
        id: 'crm.contacts',
        name: 'Contacts & Accounts Directory',
        description: 'Centralized directory of verified buyers, customer accounts, and communication logs.',
        enabled: allowedModules.includes('crm.contacts') || allowedModules.includes('contacts'),
        core: false,
      },
      {
        id: 'sales.proposals',
        name: 'Proposals & Quotations',
        description: 'Automated quotation generation, cost estimates, and client proposal documents.',
        enabled: allowedModules.includes('sales.proposals') || allowedModules.includes('proposals'),
        core: false,
      },
      {
        id: 'support.tickets',
        name: 'Customer Support Tickets & SLA',
        description: 'Helpdesk ticketing system, priority queues, and customer service resolution tracking.',
        enabled: allowedModules.includes('support.tickets') || allowedModules.includes('tickets'),
        core: false,
      },
    ];

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        planName: company.planName,
        maxEmployees: company.maxEmployees,
      },
      roles,
      availablePermissions: AVAILABLE_PERMISSIONS,
      modules: allPlatformModules,
    });
  } catch (error: any) {
    console.error('Company roles GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch roles' }, { status: 500 });
  }
}

// 2. POST: Create a New Custom Role
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Only registered companies can create custom roles' }, { status: 400 });
    }

    if (session.companyRole !== 'OWNER' && session.companyRole !== 'ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only company administrators can create custom roles' }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, description, badgeColor = 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300', capabilities = [], permissions = [] } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const roleId = (code || cleanName)
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!roleId) {
      return NextResponse.json({ error: 'Invalid role code' }, { status: 400 });
    }

    const currentRoles = await getCompanyRoles(companyId);

    if (currentRoles.some((r: any) => r.id === roleId)) {
      return NextResponse.json({ error: `A role with code "${roleId}" already exists.` }, { status: 400 });
    }

    const newRole = {
      id: roleId,
      name: cleanName,
      badgeColor,
      description: description?.trim() || `Custom role for ${cleanName}`,
      capabilities: Array.isArray(capabilities) && capabilities.length > 0 ? capabilities : ['Access to assigned company tasks and workflows.'],
      permissions: Array.isArray(permissions) ? permissions : ['whatsapp.view', 'whatsapp.inbox.view', 'whatsapp.send'],
      isSystem: false,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    const updatedRoles = [...currentRoles, newRole];
    const settingKey = `company_roles_${companyId}`;

    await db.setting.upsert({
      where: { key: settingKey },
      update: { value: JSON.stringify(updatedRoles) },
      create: { key: settingKey, value: JSON.stringify(updatedRoles), category: 'COMPANY' },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'COMPANY_ROLE_CREATED',
      entityType: 'CompanyRole',
      entityId: roleId,
      metadata: { companyId, roleName: cleanName },
    });

    return NextResponse.json({
      success: true,
      message: `Role "${cleanName}" created successfully!`,
      role: newRole,
      roles: updatedRoles,
    });
  } catch (error: any) {
    console.error('Create company role error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create role' }, { status: 500 });
  }
}

// 3. PATCH: Edit an Existing Role
export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    if (session.companyRole !== 'OWNER' && session.companyRole !== 'ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only company administrators can edit roles' }, { status: 403 });
    }

    const body = await request.json();
    const { roleId, name, description, badgeColor, capabilities, permissions } = body;

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required to update' }, { status: 400 });
    }

    const currentRoles = await getCompanyRoles(companyId);
    const roleIndex = currentRoles.findIndex((r: any) => r.id === roleId);

    if (roleIndex === -1) {
      return NextResponse.json({ error: `Role "${roleId}" not found.` }, { status: 404 });
    }

    const existingRole = currentRoles[roleIndex];

    const updatedRole = {
      ...existingRole,
      name: name?.trim() || existingRole.name,
      description: description !== undefined ? description.trim() : existingRole.description,
      badgeColor: badgeColor || existingRole.badgeColor,
      capabilities: Array.isArray(capabilities) ? capabilities : existingRole.capabilities,
      permissions: Array.isArray(permissions) ? permissions : existingRole.permissions,
      updatedAt: new Date().toISOString(),
    };

    currentRoles[roleIndex] = updatedRole;
    const settingKey = `company_roles_${companyId}`;

    await db.setting.upsert({
      where: { key: settingKey },
      update: { value: JSON.stringify(currentRoles) },
      create: { key: settingKey, value: JSON.stringify(currentRoles), category: 'COMPANY' },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'COMPANY_ROLE_UPDATED',
      entityType: 'CompanyRole',
      entityId: roleId,
      metadata: { companyId, roleName: updatedRole.name },
    });

    return NextResponse.json({
      success: true,
      message: `Role "${updatedRole.name}" updated successfully!`,
      role: updatedRole,
      roles: currentRoles,
    });
  } catch (error: any) {
    console.error('Update company role error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update role' }, { status: 500 });
  }
}

// 4. DELETE: Delete a Custom Role
export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    if (session.companyRole !== 'OWNER' && session.companyRole !== 'ADMIN' && session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only company administrators can delete roles' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID required' }, { status: 400 });
    }

    if (roleId === 'ADMIN' || roleId === 'OWNER') {
      return NextResponse.json({ error: 'System Administrator role cannot be deleted.' }, { status: 400 });
    }

    const activeStaffWithRole = await db.user.count({
      where: { companyId, companyRole: roleId },
    });

    if (activeStaffWithRole > 0) {
      return NextResponse.json({
        error: `Cannot delete role "${roleId}" because ${activeStaffWithRole} team member(s) are currently assigned to it. Please reassign them first.`,
      }, { status: 400 });
    }

    const currentRoles = await getCompanyRoles(companyId);
    const updatedRoles = currentRoles.filter((r: any) => r.id !== roleId);

    const settingKey = `company_roles_${companyId}`;
    await db.setting.upsert({
      where: { key: settingKey },
      update: { value: JSON.stringify(updatedRoles) },
      create: { key: settingKey, value: JSON.stringify(updatedRoles), category: 'COMPANY' },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'COMPANY_ROLE_DELETED',
      entityType: 'CompanyRole',
      entityId: roleId,
      metadata: { companyId },
    });

    return NextResponse.json({
      success: true,
      message: `Role "${roleId}" removed successfully.`,
      roles: updatedRoles,
    });
  } catch (error: any) {
    console.error('Delete company role error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete role' }, { status: 500 });
  }
}
