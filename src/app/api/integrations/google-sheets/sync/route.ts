import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { syncInboundSheetLeads, appendLeadToSheet } from '@/lib/google_sheets_service';

// POST: Trigger Manual Sheet Sync Now
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'google_sheets.sync') && !hasPermission(session, 'admin.settings.manage'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { configId, action = 'INBOUND_SYNC', leadData, spreadsheetId, sheetName } = body;

    // A. Outbound reverse export to Sheet
    if (action === 'OUTBOUND_EXPORT') {
      if (!spreadsheetId || !leadData) {
        return NextResponse.json({ error: 'Spreadsheet ID and Lead Data are required for export' }, { status: 400 });
      }

      const exportResult = await appendLeadToSheet(spreadsheetId, sheetName || 'Sheet1', leadData);
      return NextResponse.json(exportResult);
    }

    // B. Inbound Lead Sync from Sheet
    if (!configId) {
      return NextResponse.json({ error: 'Configuration ID is required' }, { status: 400 });
    }

    const result = await syncInboundSheetLeads(configId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Sheet sync error:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
