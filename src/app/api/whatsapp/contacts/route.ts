import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { normalizePhoneNumber } from '@/lib/whatsapp-eligibility';
import { emitWorkflowEvent } from '@/lib/workflow/eventEmitter';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    // Multi-tenant isolation: Tenant users can only view their own company's contacts
    const isTenant = session.isTenant;
    const requestedCompanyId = searchParams.get('companyId');
    const companyId = isTenant && session.companyId ? session.companyId : requestedCompanyId || undefined;

    const search = searchParams.get('search')?.trim() || '';
    const leadStatus = searchParams.get('leadStatus');
    const assignedUserId = searchParams.get('assignedUserId');
    const optInStatus = searchParams.get('optInStatus');
    const isBlacklisted = searchParams.get('isBlacklisted');
    const source = searchParams.get('source');
    const tag = searchParams.get('tag')?.trim();

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (companyId && companyId !== 'master') {
      where.companyId = companyId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { jobTitle: { contains: search } },
      ];
    }

    if (leadStatus) where.leadStatus = leadStatus;
    if (assignedUserId) where.assignedUserId = assignedUserId;
    if (optInStatus) where.optInStatus = optInStatus;
    if (isBlacklisted !== null && isBlacklisted !== undefined && isBlacklisted !== '') {
      where.isBlacklisted = isBlacklisted === 'true';
    }
    if (source) where.source = source;
    if (tag) {
      where.tags = { contains: tag };
    }

    const [total, contacts] = await Promise.all([
      db.contact.count({ where }),
      db.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          company: { select: { id: true, name: true } },
          customers: { select: { id: true, name: true, lifetimeValue: true } },
          deals: { select: { id: true, title: true, value: true }, take: 2 },
        },
      }),
    ]);

    // Fetch live conversation count and last message timestamp for these contacts
    const phones = contacts.map((c) => c.phone).filter(Boolean) as string[];
    const conversations = phones.length > 0
      ? await db.whatsappConversation.findMany({
          where: {
            OR: phones.map((p) => ({ waNumber: { contains: p.slice(-10) } })),
            ...(companyId && companyId !== 'master' ? { companyId } : {}),
          },
          select: {
            waNumber: true,
            status: true,
            unreadCount: true,
            lastMessageAt: true,
            lastMessageText: true,
          },
        })
      : [];

    const convMap = new Map<string, any>();
    for (const conv of conversations) {
      const last10 = conv.waNumber.replace(/[^0-9]/g, '').slice(-10);
      convMap.set(last10, conv);
    }

    const enriched = contacts.map((c) => {
      const last10 = (c.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const conv = convMap.get(last10);
      return {
        ...c,
        conversation: conv || null,
      };
    });

    return NextResponse.json({
      success: true,
      contacts: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch whatsapp contacts error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch contacts.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      department,
      leadStatus,
      assignedUserId,
      source = 'WHATSAPP',
      tags = [],
      customFields = {},
      optInStatus = 'OPTED_IN',
      marketingOptIn = true,
      consentSource = 'MANUAL_ENTRY',
      notes,
    } = body;

    const isTenant = session.isTenant;
    const companyId = isTenant && session.companyId ? session.companyId : body.companyId || null;

    if (!name && !firstName && !phone && !email) {
      return NextResponse.json(
        { error: 'At least Name, Phone, or Email is required to create a contact.' },
        { status: 400 }
      );
    }

    const canonicalPhone = phone ? normalizePhoneNumber(phone) : null;
    const resolvedName = (name || `${firstName || ''} ${lastName || ''}`).trim() || canonicalPhone || email;

    // Check duplicate phone in same tenant
    if (canonicalPhone) {
      const existing = await db.contact.findFirst({
        where: {
          phone: canonicalPhone,
          companyId,
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Contact with phone ${canonicalPhone} already exists for this company.` },
          { status: 409 }
        );
      }
    }

    const contact = await db.contact.create({
      data: {
        name: resolvedName,
        firstName: firstName || null,
        lastName: lastName || null,
        email: email ? email.trim().toLowerCase() : `${canonicalPhone || Date.now()}@placeholder.techinpedia.com`,
        phone: canonicalPhone,
        jobTitle: jobTitle || null,
        department: department || null,
        companyId,
        assignedUserId: assignedUserId || null,
        leadStatus: leadStatus || 'NEW',
        source: source || 'MANUAL',
        tags: Array.isArray(tags) ? JSON.stringify(tags) : tags || null,
        customFields: typeof customFields === 'object' ? JSON.stringify(customFields) : customFields || null,
        optInStatus: optInStatus || 'OPTED_IN',
        marketingOptIn: marketingOptIn ?? true,
        consentSource: consentSource || 'MANUAL_ENTRY',
        consentTimestamp: new Date(),
        notes: notes || null,
        lastInteractionAt: new Date(),
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_WHATSAPP_CONTACT',
      entityType: 'Contact',
      entityId: contact.id,
      metadata: { name: contact.name, phone: contact.phone, companyId },
    });

    // Fire workflow trigger contact.created
    emitWorkflowEvent('contact.created', {
      entityType: 'Contact',
      entityId: contact.id,
      data: {
        contact,
        action: 'CREATED',
        actor: { id: session.userId, email: session.email, role: session.role },
      },
      metadata: {
        actorId: session.userId,
        actorEmail: session.email,
      },
    }).catch((err) => console.error('Workflow trigger contact.created error:', err));

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    console.error('Create contact error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create contact.' }, { status: 500 });
  }
}
