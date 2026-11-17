import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search.trim() !== '') {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { company: { name: { contains: search } } },
      ];
    }

    const [total, customers] = await Promise.all([
      db.customer.count({ where }),
      db.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          _count: {
            select: {
              deals: true,
              invoices: true,
              rentalOrders: true,
              amcContracts: true,
              subscriptions: true,
              projects: true,
              tickets: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      customers,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Fetch customers error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { name, email, phone, companyId, contactId, status, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Customer email is required.' }, { status: 400 });
    }

    const customer = await db.customer.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        companyId: companyId || null,
        contactId: contactId || null,
        status: status || 'ACTIVE',
        accountManagerId: session.userId,
        notes: notes ? notes.trim() : null,
      },
      include: {
        company: true,
        contact: true,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_CUSTOMER',
      entityType: 'Customer',
      entityId: customer.id,
      metadata: { name: customer.name, email: customer.email },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: 'Failed to create customer.' }, { status: 500 });
  }
}
