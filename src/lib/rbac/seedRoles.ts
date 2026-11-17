import { db } from '../db';
import { ALL_PERMISSIONS, PermissionCode } from '../permissions';

export interface SystemRoleDefinition {
  name: string;
  displayName: string;
  description: string;
  isSystem: boolean;
  permissions: PermissionCode[];
}

export const SYSTEM_ROLES: SystemRoleDefinition[] = [
  {
    name: 'SUPER_ADMIN',
    displayName: 'Super Administrator',
    description: 'Unrestricted access to all company systems, settings, financials, and administrative controls.',
    isSystem: true,
    permissions: ALL_PERMISSIONS.map((p) => p.code),
  },
  {
    name: 'MANAGEMENT',
    displayName: 'Management / Executive',
    description: 'Executive company-wide visibility across CRM, Projects, Finance, and HR metrics.',
    isSystem: true,
    permissions: [
      'cockpit.executive.view',
      'crm.leads.view',
      'crm.kanban.view',
      'crm.customers.view',
      'crm.customers.manage',
      'crm.leads.import',
      'crm.contacts.view',
      'crm.contacts.manage',
      'crm.companies.view',
      'crm.companies.manage',
      'crm.deals.view',
      'crm.deals.manage',
      'crm.followups.manage',
      'meetings.create',
      'meetings.team.view',
      'sales.quotations.view',
      'sales.quotations.manage',
      'sales.proposals.view',
      'sales.proposals.manage',
      'sales.contracts.view',
      'sales.contracts.manage',
      'finance.invoice.view',
      'finance.invoices.manage',
      'finance.payments.record',
      'finance.expenses.view',
      'finance.expenses.manage',
      'projects.view',
      'projects.manage',
      'hr.employees.view',
      'hr.attendance.manage',
      'hr.leaves.manage',
      'hr.payroll.view',
      'support.tickets.view',
      'hardware.maintenance.manage',
      'integrations.hub.manage',
      'content.services.manage',
      'content.projects.manage',
      'analytics.company.view',
      'analytics.reports.manage',
      'admin.audit.view',
    ],
  },
  {
    name: 'HR_ADMIN',
    displayName: 'HR Administrator',
    description: 'Full management of employee directory, attendance policies, leaves, and payroll processing.',
    isSystem: true,
    permissions: [
      'cockpit.hr.view',
      'hr.employees.view',
      'hr.employees.manage',
      'hr.assignments.view',
      'hr.departments.manage',
      'hr.attendance.manage',
      'hr.leaves.manage',
      'hr.payroll.view',
      'hr.payroll.manage',
      'hr.jobs.manage',
      'hr.candidates.manage',
      'hr.interviews.manage',
      'admin.roles.manage',
      'admin.audit.view',
    ],
  },
  {
    name: 'HR_MANAGER',
    displayName: 'HR Manager',
    description: 'Manages employee onboarding, day-to-day attendance regularizations, and leave approvals.',
    isSystem: true,
    permissions: [
      'cockpit.hr.view',
      'hr.employees.view',
      'hr.attendance.manage',
      'hr.leaves.manage',
      'hr.payroll.view',
      'hr.jobs.manage',
      'hr.candidates.manage',
      'hr.interviews.manage',
    ],
  },
  {
    name: 'FINANCE_MANAGER',
    displayName: 'Finance Manager',
    description: 'Manages invoices, client payment links, bank reconciliations, and company expenses.',
    isSystem: true,
    permissions: [
      'finance.invoice.view',
      'finance.invoices.manage',
      'finance.payments.record',
      'finance.expenses.view',
      'finance.expenses.manage',
      'sales.quotations.view',
      'sales.quotations.manage',
      'sales.proposals.view',
      'sales.proposals.manage',
      'sales.contracts.view',
      'sales.contracts.manage',
      'crm.deals.manage',
      'crm.companies.manage',
      'hr.payroll.view',
    ],
  },
  {
    name: 'SALES_MANAGER',
    displayName: 'Sales Manager',
    description: 'Supervises sales pipelines, lead distributions, quotations, proposals, and team targets.',
    isSystem: true,
    permissions: [
      'cockpit.manager.view',
      'crm.leads.view',
      'crm.kanban.view',
      'crm.customers.view',
      'crm.customers.manage',
      'crm.leads.create',
      'crm.leads.edit',
      'crm.leads.assign',
      'crm.leads.import',
      'crm.contacts.view',
      'crm.contacts.manage',
      'crm.companies.view',
      'crm.companies.manage',
      'crm.deals.view',
      'crm.deals.manage',
      'crm.followups.manage',
      'meetings.create',
      'meetings.team.view',
      'sales.quotations.view',
      'sales.quotations.manage',
      'sales.proposals.view',
      'sales.proposals.manage',
      'sales.contracts.view',
      'sales.contracts.manage',
      'finance.invoice.view',
      'finance.invoices.manage',
      'finance.payments.record',
      'comm.whatsapp.view',
      'comm.whatsapp.send',
    ],
  },
  {
    name: 'TEAM_LEADER',
    displayName: 'Team Leader',
    description: 'Oversees team tasks, team lead follow-ups, attendance oversight, and first-level leave approvals.',
    isSystem: true,
    permissions: [
      'cockpit.manager.view',
      'crm.leads.view',
      'crm.kanban.view',
      'crm.leads.create',
      'crm.leads.edit',
      'crm.followups.manage',
      'crm.deals.manage',
      'projects.view',
      'projects.tasks.manage',
      'hr.attendance.manage',
      'hr.leaves.manage',
      'support.tickets.view',
    ],
  },
  {
    name: 'SALES_EXECUTIVE',
    displayName: 'Sales Executive',
    description: 'Manages assigned sales leads, customer communications, follow-ups, and deals.',
    isSystem: true,
    permissions: [
      'portal.ess.view',
      'crm.leads.view',
      'crm.kanban.view',
      'crm.customers.view',
      'crm.leads.create',
      'crm.leads.edit',
      'crm.followups.manage',
      'crm.deals.manage',
      'crm.contacts.view',
      'crm.contacts.manage',
      'sales.quotations.view',
      'sales.proposals.view',
      'comm.whatsapp.view',
      'comm.whatsapp.send',
      'finance.payments.record',
    ],
  },
  {
    name: 'PROJECT_MANAGER',
    displayName: 'Project Manager',
    description: 'Manages delivery projects, milestones, task assignments, and client deliverables.',
    isSystem: true,
    permissions: [
      'projects.view',
      'projects.manage',
      'projects.tasks.manage',
      'projects.timesheets.manage',
      'support.tickets.view',
      'support.tickets.manage',
    ],
  },
  {
    name: 'EMPLOYEE',
    displayName: 'Standard Employee',
    description: 'Self-service portal access: clock-in/out, leave requests, assigned tasks, and personal payslips.',
    isSystem: true,
    permissions: [
      'projects.view',
      'projects.tasks.manage',
      'projects.timesheets.manage',
      'support.kb.manage',
    ],
  },
];

