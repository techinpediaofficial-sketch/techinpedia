import { NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/razorpay';

export const VENDOR_PACKS: Record<string, { name: string; credits: number; price: number; gst: number; total: number }> = {
  starter: {
    name: 'Starter Pack (10 Leads)',
    credits: 10,
    price: 999,
    gst: 179.82,
    total: 1179,
  },
  growth: {
    name: 'Growth Pack (30 Leads)',
    credits: 30,
    price: 2499,
    gst: 449.82,
    total: 2949,
  },
  enterprise: {
    name: 'Enterprise Wholesale Pack (100 Leads)',
    credits: 100,
    price: 6999,
    gst: 1259.82,
    total: 8259,
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { packId, vendorId = 'Apex Aircon Systems', vendorEmail, vendorPhone } = body;

    const pack = VENDOR_PACKS[packId];
    if (!pack) {
      return NextResponse.json({ error: 'Invalid credit package selected' }, { status: 400 });
    }

    const receipt = `urb_${packId}_${Date.now().toString().slice(-8)}`;

    const order = await createRazorpayOrder({
      amount: pack.total,
      currency: 'INR',
      receipt,
      notes: {
        packId,
        packName: pack.name,
        credits: String(pack.credits),
        vendorId,
        type: 'URBAN_MARKETPLACE_CREDITS',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      keyId: order.keyId,
      pack: {
        id: packId,
        name: pack.name,
        credits: pack.credits,
        price: pack.price,
        gst: pack.gst,
        total: pack.total,
      },
      isSimulated: order.isSimulated,
    });
  } catch (error: any) {
    console.error('Marketplace checkout create-order error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
