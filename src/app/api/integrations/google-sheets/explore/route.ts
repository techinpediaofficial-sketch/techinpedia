import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { exploreSpreadsheet } from '@/lib/google_sheets_service';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'google_sheets.configure')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spreadsheetId, sheetTabName } = await request.json();
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
    }

    const data = await exploreSpreadsheet(spreadsheetId.trim(), sheetTabName);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error('Explore spreadsheet error:', error);
    return NextResponse.json({ error: error.message || 'Failed to inspect spreadsheet' }, { status: 500 });
  }
}
