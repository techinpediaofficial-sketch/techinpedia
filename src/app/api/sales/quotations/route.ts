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

    const where: any = {};
    if (status) where.status = status;
    if (search.trim()) {
      where.OR = [
        { quotationNumber: { contains: search } },
        { clientName: { contains: search } },
        { clientEmail: { contains: search } },
        { companyName: { contains: search } },
      ];
    }

    const quotations = await db.quotation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        deal: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, quotations });
  } catch (error) {
    console.error('Fetch quotations error:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const {
      clientName,
      clientEmail,
      clientPhone,
      companyName,
      dealId,
      customerId,
      items,
      taxRate = 18,
      discountAmount = 0,
      terms,
      notes,
      validUntil,
    } = body;

    if (!clientName || !clientEmail) {
      return NextResponse.json({ error: 'Client name and email are required.' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item line is required.' }, { status: 400 });
    }

    // Compute totals
    let subtotal = 0;
    const preparedItems = items.map((item: any) => {
      const quantity = parseFloat(item.quantity) || 1;
      const rate = parseFloat(item.rate) || 0;
      const amount = quantity * rate;
      subtotal += amount;
      return {
        description: item.description || 'Service/Item',
        quantity,
        rate,
        amount,
      };
    });

    const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
    const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);
    const quotationNumber = `QT-${Date.now().toString().slice(-6)}`;

    const quotation = await db.quotation.create({
      data: {
        quotationNumber,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim().toLowerCase(),
        clientPhone: clientPhone || null,
        companyName: companyName || null,
        dealId: dealId || null,
        customerId: customerId || null,
        subtotal,
        taxRate,
        taxAmount,
        discountAmount,
        totalAmount,
        terms: terms || 'Payment: 50% advance, 50% on delivery. Valid for 15 days.',
        notes: notes || null,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 15 * 86400000),
        status: 'SENT',
        items: {
          create: preparedItems,
        },
      },
      include: {
        items: true,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_QUOTATION',
      entityType: 'Quotation',
      entityId: quotation.id,
      metadata: { quotationNumber, totalAmount, clientEmail },
    });

    return NextResponse.json({ success: true, quotation });
  } catch (error: any) {
    console.error('Create quotation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate quotation.' }, { status: 500 });
  }
}
