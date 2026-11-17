import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { computePackageContentHash, TemplateRouter } from '@/lib/whatsapp/template_router';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (!hasPermission(session, 'whatsapp.templates.manage') && !hasPermission(session, 'whatsapp.view'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawCompanyId = searchParams.get('companyId');
    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    if (!targetCompanyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const [purposes, packageConfigs, buttonActions, templates, auditLogs, maxSetting, fallbackSetting] = await Promise.all([
      db.whatsappTemplatePurpose.findMany({
        where: { companyId: targetCompanyId },
        include: { template: true },
        orderBy: { purposeKey: 'asc' },
      }),
      db.packageWhatsAppConfig.findMany({
        where: { companyId: targetCompanyId },
        include: { whatsappTemplate: true },
        orderBy: { sortOrder: 'asc' },
      }),
      db.whatsappTemplateButtonAction.findMany({
        where: { companyId: targetCompanyId },
        include: { template: true },
        orderBy: [{ templateId: 'asc' }, { buttonIndex: 'asc' }],
      }),
      db.whatsappTemplate.findMany({
        where: { companyId: targetCompanyId },
        orderBy: { name: 'asc' },
      }),
      db.whatsappTemplateAuditLog.findMany({
        where: { companyId: targetCompanyId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.setting.findFirst({
        where: { key: `whatsapp_package_selection_max_${targetCompanyId}` },
      }),
      db.setting.findFirst({
        where: { key: `whatsapp_fallback_strategy_${targetCompanyId}` },
      }),
    ]);

    // Check consistency for all packages on load
    const packagesWithCheckedConsistency = packageConfigs.map((pkg) => {
      const currentHash = computePackageContentHash({
        name: pkg.packageName,
        price: pkg.packagePrice,
        services: pkg.servicesSummary,
        freeService: pkg.freeService,
        importantNote: pkg.importantNote,
      });
      const isOutdated = Boolean(pkg.templateContentVersion && pkg.templateContentVersion !== currentHash);
      return {
        ...pkg,
        currentCommercialHash: currentHash,
        requiresMetaUpdate: isOutdated || pkg.requiresMetaUpdate,
      };
    });

    return NextResponse.json({
      success: true,
      purposes,
      packages: packagesWithCheckedConsistency,
      buttonActions,
      templates,
      auditLogs,
      settings: {
        maxSelection: maxSetting?.value ? parseInt(maxSetting.value, 10) : 3,
        fallbackStrategy: fallbackSetting?.value || 'CARE_WINDOW_TEXT',
      },
    });
  } catch (error: any) {
    console.error('Template router GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch router configurations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'whatsapp.templates.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, companyId: rawCompanyId } = body;

    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    if (!targetCompanyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const performedBy = session.email || session.name || 'admin';

    // ──────────────────────────────────────────────────────────
    // ACTION: UPDATE_PURPOSE
    // ──────────────────────────────────────────────────────────
    if (action === 'UPDATE_PURPOSE') {
      const { purposeKey, templateId, isActive = true, configuration } = body;
      if (!purposeKey || !templateId) {
        return NextResponse.json({ error: 'purposeKey and templateId are required' }, { status: 400 });
      }

      const existing = await db.whatsappTemplatePurpose.findFirst({
        where: { companyId: targetCompanyId, purposeKey: purposeKey.toUpperCase().trim() },
      });

      const updated = await db.whatsappTemplatePurpose.upsert({
        where: { id: existing?.id || 'new-purpose' },
        update: {
          templateId,
          isActive: Boolean(isActive),
          configuration: configuration ? (typeof configuration === 'string' ? configuration : JSON.stringify(configuration)) : null,
        },
        create: {
          companyId: targetCompanyId,
          purposeKey: purposeKey.toUpperCase().trim(),
          templateId,
          isActive: Boolean(isActive),
          configuration: configuration ? (typeof configuration === 'string' ? configuration : JSON.stringify(configuration)) : null,
        },
        include: { template: true },
      });

      await TemplateRouter.logAudit({
        companyId: targetCompanyId,
        actionType: 'TEMPLATE_PURPOSE_UPDATED',
        detailsJson: JSON.stringify({
          purposeKey,
          oldTemplateId: existing?.templateId,
          newTemplateId: templateId,
          newTemplateName: updated.template?.name,
          isActive,
        }),
        performedBy,
      });

      return NextResponse.json({ success: true, purpose: updated });
    }

    // ──────────────────────────────────────────────────────────
    // ACTION: UPSERT_PACKAGE
    // ──────────────────────────────────────────────────────────
    if (action === 'UPSERT_PACKAGE') {
      const {
        id,
        packageId,
        packageName,
        packagePrice,
        servicesSummary,
        freeService,
        importantNote,
        selectionKey,
        whatsappTemplateId,
        isActive = true,
        sortOrder = 0,
      } = body;

      if (!packageId || !packageName || !selectionKey || !whatsappTemplateId) {
        return NextResponse.json({
          error: 'packageId, packageName, selectionKey, and whatsappTemplateId are required',
        }, { status: 400 });
      }

      const currentHash = computePackageContentHash({
        name: packageName,
        price: Number(packagePrice || 0),
        services: servicesSummary,
        freeService,
        importantNote,
      });

      let pkgRecord;
      if (id) {
        const existing = await db.packageWhatsAppConfig.findUnique({ where: { id } });
        const isOutdated = Boolean(
          existing?.templateContentVersion && existing.templateContentVersion !== currentHash
        );

        pkgRecord = await db.packageWhatsAppConfig.update({
          where: { id },
          data: {
            packageId,
            packageName,
            packagePrice: Number(packagePrice || 0),
            servicesSummary: servicesSummary || null,
            freeService: freeService || null,
            importantNote: importantNote || null,
            selectionKey: String(selectionKey).trim(),
            whatsappTemplateId,
            isActive: Boolean(isActive),
            sortOrder: Number(sortOrder || 0),
            packageContentVersion: currentHash,
            requiresMetaUpdate: isOutdated,
          },
          include: { whatsappTemplate: true },
        });

        await TemplateRouter.logAudit({
          companyId: targetCompanyId,
          actionType: 'PACKAGE_CONFIG_UPDATED',
          detailsJson: JSON.stringify({
            packageId,
            packageName,
            selectionKey,
            whatsappTemplateId,
            requiresMetaUpdate: isOutdated,
          }),
          performedBy,
        });
      } else {
        // Creating fresh package mapping
        pkgRecord = await db.packageWhatsAppConfig.create({
          data: {
            companyId: targetCompanyId,
            packageId,
            packageName,
            packagePrice: Number(packagePrice || 0),
            servicesSummary: servicesSummary || null,
            freeService: freeService || null,
            importantNote: importantNote || null,
            selectionKey: String(selectionKey).trim(),
            whatsappTemplateId,
            isActive: Boolean(isActive),
            sortOrder: Number(sortOrder || 0),
            templateContentVersion: currentHash,
            packageContentVersion: currentHash,
            requiresMetaUpdate: false,
          },
          include: { whatsappTemplate: true },
        });

        await TemplateRouter.logAudit({
          companyId: targetCompanyId,
          actionType: 'PACKAGE_CONFIG_CREATED',
          detailsJson: JSON.stringify({ packageId, packageName, selectionKey, whatsappTemplateId }),
          performedBy,
        });
      }

      return NextResponse.json({ success: true, package: pkgRecord });
    }

    // ──────────────────────────────────────────────────────────
    // ACTION: RESET_PACKAGE_CONSISTENCY (Admin confirmed Meta template is synchronized)
    // ──────────────────────────────────────────────────────────
    if (action === 'RESET_PACKAGE_CONSISTENCY') {
      const { packageConfigId } = body;
      const pkg = await db.packageWhatsAppConfig.findUnique({ where: { id: packageConfigId } });
      if (!pkg) return NextResponse.json({ error: 'Package config not found' }, { status: 404 });

      const currentHash = computePackageContentHash({
        name: pkg.packageName,
        price: pkg.packagePrice,
        services: pkg.servicesSummary,
        freeService: pkg.freeService,
        importantNote: pkg.importantNote,
      });

      const updated = await db.packageWhatsAppConfig.update({
        where: { id: packageConfigId },
        data: {
          templateContentVersion: currentHash,
          packageContentVersion: currentHash,
          requiresMetaUpdate: false,
        },
      });

      await TemplateRouter.logAudit({
        companyId: targetCompanyId,
        actionType: 'PACKAGE_CONSISTENCY_RESET',
        detailsJson: JSON.stringify({
          packageId: pkg.packageId,
          packageName: pkg.packageName,
          synchronizedHash: currentHash,
        }),
        performedBy,
      });

      return NextResponse.json({ success: true, package: updated });
    }

    // ──────────────────────────────────────────────────────────
    // ACTION: TOGGLE_PACKAGE_ACTIVE
    // ──────────────────────────────────────────────────────────
    if (action === 'TOGGLE_PACKAGE_ACTIVE') {
      const { packageConfigId, isActive } = body;
      const updated = await db.packageWhatsAppConfig.update({
        where: { id: packageConfigId },
        data: { isActive: Boolean(isActive) },
      });

      await TemplateRouter.logAudit({
        companyId: targetCompanyId,
        actionType: 'PACKAGE_STATUS_TOGGLED',
        detailsJson: JSON.stringify({ packageId: updated.packageId, isActive }),
        performedBy,
      });

      return NextResponse.json({ success: true, package: updated });
    }

    // ──────────────────────────────────────────────────────────
    // ACTION: UPSERT_BUTTON_ACTION
    // ──────────────────────────────────────────────────────────
    if (action === 'UPSERT_BUTTON_ACTION') {
      const { id, templateId, buttonIndex, buttonLabel, actionKey, actionConfig, isActive = true } = body;
      if (!templateId || buttonIndex === undefined || !actionKey) {
        return NextResponse.json({ error: 'templateId, buttonIndex, and actionKey are required' }, { status: 400 });
      }

      let btnRecord;
      if (id) {
        btnRecord = await db.whatsappTemplateButtonAction.update({
          where: { id },
          data: {
            templateId,
            buttonIndex: Number(buttonIndex),
            buttonLabel: buttonLabel || null,
            actionKey: actionKey.toUpperCase().trim(),
            actionConfig: actionConfig ? (typeof actionConfig === 'string' ? actionConfig : JSON.stringify(actionConfig)) : null,
            isActive: Boolean(isActive),
          },
          include: { template: true },
        });
      } else {
        btnRecord = await db.whatsappTemplateButtonAction.create({
          data: {
            companyId: targetCompanyId,
            templateId,
            buttonIndex: Number(buttonIndex),
            buttonLabel: buttonLabel || null,
            actionKey: actionKey.toUpperCase().trim(),
            actionConfig: actionConfig ? (typeof actionConfig === 'string' ? actionConfig : JSON.stringify(actionConfig)) : null,
            isActive: Boolean(isActive),
          },
          include: { template: true },
        });
      }

      await TemplateRouter.logAudit({
        companyId: targetCompanyId,
        actionType: 'BUTTON_ACTION_CONFIGURED',
        detailsJson: JSON.stringify({ templateId, buttonIndex, actionKey, buttonLabel }),
        performedBy,
      });

      return NextResponse.json({ success: true, buttonAction: btnRecord });
    }

    // ──────────────────────────────────────────────────────────
    // ACTION: UPDATE_SETTINGS
    // ──────────────────────────────────────────────────────────
    if (action === 'UPDATE_SETTINGS') {
      const { maxSelection, fallbackStrategy } = body;

      if (maxSelection !== undefined) {
        const val = Math.min(Math.max(parseInt(maxSelection, 10) || 3, 1), 9);
        await db.setting.upsert({
          where: { key: `whatsapp_package_selection_max_${targetCompanyId}` },
          update: { value: String(val) },
          create: {
            key: `whatsapp_package_selection_max_${targetCompanyId}`,
            value: String(val),
          },
        });
      }

      if (fallbackStrategy) {
        await db.setting.upsert({
          where: { key: `whatsapp_fallback_strategy_${targetCompanyId}` },
          update: { value: String(fallbackStrategy) },
          create: {
            key: `whatsapp_fallback_strategy_${targetCompanyId}`,
            value: String(fallbackStrategy),
          },
        });
      }

      await TemplateRouter.logAudit({
        companyId: targetCompanyId,
        actionType: 'ROUTER_SETTINGS_UPDATED',
        detailsJson: JSON.stringify({ maxSelection, fallbackStrategy }),
        performedBy,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Template router POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update configuration' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, 'whatsapp.templates.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type'); // 'PACKAGE' or 'BUTTON_ACTION'
    const rawCompanyId = searchParams.get('companyId');

    const targetCompanyId = session.isTenant || session.companyId
      ? session.companyId
      : (rawCompanyId && rawCompanyId !== 'master' && rawCompanyId !== 'ALL' ? rawCompanyId : null);

    if (!id || !type || !targetCompanyId) {
      return NextResponse.json({ error: 'id, type, and companyId are required' }, { status: 400 });
    }

    const performedBy = session.email || session.name || 'admin';

    if (type === 'PACKAGE') {
      const deleted = await db.packageWhatsAppConfig.deleteMany({
        where: { id, companyId: targetCompanyId },
      });
      await TemplateRouter.logAudit({
        companyId: targetCompanyId,
        actionType: 'PACKAGE_CONFIG_DELETED',
        detailsJson: JSON.stringify({ id }),
        performedBy,
      });
      return NextResponse.json({ success: true, count: deleted.count });
    }

    if (type === 'BUTTON_ACTION') {
      const deleted = await db.whatsappTemplateButtonAction.deleteMany({
        where: { id, companyId: targetCompanyId },
      });
      await TemplateRouter.logAudit({
        companyId: targetCompanyId,
        actionType: 'BUTTON_ACTION_DELETED',
        detailsJson: JSON.stringify({ id }),
        performedBy,
      });
      return NextResponse.json({ success: true, count: deleted.count });
    }

    return NextResponse.json({ error: `Unknown delete type: ${type}` }, { status: 400 });
  } catch (error: any) {
    console.error('Template router DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete record' }, { status: 500 });
  }
}
