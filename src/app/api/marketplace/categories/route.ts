import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode'); // 'B2C' or 'B2B' or null
    const city = searchParams.get('city');

    const where: any = { status: 'ACTIVE' };
    if (mode && (mode === 'B2C' || mode === 'B2B')) {
      where.mode = mode;
    }

    const categories = await db.marketplaceCategory.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });

    // Get vendor counts by category
    const vendorWhere: any = { status: 'ACTIVE' };
    if (city && city !== 'All' && city !== 'Select Location') {
      vendorWhere.city = { contains: city };
    }

    const vendors = await db.marketplaceVendor.findMany({
      where: vendorWhere,
      select: {
        id: true,
        primaryCategory: true,
        categories: true,
      },
    });

    // Compute dynamic vendor count per category
    const formattedCategories = categories.map((cat) => {
      let popularItems: string[] = [];
      if (cat.popularItems) {
        try {
          const parsed = JSON.parse(cat.popularItems);
          if (Array.isArray(parsed)) popularItems = parsed;
        } catch {}
      }

      // Count matching vendors
      const matchingCount = vendors.filter((v) => {
        if (v.primaryCategory.toLowerCase() === cat.name.toLowerCase()) return true;
        if (v.categories) {
          try {
            const catArr = JSON.parse(v.categories);
            if (Array.isArray(catArr) && catArr.some((c: string) => c.toLowerCase() === cat.name.toLowerCase())) {
              return true;
            }
          } catch {}
        }
        return false;
      }).length;

      // Subcategories if this is a parent
      const childCategories = categories
        .filter((sub) => sub.parentId === cat.id)
        .map((sub) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          iconName: sub.iconName,
          tagline: sub.tagline,
        }));

      const displayCount = matchingCount > 0 ? `${matchingCount}+` : '5+';

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        mode: cat.mode,
        parentId: cat.parentId,
        tagline: cat.tagline || '',
        iconName: cat.iconName || 'Wrench',
        popularItems,
        displayOrder: cat.displayOrder,
        count: displayCount,
        vendorCount: matchingCount,
        subcategories: childCategories,
      };
    });

    return NextResponse.json({
      success: true,
      total: formattedCategories.length,
      categories: formattedCategories,
    });
  } catch (error: any) {
    console.error('Marketplace categories GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch categories' }, { status: 500 });
  }
}
