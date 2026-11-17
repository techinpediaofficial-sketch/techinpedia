import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.performance.view') && !hasPermission(session, 'hr.performance.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (category) where.category = category;
    if (isActive !== null) where.isActive = isActive === 'true';

    const templates = await prisma.performanceKpiTemplate.findMany({
      where,
      include: {
        department: { select: { name: true } },
        designation: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching KPI templates:', error);
    return NextResponse.json({ error: 'Failed to fetch KPI templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!hasPermission(session, 'hr.performance.manage')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'KPI Name is required' }, { status: 400 });
    }

    const template = await prisma.performanceKpiTemplate.create({
      data: {
        name: body.name,
        departmentId: body.departmentId || null,
        designationId: body.designationId || null,
        category: body.category || 'GENERAL',
        weightPercent: parseFloat(body.weightPercent) || 10,
        target: parseFloat(body.target) || 100,
        measurementType: body.measurementType || 'COUNT',
        minScore: parseFloat(body.minScore) || 0,
        maxScore: parseFloat(body.maxScore) || 100,
        isAutomatic: body.isAutomatic ?? false,
        dataSource: body.dataSource,
        isActive: body.isActive ?? true,
      }
    });

    try {
      await prisma.activityLog.create({
        data: {
          action: 'KPI_TEMPLATE_CREATED',
          userId: session.id,
          entityType: 'KPI_TEMPLATE',
          entityId: template.id,
          details: `Created KPI Template: ${template.name}`,
        }
      });
    } catch (e) {
      console.warn("Could not log activity:", e);
    }

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating KPI template:', error);
    return NextResponse.json({ error: 'Failed to create KPI template' }, { status: 500 });
  }
}
