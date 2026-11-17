import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    if (session.role !== 'SUPER_ADMIN') {
      where.businessUnitId = { in: session.businessUnitIds || [] };
    }
    if (search.trim()) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { clientName: { contains: search } },
        { clientEmail: { contains: search } },
        { companyName: { contains: search } },
      ];
    }

    const invoices = await db.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        customer: { select: { id: true, name: true } },
        payments: { select: { id: true, amount: true, paymentDate: true, paymentMethod: true } },
      },
    });

    const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
    const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balanceDue, 0);

    return NextResponse.json({
      success: true,
      invoices,
      metrics: {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
      },
    });
  } catch (error) {
    console.error('Fetch invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const {
      clientName,
      clientEmail,
      companyName,
      customerId,
      dueDate,
      items,
      taxRate = 18,
      discount = 0,
      notes,
    } = body;

    if (!clientName || !clientEmail || !dueDate) {
      return NextResponse.json({ error: 'Client name, email, and due date are required.' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one invoice line item is required.' }, { status: 400 });
    }

    let subtotal = 0;
    const preparedItems = items.map((item: any) => {
      const quantity = parseFloat(item.quantity) || 1;
      const unitPrice = parseFloat(item.unitPrice || item.rate) || 0;
      const amount = quantity * unitPrice;
      subtotal += amount;
      return {
        description: item.description || 'Service/Product',
        quantity,
        unitPrice,
        amount,
      };
    });

    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const totalAmount = Math.max(0, subtotal - discount + taxAmount);
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim().toLowerCase(),
        companyName: companyName || null,
        customerId: customerId || null,
        dueDate: new Date(dueDate),
        subtotal,
        taxRate,
        taxAmount,
        discount,
        totalAmount,
        amountPaid: 0,
        balanceDue: totalAmount,
        status: 'SENT',
        notes: notes || null,
        businessUnitId: session.businessUnitIds?.[0] || null,
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
      action: 'CREATE_INVOICE',
      entityType: 'Invoice',
      entityId: invoice.id,
      metadata: { invoiceNumber, totalAmount, clientEmail },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate invoice.' }, { status: 500 });
  }
}
