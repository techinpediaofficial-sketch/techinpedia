import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// 1. GET: Fetch Logged-in Company Profile
export async function GET() {
  try {
    const session = await requireAuth();

    if (!session.companyId && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No company account associated with this session' }, { status: 400 });
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID missing' }, { status: 400 });
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            users: true,
            contacts: true,
            deals: true,
            whatsappConversations: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company record not found' }, { status: 404 });
    }

    let allowedModules: string[] = ['whatsapp'];
    if (company.allowedModules) {
      try {
        const parsed = JSON.parse(company.allowedModules);
        if (Array.isArray(parsed)) allowedModules = parsed;
      } catch {}
    }

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
        allowedModules,
        createdAt: company.createdAt,
        stats: {
          totalUsers: company._count.users,
          totalContacts: company._count.contacts,
          totalDeals: company._count.deals,
          totalConversations: company._count.whatsappConversations,
        },
      },
    });
  } catch (error: any) {
    console.error('Company profile GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch company profile' }, { status: 500 });
  }
}

// 2. PUT: Update Company Profile (Self-Service)
export async function PUT(request: Request) {
  try {
    const session = await requireAuth();

    if (!session.companyId && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No company account associated with this session' }, { status: 400 });
    }

    const companyId = session.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID missing' }, { status: 400 });
    }

    const isCompanyAdmin =
      session.role === 'SUPER_ADMIN' ||
      session.companyRole === 'OWNER' ||
      session.companyRole === 'ADMIN' ||
      session.role === 'ADMIN';

    if (!isCompanyAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only Company Administrators or Owners can update company profile.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      website,
      domain,
      industry,
      address,
      city,
      state,
      country,
      postalCode,
      gstNumber,
      notes,
    } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });
    }

    const updated = await db.company.update({
      where: { id: companyId },
      data: {
        name: name.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        website: website ? website.trim() : null,
        domain: domain ? domain.trim() : null,
        industry: industry || 'Information Technology',
        address: address ? address.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        country: country ? country.trim() : 'India',
        postalCode: postalCode ? postalCode.trim() : null,
        gstNumber: gstNumber ? gstNumber.trim() : null,
        notes: notes ? notes.trim() : null,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_COMPANY_PROFILE',
      entityType: 'Company',
      entityId: companyId,
      metadata: { companyName: updated.name, updatedFields: Object.keys(body) },
    });

    return NextResponse.json({
      success: true,
      message: 'Company profile updated successfully.',
      company: updated,
    });
  } catch (error: any) {
    console.error('Company profile PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update company profile' }, { status: 500 });
  }
}
