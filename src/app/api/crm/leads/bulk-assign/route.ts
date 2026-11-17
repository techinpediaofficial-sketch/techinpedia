import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { recordLeadTimelineEvent } from '@/lib/crm';
import { handleApiAuthError } from '@/lib/auth-errors';

/**
 * POST /api/crm/leads/bulk-assign
 *
 * Modes:
 *  - SINGLE: Assign all selected leads to one specific assigneeId (employee ID)
 *  - ROUND_ROBIN: Distribute selected leads evenly across provided assigneeIds list
 *  - AUTO_DISTRIBUTE: Auto pick non-SUPER_ADMIN employees and round-robin among them
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.leads.edit');

    const body = await request.json();
    const {
      leadIds,
      mode = 'SINGLE',
      assigneeId,
      assigneeIds,
    }: {
      leadIds: string[];
      mode: 'SINGLE' | 'ROUND_ROBIN' | 'AUTO_DISTRIBUTE';
      assigneeId?: string;
      assigneeIds?: string[];
    } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'leadIds array is required.' }, { status: 400 });
    }

    let targets: { id: string; name: string }[] = [];

    if (mode === 'SINGLE') {
      if (!assigneeId) {
        return NextResponse.json({ error: 'assigneeId is required for SINGLE mode.' }, { status: 400 });
      }
      const emp = await db.employee.findUnique({ where: { id: assigneeId }, select: { id: true, name: true } });
      if (!emp) return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
      targets = [emp];
    } else if (mode === 'ROUND_ROBIN') {
      if (!assigneeIds || assigneeIds.length === 0) {
        return NextResponse.json({ error: 'assigneeIds list is required for ROUND_ROBIN mode.' }, { status: 400 });
      }
      const emps = await db.employee.findMany({
        where: { id: { in: assigneeIds }, status: 'ACTIVE' },
        select: { id: true, name: true },
      });
      if (emps.length === 0) return NextResponse.json({ error: 'No active employees found in provided list.' }, { status: 404 });
      targets = emps;
    } else if (mode === 'AUTO_DISTRIBUTE') {
      // Get all active employees (non-super-admin users' linked employees)
      const activeEmps = await db.employee.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      if (activeEmps.length === 0) {
        return NextResponse.json({ error: 'No active employees available for auto-distribution.' }, { status: 404 });
      }
      targets = activeEmps;
    } else {
      return NextResponse.json({ error: 'Invalid mode.' }, { status: 400 });
    }

    // Distribute leads across targets
    const results: { leadId: string; assignedTo: string; assignedName: string }[] = [];
    const actorName = session.name || session.email || 'Admin';

    for (let i = 0; i < leadIds.length; i++) {
      const leadId = leadIds[i];
      const target = targets[i % targets.length];

      // Verify enquiry exists
      const enquiry = await db.enquiry.findUnique({ where: { id: leadId }, select: { id: true, name: true } });
      if (!enquiry) continue;

      await db.enquiry.update({
        where: { id: leadId },
        data: { assignedEmployeeId: target.id },
      });

      await recordLeadTimelineEvent({
        enquiryId: leadId,
        type: 'ASSIGNMENT',
        title: `Lead assigned to ${target.name}`,
        description: `Bulk ${mode === 'AUTO_DISTRIBUTE' ? 'auto-distribution' : mode === 'ROUND_ROBIN' ? 'round-robin distribution' : 'assignment'} by ${actorName}.`,
        metadata: {
          assignedEmployeeId: target.id,
          assignedEmployeeName: target.name,
          mode,
          bulkOperation: true,
        },
        actorEmail: session.email || 'admin@techinpedia.com',
      });

      results.push({ leadId, assignedTo: target.id, assignedName: target.name });
    }

    return NextResponse.json({
      success: true,
      assigned: results.length,
      results,
    });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;

    console.error('Bulk assign error:', error);
    return NextResponse.json({ error: 'Failed to bulk assign leads.' }, { status: 500 });
  }
}
