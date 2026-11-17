import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { handleApiAuthError } from '@/lib/auth-errors';
import { sendEnquiryEmailNotification } from '@/lib/email';
import { getLeadWhatsAppLink } from '@/lib/whatsapp';
import { EnquiryStatus, Prisma } from '@prisma/client';
import { createEnquiry } from '@/lib/crm/create-lead';
import { getAccessibleBusinessUnits, buildBusinessUnitFilter } from '@/lib/business-units';
import {
  calculateLeadScore,
  recordLeadTimelineEvent,
  syncLeadToContactAndCompany,
  assignLeadAuto,
} from '@/lib/crm';
import { emitWorkflowEvent } from '@/lib/workflow/eventEmitter';
import { fanoutMarketplaceLead } from '@/lib/marketplace/fanout';
import { isOwnerOrAdmin, isManager, getAccessibleUserIdsForUser } from '@/lib/access-policy';

export async function POST(request: Request) {
// ... POST body stays the same ...
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      company,
      website,
      service,
      projectType,
      budget,
      timeline,
      message,
      source,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
    } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Project message/details are required.' }, { status: 400 });
    }

    // Determine relevant CRM Pipeline & Initial Stage
    let pipelineCode = 'software-dev';
    const sLower = (service || '').toLowerCase();
    if (sLower.includes('rental') || sLower.includes('laptop') || sLower.includes('hardware') || sLower.includes('macbook')) {
      pipelineCode = 'hardware-rentals';
    } else if (sLower.includes('amc') || sLower.includes('maintenance')) {
      pipelineCode = 'amc-contracts';
    } else if (sLower.includes('marketing') || sLower.includes('seo') || sLower.includes('ads')) {
      pipelineCode = 'digital-marketing';
    }

    const defaultPipeline = await db.pipeline.findUnique({
      where: { code: pipelineCode },
      include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
    });
    const initialStageId = defaultPipeline?.stages[0]?.id || null;

    // Calculate dynamic lead score
    const leadScore = calculateLeadScore({
      phone,
      email,
      company,
      budget,
      timeline,
      message,
      service,
    });

    // Determine initial temperature
    const temperature = leadScore >= 60 ? 'HOT' : leadScore >= 35 ? 'WARM' : 'COLD';

    const forwardedHost = request.headers.get('x-forwarded-host');
    const rawHost = request.headers.get('host') || null;
    const originHostname = forwardedHost || rawHost;

    // Check if source or host indicates Urban Marketplace
    let forceBusinessUnitId = body.businessUnitId || undefined;
    let forceSiteId = body.siteId || undefined;
    if (
      !forceBusinessUnitId &&
      (source?.toLowerCase().includes('urban') ||
       originHostname?.toLowerCase().includes('urban') ||
       body.message?.includes('[URBAN MARKETPLACE'))
    ) {
      forceBusinessUnitId = '27d5a6a6-96b6-4b5c-a4a9-dfac8a4e6a1e';
      forceSiteId = 'd6d15177-d53d-407f-844f-e76b4e9bc98a';
    } else if (!forceBusinessUnitId && !forceSiteId) {
      // Default all standard website form enquiries to TechInPedia Company Services
      forceBusinessUnitId = '27880553-4656-4557-abef-55ba9b5949c2';
      forceSiteId = 'e72cf75b-47e8-4821-adfa-2fb38943e076';
    }

    // Save lead to database using centralized helper
    const enquiry = await createEnquiry({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : undefined,
      company: company ? company.trim() : undefined,
      service: service ? service.trim() : undefined,
      budget: budget ? budget.trim() : undefined,
      timeline: timeline ? timeline.trim() : undefined,
      message: message.trim(),
      source: source ? source.trim() : 'Website Form',
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      utmContent: utmContent || undefined,
      forceBusinessUnitId,
      forceSiteId,
      forceCompanyId: body.companyId || undefined,
    }, originHostname);

    // Update with score, temperature, city, address, projectType
    await db.enquiry.update({
      where: { id: enquiry.id },
      data: {
        score: leadScore,
        temperature,
        priority: leadScore >= 60 ? 'HIGH' : 'MEDIUM',
        city: body.city || undefined,
        address: body.address || undefined,
        projectType: body.projectType || undefined,
        departmentId: body.departmentId || undefined,
        teamId: body.teamId || undefined,
        assignedEmployeeId: body.assignedEmployeeId || undefined,
      }
    });
    // Ensure enquiry object has updated fields for the rest of the flow
    enquiry.score = leadScore;
    enquiry.temperature = temperature;
    enquiry.priority = leadScore >= 60 ? 'HIGH' : 'MEDIUM';

    // Record initial timeline event
    await recordLeadTimelineEvent({
      enquiryId: enquiry.id,
      type: 'CREATED',
      title: 'Lead Inbound from Website',
      description: `Inquiry submitted for "${service || 'General'}" via ${source || 'Website'}. Initial score: ${leadScore}/100.`,
      metadata: { utmSource, utmMedium, utmCampaign, budget, timeline },
      actorEmail: 'system@techinpedia.com',
    });

    // Non-blocking sync Contact & Company and Auto-assignment
    syncLeadToContactAndCompany(enquiry.id).catch((err) =>
      console.error('Lead Contact/Company sync error:', err)
    );
    assignLeadAuto(enquiry).catch((err) =>
      console.error('Lead auto-assignment error:', err)
    );

    // Non-blocking trigger Business Automation Workflows
    emitWorkflowEvent('crm.lead.created', {
      entityId: enquiry.id,
      entityType: 'Lead',
      data: {
        lead: {
          id: enquiry.id,
          name: enquiry.name,
          email: enquiry.email,
          phone: enquiry.phone,
          company: enquiry.company,
          service: enquiry.service,
          budget: enquiry.budget,
          timeline: enquiry.timeline,
          score: enquiry.score,
          status: enquiry.status,
          source: enquiry.source,
        },
      },
    }).catch((err) => console.error('Workflow event dispatch error:', err));

    // Send async non-blocking email alert to admin
    sendEnquiryEmailNotification({
      enquiryId: enquiry.id,
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone,
      company: enquiry.company,
      service: enquiry.service,
      budget: enquiry.budget,
      timeline: enquiry.timeline,
      message: enquiry.message,
      source: enquiry.source,
    }).catch((err) => console.error('Background email dispatch error:', err));

    // Non-blocking Urban Marketplace Automated Lead Fanout Engine
    if (
      enquiry.businessUnitId === 'MARKETPLACE' ||
      enquiry.siteId === 'MARKETPLACE_PUBLIC' ||
      (enquiry.source && enquiry.source.toLowerCase().includes('urban'))
    ) {
      fanoutMarketplaceLead(enquiry.id).catch((err) =>
        console.error('[Marketplace Fanout] Background distribution error:', err)
      );
    }

    // Generate context WhatsApp link for user convenience
    const whatsappLink = await getLeadWhatsAppLink(enquiry.name, enquiry.service || undefined);

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your enquiry has been received. Our team will get back to you within 24 hours.',
      enquiryId: enquiry.id,
      whatsappLink,
    });
  } catch (error) {
    console.error('Enquiry creation error:', error);
    return NextResponse.json({ error: 'Failed to submit project enquiry. Please try again.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.leads.view');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as EnquiryStatus | null;
    const stageId = searchParams.get('stageId');
    const temperature = searchParams.get('temperature');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    const departmentId = searchParams.get('departmentId');
    const teamId = searchParams.get('teamId');
    const assignedEmployeeId = searchParams.get('assignedEmployeeId');
    const checkDuplicate = searchParams.get('checkDuplicate') === 'true';
    const checkEmail = searchParams.get('email');
    const checkPhone = searchParams.get('phone');

    // PHASE 1.1 FIX: Duplicate check scoped to accessible Business Units.
    // Normal employees cannot discover leads from other Business Units even via duplicate check.
    if (checkDuplicate && (checkEmail || checkPhone)) {
      const duplicateConditions: Prisma.EnquiryWhereInput[] = [];
      if (checkEmail) duplicateConditions.push({ email: checkEmail.trim().toLowerCase() });
      if (checkPhone) duplicateConditions.push({ phone: checkPhone.trim() });

      // Build BU filter for this session
      const accessibleUnits = getAccessibleBusinessUnits(session);
      const buWhere: Prisma.EnquiryWhereInput = accessibleUnits.includes('*')
        ? {} // SUPER_ADMIN sees all
        : { businessUnitId: { in: accessibleUnits } };

      const duplicates = await db.enquiry.findMany({
        where: {
          AND: [
            buWhere,
            { OR: duplicateConditions },
          ],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          status: true,
          businessUnitId: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        isDuplicate: duplicates.length > 0,
        duplicates,
      });
    }

    const where: Prisma.EnquiryWhereInput = {};

    // STRICT TENANT ISOLATION:
    // Tenant users only see their own company leads.
    // Master Admin (/admin/leads) strictly sees TechInPedia leads (companyId: null).
    // Tenant company leads (such as Hello Mam) will NEVER mix into TechInPedia leads!
    if (session.isTenant || session.companyId) {
      where.companyId = session.companyId;
    } else {
      const queryCompanyId = searchParams.get('companyId');
      if (queryCompanyId && queryCompanyId !== 'master' && queryCompanyId !== 'all') {
        where.companyId = queryCompanyId;
      } else {
        where.companyId = null;
      }
    }

    const isOwnerAdmin = isOwnerOrAdmin(session);
    if (!isOwnerAdmin) {
      const accessibleUserIds = await getAccessibleUserIdsForUser(session);
      if (accessibleUserIds !== null) {
        if (isManager(session)) {
          where.OR = [
            { assignedTo: { in: accessibleUserIds } },
            { AND: [{ assignedTo: null }, { assignedEmployeeId: null }] },
            ...(session.employeeId ? [{ assignedEmployeeId: session.employeeId }] : []),
          ];
        } else {
          where.OR = [
            { assignedTo: session.userId },
            ...(session.employeeId ? [{ assignedEmployeeId: session.employeeId }] : []),
          ];
        }
      }
    }

    const accessibleUnits = getAccessibleBusinessUnits(session);
    if (!accessibleUnits.includes('*')) {
      where.businessUnitId = { in: accessibleUnits };
    }

    // PHASE 1.1: Support filtering by a specific BU (within session's accessible units)
    const filterBU = searchParams.get('businessUnitId');
    if (filterBU) {
      const buFilter = buildBusinessUnitFilter(session, filterBU);
      if (buFilter !== undefined) {
        where.businessUnitId = buFilter as any;
      }
    }

    if (status) {
      where.status = status;
    }

    if (stageId) {
      where.pipelineStageId = stageId;
    }

    if (temperature) {
      where.temperature = temperature;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (assignedEmployeeId) {
      where.assignedEmployeeId = assignedEmployeeId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (teamId) {
      where.teamId = teamId;
    }

    if (search.trim() !== '') {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { company: { contains: search } },
        { service: { contains: search } },
      ];
    }

    const [total, enquiries] = await Promise.all([
      db.enquiry.count({ where }),
      db.enquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedUser: { select: { id: true, name: true, email: true } },
          assignedEmployee: { select: { id: true, name: true, employeeCode: true, companyEmail: true } },
          department: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          businessUnit: { select: { id: true, code: true, name: true } },
          tenantCompany: { select: { id: true, name: true } },
          wonDeal: { select: { id: true, title: true, value: true } },
          followUps: {
            orderBy: { scheduledAt: 'asc' },
            take: 3,
            select: { id: true, title: true, scheduledAt: true, status: true, type: true },
          },
          notes: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } },
          },
        },
      }),
    ]);

    // Batch resolve pipeline stages for returned enquiries
    const stageIds = Array.from(
      new Set(enquiries.map((e) => e.pipelineStageId).filter(Boolean) as string[])
    );
    const stages = stageIds.length > 0
      ? await db.pipelineStage.findMany({
          where: { id: { in: stageIds } },
          include: { pipeline: { select: { id: true, name: true, code: true } } },
        })
      : [];
    const stageMap = new Map(stages.map((s) => [s.id, s]));

    const enrichedEnquiries = enquiries.map((e) => ({
      ...e,
      stage: e.pipelineStageId ? stageMap.get(e.pipelineStageId) || null : null,
    }));

    return NextResponse.json({
      enquiries: enrichedEnquiries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;

    console.error('Fetch enquiries error:', error);
    return NextResponse.json({ error: 'Failed to fetch enquiries.' }, { status: 500 });
  }
}
