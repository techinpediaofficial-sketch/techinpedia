import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const {
      actionType = 'COMPLETE_RETURN', // 'REQUEST_DISCONTINUATION' | 'COMPLETE_RETURN'
      discontinueReason,
      returnDate,
      returnCondition = 'GOOD', // 'GOOD', 'MINOR_SCRATCHES', 'DAMAGED', 'PARTS_MISSING'
      inspectionNotes,
      depositDeduction = 0,
      deductionReason,
      unpaidRentDeduction = 0,
      depositRefundStatus = 'REFUNDED', // 'REFUNDED', 'PENDING_SETTLEMENT', 'ADJUSTED_TO_RENT', 'FORFEITED'
      depositRefundPaymentMode = 'UPI',
      depositRefundRef,
    } = body;

    const order = await db.rentalOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { asset: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Rental order not found' }, { status: 404 });
    }

    const deductionFloat = parseFloat(String(depositDeduction)) || 0;
    const unpaidRentFloat = parseFloat(String(unpaidRentDeduction)) || 0;
    const originalDeposit = order.securityDeposit || 0;
    const netRefundAmount = Math.max(0, originalDeposit - deductionFloat - unpaidRentFloat);

    // Parse existing metadata
    let existingMeta: any = {};
    try {
      if (order.agreementRef && order.agreementRef.trim().startsWith('{')) {
        existingMeta = JSON.parse(order.agreementRef);
      }
    } catch {
      existingMeta = {};
    }

    const discontinuationData = {
      requestedAt: existingMeta.discontinuation?.requestedAt || new Date().toISOString(),
      discontinueReason: discontinueReason?.trim() || 'Client requested discontinuation',
      returnDate: returnDate ? new Date(returnDate).toISOString() : new Date().toISOString(),
      returnCondition,
      inspectionNotes: inspectionNotes?.trim() || '',
      depositOriginal: originalDeposit,
      depositDeduction: deductionFloat,
      deductionReason: deductionReason?.trim() || '',
      unpaidRentDeduction: unpaidRentFloat,
      depositNetRefund: netRefundAmount,
      depositRefundStatus,
      depositRefundPaymentMode,
      depositRefundRef: depositRefundRef?.trim() || null,
      closedAt: actionType === 'COMPLETE_RETURN' ? new Date().toISOString() : null,
      recordedBy: (session as any).name || (session as any).userName || session.email || 'Admin',
    };

    const updatedMeta = {
      ...existingMeta,
      discontinuation: discontinuationData,
    };

    const newStatus = actionType === 'COMPLETE_RETURN' ? 'RETURNED' : 'DISCONTINUATION_REQUESTED';

    const updatedOrder = await db.$transaction(async (tx) => {
      // 1. If completing return, release all assets back to inventory
      if (actionType === 'COMPLETE_RETURN') {
        const now = new Date();
        for (const item of order.items) {
          await tx.rentalOrderItem.update({
            where: { id: item.id },
            data: { returnedAt: now },
          });
          await tx.rentalAsset.update({
            where: { id: item.assetId },
            data: { status: 'AVAILABLE' },
          });
        }
      }

      // 2. Update order status and metadata
      return await tx.rentalOrder.update({
        where: { id },
        data: {
          status: newStatus,
          agreementRef: JSON.stringify(updatedMeta),
          ...(actionType === 'COMPLETE_RETURN' && { endDate: returnDate ? new Date(returnDate) : new Date() }),
        },
        include: {
          customer: true,
          items: { include: { asset: true } },
        },
      });
    });

    await logActivity({
      userId: session.userId,
      action: actionType === 'COMPLETE_RETURN' ? 'RETURN' : 'UPDATE',
      entityType: 'RENTAL_ORDER',
      entityId: id,
      details: `${actionType === 'COMPLETE_RETURN' ? 'Closed & Returned' : 'Discontinuation requested for'} Rental Order ${order.orderNumber}. Deposit Refund: ₹${netRefundAmount} (${depositRefundStatus})`,
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      discontinuation: discontinuationData,
    });
  } catch (error: any) {
    if (error?.name === 'AuthenticationError' || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Rental order discontinuation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process discontinuation' }, { status: 500 });
  }
}
