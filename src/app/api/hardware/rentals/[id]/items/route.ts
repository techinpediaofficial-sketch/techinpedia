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

    const order = await db.rentalOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Rental order not found' }, { status: 404 });
    }

    if (order.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot add items to an inactive or returned rental order.' },
        { status: 400 }
      );
    }

    const {
      items = [],
      // Or single item
      systemConfiguration,
      quantity = 1,
      rentPerPiece = 0,
      gstPerPiece = 0,
      assetType = 'WORKSTATION',
      assetBrand = 'Custom / Assembled',
      assetModel = 'Rental System',
    } = body;

    const rawList = Array.isArray(items) && items.length > 0
      ? items
      : [
          {
            systemConfiguration,
            quantity,
            rentPerPiece,
            gstPerPiece,
            assetType,
            assetBrand,
            assetModel,
          },
        ];

    interface NormalizedItem {
      systemConfiguration: string;
      quantity: number;
      rentPerPiece: number;
      gstPerPiece: number;
      unitRate: number;
      lineTotal: number;
      assetType: string;
      assetBrand: string;
      assetModel: string;
    }

    const newItems: NormalizedItem[] = [];

    for (let i = 0; i < rawList.length; i++) {
      const raw = rawList[i];
      const configText = (raw.systemConfiguration || '').trim();
      if (!configText) {
        return NextResponse.json(
          { error: `Product #${i + 1}: System configuration is required.` },
          { status: 400 }
        );
      }
      const q = Math.max(1, parseInt(String(raw.quantity), 10) || 1);
      const r = Math.max(0, parseFloat(String(raw.rentPerPiece)) || 0);
      const g = Math.max(0, parseFloat(String(raw.gstPerPiece)) || 0);
      const unit = r + g;
      if (unit <= 0) {
        return NextResponse.json(
          { error: `Product #${i + 1}: Rent per piece must be greater than 0.` },
          { status: 400 }
        );
      }
      newItems.push({
        systemConfiguration: configText,
        quantity: q,
        rentPerPiece: r,
        gstPerPiece: g,
        unitRate: unit,
        lineTotal: q * unit,
        assetType: raw.assetType || 'WORKSTATION',
        assetBrand: raw.assetBrand?.trim() || 'Custom / Assembled',
        assetModel: raw.assetModel?.trim() || 'Rental System',
      });
    }

    const additionalRunrate = newItems.reduce((acc, it) => acc + it.lineTotal, 0);
    const addedUnitsCount = newItems.reduce((acc, it) => acc + it.quantity, 0);

    // Parse existing metadata
    let existingMeta: any = {};
    try {
      if (order.agreementRef && order.agreementRef.trim().startsWith('{')) {
        existingMeta = JSON.parse(order.agreementRef);
      }
    } catch {
      existingMeta = {};
    }

    const existingItems = Array.isArray(existingMeta.items) ? existingMeta.items : [];
    const mergedItems = [...existingItems, ...newItems];

    const updated = await db.$transaction(async (tx) => {
      const timeKey = Date.now().toString().slice(-5);
      let assetSeq = (order.items?.length || 0) + 1;

      for (let pIdx = 0; pIdx < newItems.length; pIdx++) {
        const prod = newItems[pIdx];
        for (let j = 1; j <= prod.quantity; j++) {
          const codeSuffix = `${timeKey}-${String(assetSeq).padStart(2, '0')}`;
          const newAsset = await tx.rentalAsset.create({
            data: {
              assetCode: `MAN-SYS-${codeSuffix}`,
              serialNumber: `SN-MAN-${codeSuffix}-${Math.floor(100 + Math.random() * 900)}`,
              assetType: prod.assetType || 'WORKSTATION',
              brand: prod.assetBrand?.trim() || 'Custom / Assembled',
              model: prod.assetModel?.trim() || 'Rental System',
              specs: prod.systemConfiguration.trim(),
              status: 'RENTED',
              location: order.deliveryAddress.slice(0, 100),
              notes: `Appended to Rental: ${order.orderNumber} | Customer: ${order.customer.name}`,
            },
          });

          await tx.rentalOrderItem.create({
            data: {
              rentalOrderId: order.id,
              assetId: newAsset.id,
              rate: prod.unitRate,
            },
          });
          assetSeq++;
        }
      }

      const updatedMeta = {
        ...existingMeta,
        manual: true,
        totalQuantity: (existingMeta.totalQuantity || order.items?.length || 0) + addedUnitsCount,
        items: mergedItems,
      };

      return await tx.rentalOrder.update({
        where: { id },
        data: {
          monthlyRate: order.monthlyRate + additionalRunrate,
          agreementRef: JSON.stringify(updatedMeta),
        },
        include: {
          customer: true,
          items: { include: { asset: true } },
        },
      });
    });

    await logActivity({
      userId: session.userId,
      action: 'UPDATE',
      entityType: 'RENTAL_ORDER',
      entityId: id,
      details: `Added ${addedUnitsCount} new devices (₹${additionalRunrate}/mo) to rental order ${order.orderNumber}`,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    if (error?.name === 'AuthenticationError' || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Add rental items error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add items to rental order.' }, { status: 500 });
  }
}
