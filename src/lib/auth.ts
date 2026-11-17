import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { db } from './db';
import { Role } from '@prisma/client';
import { env } from './env';
import { AuthenticationError, AuthorizationError } from './auth-errors';

const COOKIE_NAME = 'tip_admin_token';

export interface TokenPayload {
  id?: string;
  userId: string;
  email: string;
  name?: string;
  role: Role;
  mustChangePassword: boolean;

  // Phase A: Resolved Staff Identity & Role
  appRoleId?: string | null;
  appRoleName?: string | null;
  employeeId?: string | null;
  employeeCode?: string | null;
  employeeName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  designationId?: string | null;
  designationTitle?: string | null;
  managerId?: string | null;
  permissions?: string[];
  businessUnitIds?: string[];

  // SaaS Multi-Tenancy
  companyId?: string | null;
  companyName?: string | null;
  companyRole?: string | null;
  isTenant?: boolean;
  tenantStatus?: string | null;
  allowedModules?: string[];
  userType?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function comparePasswords(password: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(password, hashed);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30d' }); // 30-day persistence for mobile sessions
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export async function getAuthSession(): Promise<TokenPayload | null> {
  try {
    let token: string | undefined;

    // 1. Check Cookie Store (Web Portal)
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {}

    // 2. Check Authorization Header (Bearer <token> for Mobile App)
    if (!token) {
      try {
        const headerStore = await headers();
        const authHeader = headerStore.get('authorization') || headerStore.get('Authorization');
        if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
          token = authHeader.substring(7).trim();
        }
      } catch {}
    }

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    // Verify user is still active in database and resolve staff profile & permissions
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        mustChangePassword: true,
        companyId: true,
        companyRole: true,
        company: {
          select: {
            id: true,
            name: true,
            isTenant: true,
            tenantStatus: true,
            allowedModules: true,
          },
        },
        appRoleId: true,
        appRole: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                permission: { select: { code: true } },
              },
            },
          },
        },
        employeeId: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            departmentId: true,
            department: { select: { id: true, name: true } },
            teamId: true,
            team: { select: { id: true, name: true } },
            designationId: true,
            designation: { select: { id: true, title: true } },
            managerId: true,
            businessUnits: {
              select: { businessUnitId: true },
            },
            appRoleId: true,
            appRole: {
              select: {
                id: true,
                name: true,
                displayName: true,
                permissions: {
                  select: {
                    permission: { select: { code: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    // Sync appRoleId to user if missing on user but present on linked employee
    if (!user.appRoleId && user.employee?.appRoleId) {
      db.user.update({
        where: { id: user.id },
        data: { appRoleId: user.employee.appRoleId },
      }).catch((e) => console.error('Error syncing appRoleId to user:', e));
    }

    // Check tenant status
    const isTenant = !!user.company?.isTenant;
    if (isTenant && user.company?.tenantStatus === 'SUSPENDED') {
      return null;
    }

    let allowedModules: string[] = ['whatsapp'];
    if (user.company?.allowedModules) {
      try {
        const parsed = JSON.parse(user.company.allowedModules);
        if (Array.isArray(parsed)) allowedModules = parsed;
      } catch (e) {
        // Fallback default
      }
    }

    const effectiveAppRole = user.appRole || user.employee?.appRole;
    let permissions = effectiveAppRole?.permissions.map((p) => p.permission.code) || [];

    // If tenant user without custom RBAC appRole:
    // Check if custom roles exist for this company in db.setting
    if (isTenant && permissions.length === 0) {
      let customRoleFound = false;
      if (user.companyId && user.companyRole) {
        try {
          const roleSetting = await db.setting.findUnique({
            where: { key: `company_roles_${user.companyId}` },
          });
          if (roleSetting?.value) {
            const customRoles = JSON.parse(roleSetting.value);
            const matched = Array.isArray(customRoles) ? customRoles.find((r: any) => r.id === user.companyRole) : null;
            if (matched && Array.isArray(matched.permissions) && matched.permissions.length > 0) {
              permissions = matched.permissions;
              customRoleFound = true;
            }
          }
        } catch {}
      }

      if (!customRoleFound) {
        if (user.companyRole === 'OWNER' || user.companyRole === 'ADMIN' || user.role === 'ADMIN') {
          const defaultTenantPermissions = [
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
          // AI & Chatbot Suite
          'chatbot.view',
          'chatbot.manage',
          'chatbot.publish',
          'ai.brain.view',
          'ai.brain.manage',
          'ai.knowledge.manage',
          'ai.intents.manage',
          'ai.analytics.view',
          'ai.assist.use',
          'ai.conversation.pause',
          'ai.usage.view',
        ];
        if (allowedModules.includes('crm.leads') || allowedModules.includes('leads')) {
          defaultTenantPermissions.push('crm.leads.view', 'crm.leads.create', 'crm.leads.edit', 'crm.leads.assign');
        }
        if (allowedModules.includes('crm.contacts') || allowedModules.includes('contacts')) {
          defaultTenantPermissions.push('crm.contacts.manage');
        }
        if (allowedModules.includes('crm.deals') || allowedModules.includes('deals')) {
          defaultTenantPermissions.push('crm.deals.view', 'crm.deals.manage');
        }
        defaultTenantPermissions.push('company.profile.edit', 'company.employees.manage');
        permissions = defaultTenantPermissions;
      } else if (user.companyRole === 'MANAGER') {
        const managerPermissions = [
          'whatsapp.view',
          'whatsapp.inbox.view',
          'whatsapp.inbox.assign',
          'whatsapp.send',
          'whatsapp.templates.manage',
          'whatsapp.campaigns.view',
          'whatsapp.campaigns.create',
          'whatsapp.campaigns.launch',
          'whatsapp.logs.view',
          'comm.whatsapp.view',
          'comm.whatsapp.send',
          'company.employees.manage',
          // AI & Chatbot Suite
          'chatbot.view',
          'ai.brain.view',
          'ai.analytics.view',
          'ai.assist.use',
          'ai.conversation.pause',
        ];
        if (allowedModules.includes('crm.leads') || allowedModules.includes('leads')) {
          managerPermissions.push('crm.leads.view', 'crm.leads.create', 'crm.leads.edit', 'crm.leads.assign');
        }
        permissions = managerPermissions;
      } else if (user.companyRole === 'WHATSAPP_CAMPAIGNS') {
        // Dedicated WhatsApp Specialist
        permissions = [
          'whatsapp.view',
          'whatsapp.inbox.view',
          'whatsapp.send',
          'whatsapp.templates.manage',
          'whatsapp.campaigns.view',
          'whatsapp.campaigns.create',
          'whatsapp.campaigns.launch',
          'whatsapp.logs.view',
          'comm.whatsapp.view',
          'comm.whatsapp.send',
          // AI & Chatbot Suite
          'chatbot.view',
          'chatbot.manage',
          'ai.knowledge.manage',
          'ai.analytics.view',
        ];
      } else if (user.companyRole === 'LEADS_MANAGER') {
        // Dedicated CRM Leads Executive
        permissions = [
          'whatsapp.view',
          'whatsapp.send',
          'comm.whatsapp.view',
          'comm.whatsapp.send',
          'crm.leads.view',
          'crm.leads.create',
          'crm.leads.edit',
          'crm.leads.assign',
          'crm.contacts.manage',
          'crm.deals.view',
          'crm.deals.manage',
        ];
      } else if (user.companyRole === 'AGENT') {
        // Customer Support & Sales Agent
        permissions = [
          'whatsapp.view',
          'whatsapp.inbox.view',
          'whatsapp.send',
          'comm.whatsapp.view',
          'comm.whatsapp.send',
          'crm.leads.view',
          'crm.leads.edit',
          // AI Assist
          'ai.assist.use',
          'ai.conversation.pause',
        ];
      } else if (user.companyRole === 'INBOX_ONLY') {
        // Restricted Inbox-only agent
        permissions = ['whatsapp.view', 'whatsapp.inbox.view', 'whatsapp.send', 'comm.whatsapp.view', 'comm.whatsapp.send'];
      } else if (user.companyRole === 'VIEWER') {
        // Read-only auditor
        permissions = ['whatsapp.view', 'whatsapp.inbox.view', 'whatsapp.logs.view', 'comm.whatsapp.view', 'crm.leads.view'];
      } else {
        // Default frontline
        permissions = ['whatsapp.view', 'whatsapp.inbox.view', 'whatsapp.send', 'comm.whatsapp.view', 'comm.whatsapp.send'];
      }
    }
  }

    return {
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      appRoleId: effectiveAppRole?.id || user.appRoleId || user.employee?.appRoleId || null,
      appRoleName: effectiveAppRole?.name || (isTenant ? `Tenant ${user.companyRole || 'User'}` : null),
      employeeId: user.employeeId,
      employeeCode: user.employee?.employeeCode || null,
      employeeName: user.employee?.name || null,
      departmentId: user.employee?.departmentId || null,
      departmentName: user.employee?.department?.name || null,
      teamId: user.employee?.teamId || null,
      teamName: user.employee?.team?.name || null,
      designationId: user.employee?.designationId || null,
      designationTitle: user.employee?.designation?.title || null,
      managerId: user.employee?.managerId || null,
      permissions,
      businessUnitIds: user.employee?.businessUnits.map((b) => b.businessUnitId) || [],

      // SaaS Multi-Tenancy
      companyId: user.companyId || null,
      companyName: user.company?.name || null,
      companyRole: user.companyRole || null,
      isTenant,
      tenantStatus: user.company?.tenantStatus || null,
      allowedModules,
    };
  } catch (error) {
    console.error('getAuthSession error:', error);
    return null;
  }
}

export async function requireAuth(): Promise<TokenPayload> {
  const session = await getAuthSession();
  if (!session) {
    throw new AuthenticationError('Unauthorized');
  }
  return session;
}

export async function requireRole(allowedRoles: Role[]): Promise<TokenPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new AuthorizationError('Forbidden: Insufficient permissions');
  }
  return session;
}

export const getSession = getAuthSession;
export const requireAdminSession = requireAuth;

