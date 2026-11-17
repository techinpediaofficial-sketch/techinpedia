import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createRazorpayPaymentLink } from '@/lib/razorpay';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const employeeId = searchParams.get('employeeId');
    const departmentId = searchParams.get('departmentId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (employeeId) {
      where.salesEmployeeId = employeeId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { clientName: { contains: search } },
        { clientEmail: { contains: search } },
        { providerLinkId: { contains: search } },
        { purpose: { contains: search } },
      ];
    }

    const [links, totalCount] = await Promise.all([
      db.paymentLink.findMany({
        where,
        include: {
          createdByUser: { select: { name: true, email: true } },
          salesEmployee: { select: { id: true, name: true, employeeCode: true } },
          department: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true, email: true } },
          deal: { select: { id: true, title: true, value: true } },
          invoice: { select: { id: true, invoiceNumber: true, totalAmount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.paymentLink.count({ where }),
    ]);

    // Summary metrics
    const [totalGenerated, totalPaid, totalAmountSum] = await Promise.all([
      db.paymentLink.count(),
      db.paymentLink.count({ where: { status: 'PAID' } }),
      db.paymentLink.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      links,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      metrics: {
        totalGenerated,
        totalPaid,
        totalRealizedAmount: totalAmountSum._sum.amount || 0,
      },
    });
  } catch (error: any) {
    console.error('Payment Links GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payment links' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const {
      amount,
      purpose,
      description,
      clientName,
      clientEmail,
      clientPhone,
      expiresInDays,
      customerId,
      dealId,
      invoiceId,
      enquiryId,
      projectRecordId,
      internalNotes,
    } = body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount < 1) {
      return NextResponse.json({ error: 'Valid amount in INR (minimum ₹1.00) is required.' }, { status: 400 });
    }

    if (!purpose) {
      return NextResponse.json({ error: 'Purpose is required.' }, { status: 400 });
    }

    // Authoritative staff attribution resolved strictly from session
    const createdByUserId = session.userId;
    const salesEmployeeId = session.employeeId || null;
    const departmentId = session.departmentId || null;
    const teamId = session.teamId || null;

    // Resolve customer details if customerId provided but client info omitted
    let finalClientName = clientName;
    let finalClientEmail = clientEmail;
    let finalClientPhone = clientPhone;

    if (customerId && (!finalClientName || !finalClientEmail)) {
      const customer = await db.customer.findUnique({ where: { id: customerId } });
      if (customer) {
        if (!finalClientName) finalClientName = customer.name;
        if (!finalClientEmail) finalClientEmail = customer.email;
        if (!finalClientPhone) finalClientPhone = customer.phone || undefined;
      }
    }

    // Call Razorpay API / Sandbox Generator
    const linkResult = await createRazorpayPaymentLink({
      amount: parsedAmount,
      currency: 'INR',
      purpose,
      description: description || `Payment for ${purpose.replace(/_/g, ' ')}`,
      clientName: finalClientName,
      clientEmail: finalClientEmail,
      clientPhone: finalClientPhone,
      expiresInDays: expiresInDays ? parseInt(expiresInDays, 10) : 7,
      dealId: dealId || undefined,
      invoiceId: invoiceId || undefined,
      salesEmployeeId: salesEmployeeId || undefined,
      internalNotes,
    });

    const expiresAt = new Date(Date.now() + ((expiresInDays ? parseInt(expiresInDays, 10) : 7) * 86400000));

    // Save PaymentLink to database with full attribution
    const paymentLink = await db.paymentLink.create({
      data: {
        providerLinkId: linkResult.providerLinkId,
        providerOrderId: linkResult.providerOrderId || null,
        shortUrl: linkResult.shortUrl,
        amount: parsedAmount,
        currency: 'INR',
        purpose,
        description: description || null,
        status: 'CREATED',
        createdByUserId,
        salesEmployeeId,
        departmentId,
        teamId,
        customerId: customerId || null,
        enquiryId: enquiryId || null,
        dealId: dealId || null,
        invoiceId: invoiceId || null,
        projectRecordId: projectRecordId || null,
        clientName: finalClientName || null,
        clientEmail: finalClientEmail || null,
        clientPhone: finalClientPhone || null,
        expiresAt,
        providerResponse: JSON.stringify(linkResult.rawResponse),
        internalNotes: internalNotes || null,
      },
      include: {
        salesEmployee: { select: { name: true, employeeCode: true } },
        department: { select: { name: true } },
      },
    });

    // Audit Log
    try {
      await db.activityLog.create({
        data: {
          action: 'PAYMENT_LINK_GENERATED',
          userId: session.userId,
          userEmail: session.email,
          entityType: 'PaymentLink',
          entityId: 'generate',
        },
      });
    } catch {
      // Non-blocking audit log
    }

    return NextResponse.json({
      success: true,
      paymentLink,
      shortUrl: linkResult.shortUrl,
      isSimulated: linkResult.isSimulated,
    });
  } catch (error: any) {
    console.error('Payment Link creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate payment link' }, { status: 500 });
  }
}
