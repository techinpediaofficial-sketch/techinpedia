import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const companyId = searchParams.get('companyId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (search.trim() !== '') {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { jobTitle: { contains: search } },
      ];
    }

    const [total, contacts] = await Promise.all([
      db.contact.count({ where }),
      db.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: { select: { id: true, name: true } },
          customers: { select: { id: true, name: true } },
          deals: { select: { id: true, title: true, value: true }, take: 3 },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      contacts,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { firstName, lastName, email, phone, jobTitle, department, isPrimary, companyId, notes } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required for contact.' }, { status: 400 });
    }

    const fullName = `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim() || email.split('@')[0];

    const contact = await db.contact.create({
      data: {
        name: fullName,
        firstName: firstName ? firstName.trim() : null,
        lastName: lastName ? lastName.trim() : null,
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        jobTitle: jobTitle ? jobTitle.trim() : null,
        department: department ? department.trim() : null,
        isPrimary: isPrimary || false,
        companyId: companyId || null,
        notes: notes ? notes.trim() : null,
      },
      include: {
        company: true,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_CONTACT',
      entityType: 'Contact',
      entityId: contact.id,
      metadata: { name: contact.name, email: contact.email },
    });

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json({ error: 'Failed to create contact.' }, { status: 500 });
  }
}
