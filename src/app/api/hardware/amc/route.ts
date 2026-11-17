import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search.trim()) {
      where.OR = [
        { amcNumber: { contains: search } },
        { contractTitle: { contains: search } },
        { engineerName: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { company: { name: { contains: search } } } },
      ];
    }

    const contracts = await db.aMCContract.findMany({
      where,
      orderBy: { renewalDate: 'asc' },
      include: {
        customer: { select: { id: true, name: true, company: { select: { name: true } }, email: true, phone: true } },
      },
    });

    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const activeContracts = contracts.filter(c => c.status === 'ACTIVE');
    const totalValue = activeContracts.reduce((acc, c) => acc + c.contractValue, 0);
    const expiringSoon = activeContracts.filter(c => new Date(c.renewalDate) <= thirtyDaysAhead && new Date(c.renewalDate) >= now).length;

    return NextResponse.json({
      success: true,
      contracts,
      metrics: {
        total: contracts.length,
        active: activeContracts.length,
        totalValue,
        expiringSoon,
      },
    });
  } catch (error) {
    console.error('Fetch AMC contracts error:', error);
    return NextResponse.json({ error: 'Failed to fetch AMC contracts.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const {
      customerId,
      contractTitle,
      coveredDevices = 1,
      startDate,
      endDate,
      visitFrequency = 'MONTHLY',
      replacementSLA = '24_HOURS',
      contractValue,
      engineerName,
      notes,
    } = body;

    if (!customerId || !contractTitle || !startDate || !endDate || contractValue === undefined) {
      return NextResponse.json({ error: 'Customer, title, dates, and contract value are required.' }, { status: 400 });
    }

    const count = await db.aMCContract.count();
    const amcNumber = `AMC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const renewalDate = new Date(endDate);

    const contract = await db.aMCContract.create({
      data: {
        amcNumber,
        customerId,
        contractTitle,
        coveredDevices: parseInt(coveredDevices) || 1,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        renewalDate,
        visitFrequency,
        replacementSLA,
        contractValue: parseFloat(contractValue) || 0,
        engineerName,
        notes,
        status: 'ACTIVE',
      },
      include: { customer: true },
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'AMC_CONTRACT',
      entityId: contract.id,
      details: `Created AMC contract ${contract.amcNumber} for ${contract.contractTitle} (₹${contract.contractValue})`,
    });

    return NextResponse.json({ success: true, contract });
  } catch (error) {
    console.error('Create AMC contract error:', error);
    return NextResponse.json({ error: 'Failed to create AMC contract.' }, { status: 500 });
  }
}
