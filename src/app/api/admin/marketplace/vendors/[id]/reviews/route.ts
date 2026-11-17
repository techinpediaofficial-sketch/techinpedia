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
    const reviews = await db.marketplaceVendorReview.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch reviews.' }, { status: 500 });
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
    const { reviewerName, reviewerPhone, rating, comment, reviewTags, ownerReply, status } = body;

    if (!reviewerName || !comment) {
      return NextResponse.json({ error: 'Reviewer name and comment are required.' }, { status: 400 });
    }

    const created = await db.marketplaceVendorReview.create({
      data: {
        vendorId: id,
        reviewerName,
        reviewerPhone: reviewerPhone || null,
        rating: rating ? parseInt(rating, 10) : 5,
        comment,
        reviewTags: reviewTags ? (typeof reviewTags === 'string' ? reviewTags : JSON.stringify(reviewTags)) : null,
        ownerReply: ownerReply || null,
        status: status || 'APPROVED',
      },
    });

    // Recompute vendor average rating and reviewCount
    const aggregate = await db.marketplaceVendorReview.aggregate({
      where: { vendorId: id, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { id: true },
    });

    if (aggregate._count.id > 0) {
      await db.marketplaceVendor.update({
        where: { id },
        data: {
          averageRating: aggregate._avg.rating || 5.0,
          ratingCount: aggregate._count.id,
          reviewCount: aggregate._count.id,
        },
      });
    }

    return NextResponse.json({ success: true, review: created });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Vendor review POST error:', error);
    return NextResponse.json({ error: 'Failed to add review.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requirePermission(session, 'crm.companies.manage');

    const { id } = await params;
    const url = new URL(request.url);
    const reviewId = url.searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required.' }, { status: 400 });
    }

    await db.marketplaceVendorReview.delete({
      where: { id: reviewId },
    });

    // Recompute vendor average rating
    const aggregate = await db.marketplaceVendorReview.aggregate({
      where: { vendorId: id, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { id: true },
    });

    await db.marketplaceVendor.update({
      where: { id },
      data: {
        averageRating: aggregate._avg.rating || 5.0,
        ratingCount: aggregate._count.id,
        reviewCount: aggregate._count.id,
      },
    });

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    const authResponse = handleApiAuthError(error);
    if (authResponse) return authResponse;
    console.error('Vendor review DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete review.' }, { status: 500 });
  }
}
