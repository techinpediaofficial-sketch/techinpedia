import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { syncMetaTemplates, createMetaTemplate, deleteMetaTemplate, updateMetaTemplate } from '@/lib/whatsapp_service';

// 1. GET: List All Synced Templates
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'whatsapp.templates.manage') && !hasPermission(session, 'whatsapp.view'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const sync = searchParams.get('sync');

    const rawCompanyId = searchParams.get('companyId');
    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    if (sync === 'true') {
      try {
        await syncMetaTemplates(targetCompanyId);
      } catch (syncErr) {
        console.warn('Auto-sync on templates GET error:', syncErr);
      }
    }

    const where: any = {};
    if (targetCompanyId !== 'ALL') where.companyId = targetCompanyId || null;
    if (category && category !== 'ALL') where.category = category;
    if (status && status !== 'ALL') where.status = status;

    const templates = await db.whatsappTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const activeConn = await db.whatsappConnection.findFirst({
      where: { isActive: true, companyId: targetCompanyId || null },
      select: {
        id: true,
        wabaId: true,
        phoneNumberId: true,
        businessPhoneNumber: true,
        displayName: true,
        status: true,
      },
    });

    return NextResponse.json({
      templates,
      wabaId: activeConn?.wabaId || null,
      connection: activeConn || null,
    });
  } catch (error: any) {
    console.error('Templates GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch templates' }, { status: 500 });
  }
}

