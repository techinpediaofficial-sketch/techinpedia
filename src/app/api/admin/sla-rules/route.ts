import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET: Fetch SLA rules for the authenticated company
export async function GET() {
  try {
    const session = await requireAuth();
    const companyId = session.companyId || null;

    // Fetch company-specific rules and platform defaults
    const [companyRules, platformDefaults] = await Promise.all([
      companyId
        ? db.slaRule.findMany({ where: { companyId, isActive: true }, orderBy: [{ entityType: 'asc' }, { priority: 'asc' }] })
        : [],
      db.slaRule.findMany({ where: { companyId: null, isActive: true }, orderBy: [{ entityType: 'asc' }, { priority: 'asc' }] }),
    ]);

    // Merge: company overrides platform defaults
    const mergedMap = new Map<string, any>();
    for (const rule of platformDefaults) {
      mergedMap.set(`${rule.entityType}:${rule.actionType}:${rule.priority}`, { ...rule, isDefault: true });
    }
    for (const rule of companyRules) {
      mergedMap.set(`${rule.entityType}:${rule.actionType}:${rule.priority}`, { ...rule, isDefault: false });
    }

    return NextResponse.json({ rules: Array.from(mergedMap.values()), companyId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST: Create or update an SLA rule for the company
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const companyId = session.companyId || null;

    // Only OWNER/ADMIN can configure SLA
    const role = (session.companyRole || session.role || '').toUpperCase();
    if (!['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { entityType, actionType, priority, warningMinutes, breachMinutes, escalationActions } = body;

    if (!entityType || !actionType || !priority) {
      return NextResponse.json({ error: 'entityType, actionType, and priority are required' }, { status: 400 });
    }
    if (warningMinutes >= breachMinutes) {
      return NextResponse.json({ error: 'Warning threshold must be less than breach threshold' }, { status: 400 });
    }

    const existing = await db.slaRule.findFirst({
      where: {
        companyId: companyId || null,
        entityType,
        actionType,
        priority,
      },
    });

    const rule = existing
      ? await db.slaRule.update({
          where: { id: existing.id },
          data: {
            warningMinutes: parseInt(warningMinutes),
            breachMinutes: parseInt(breachMinutes),
            escalationActions: escalationActions || null,
            isActive: true,
          },
        })
      : await db.slaRule.create({
          data: {
            companyId: companyId || null,
            entityType,
            actionType,
            priority,
            warningMinutes: parseInt(warningMinutes),
            breachMinutes: parseInt(breachMinutes),
            escalationActions: escalationActions || null,
            isActive: true,
          },
        });

    return NextResponse.json({ success: true, rule });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
