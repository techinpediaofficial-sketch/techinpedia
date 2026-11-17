import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    const where: any = { status: 'ACTIVE' };
    if (city && city !== 'All') {
      where.city = { contains: city };
    }

    let vendors = await db.marketplaceVendor.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { averageRating: 'desc' }],
      take: 8,
      include: {
        media: {
          where: { mediaType: 'PHOTO' },
          take: 3,
          orderBy: { displayOrder: 'asc' },
        },
        services: {
          where: { status: 'ACTIVE' },
          take: 2,
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (vendors.length === 0 && city && city !== 'All') {
      vendors = await db.marketplaceVendor.findMany({
        where: { status: 'ACTIVE' },
        orderBy: [{ isFeatured: 'desc' }, { averageRating: 'desc' }],
        take: 8,
        include: {
          media: {
            where: { mediaType: 'PHOTO' },
            take: 3,
            orderBy: { displayOrder: 'asc' },
          },
          services: {
            where: { status: 'ACTIVE' },
            take: 2,
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
    }


    const formatted = vendors.map((v) => {
      let quickInfo: any = {};
      if (v.quickInfo) {
        try {
          quickInfo = JSON.parse(v.quickInfo);
        } catch {}
      }

      return {
        id: v.id,
        slug: v.slug,
        name: v.businessName,
        tagline: v.tagline,
        category: v.primaryCategory,
        city: `${v.locality ? v.locality + ', ' : ''}${v.city}`,
        rating: Number(v.averageRating),
        reviews: v.reviewCount,
        badge: v.isVerified ? 'Verified Partner' : 'Registered Business',
        phone: v.phone,
        whatsappNumber: v.whatsappNumber || v.phone,
        distance: quickInfo.distance || '2.0 km',
        responseSpeed: quickInfo.responseSpeed || 'Responds in 15 Mins',
        image: v.media[0]?.url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
        services: v.services.map((s) => ({
          title: s.title,
          price: Number(s.price),
          unit: s.priceUnit,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      vendors: formatted,
    });
  } catch (error: any) {
    console.error('Marketplace spotlight GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch spotlight vendors' }, { status: 500 });
  }
}
