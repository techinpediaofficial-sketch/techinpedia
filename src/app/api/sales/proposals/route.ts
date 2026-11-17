import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// Legacy route — new proposals are managed via /api/proposals
export async function GET() {
  try {
    await requireAuth();
    const proposals = await db.proposal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        deal: { select: { id: true, title: true } },
        items: true,
      },
    });
    return NextResponse.json({ success: true, proposals });
  } catch (error) {
    console.error('Fetch proposals error:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const { title, clientName, clientEmail, dealId } = body;

    if (!title || !clientName || !clientEmail) {
      return NextResponse.json({ error: 'Title, client name and email are required.' }, { status: 400 });
    }

    const year  = new Date().getFullYear();
    const count = await db.proposal.count();
    const proposalNumber = `TIP-PROP-${year}-${String(count + 1).padStart(4, '0')}`;

    const proposal = await db.proposal.create({
      data: {
        proposalNumber,
        dealId: dealId || null,
        title: title.trim(),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim().toLowerCase(),
        status: 'DRAFT',
      },
    });

    return NextResponse.json({ success: true, proposal }, { status: 201 });
  } catch (error) {
    console.error('Create proposal error:', error);
    return NextResponse.json({ error: 'Failed to create proposal.' }, { status: 500 });
  }
}
