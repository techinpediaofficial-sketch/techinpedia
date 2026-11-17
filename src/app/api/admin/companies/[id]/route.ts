import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { hasPermission } from '@/lib/permissions';

interface Params {
  params: Promise<{ id: string }>;
}

// 1. GET: Comprehensive Company 360 Profile & Multi-Tenant Telemetry
export async function GET(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Access control:
    // Super Admin can view any company.
    // Tenant users can only view their own company.
    if (session.isTenant && session.companyId !== id) {
      return NextResponse.json({ error: 'Forbidden: Access limited to your company.' }, { status: 403 });
    }

    const company = await db.company.findUnique({
      where: { id },
      include: {
        whatsappConnections: {
          where: { isActive: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            companyRole: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            contacts: true,
            deals: true,
            customers: true,
            users: true,
            whatsappConversations: true,
            whatsappTemplates: true,
            whatsappCampaigns: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Telemetry calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [messagesToday, messagesThisMonth, recentMessages, openConversations] = await Promise.all([
      db.whatsappMessage.count({
        where: {
          conversation: { companyId: id },
          createdAt: { gte: today },
        },
      }),
      db.whatsappMessage.count({
        where: {
          conversation: { companyId: id },
          direction: 'OUTBOUND',
          status: { in: ['SENT', 'DELIVERED', 'READ'] },
          createdAt: { gte: firstDayOfMonth },
        },
      }),
      db.whatsappMessage.findMany({
        where: { conversation: { companyId: id } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          conversation: {
            select: { waNumber: true, customerName: true },
          },
        },
      }),
      db.whatsappConversation.count({
        where: { companyId: id, status: 'OPEN' },
      }),
    ]);

    const activeConn = company.whatsappConnections[0] || null;

    let parsedModules: string[] = ['whatsapp'];
    if (company.allowedModules) {
      try {
        parsedModules = JSON.parse(company.allowedModules);
      } catch (e) {
        // default
      }
    }

    const webhookUrl = `https://admin.techinpedia.com/api/whatsapp/webhook?companyId=${company.id}`;

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        website: company.website,
        domain: company.domain,
        industry: company.industry,
        address: company.address,
        city: company.city,
        state: company.state,
        country: company.country,
        postalCode: company.postalCode,
        gstNumber: company.gstNumber,
        notes: company.notes,
        isTenant: company.isTenant,
        tenantStatus: company.tenantStatus,
        planName: company.planName,
        monthlyMessageLimit: company.monthlyMessageLimit,
        maxEmployees: company.maxEmployees,
        allowedModules: parsedModules,
        webhookSecret: company.webhookSecret,
        webhookUrl,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
      connection: activeConn
        ? {
            id: activeConn.id,
            wabaId: activeConn.wabaId,
            phoneNumberId: activeConn.phoneNumberId,
            businessPhoneNumber: activeConn.businessPhoneNumber,
            displayName: activeConn.displayName,
            qualityRating: activeConn.qualityRating,
            status: activeConn.status,
            connectionHealth: activeConn.connectionHealth,
            apiVersion: activeConn.apiVersion,
            verifyToken: activeConn.verifyToken,
            lastSuccessfulApiCall: activeConn.lastSuccessfulApiCall,
            lastWebhookReceivedAt: activeConn.lastWebhookReceivedAt,
          }
        : null,
      employees: company.users,
      telemetry: {
        messagesToday,
        messagesThisMonth,
        monthlyLimit: company.monthlyMessageLimit,
        quotaUsedPercent: Math.min(100, Math.round((messagesThisMonth / (company.monthlyMessageLimit || 10000)) * 100)),
        totalConversations: company._count.whatsappConversations,
        openConversations,
        totalTemplates: company._count.whatsappTemplates,
        totalCampaigns: company._count.whatsappCampaigns,
        totalEmployees: company._count.users,
        maxEmployees: company.maxEmployees,
      },
      crmStats: {
        contactsCount: company._count.contacts,
        dealsCount: company._count.deals,
        customersCount: company._count.customers,
      },
      recentMessages,
    });
  } catch (error: any) {
    console.error('Company 360 GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch company 360 profile.' }, { status: 500 });
  }
}

// 2. PATCH: Update Company Profile, SaaS Status, Plan & Allowed Module Entitlements
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Super Admin or Tenant Owner
    const isSuperAdmin = session.role === 'SUPER_ADMIN';
    const isTenantOwner = session.companyId === id && (session.companyRole === 'OWNER' || session.role === 'ADMIN');

    if (!isSuperAdmin && !isTenantOwner) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      website,
      phone,
      email,
      industry,
      domain,
      address,
      city,
      state,
      country,
      postalCode,
      gstNumber,
      notes,
      // SaaS Entitlements (Super Admin only can edit plan / status / limits)
      isTenant,
      tenantStatus,
      planName,
      monthlyMessageLimit,
      maxEmployees,
      allowedModules,
    } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name ? name.trim() : undefined;
    if (website !== undefined) updateData.website = website ? website.trim() : null;
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (email !== undefined) updateData.email = email ? email.trim().toLowerCase() : null;
    if (industry !== undefined) updateData.industry = industry ? industry.trim() : null;
    if (domain !== undefined) updateData.domain = domain ? domain.trim() : null;
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (city !== undefined) updateData.city = city ? city.trim() : null;
    if (state !== undefined) updateData.state = state ? state.trim() : null;
    if (country !== undefined) updateData.country = country ? country.trim() : 'India';
    if (postalCode !== undefined) updateData.postalCode = postalCode ? postalCode.trim() : null;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber ? gstNumber.trim() : null;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    // Super Admin can change multi-tenant SaaS entitlements & limits
    if (isSuperAdmin) {
      if (isTenant !== undefined) updateData.isTenant = Boolean(isTenant);
      if (tenantStatus !== undefined) updateData.tenantStatus = tenantStatus;
      if (planName !== undefined) updateData.planName = planName;
      if (monthlyMessageLimit !== undefined) updateData.monthlyMessageLimit = parseInt(String(monthlyMessageLimit)) || 10000;
      if (maxEmployees !== undefined) updateData.maxEmployees = parseInt(String(maxEmployees)) || 5;
      if (allowedModules !== undefined) {
        updateData.allowedModules = Array.isArray(allowedModules)
          ? JSON.stringify(allowedModules)
          : String(allowedModules);
      }
    }

    const updatedCompany = await db.company.update({
      where: { id },
      data: updateData,
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_COMPANY_360',
      entityType: 'Company',
      entityId: id,
      metadata: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Company profile updated successfully.',
      company: updatedCompany,
    });
  } catch (error: any) {
    console.error('Company 360 PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update company.' }, { status: 500 });
  }
}