/**
 * Ensures all system roles and their permission mappings exist in the database.
 * Non-destructive: Updates missing roles without deleting existing custom roles.
 */
export async function ensureSystemRoles(): Promise<void> {
  // 1. Ensure all permissions from ALL_PERMISSIONS exist in Permission table
  for (const perm of ALL_PERMISSIONS) {
    await db.permission.upsert({
      where: { code: perm.code },
      update: {
        name: perm.name,
        category: perm.category,
        description: perm.description,
      },
      create: {
        code: perm.code,
        name: perm.name,
        category: perm.category,
        description: perm.description,
      },
    });
  }

  // 2. Fetch all permissions map
  const allDbPermissions = await db.permission.findMany();
  const permCodeToId = new Map(allDbPermissions.map((p) => [p.code, p.id]));

  // 3. Upsert each system role
  for (const roleDef of SYSTEM_ROLES) {
    const role = await db.appRole.upsert({
      where: { name: roleDef.name },
      update: {
        displayName: roleDef.displayName,
        description: roleDef.description,
        isSystem: true,
      },
      create: {
        name: roleDef.name,
        displayName: roleDef.displayName,
        description: roleDef.description,
        isSystem: true,
      },
    });

    // 4. Upsert permission links for this system role
    for (const permCode of roleDef.permissions) {
      const permissionId = permCodeToId.get(permCode);
      if (permissionId) {
        await db.appRolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permissionId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permissionId,
          },
        });
      }
    }
  }
}
