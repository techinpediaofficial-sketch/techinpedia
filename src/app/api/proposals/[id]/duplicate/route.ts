import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const original = await db.proposal.findUnique({
      where: { id },
      include: { items: true, additionalChargeItems: true },
    });
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // New version number
    const maxVersion = await db.proposal.aggregate({
      where: { OR: [{ id }, { parentId: id }] },
      _max: { version: true },
    });
    const nextVersion = (maxVersion._max.version || 1) + 1;

    // New proposal number
    const year  = new Date().getFullYear();
    const count = await db.proposal.count();
    const proposalNumber = `TIP-PROP-${year}-${String(count + 1).padStart(4, '0')}`;

    const {
      id: _id,
      proposalNumber: _num,
      createdAt: _ca,
      updatedAt: _ua,
      items,
      additionalChargeItems,
      ...rest
    } = original;

    const duplicate = await db.proposal.create({
      data: {
        ...rest,
        proposalNumber,
        version:    nextVersion,
        parentId:   id,
        status:     'DRAFT',
        sentAt:     null,
        viewedAt:   null,
        acceptedAt: null,
        rejectedAt: null,
        title: `${original.title} (V${nextVersion})`,
        items: {
          create: items.map((item, idx) => ({
            sortOrder:   idx,
            serviceName: item.serviceName,
            description: item.description || '',
            quantity:    item.quantity,
            rate:        item.rate,
            discount:    item.discount,
            taxPercent:  item.taxPercent,
            amount:      item.amount,
          })),
        },
        additionalChargeItems: {
          create: additionalChargeItems.map(c => ({
            label:  c.label,
            amount: c.amount,
          })),
        },
      },
      include: { items: true, additionalChargeItems: true },
    });

    return NextResponse.json({ proposal: duplicate }, { status: 201 });
  } catch (err) {
    console.error('[duplicate]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
