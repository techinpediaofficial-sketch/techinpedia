import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const contracts = await db.contract.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        deal: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, contracts });
  } catch (error) {
    console.error('Fetch contracts error:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { clientName, companyName, contractType, startDate, endDate, renewalDate, totalValue, terms, dealId } = body;

    if (!clientName || !startDate) {
      return NextResponse.json({ error: 'Client name and start date are required.' }, { status: 400 });
    }

    const contractNumber = `CNT-${Date.now().toString().slice(-6)}`;

    const contract = await db.contract.create({
      data: {
        contractNumber,
        dealId: dealId || null,
        clientName: clientName.trim(),
        companyName: companyName ? companyName.trim() : null,
        contractType: contractType || 'SOFTWARE_DEV',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        totalValue: totalValue ? parseFloat(totalValue) : 0,
        terms: terms || null,
        status: 'ACTIVE',
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_CONTRACT',
      entityType: 'Contract',
      entityId: contract.id,
      metadata: { contractNumber, clientName, totalValue },
    });

    return NextResponse.json({ success: true, contract });
  } catch (error: any) {
    console.error('Create contract error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create contract.' }, { status: 500 });
  }
}
