import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { handleApiAuthError } from '@/lib/auth-errors';

export async function GET() {
  try {
    const session = await requireAuth();
    requirePermission(session, 'admin.business_units.manage');

    const units = await db.businessUnit.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            enquiries: true,
            employees: true,
          },
        },
      },
    });

    return NextResponse.json({ businessUnits: units });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Business Units fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch business units.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'admin.business_units.manage');

    const body = await request.json();
    const { code, name, description } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'code and name are required.' }, { status: 400 });
    }

    const existing = await db.businessUnit.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: `Business Unit with code '${code}' already exists.` }, { status: 409 });
    }

    const bu = await db.businessUnit.create({
      data: {
        code: code.toUpperCase().trim(),
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true,
        isSystem: false,
      },
    });

    return NextResponse.json({ businessUnit: bu }, { status: 201 });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Business Unit create error:', error);
    return NextResponse.json({ error: 'Failed to create business unit.' }, { status: 500 });
  }
}
