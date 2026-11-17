import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');
    const stageId = searchParams.get('stageId');
    const customerId = searchParams.get('customerId');
    const companyId = searchParams.get('companyId');
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (pipelineId) where.pipelineId = pipelineId;
    if (stageId) where.stageId = stageId;
    if (customerId) where.customerId = customerId;
    if (companyId) where.companyId = companyId;
    if (search.trim() !== '') {
      where.OR = [
        { title: { contains: search } },
        { company: { name: { contains: search } } },
        { customer: { name: { contains: search } } },
      ];
    }

    const deals = await db.deal.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        stage: { select: { id: true, name: true, color: true, isWon: true, isLost: true, probability: true } },
        pipeline: { select: { id: true, name: true, code: true } },
        customer: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true, phone: true } },
        _count: { select: { quotations: true, proposals: true, followUps: true } },
      },
    });

    // Compute pipeline totals
    const totalPipelineValue = deals.reduce((acc, d) => acc + d.value, 0);
    const weightedPipelineValue = deals.reduce((acc, d) => acc + (d.value * (d.probability / 100)), 0);

    return NextResponse.json({
      success: true,
      deals,
      metrics: {
        count: deals.length,
        totalPipelineValue,
        weightedPipelineValue,
      },
    });
  } catch (error) {
    console.error('Fetch deals error:', error);
    return NextResponse.json({ error: 'Failed to fetch deals.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const {
      title,
      pipelineId,
      stageId,
      value,
      probability,
      expectedCloseDate,
      companyId,
      customerId,
      contactId,
      source,
      notes,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Deal title is required.' }, { status: 400 });
    }
    if (!pipelineId || !stageId) {
      return NextResponse.json({ error: 'Pipeline and stage are required.' }, { status: 400 });
    }

    const stage = await db.pipelineStage.findUnique({ where: { id: stageId } });

    const deal = await db.deal.create({
      data: {
        title: title.trim(),
        pipelineId,
        stageId,
        value: value ? parseFloat(value) : 0,
        probability: probability !== undefined ? parseInt(probability) : (stage?.probability ?? 50),
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        companyId: companyId || null,
        customerId: customerId || null,
        contactId: contactId || null,
        assignedToId: session.userId,
        source: source || null,
        notes: notes ? notes.trim() : null,
        wonDate: stage?.isWon ? new Date() : null,
        lostDate: stage?.isLost ? new Date() : null,
      },
      include: {
        stage: true,
        pipeline: true,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_DEAL',
      entityType: 'Deal',
      entityId: deal.id,
      metadata: { title: deal.title, value: deal.value, stage: stage?.name },
    });

    return NextResponse.json({ success: true, deal });
  } catch (error) {
    console.error('Create deal error:', error);
    return NextResponse.json({ error: 'Failed to create deal.' }, { status: 500 });
  }
}
