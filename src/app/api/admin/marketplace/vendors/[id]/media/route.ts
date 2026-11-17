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
    const media = await db.marketplaceVendorMedia.findMany({
      where: { vendorId: id },
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ success: true, media });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch media.' }, { status: 500 });
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
    const { url, thumbnailUrl, mediaType, sourceCategory, title, displayOrder } = body;

    if (!url) {
      return NextResponse.json({ error: 'Media URL is required.' }, { status: 400 });
    }

    const created = await db.marketplaceVendorMedia.create({
      data: {
        vendorId: id,
        url,
        thumbnailUrl: thumbnailUrl || null,
        mediaType: mediaType || 'PHOTO', // PHOTO, VIDEO, SCANNED_RATE_CARD, DOCUMENT
        sourceCategory: sourceCategory || 'OWNER', // OWNER, CUSTOMER, OFFICE, WORK_PORTFOLIO
        title: title || null,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) : 0,
      },
    });

    return NextResponse.json({ success: true, media: created });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Vendor media POST error:', error);
    return NextResponse.json({ error: 'Failed to add media.' }, { status: 500 });
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
    const mediaId = url.searchParams.get('mediaId');

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId is required.' }, { status: 400 });
    }

    await db.marketplaceVendorMedia.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({ success: true, message: 'Media deleted successfully' });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Vendor media DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete media.' }, { status: 500 });
  }
}
