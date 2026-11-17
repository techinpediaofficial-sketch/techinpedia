import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// 1. GET: List All Sheet Sync Configs & Stats
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'google_sheets.view') && !hasPermission(session, 'admin.settings.manage'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configs = await db.googleSheetSyncConfig.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        logs: {
          take: 5,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ configs });
  } catch (error: any) {
    console.error('Sheet config GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch configurations' }, { status: 500 });
  }
}

// 2. POST: Create or Update Sheet Sync Configuration
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'google_sheets.configure')) {
      return NextResponse.json({ error: 'Forbidden: Missing google_sheets.configure permission' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      name,
      spreadsheetId,
      sheetName = 'Sheet1',
      columnMapping = {},
      defaultPipelineId,
      defaultStageId,
      defaultSource = 'Google Sheets Sync',
      defaultAssigneeId,
      assignmentStrategy = 'ROUND_ROBIN',
      dedupField = 'PHONE_OR_EMAIL',
      duplicateAction = 'UPDATE',
      enableAutoWhatsApp = false,
      whatsAppTemplateId,
    } = body;

    if (!name || !spreadsheetId) {
      return NextResponse.json({ error: 'Configuration name and Spreadsheet ID are required' }, { status: 400 });
    }

    const configData = {
      name,
      spreadsheetId: spreadsheetId.trim(),
      sheetName: sheetName.trim(),
      columnMapping: typeof columnMapping === 'object' ? JSON.stringify(columnMapping) : columnMapping,
      defaultPipelineId: defaultPipelineId || null,
      defaultStageId: defaultStageId || null,
      defaultSource,
      defaultAssigneeId: defaultAssigneeId || null,
      assignmentStrategy,
      dedupField,
      duplicateAction,
      enableAutoWhatsApp: Boolean(enableAutoWhatsApp),
      whatsAppTemplateId: whatsAppTemplateId || null,
      status: 'ACTIVE',
    };

    let config;
    if (id) {
      config = await db.googleSheetSyncConfig.update({
        where: { id },
        data: configData,
      });
    } else {
      config = await db.googleSheetSyncConfig.create({
        data: configData,
      });
    }

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error('Sheet config POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save configuration' }, { status: 500 });
  }
}

// 3. DELETE: Remove Sheet Sync Configuration
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'google_sheets.configure')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.googleSheetSyncConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Configuration deleted.' });
  } catch (error: any) {
    console.error('Sheet config DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete configuration' }, { status: 500 });
  }
}
