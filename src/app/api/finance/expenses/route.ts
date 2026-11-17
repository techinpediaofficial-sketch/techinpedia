import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;

    if (session.role !== 'SUPER_ADMIN') {
      where.businessUnitId = { in: session.businessUnitIds || [] };
    }

    const expenses = await db.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

    return NextResponse.json({
      success: true,
      expenses,
      metrics: { totalExpense },
    });
  } catch (error) {
    console.error('Fetch expenses error:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { category, vendorName, amount, taxAmount = 0, date, paymentMethod, receiptUrl, notes } = body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0 || !category) {
      return NextResponse.json({ error: 'Category and positive amount are required.' }, { status: 400 });
    }

    const expense = await db.expense.create({
      data: {
        category,
        vendorName: vendorName ? vendorName.trim() : null,
        amount: parsedAmount,
        taxAmount: parseFloat(taxAmount) || 0,
        date: date ? new Date(date) : new Date(),
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        receiptUrl: receiptUrl || null,
        notes: notes || null,
        businessUnitId: session.businessUnitIds?.[0] || null,
        status: 'APPROVED',
        approvedBy: session.email,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'RECORD_EXPENSE',
      entityType: 'Expense',
      entityId: expense.id,
      metadata: { category, amount: parsedAmount, vendorName },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    console.error('Expense record error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record expense.' }, { status: 500 });
  }
}
