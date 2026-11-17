import { NextResponse } from 'next/server';
import {
  WORKFLOW_CATEGORIES,
  ACTION_REGISTRY,
  TRIGGER_REGISTRY,
  getActionsGroupedByCategory,
} from '@/lib/workflow/registry';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resolveEffectiveCompanyId } from '@/lib/access-policy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    const url = new URL(request.url);
    const queryCid = url.searchParams.get('companyId');
    const targetCompanyId = session ? await resolveEffectiveCompanyId(session, queryCid) : (queryCid || null);

    const userWhere: any = { status: 'ACTIVE' };
    if (targetCompanyId) {
      userWhere.companyId = targetCompanyId;
    }

    // Fetch live lookups strictly scoped to the requesting company
    const [users, pipelines, projects, tags, departments, whatsappTemplates] = await Promise.all([
      db.user.findMany({
        where: userWhere,
        select: { id: true, name: true, email: true, role: true, companyRole: true },
        orderBy: { name: 'asc' },
      }).catch(() => []),
      db.pipeline.findMany({
        include: { stages: { orderBy: { order: 'asc' } } },
      }).catch(() => []),
      db.projectRecord.findMany({
        where: { status: 'ACTIVE', ...(targetCompanyId ? { companyId: targetCompanyId } : {}) },
        select: { id: true, name: true, code: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }).catch(() => []),
      db.tag.findMany({
        select: { id: true, name: true, color: true },
        orderBy: { name: 'asc' },
      }).catch(() => []),
      db.department.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }).catch(() => []),
      db.whatsappTemplate.findMany({
        where: {
          companyId: targetCompanyId,
          status: { in: ['APPROVED', 'ACTIVE'] },
        },
        select: {
          id: true,
          name: true,
          category: true,
          language: true,
          headerType: true,
          bodyText: true,
          status: true,
        },
        orderBy: { name: 'asc' },
      }).catch(() => []),
    ]);

    return NextResponse.json({
      success: true,
      categories: WORKFLOW_CATEGORIES,
      actions: ACTION_REGISTRY,
      actionsByCategory: getActionsGroupedByCategory(),
      triggers: TRIGGER_REGISTRY,
      dynamicLookups: {
        users: users.map((u: any) => ({ label: `${u.name} (${u.companyRole || u.role})`, value: u.id })),
        pipelines: pipelines.map((p: any) => ({
          label: p.name,
          value: p.id,
          stages: p.stages.map((s: any) => ({ label: s.name, value: s.id })),
        })),
        projects: projects.map((pr: any) => ({ label: `${pr.name} (${pr.code})`, value: pr.id })),
        tags: tags.map((t: any) => ({ label: t.name, value: t.name, color: t.color })),
        departments: departments.map((d: any) => ({ label: d.name, value: d.name })),
        whatsappTemplates: whatsappTemplates.map((t: any) => ({
          label: `${t.name} (${t.category} - ${t.language})`,
          value: t.name,
          category: t.category,
          language: t.language,
          headerType: t.headerType,
          bodyText: t.bodyText,
        })),
      },
      companyId: targetCompanyId,
    });
  } catch (error: any) {
    console.error('Error serving workflow registry:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to load workflow action registry.',
      },
      { status: 500 }
    );
  }
}
