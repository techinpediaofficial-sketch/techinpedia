import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// ── GET /api/proposals ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search   = searchParams.get('search')   || '';
    const status   = searchParams.get('status')   || '';
    const type     = searchParams.get('type')     || '';
    const page     = parseInt(searchParams.get('page')  || '1');
    const limit    = parseInt(searchParams.get('limit') || '50');
    const skip     = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { clientName:    { contains: search } },
        { proposalNumber:{ contains: search } },
        { title:         { contains: search } },
        { clientEmail:   { contains: search } },
        { projectName:   { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (type)   where.proposalType = type;

    const [proposals, total] = await Promise.all([
      db.proposal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          additionalChargeItems: true,
        },
      }),
      db.proposal.count({ where }),
    ]);

    return NextResponse.json({ proposals, total, page, limit });
  } catch (err) {
    console.error('[proposals GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── POST /api/proposals ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Auto-generate proposal number: TIP-PROP-2026-0001
    const year  = new Date().getFullYear();
    const count = await db.proposal.count();
    const proposalNumber = `TIP-PROP-${year}-${String(count + 1).padStart(4, '0')}`;

    const { items = [], additionalChargeItems = [], ...data } = body;

    const proposal = await db.proposal.create({
      data: {
        ...data,
        proposalNumber,
        proposalDate: data.proposalDate ? new Date(data.proposalDate) : new Date(),
        validUntil:   data.validUntil   ? new Date(data.validUntil)   : null,
        startDate:    data.startDate    ? new Date(data.startDate)     : null,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate)  : null,
        items: {
          create: items.map((item: any, idx: number) => ({
            sortOrder:   idx,
            serviceName: item.serviceName || '',
            description: item.description || '',
            quantity:    parseFloat(item.quantity)   || 1,
            rate:        parseFloat(item.rate)        || 0,
            discount:    parseFloat(item.discount)    || 0,
            taxPercent:  parseFloat(item.taxPercent)  || 18,
            amount:      parseFloat(item.amount)      || 0,
          })),
        },
        additionalChargeItems: {
          create: additionalChargeItems.map((c: any) => ({
            label:  c.label  || '',
            amount: parseFloat(c.amount) || 0,
          })),
        },
      },
      include: {
        items: true,
        additionalChargeItems: true,
      },
    });

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (err) {
    console.error('[proposals POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