// 2. POST: Sync Templates from Meta Cloud API OR Create New Template
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'whatsapp.templates.manage')) {
      return NextResponse.json({ error: 'Forbidden: Missing whatsapp.templates.manage permission' }, { status: 403 });
    }

    const body = await request.json();
    const { action = 'SYNC' } = body;

    const url = new URL(request.url);
    const rawCompanyId = body.companyId || url.searchParams.get('companyId');
    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    if (action === 'CREATE') {
      const {
        name,
        category,
        language,
        headerType,
        headerText,
        headerMediaUrl,
        headerMediaBase64,
        headerMediaHandle,
        bodyText,
        bodySampleValues,
        footerText,
        buttons,
      } = body;

      if (!name || !bodyText) {
        return NextResponse.json({ error: 'Template name and body text are required.' }, { status: 400 });
      }

      const createResult = await createMetaTemplate({
        name,
        category: category || 'MARKETING',
        language: language || 'en_US',
        headerType,
        headerText,
        headerMediaUrl,
        headerMediaBase64,
        headerMediaHandle,
        bodyText,
        bodySampleValues,
        footerText,
        buttons,
      }, targetCompanyId);

      if (!createResult.success) {
        return NextResponse.json({ error: createResult.error || 'Failed to create template on Meta' }, { status: 400 });
      }

      await db.activityLog.create({
        data: {
          userId: session.userId,
          userEmail: session.email,
          action: 'WHATSAPP_TEMPLATE_CREATED',
          entityType: 'WhatsAppTemplate',
          entityId: createResult.template?.id,
          metadata: JSON.stringify({
            name: createResult.template?.name,
            category: createResult.template?.category,
            metaTemplateId: createResult.template?.metaTemplateId,
            status: createResult.template?.status,
            companyId: targetCompanyId,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        template: createResult.template,
        message: 'Template submitted to Meta for review and approval.',
      });
    }

    if (action === 'SYNC') {
      const syncResult = await syncMetaTemplates(targetCompanyId);
      if (!syncResult.success) {
        return NextResponse.json({ error: syncResult.error || 'Failed to sync templates from Meta' }, { status: 400 });
      }

      await db.activityLog.create({
        data: {
          userId: session.userId,
          userEmail: session.email,
          action: 'WHATSAPP_TEMPLATES_SYNCED',
          entityType: 'WhatsAppTemplate',
          metadata: JSON.stringify({ count: syncResult.count, companyId: targetCompanyId }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully synchronized ${syncResult.count} templates from Meta WhatsApp Business Platform.`,
        count: syncResult.count,
      });
    }

    if (action === 'UPDATE') {
      const {
        id,
        category,
        headerType,
        headerText,
        headerMediaUrl,
        headerMediaBase64,
        headerMediaHandle,
        bodyText,
        bodySampleValues,
        footerText,
        buttons,
      } = body;

      if (!id || !bodyText) {
        return NextResponse.json({ error: 'Template ID and body text are required.' }, { status: 400 });
      }

      const updateResult = await updateMetaTemplate({
        id,
        category,
        headerType,
        headerText,
        headerMediaUrl,
        headerMediaBase64,
        headerMediaHandle,
        bodyText,
        bodySampleValues,
        footerText,
        buttons,
      }, targetCompanyId);

      if (!updateResult.success) {
        return NextResponse.json({ error: updateResult.error || 'Failed to update template' }, { status: 400 });
      }

      await db.activityLog.create({
        data: {
          userId: session.userId,
          userEmail: session.email,
          action: 'WHATSAPP_TEMPLATE_UPDATED',
          entityType: 'WhatsAppTemplate',
          entityId: id,
          metadata: JSON.stringify({
            name: updateResult.template?.name,
            category: updateResult.template?.category,
            metaTemplateId: updateResult.template?.metaTemplateId,
            metaUpdated: updateResult.metaUpdated,
            companyId: targetCompanyId,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        template: updateResult.template,
        metaUpdated: updateResult.metaUpdated,
        warning: updateResult.warning,
        message: updateResult.metaUpdated
          ? 'Template updated and re-submitted to Meta for review.'
          : 'Template updated in local database.' + (updateResult.warning ? ` (${updateResult.warning})` : ''),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Templates POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process template request' }, { status: 500 });
  }
}

// 4. DELETE: Remove Template from Meta & Local Registry
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'whatsapp.templates.manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const template = await db.whatsappTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Attempt deletion from Meta WABA scoped to template's company
    await deleteMetaTemplate(template.name, template.companyId);

    // Delete local database record
    await db.whatsappTemplate.delete({
      where: { id },
    });

    await db.activityLog.create({
      data: {
        userId: session.userId,
        userEmail: session.email,
        action: 'WHATSAPP_TEMPLATE_DELETED',
        entityType: 'WhatsAppTemplate',
        entityId: id,
        metadata: JSON.stringify({ name: template.name }),
      },
    });

    return NextResponse.json({ success: true, message: 'Template removed successfully' });
  } catch (error: any) {
    console.error('Template DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete template' }, { status: 500 });
  }
}

// 3. PATCH: Update CRM Variable Mappings for Template
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'whatsapp.templates.manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, crmMapping } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const updated = await db.whatsappTemplate.update({
      where: { id },
      data: {
        crmMappingJson: typeof crmMapping === 'object' ? JSON.stringify(crmMapping) : crmMapping,
      },
    });

    return NextResponse.json({ success: true, template: updated });
  } catch (error: any) {
    console.error('Template mapping update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update template mapping' }, { status: 500 });
  }
}

// 5. PUT: Update Meta Template components and sync
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'whatsapp.templates.manage')) {
      return NextResponse.json({ error: 'Forbidden: Missing whatsapp.templates.manage permission' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      category,
      headerType,
      headerText,
      headerMediaUrl,
      headerMediaBase64,
      headerMediaHandle,
      bodyText,
      bodySampleValues,
      footerText,
      buttons,
    } = body;

    if (!id || !bodyText) {
      return NextResponse.json({ error: 'Template ID and body text are required.' }, { status: 400 });
    }

    const url = new URL(request.url);
    const rawCompanyId = body.companyId || url.searchParams.get('companyId');
    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    const updateResult = await updateMetaTemplate({
      id,
      category,
      headerType,
      headerText,
      headerMediaUrl,
      headerMediaBase64,
      headerMediaHandle,
      bodyText,
      bodySampleValues,
      footerText,
      buttons,
    }, targetCompanyId);

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error || 'Failed to update template' }, { status: 400 });
    }

    await db.activityLog.create({
      data: {
        userId: session.userId,
        userEmail: session.email,
        action: 'WHATSAPP_TEMPLATE_UPDATED',
        entityType: 'WhatsAppTemplate',
        entityId: id,
        metadata: JSON.stringify({
          name: updateResult.template?.name,
          category: updateResult.template?.category,
          metaTemplateId: updateResult.template?.metaTemplateId,
          metaUpdated: updateResult.metaUpdated,
          companyId: targetCompanyId,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      template: updateResult.template,
      metaUpdated: updateResult.metaUpdated,
      warning: updateResult.warning,
      message: updateResult.metaUpdated
        ? 'Template updated and re-submitted to Meta for review.'
        : 'Template updated in local database.' + (updateResult.warning ? ` (${updateResult.warning})` : ''),
    });
  } catch (error: any) {
    console.error('Template PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update template' }, { status: 500 });
  }
}

