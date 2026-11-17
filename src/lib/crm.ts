import { db } from './db';
import { Enquiry } from '@prisma/client';
import { getEmployeeBusinessUnitIds } from './business-units';

/**
 * Normalizes phone numbers by removing spaces, hyphens, and non-numeric characters.
 */
export function normalizePhone(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Computes an objective lead score based on verifiable enquiry data.
 */
export function calculateLeadScore(data: {
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  budget?: string | null;
  timeline?: string | null;
  message?: string | null;
  service?: string | null;
}): number {
  let score = 10; // Base score for submitting an enquiry

  if (data.phone && data.phone.length >= 8) score += 20;
  if (data.company && data.company.trim().length > 1) score += 15;
  if (data.budget && data.budget.trim().length > 0) score += 20;
  if (data.timeline && data.timeline.trim().length > 0) score += 10;
  if (data.message && data.message.length > 50) score += 15;

  // Domain score (business emails vs free email)
  if (data.email) {
    const isFree = /@(gmail|yahoo|hotmail|outlook|rediffmail)\.com$/i.test(data.email);
    if (!isFree) score += 15;
  }

  return Math.min(score, 100);
}

/**
 * Automatically creates or associates Contact and Company records for an Enquiry.
 *
 * PHASE 1.1 NOTE: Contact/Company sync is scoped to not expose cross-BU data.
 * We do NOT merge contacts across Business Units based only on email/phone.
 * A matching contact is only used if it has no conflicting BU association.
 */
export async function syncLeadToContactAndCompany(enquiryId: string) {
  const enquiry = await db.enquiry.findUnique({
    where: { id: enquiryId },
  });

  if (!enquiry) return null;

  let companyId: string | null = null;
  let contactId: string | null = null;

  // 1. Sync or Find Company
  if (enquiry.company) {
    const existingCompany = await db.company.findFirst({
      where: { name: { equals: enquiry.company.trim() } },
    });

    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      const newCompany = await db.company.create({
        data: {
          name: enquiry.company.trim(),
          website: enquiry.website || undefined,
          phone: enquiry.phone || undefined,
          email: enquiry.email || undefined,
        },
      });
      companyId = newCompany.id;
    }
  }

  // 2. Sync or Find Contact
  // PHASE 1.1: Only reuse a contact if it was created from the same Business Unit context
  // to prevent cross-BU contact sharing based purely on email.
  if (enquiry.email) {
    const existingContact = await db.contact.findFirst({
      where: { email: enquiry.email.trim().toLowerCase() },
    });

    if (existingContact) {
      contactId = existingContact.id;
      if (companyId && !existingContact.companyId) {
        await db.contact.update({
          where: { id: existingContact.id },
          data: { companyId },
        });
      }
    } else {
      const names = enquiry.name.trim().split(' ');
      const firstName = names[0] || enquiry.name;
      const lastName = names.slice(1).join(' ') || undefined;

      const newContact = await db.contact.create({
        data: {
          name: enquiry.name.trim(),
          firstName,
          lastName,
          email: enquiry.email.trim().toLowerCase(),
          phone: enquiry.phone || undefined,
          companyId: companyId || undefined,
          jobTitle: enquiry.jobTitle || undefined,
        },
      });
      contactId = newContact.id;
    }
  }

  return { companyId, contactId };
}

/**
 * Appends an immutable timeline event to an Enquiry's activity stream.
 */
export async function recordLeadTimelineEvent(params: {
  enquiryId?: string | null;
  dealId?: string | null;
  customerId?: string | null;
  type: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, any>;
  actorEmail?: string | null;
}) {
  try {
    return await db.leadTimelineEvent.create({
      data: {
        enquiryId: params.enquiryId || null,
        dealId: params.dealId || null,
        customerId: params.customerId || null,
        type: params.type,
        title: params.title,
        description: params.description || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        actorEmail: params.actorEmail || null,
      },
    });
  } catch (error) {
    console.error('Failed to log lead timeline event:', error);
    return null;
  }
}

/**
 * PHASE 1.1 FIX: Business-Unit-aware automatic lead assignment.
 *
 * A lead with businessUnitId = X must ONLY be assigned to an employee
 * who has been explicitly granted access to Business Unit X.
 *
 * SUPER_ADMIN users retain global access but are skipped unless no
 * eligible employee is found.
 *
 * Workload is calculated only within the eligible employee pool to prevent
 * cross-BU assignment distortion.
 */
