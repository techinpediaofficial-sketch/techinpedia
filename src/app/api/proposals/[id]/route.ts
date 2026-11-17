import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/proposals/[id] ────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const proposal = await db.proposal.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        additionalChargeItems: true,
      },
    });
    if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Mark as viewed if status is SENT
    if (proposal.status === 'SENT' && !proposal.viewedAt) {
      await db.proposal.update({
        where: { id },
        data: { status: 'VIEWED', viewedAt: new Date() },
      });
    }

    return NextResponse.json({ proposal });
  } catch (err) {
    console.error('[proposals/[id] GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── PATCH /api/proposals/[id] ──────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body   = await req.json();
    const { items, additionalChargeItems, ...data } = body;

    const updateData: any = { ...data };
    if (data.proposalDate) updateData.proposalDate = new Date(data.proposalDate);
    if (data.validUntil)   updateData.validUntil   = new Date(data.validUntil);
    if (data.startDate)    updateData.startDate    = new Date(data.startDate);
    if (data.deliveryDate) updateData.deliveryDate = new Date(data.deliveryDate);

    // Handle status timestamps
    if (data.status === 'SENT')     updateData.sentAt     = new Date();
    if (data.status === 'ACCEPTED') updateData.acceptedAt = new Date();
    if (data.status === 'REJECTED') updateData.rejectedAt = new Date();

    // Update items if provided
    if (Array.isArray(items)) {
      await db.proposalItem.deleteMany({ where: { proposalId: id } });
      updateData.items = {
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
      };
    }

    if (Array.isArray(additionalChargeItems)) {
      await db.proposalAdditionalCharge.deleteMany({ where: { proposalId: id } });
      updateData.additionalChargeItems = {
        create: additionalChargeItems.map((c: any) => ({
          label:  c.label  || '',
          amount: parseFloat(c.amount) || 0,
        })),
      };
    }

    const proposal = await db.proposal.update({
      where: { id },
      data: updateData,
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        additionalChargeItems: true,
      },
    });

    return NextResponse.json({ proposal });
  } catch (err) {
    console.error('[proposals/[id] PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── DELETE /api/proposals/[id] ─────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await db.proposal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[proposals/[id] DELETE]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
