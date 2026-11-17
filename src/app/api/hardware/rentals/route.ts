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
        { orderNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { customer: { company: { name: { contains: search } } } },
        { agreementRef: { contains: search } },
        { deliveryAddress: { contains: search } },
      ];
    }

    const orders = await db.rentalOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            company: { select: { name: true } },
            email: true,
            phone: true,
            notes: true,
          },
        },
        items: {
          include: {
            asset: true,
          },
        },
      },
    });

    const activeOrders = orders.filter((o) => o.status === 'ACTIVE');
    const monthlyRunrate = activeOrders.reduce((acc, o) => acc + o.monthlyRate, 0);
    const totalDeposits = activeOrders.reduce((acc, o) => acc + o.securityDeposit, 0);

    return NextResponse.json({
      success: true,
      orders,
      metrics: {
        total: orders.length,
        active: activeOrders.length,
        monthlyRunrate,
        totalDeposits,
      },
    });
  } catch (error: any) {
    if (error?.name === 'AuthenticationError' || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Fetch rental orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch rental orders.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const {
      customerId,
      // Manual Customer fields
      isManualCustomer = false,
      customerName,
      customerPhone,
      customerAltPhone,
      customerAddress,
      customerEmail,

      // Dates & Billing
      startDate,
      endDate,
      billingCycle = 'MONTHLY',
      monthlyRate,
      securityDeposit = 0,
      deliveryAddress,
      agreementRef,

      // Multi-Product items support
      items = [],

      // Legacy single-item fields (for backward compatibility)
      isManualAsset = false,
      systemConfiguration,
      quantity = 1,
      rentPerPiece = 0,
      gstPerPiece = 0,
      assetType = 'WORKSTATION',
      assetBrand = 'Custom / Assembled',
      assetModel = 'Rental PC',

      // Existing asset selection
      assetIds = [],
    } = body;

    // Validate Dates
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Rental start date and end date are required.' }, { status: 400 });
    }

    // Validate Customer
    const manualCust = Boolean(isManualCustomer || customerId === 'MANUAL' || (!customerId && customerName));
    if (manualCust) {
      if (!customerName || !customerName.trim()) {
        return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
      }
      if (!customerPhone || !customerPhone.trim()) {
        return NextResponse.json({ error: 'Customer phone number is required.' }, { status: 400 });
      }
    } else if (!customerId) {
      return NextResponse.json({ error: 'Please select a customer or enter customer details manually.' }, { status: 400 });
    }

    // Validate Delivery Address
    const finalDeliveryAddress = (deliveryAddress || customerAddress || '').trim();
    if (!finalDeliveryAddress) {
      return NextResponse.json({ error: 'Delivery / Installation address is required.' }, { status: 400 });
    }

    // Normalize Items
    const hasItemsArray = Array.isArray(items) && items.length > 0;
    const manualAsset = Boolean(isManualAsset || hasItemsArray || (!assetIds.length && systemConfiguration));

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

    const normalizedItems: NormalizedItem[] = [];

    if (manualAsset) {
      const rawList = hasItemsArray
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

      for (let i = 0; i < rawList.length; i++) {
        const raw = rawList[i];
        const configText = (raw.systemConfiguration || '').trim();
        if (!configText) {
          return NextResponse.json(
            { error: `Product #${i + 1}: System configuration / specifications are required.` },
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
    }

    let finalMonthlyRate = 0;
    let totalDevicesCount = 0;

    if (manualAsset) {
      totalDevicesCount = normalizedItems.reduce((acc, it) => acc + it.quantity, 0);
      finalMonthlyRate = normalizedItems.reduce((acc, it) => acc + it.lineTotal, 0);
      if (monthlyRate !== undefined && parseFloat(String(monthlyRate)) > 0) {
        finalMonthlyRate = parseFloat(String(monthlyRate));
      }
    } else {
      if (!Array.isArray(assetIds) || assetIds.length === 0) {
        return NextResponse.json(
          { error: 'Please select at least one hardware asset or enter product configurations.' },
          { status: 400 }
        );
      }
      totalDevicesCount = assetIds.length;
      finalMonthlyRate = parseFloat(String(monthlyRate)) || 0;
      if (finalMonthlyRate <= 0) {
        return NextResponse.json({ error: 'Monthly rate is required.' }, { status: 400 });
      }

      // Verify selected assets are AVAILABLE
      const availableAssets = await db.rentalAsset.findMany({
        where: { id: { in: assetIds }, status: 'AVAILABLE' },
      });
      if (availableAssets.length !== assetIds.length) {
        return NextResponse.json(
          { error: 'One or more selected inventory assets are not currently available.' },
          { status: 400 }
        );
      }
    }

    // Generate Order Number: RENT-YYYY-XXXX
    const count = await db.rentalOrder.count();
    const orderNumber = `RENT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Parse dates: startDate defaults to now, endDate is optional (null for ongoing lease)
    const parsedStartDate = startDate && !isNaN(new Date(startDate).getTime()) ? new Date(startDate) : new Date();
    const parsedEndDate = endDate && !isNaN(new Date(endDate).getTime()) ? new Date(endDate) : null;

    // Execute everything in transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Resolve or create customer
      let targetCustomerId = customerId;
      if (manualCust) {
        const cleanPhone = customerPhone.trim();
        // Look up by exact phone number first (do NOT match by name alone to avoid attaching to old/wrong test customers)
        let existingCustomer = await tx.customer.findFirst({
          where: { phone: cleanPhone },
        });

        // If not found by phone, check if a customer with the exact name AND no phone exists
        if (!existingCustomer) {
          existingCustomer = await tx.customer.findFirst({
            where: {
              name: customerName.trim(),
              OR: [{ phone: null }, { phone: '' }],
            },
          });
        }

        const notesParts = [
          customerAltPhone?.trim() ? `Alt Phone: ${customerAltPhone.trim()}` : '',
          customerAddress?.trim() ? `Address: ${customerAddress.trim()}` : '',
        ].filter(Boolean);

        if (!existingCustomer) {
          const autoEmail =
            customerEmail?.trim() ||
            `${cleanPhone.replace(/[^0-9]/g, '') || 'client'}@rental.techinpedia.com`;

          existingCustomer = await tx.customer.create({
            data: {
              name: customerName.trim(),
              phone: cleanPhone,
              email: autoEmail,
              notes: notesParts.join(' | ') || null,
              status: 'ACTIVE',
            },
          });
        } else {
          // Always ensure the customer's phone and name are updated to latest user entry
          const existingNotes = existingCustomer.notes || '';
          const toAdd = notesParts.filter((p) => !existingNotes.includes(p));
          await tx.customer.update({
            where: { id: existingCustomer.id },
            data: {
              name: customerName.trim(),
              phone: cleanPhone,
              notes: toAdd.length > 0 ? [existingNotes, ...toAdd].filter(Boolean).join(' | ') : existingNotes,
            },
          });
        }
        targetCustomerId = existingCustomer.id;
      }

      // 2. Prepare Agreement Ref JSON metadata (stored safely as TEXT)
      const agreementMetadata = {
        manual: manualAsset,
        customerName: manualCust ? customerName.trim() : undefined,
        customerPhone: manualCust ? customerPhone.trim() : undefined,
        customerAltPhone: customerAltPhone?.trim() || undefined,
        deliveryAddress: finalDeliveryAddress,
        totalQuantity: totalDevicesCount,
        isOngoing: !parsedEndDate,
        systemConfiguration: normalizedItems[0]?.systemConfiguration,
        rentPerPiece: normalizedItems[0]?.rentPerPiece,
        gstPerPiece: normalizedItems[0]?.gstPerPiece,
        items: normalizedItems,
        customRef: agreementRef?.trim() || undefined,
      };

      // 3. Create Rental Order
      const order = await tx.rentalOrder.create({
        data: {
          orderNumber,
          customerId: targetCustomerId,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          billingCycle,
          monthlyRate: finalMonthlyRate,
          securityDeposit: parseFloat(String(securityDeposit)) || 0,
          deliveryAddress: finalDeliveryAddress,
          agreementRef: JSON.stringify(agreementMetadata),
          status: 'ACTIVE',
        },
      });

      // 4. Create Line items and Assets
      if (manualAsset) {
        const timeKey = Date.now().toString().slice(-5);
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
                status: 'RENTED',
                location: finalDeliveryAddress.slice(0, 100),
                notes: `Manual Rental: ${orderNumber} | Prod: ${prod.assetBrand} ${prod.assetModel} | Customer: ${customerName || targetCustomerId} | Alt Phone: ${customerAltPhone || 'N/A'}`,
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
      } else {
        const ratePerAsset = finalMonthlyRate / assetIds.length;
        for (const assetId of assetIds) {
          await tx.rentalOrderItem.create({
            data: {
              rentalOrderId: order.id,
              assetId,
              rate: ratePerAsset,
            },
          });

          await tx.rentalAsset.update({
            where: { id: assetId },
            data: { status: 'RENTED' },
          });
        }
      }

      return order;
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'RENTAL_ORDER',
      entityId: result.id,
      details: `Created rental order ${result.orderNumber} with ${totalDevicesCount} devices across ${manualAsset ? normalizedItems.length : 1} product group(s) for ₹${finalMonthlyRate}/mo`,
    });

    return NextResponse.json({ success: true, order: result });
  } catch (error: any) {
    if (error?.name === 'AuthenticationError' || error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create rental order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create rental order.' }, { status: 500 });
  }
}