// 3. DELETE: Safely delete company, cascade WhatsApp assets, and unlink CRM records
export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const isSuperAdmin = session.role === 'SUPER_ADMIN';
    const hasPerm = hasPermission(session as any, 'crm.companies.manage');
    if (!isSuperAdmin && !hasPerm) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges to delete companies.' }, { status: 403 });
    }

    const company = await db.company.findUnique({
      where: { id },
      select: { id: true, name: true, isTenant: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    // Safely clean up associated records
    try {
      await db.whatsappWebhookEvent.deleteMany({ where: { companyId: id } });
      await db.whatsappSuppression.deleteMany({ where: { companyId: id } });
      await db.whatsappMessage.deleteMany({ where: { conversation: { companyId: id } } });
      await db.whatsappConversation.deleteMany({ where: { companyId: id } });
      await db.whatsappTemplate.deleteMany({ where: { companyId: id } });
      await db.whatsappCampaign.deleteMany({ where: { companyId: id } });
      await db.whatsappConnection.deleteMany({ where: { companyId: id } });
    } catch (cleanupErr) {
      console.warn('WhatsApp cascade cleanup warning:', cleanupErr);
    }

    // If tenant, delete tenant employee sub-accounts
    if (company.isTenant) {
      await db.user.deleteMany({ where: { companyId: id } });
    } else {
      await db.user.updateMany({ where: { companyId: id }, data: { companyId: null } });
    }

    // Unlink CRM records cleanly
    await db.contact.updateMany({ where: { companyId: id }, data: { companyId: null } });
    await db.deal.updateMany({ where: { companyId: id }, data: { companyId: null } });
    await db.customer.updateMany({ where: { companyId: id }, data: { companyId: null } });

    // Delete company
    await db.company.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_COMPANY',
      entityType: 'Company',
      entityId: id,
      metadata: { companyName: company.name, isTenant: company.isTenant },
    });

    return NextResponse.json({
      success: true,
      message: `Company "${company.name}" and its associated assets were deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Company DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete company.' }, { status: 500 });
  }
}
