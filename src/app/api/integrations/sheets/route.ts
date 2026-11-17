import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isGoogleSheetsConfigured } from '@/lib/google_sheets';

export async function GET() {
  try {
    await requireAuth();
    const configStatus = isGoogleSheetsConfigured();
    const integrations = await db.sheetIntegration.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      integrations,
      configured: configStatus.configured,
      missing: configStatus.missing,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const { name, spreadsheetId, sheetTabName, columnMappings, syncDirection } = body;

    if (!name || !spreadsheetId) {
      return NextResponse.json({ error: 'Name and Spreadsheet ID are required.' }, { status: 400 });
    }

    const integration = await db.sheetIntegration.create({
      data: {
        name: name.trim(),
        spreadsheetId: spreadsheetId.trim(),
        sheetTabName: sheetTabName || 'Sheet1',
        columnMappings: JSON.stringify(columnMappings || {}),
        syncDirection: syncDirection || 'INBOUND',
        status: isGoogleSheetsConfigured().configured ? 'ACTIVE' : 'NOT_CONFIGURED',
      },
    });

    return NextResponse.json({ success: true, integration });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save integration' }, { status: 500 });
  }
}
