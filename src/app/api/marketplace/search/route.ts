import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || '';
    const city = url.searchParams.get('city') || '';
    const q = url.searchParams.get('q') || '';
    const sort = url.searchParams.get('sort') || 'rating'; // rating, name, new
    const verifiedOnly = url.searchParams.get('verified') === 'true';

    const where: any = {
      status: 'ACTIVE',
    };

    if (city.trim()) {
      where.city = { contains: city.trim().toLowerCase() };
    }

    if (verifiedOnly) {
      where.isVerified = true;
    }

    if (category.trim()) {
      where.OR = [
        { primaryCategory: { contains: category.trim() } },
        { categories: { contains: category.trim() } },
      ];
    }

    if (q.trim()) {
      const searchTerms = [
        { businessName: { contains: q.trim() } },
        { primaryCategory: { contains: q.trim() } },
        { categories: { contains: q.trim() } },
        { locality: { contains: q.trim() } },
        { tagline: { contains: q.trim() } },
      ];

      if (where.OR) {
        where.AND = [{ OR: searchTerms }];
      } else {
        where.OR = searchTerms;
      }
    }

    let orderBy: any = [{ isFeatured: 'desc' }, { averageRating: 'desc' }];
    if (sort === 'rating') {
      orderBy = [{ averageRating: 'desc' }, { ratingCount: 'desc' }];
    } else if (sort === 'name') {
      orderBy = [{ businessName: 'asc' }];
    } else if (sort === 'new') {
      orderBy = [{ createdAt: 'desc' }];
    }

    const vendors = await db.marketplaceVendor.findMany({
      where,
      orderBy,
      include: {
        media: {
          where: { mediaType: 'PHOTO' },
          take: 5,
          orderBy: { displayOrder: 'asc' },
        },
        services: {
          where: { status: 'ACTIVE' },
          take: 4,
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    const parsed = vendors.map((v) => {
      let categories: string[] = [];
      try {
        categories = v.categories ? JSON.parse(v.categories) : [];
      } catch {
        categories = [v.primaryCategory];
      }

      let quickInfo: any = {};
      try {
        quickInfo = v.quickInfo ? JSON.parse(v.quickInfo) : {};
      } catch {
        quickInfo = {};
      }

      const startingPrice = v.services.length > 0
        ? Math.min(...v.services.map((s) => Number(s.price)).filter((p) => p > 0))
        : null;

      return {
        id: v.id,
        slug: v.slug,
        businessName: v.businessName,
        tagline: v.tagline,
        phone: v.phone,
        whatsappNumber: v.whatsappNumber || v.phone,
        locality: v.locality || v.city,
        city: v.city,
        address: v.address,
        primaryCategory: v.primaryCategory,
        categories,
        averageRating: Number(v.averageRating),
        ratingCount: v.ratingCount,
        reviewCount: v.reviewCount,
        isVerified: v.isVerified,
        isClaimed: v.isClaimed,
        isFeatured: v.isFeatured,
        establishmentYear: v.establishmentYear,
        distance: quickInfo.distance || '1.2 km',
        responseSpeed: quickInfo.responseSpeed || 'Responds in 15 Mins',
        tagSuggestion: quickInfo.tagSuggestion || '"Reasonably priced" 4 Suggestions',
        startingPrice,
        photos: v.media.map((m) => m.url),
        services: v.services.map((s) => ({
          id: s.id,
          title: s.title,
          price: Number(s.price),
          priceUnit: s.priceUnit,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      total: parsed.length,
      category: category || 'All Services',
      city: city || 'All Cities',
      vendors: parsed,
    });
  } catch (error: any) {
    console.error('Marketplace search API error:', error);
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 });
  }
}
