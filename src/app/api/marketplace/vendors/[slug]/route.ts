import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const vendor = await db.marketplaceVendor.findFirst({
      where: {
        OR: [
          { slug: slug },
          { id: slug },
        ],
        status: 'ACTIVE',
      },
      include: {
        media: {
          orderBy: { displayOrder: 'asc' },
        },
        services: {
          where: { status: 'ACTIVE' },
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    // Parse JSON fields safely
    let categories: string[] = [];
    try {
      categories = vendor.categories ? JSON.parse(vendor.categories) : [];
    } catch {
      categories = [vendor.primaryCategory];
    }

    let openingHours: any = null;
    try {
      openingHours = vendor.openingHours ? JSON.parse(vendor.openingHours) : null;
    } catch {
      openingHours = null;
    }

    let quickInfo: any = {};
    try {
      quickInfo = vendor.quickInfo ? JSON.parse(vendor.quickInfo) : {};
    } catch {
      quickInfo = {};
    }

    // Organize media into categories matching Screenshot 2
    const photosAll = vendor.media.filter((m) => m.mediaType === 'PHOTO' || m.mediaType === 'VIDEO');
    const photosByOwner = vendor.media.filter((m) => m.mediaType === 'PHOTO' && m.sourceCategory === 'OWNER');
    const photosByUser = vendor.media.filter((m) => m.mediaType === 'PHOTO' && m.sourceCategory === 'CUSTOMER');
    const videos = vendor.media.filter((m) => m.mediaType === 'VIDEO');
    const scannedRateCards = vendor.media.filter((m) => m.mediaType === 'SCANNED_RATE_CARD' || m.mediaType === 'DOCUMENT');

    // Aggregate review highlights
    const tagCountMap: Record<string, number> = {};
    const parsedReviews = vendor.reviews.map((r) => {
      let tags: string[] = [];
      try {
        tags = r.reviewTags ? JSON.parse(r.reviewTags) : [];
      } catch {
        tags = [];
      }
      tags.forEach((t) => {
        tagCountMap[t] = (tagCountMap[t] || 0) + 1;
      });
      return {
        id: r.id,
        reviewerName: r.reviewerName,
        rating: r.rating,
        comment: r.comment,
        tags,
        ownerReply: r.ownerReply,
        createdAt: r.createdAt,
      };
    });

    const reviewHighlights = Object.entries(tagCountMap).map(([tag, count]) => ({
      tag,
      count,
    })).sort((a, b) => b.count - a.count);

    // Fetch related vendors in same city or category
    const relatedVendors = await db.marketplaceVendor.findMany({
      where: {
        city: vendor.city,
        id: { not: vendor.id },
        status: 'ACTIVE',
      },
      take: 4,
      select: {
        id: true,
        businessName: true,
        slug: true,
        city: true,
        locality: true,
        phone: true,
        averageRating: true,
        ratingCount: true,
        logoUrl: true,
        coverImageUrl: true,
        primaryCategory: true,
      },
    });

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor.id,
        slug: vendor.slug,
        businessName: vendor.businessName,
        tagline: vendor.tagline,
        description: vendor.description,
        logoUrl: vendor.logoUrl,
        coverImageUrl: vendor.coverImageUrl,
        ownerName: vendor.ownerName,
        phone: vendor.phone,
        whatsappNumber: vendor.whatsappNumber || vendor.phone,
        email: vendor.email,
        website: vendor.website,
        address: vendor.address,
        locality: vendor.locality,
        city: vendor.city,
        state: vendor.state,
        pincode: vendor.pincode,
        establishmentYear: vendor.establishmentYear,
        businessType: vendor.businessType,
        primaryCategory: vendor.primaryCategory,
        categories,
        openingHours,
        quickInfo,
        gstin: vendor.gstin,
        isClaimed: vendor.isClaimed,
        isVerified: vendor.isVerified,
        isFeatured: vendor.isFeatured,
        averageRating: Number(vendor.averageRating),
        ratingCount: vendor.ratingCount,
        reviewCount: vendor.reviewCount,
      },
      media: {
        all: vendor.media,
        photosAll,
        photosByOwner,
        photosByUser,
        videos,
        scannedRateCards,
      },
      services: vendor.services.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        price: Number(s.price),
        priceUnit: s.priceUnit,
        duration: s.duration,
        imageUrl: s.imageUrl,
        isPopular: s.isPopular,
      })),
      reviews: parsedReviews,
      reviewHighlights,
      relatedVendors: relatedVendors.map((rv) => ({
        ...rv,
        averageRating: Number(rv.averageRating),
      })),
    });
  } catch (error: any) {
    console.error('Public marketplace vendor GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor.' }, { status: 500 });
  }
}