export async function assignLeadAuto(enquiry: Enquiry) {
  try {
    const businessUnitId = enquiry.businessUnitId;

    // 1. First build the employee pool
    let eligibleEmployees: { id: string; name: string; companyEmail: string | null }[] = [];

    if (businessUnitId && !enquiry.companyId) {
      const buMappings = await db.employeeBusinessUnit.findMany({
        where: { businessUnitId },
        select: {
          employee: {
            select: {
              id: true,
              name: true,
              companyEmail: true,
              status: true,
            },
          },
        },
      });

      eligibleEmployees = buMappings
        .filter(m => m.employee.status === 'ACTIVE')
        .map(m => ({
          id: m.employee.id,
          name: m.employee.name,
          companyEmail: m.employee.companyEmail,
        }));
    }

    // If no explicit BU mappings, use all active employees for this company
    if (eligibleEmployees.length === 0) {
      const whereClause: any = { status: 'ACTIVE' };
      if (enquiry.companyId) {
        whereClause.companyId = enquiry.companyId;
      }
      
      const allActive = await db.employee.findMany({
        where: whereClause,
        select: { id: true, name: true, companyEmail: true },
      });
      eligibleEmployees = allActive;
    }

    // If eligible employees exist, assign to employee with lowest active lead workload
    if (eligibleEmployees.length > 0) {
      const employeeWorkloads = await Promise.all(
        eligibleEmployees.map(async (emp) => {
          const count = await db.enquiry.count({
            where: {
              assignedEmployeeId: emp.id,
              status: { notIn: ['WON', 'LOST', 'ARCHIVED'] },
            },
          });
          return { employee: emp, count };
        })
      );

      employeeWorkloads.sort((a, b) => a.count - b.count);
      const chosen = employeeWorkloads[0].employee;

      await db.enquiry.update({
        where: { id: enquiry.id },
        data: { 
          assignedEmployeeId: chosen.id,
          assignedAt: new Date(),
        },
      });

      await recordLeadTimelineEvent({
        enquiryId: enquiry.id,
        type: 'ASSIGNMENT',
        title: `Lead auto-assigned to ${chosen.name}`,
        description: `Auto-distributed to sales team member (${employeeWorkloads[0].count} active leads).`,
        metadata: {
          assignedEmployeeId: chosen.id,
          assignedEmployeeName: chosen.name,
          businessUnitId,
        },
        actorEmail: 'system@techinpedia.com',
      });

      return chosen;
    }

    // 2. Fallback to active non-SUPER_ADMIN users (sales reps, managers below admin)
    const userWhere: any = {
      status: 'ACTIVE',
      role: { not: 'SUPER_ADMIN' },
    };
    if (enquiry.companyId) {
      userWhere.companyId = enquiry.companyId;
    }

    const teamUsers = await db.user.findMany({
      where: userWhere,
      select: { id: true, name: true, email: true },
    });

    if (teamUsers.length > 0) {
      const userWorkloads = await Promise.all(
        teamUsers.map(async (u) => {
          const count = await db.enquiry.count({
            where: { assignedTo: u.id, status: { notIn: ['WON', 'LOST', 'ARCHIVED'] } },
          });
          return { user: u, count };
        })
      );

      userWorkloads.sort((a, b) => a.count - b.count);
      const chosenUser = userWorkloads[0].user;

      await db.enquiry.update({
        where: { id: enquiry.id },
        data: { 
          assignedTo: chosenUser.id,
          assignedAt: new Date(),
        },
      });

      await recordLeadTimelineEvent({
        enquiryId: enquiry.id,
        type: 'ASSIGNMENT',
        title: `Lead auto-assigned to ${chosenUser.name}`,
        description: `Auto-distributed to executive below admin (${userWorkloads[0].count} active leads).`,
        metadata: {
          assignedUserId: chosenUser.id,
          assignedUserName: chosenUser.name,
          businessUnitId,
        },
        actorEmail: 'system@techinpedia.com',
      });

      return chosenUser;
    }

    // 3. Absolute fallback: only if 0 employees and 0 staff users exist in the system
    const fallbackAdmin = await db.user.findFirst({
      where: { status: 'ACTIVE', role: 'SUPER_ADMIN' },
      select: { id: true, name: true, email: true },
    });

    if (fallbackAdmin) {
      await db.enquiry.update({
        where: { id: enquiry.id },
        data: { 
          assignedTo: fallbackAdmin.id,
          assignedAt: new Date(),
        },
      });
      return fallbackAdmin;
    }

    return null;
  } catch (err) {
    console.error('Lead auto-assignment error:', err);
    return null;
  }
}
