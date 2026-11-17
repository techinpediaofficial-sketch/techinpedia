import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { handleApiAuthError } from '@/lib/auth-errors';

const SYSTEM_PROTECTED_CODES = ['COMPANY_SERVICES', 'MARKETPLACE'];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'admin.business_units.manage');

    const { id } = await params;
    const body = await request.json();
    const { name, description, isActive } = body;

    const existing = await db.businessUnit.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Business Unit not found.' }, { status: 404 });

    // System BUs can be deactivated but code cannot be changed
    const updated = await db.businessUnit.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json({ businessUnit: updated });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Business Unit update error:', error);
    return NextResponse.json({ error: 'Failed to update business unit.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'admin.business_units.manage');

    const { id } = await params;
    const existing = await db.businessUnit.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Business Unit not found.' }, { status: 404 });

    // Protect system BUs — prefer deactivation over deletion
    if (SYSTEM_PROTECTED_CODES.includes(existing.code)) {
      return NextResponse.json(
        { error: `Cannot delete system Business Unit '${existing.code}'. Use deactivate instead.` },
        { status: 403 }
      );
    }

    // Check for assigned leads or employees before deleting
    const leadCount = await db.enquiry.count({ where: { businessUnitId: id } });
    const empCount = await db.employeeBusinessUnit.count({ where: { businessUnitId: id } });

    if (leadCount > 0 || empCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${leadCount} leads and ${empCount} employee assignments exist. Deactivate instead.` },
        { status: 409 }
      );
    }

    await db.businessUnit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Business Unit delete error:', error);
    return NextResponse.json({ error: 'Failed to delete business unit.' }, { status: 500 });
  }
}
