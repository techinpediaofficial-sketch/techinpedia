import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/templates';

export async function GET() {
  try {
    await requireAuth();
    return NextResponse.json({
      success: true,
      templates: WORKFLOW_TEMPLATES,
    });
  } catch (error) {
    console.error('Fetch workflow templates error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates.' }, { status: 500 });
  }
}
