import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      customerName,
      customerPhone,
      customerAltPhone,
      customerEmail,
      customerAddress,
      startDate,
      endDate,
      billingCycle,
      monthlyRate,
      securityDeposit,
      deliveryAddress,
      agreementRef,
      customRef,
      items,
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

    const updated = await db.$transaction(async (tx) => {
      // 1. If status changed to RETURNED, release all assets
      if (status === 'RETURNED' && order.status !== 'RETURNED') {
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
      } else if (status === 'ACTIVE' && order.status === 'RETURNED') {
        // Re-activating previously returned order
        for (const item of order.items) {
          await tx.rentalOrderItem.update({
            where: { id: item.id },
            data: { returnedAt: null },
          });
          await tx.rentalAsset.update({
            where: { id: item.assetId },
            data: { status: 'RENTED' },
          });
        }
      }

      // 2. Customer updates (if provided)
      const cleanPhone = customerPhone?.trim();
      const cleanName = customerName?.trim();
      if (cleanPhone || cleanName) {
        const notesParts = [
          customerAltPhone?.trim() ? `Alt Phone: ${customerAltPhone.trim()}` : '',
          customerAddress?.trim() ? `Address: ${customerAddress.trim()}` : '',
        ].filter(Boolean);

        const existingNotes = order.customer?.notes || '';
        const otherNotes = existingNotes
          .split('|')
          .map((p) => p.trim())
          .filter((p) => p && !p.startsWith('Alt Phone:') && !p.startsWith('Address:'));
        const newNotes = [...otherNotes, ...notesParts].join(' | ') || null;

        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            ...(cleanName && { name: cleanName }),
            ...(cleanPhone && { phone: cleanPhone }),
            ...(customerEmail?.trim() && { email: customerEmail.trim() }),
            notes: newNotes,
          },
        });
      }

      const finalDeliveryAddress = (deliveryAddress || customerAddress || order.deliveryAddress || '').trim();

      // 3. Products / Line items fleet updates (if items array is provided)
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

      let normalizedItems: NormalizedItem[] | null = null;
      let calculatedMonthlyRate = order.monthlyRate;
      let totalDevicesCount = order.items.length;

      if (Array.isArray(items)) {
        if (items.length === 0) {
          throw new Error('At least one product item is required.');
        }

        normalizedItems = [];
        for (let i = 0; i < items.length; i++) {
          const raw = items[i];
          const configText = (raw.systemConfiguration || '').trim();
          if (!configText) {
            throw new Error(`Product #${i + 1}: System configuration is required.`);
          }
          const q = Math.max(1, parseInt(String(raw.quantity), 10) || 1);
          const r = Math.max(0, parseFloat(String(raw.rentPerPiece)) || 0);
          const g = Math.max(0, parseFloat(String(raw.gstPerPiece)) || 0);
          const unit = r + g;
          normalizedItems.push({
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

        calculatedMonthlyRate = normalizedItems.reduce((acc, it) => acc + it.lineTotal, 0);
        totalDevicesCount = normalizedItems.reduce((acc, it) => acc + it.quantity, 0);

        // Delete old line items and their temporary manual assets
        for (const oldItem of order.items) {
          await tx.rentalOrderItem.delete({ where: { id: oldItem.id } });
          if (oldItem.asset.assetCode.startsWith('MAN-SYS-')) {
            await tx.rentalAsset.delete({ where: { id: oldItem.assetId } });
          } else {
            await tx.rentalAsset.update({
              where: { id: oldItem.assetId },
              data: { status: 'AVAILABLE' },
            });
          }
        }

        // Create fresh manual assets and line items
        const timeKey = `${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        let assetSeq = 1;
        for (let pIdx = 0; pIdx < normalizedItems.length; pIdx++) {
          const prod = normalizedItems[pIdx];
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
                status: (status || order.status) === 'RETURNED' ? 'AVAILABLE' : 'RENTED',
                location: finalDeliveryAddress.slice(0, 100),
                notes: `Rental: ${order.orderNumber} | Prod: ${prod.assetBrand} ${prod.assetModel} | Customer: ${cleanName || order.customer?.name}`,
              },
            });

            await tx.rentalOrderItem.create({
              data: {
                rentalOrderId: order.id,
                assetId: newAsset.id,
                rate: prod.unitRate,
                returnedAt: (status || order.status) === 'RETURNED' ? new Date() : null,
              },
            });
            assetSeq++;
          }
        }
      }

      // 4. Update agreement metadata JSON
      let existingMeta: any = {};
      try {
        if (order.agreementRef && order.agreementRef.trim().startsWith('{')) {
          existingMeta = JSON.parse(order.agreementRef);
        }
      } catch {
        existingMeta = {};
      }

      const updatedMeta = {
        ...existingMeta,
        manual: true,
        customerName: cleanName || existingMeta.customerName || order.customer?.name,
        customerPhone: cleanPhone || existingMeta.customerPhone || order.customer?.phone,
        customerAltPhone:
          customerAltPhone !== undefined ? customerAltPhone.trim() : existingMeta.customerAltPhone,
        deliveryAddress: finalDeliveryAddress,
        totalQuantity: normalizedItems ? totalDevicesCount : existingMeta.totalQuantity,
        isOngoing: endDate === '' || endDate === null,
        systemConfiguration: normalizedItems ? normalizedItems[0]?.systemConfiguration : existingMeta.systemConfiguration,
        rentPerPiece: normalizedItems ? normalizedItems[0]?.rentPerPiece : existingMeta.rentPerPiece,
        gstPerPiece: normalizedItems ? normalizedItems[0]?.gstPerPiece : existingMeta.gstPerPiece,
        items: normalizedItems || existingMeta.items,
        customRef:
          customRef !== undefined
            ? customRef?.trim()
            : agreementRef && !agreementRef.trim().startsWith('{')
            ? agreementRef.trim()
            : existingMeta.customRef,
      };

      // 5. Parse Dates
      let parsedStartDate = order.startDate;
      if (startDate) {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) parsedStartDate = d;
      }

      let parsedEndDate: Date | null = order.endDate;
      if (endDate === '' || endDate === null) {
        parsedEndDate = null;
      } else if (endDate) {
        const d = new Date(endDate);
        if (!isNaN(d.getTime())) parsedEndDate = d;
      }

      return await tx.rentalOrder.update({
        where: { id },
        data: {
          ...(status && { status }),
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          ...(billingCycle && { billingCycle }),
          monthlyRate: normalizedItems
            ? calculatedMonthlyRate
            : monthlyRate !== undefined
            ? parseFloat(String(monthlyRate)) || order.monthlyRate
            : order.monthlyRate,
          securityDeposit:
            securityDeposit !== undefined
              ? parseFloat(String(securityDeposit)) || 0
              : order.securityDeposit,
          deliveryAddress: finalDeliveryAddress,
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
      details: `Edited entire rental order ${order.orderNumber} (Monthly: ₹${updated.monthlyRate}, Status: ${updated.status})`,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    if (error?.name === 'AuthenticationError' || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update rental order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update rental order.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const order = await db.rentalOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: { asset: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Rental order not found' }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.rentalOrderItem.delete({ where: { id: item.id } });
        if (item.asset.assetCode.startsWith('MAN-SYS-')) {
          // Delete temporary manual asset record
          await tx.rentalAsset.delete({ where: { id: item.assetId } });
        } else {
          // Release inventory asset
          await tx.rentalAsset.update({
            where: { id: item.assetId },
            data: { status: 'AVAILABLE' },
          });
        }
      }
      await tx.rentalOrder.delete({ where: { id } });
    });

    await logActivity({
      userId: session.userId,
      action: 'DELETE',
      entityType: 'RENTAL_ORDER',
      entityId: id,
      details: `Deleted rental order ${order.orderNumber}`,
    });

    return NextResponse.json({ success: true, message: 'Rental order deleted successfully' });
  } catch (error: any) {
    if (error?.name === 'AuthenticationError' || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Delete rental order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete rental order.' }, { status: 500 });
  }
}
