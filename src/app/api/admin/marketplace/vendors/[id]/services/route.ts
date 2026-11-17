import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { handleApiAuthError } from '@/lib/auth-errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const services = await db.marketplaceVendorService.findMany({
      where: { vendorId: id },
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch services.' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.companies.manage');

    const { id } = await params;
    const body = await request.json();
    const { title, description, price, priceUnit, duration, imageUrl, isPopular, displayOrder } = body;

    if (!title) {
      return NextResponse.json({ error: 'Service Title is required.' }, { status: 400 });
    }

    const created = await db.marketplaceVendorService.create({
      data: {
        vendorId: id,
        title,
        description: description || null,
        price: price ? parseFloat(price) : 0,
        priceUnit: priceUnit || 'onwards / visit',
        duration: duration || null,
        imageUrl: imageUrl || null,
        isPopular: !!isPopular,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : 0,
      },
    });

    return NextResponse.json({ success: true, service: created });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Vendor service POST error:', error);
    return NextResponse.json({ error: 'Failed to add service.' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.companies.manage');

    const body = await request.json();
    const { serviceId, title, description, price, priceUnit, duration, imageUrl, isPopular, displayOrder, status } = body;

    if (!serviceId) {
      return NextResponse.json({ error: 'serviceId is required.' }, { status: 400 });
    }

    const updated = await db.marketplaceVendorService.update({
      where: { id: serviceId },
      data: {
        title,
        description: description || null,
        price: price !== undefined ? parseFloat(price) : undefined,
        priceUnit: priceUnit || undefined,
        duration: duration || null,
        imageUrl: imageUrl || null,
        isPopular: isPopular !== undefined ? !!isPopular : undefined,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : undefined,
        status: status || undefined,
      },
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Vendor service PUT error:', error);
    return NextResponse.json({ error: 'Failed to update service.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.companies.manage');

    const url = new URL(request.url);
    const serviceId = url.searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json({ error: 'serviceId is required.' }, { status: 400 });
    }

    await db.marketplaceVendorService.delete({
      where: { id: serviceId },
    });

    return NextResponse.json({ success: true, message: 'Service deleted successfully' });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Vendor service DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete service.' }, { status: 500 });
  }
}
