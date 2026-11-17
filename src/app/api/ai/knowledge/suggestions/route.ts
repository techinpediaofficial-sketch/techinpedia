import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

import { resolveEffectiveCompanyId } from '@/lib/access-policy';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    if (!hasPermission(session, 'ai.knowledge.manage') && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = await resolveEffectiveCompanyId(session, searchParams.get('companyId'));

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    const suggestions = await db.aiKnowledgeSuggestion.findMany({
      where: { companyId },
      orderBy: [{ status: 'asc' }, { frequency: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error('Error fetching knowledge suggestions:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
