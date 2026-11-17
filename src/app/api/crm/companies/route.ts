import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'ALL'; // ALL, TENANTS, CRM
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter === 'TENANTS') {
      where.isTenant = true;
    } else if (filter === 'CRM') {
      where.isTenant = false;
    }

    if (search.trim() !== '') {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { website: { contains: search } },
        { industry: { contains: search } },
        { planName: { contains: search } },
      ];
    }

    const [total, companies] = await Promise.all([
      db.company.count({ where }),
      db.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contacts: { select: { id: true, name: true, email: true, phone: true } },
          customers: { select: { id: true, name: true, status: true } },
          deals: { select: { id: true, title: true, value: true } },
          whatsappConnections: {
            where: { isActive: true },
            select: { id: true, businessPhoneNumber: true, displayName: true, status: true, qualityRating: true },
          },
          _count: {
            select: {
              contacts: true,
              deals: true,
              customers: true,
              users: true,
              whatsappConversations: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      companies,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Fetch companies error:', error);
    return NextResponse.json({ error: 'Failed to fetch companies.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
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
      // SaaS Multi-Tenancy fields
      isTenant = false,
      tenantStatus = 'ACTIVE',
      planName = 'WhatsApp SaaS',
      monthlyMessageLimit = 10000,
      maxEmployees = 5,
      allowedModules = ['whatsapp'],
      adminEmail,
      adminPassword,
      adminName,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Company name is required.' }, { status: 400 });
    }

    // Check if tenant admin email already in use
    if (isTenant && adminEmail) {
      const cleanEmail = adminEmail.trim().toLowerCase();
      const existingUser = await db.user.findUnique({
        where: { email: cleanEmail },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: `A user with email "${cleanEmail}" already exists on the platform.` },
          { status: 400 }
        );
      }
    }

    const webhookSecret = isTenant ? `wh_${crypto.randomBytes(16).toString('hex')}` : null;
    const modulesJson = Array.isArray(allowedModules)
      ? JSON.stringify(allowedModules)
      : typeof allowedModules === 'string'
      ? allowedModules
      : JSON.stringify(['whatsapp']);

    const company = await db.company.create({
      data: {
        name: name.trim(),
        website: website ? website.trim() : null,
        phone: phone ? phone.trim() : null,
        email: email ? email.trim().toLowerCase() : null,
        industry: industry ? industry.trim() : null,
        domain: domain ? domain.trim() : null,
        address: address ? address.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        country: country ? country.trim() : 'India',
        postalCode: postalCode ? postalCode.trim() : null,
        gstNumber: gstNumber ? gstNumber.trim() : null,
        notes: notes ? notes.trim() : null,
        // SaaS Multi-Tenancy
        isTenant: Boolean(isTenant),
        tenantStatus: tenantStatus || 'ACTIVE',
        planName: planName || 'WhatsApp SaaS',
        monthlyMessageLimit: parseInt(String(monthlyMessageLimit)) || 10000,
        maxEmployees: parseInt(String(maxEmployees)) || 5,
        allowedModules: modulesJson,
        webhookSecret,
      },
    });

    // Automatically provision initial tenant Owner/Admin User
    let provisionedUser = null;
    if (isTenant && adminEmail && adminPassword) {
      const cleanEmail = adminEmail.trim().toLowerCase();
      const hashedPassword = await hashPassword(adminPassword);

      provisionedUser = await db.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          name: adminName ? adminName.trim() : name.trim(),
          role: 'ADMIN',
          companyId: company.id,
          companyRole: 'OWNER',
          status: 'ACTIVE',
          mustChangePassword: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          companyRole: true,
        },
      });
    }

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: isTenant ? 'CREATE_TENANT_COMPANY' : 'CREATE_COMPANY',
      entityType: 'Company',
      entityId: company.id,
      metadata: { name: company.name, isTenant, planName, adminEmail },
    });

    return NextResponse.json({
      success: true,
      company,
      adminUser: provisionedUser,
      webhookUrl: isTenant
        ? `https://admin.techinpedia.com/api/whatsapp/webhook?companyId=${company.id}`
        : null,
    });
  } catch (error: any) {
    console.error('Create company error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create company.' }, { status: 500 });
  }
}
