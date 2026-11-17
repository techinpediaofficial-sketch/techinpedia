import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const mode = searchParams.get('mode');

    const where: any = {};
    if (parentId === 'root') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    if (mode && (mode === 'B2C' || mode === 'B2B')) {
      where.mode = mode;
    }

    const categories = await db.marketplaceCategory.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    // Also fetch all parent categories to map parent names
    const allCategories = await db.marketplaceCategory.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
    });

    const categoryMap = new Map<string, { id: string; name: string; slug: string }>();
    allCategories.forEach((c) => categoryMap.set(c.id, c));

    // Get vendor counts per category
    const vendors = await db.marketplaceVendor.findMany({
      select: { primaryCategory: true, categories: true },
    });

    const enriched = categories.map((cat) => {
      const parent = cat.parentId ? categoryMap.get(cat.parentId) : null;
      const subcategoriesCount = allCategories.filter((c) => c.parentId === cat.id).length;

      let popularItems: string[] = [];
      try {
        if (cat.popularItems) popularItems = JSON.parse(cat.popularItems);
      } catch {}

      const vendorCount = vendors.filter((v) => {
        if (v.primaryCategory.toLowerCase() === cat.name.toLowerCase()) return true;
        try {
          if (v.categories) {
            const arr = JSON.parse(v.categories);
            if (Array.isArray(arr) && arr.some((x: string) => x.toLowerCase() === cat.name.toLowerCase())) {
              return true;
            }
          }
        } catch {}
        return false;
      }).length;

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        mode: cat.mode,
        parentId: cat.parentId,
        parentName: parent ? parent.name : null,
        parentSlug: parent ? parent.slug : null,
        subcategoriesCount,
        tagline: cat.tagline,
        iconName: cat.iconName,
        popularItems,
        displayOrder: cat.displayOrder,
        status: cat.status,
        vendorCount,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      total: enriched.length,
      categories: enriched,
      parentOptions: allCategories.filter((c) => !c.parentId),
    });
  } catch (error: any) {
    console.error('Admin categories GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, mode, parentId, tagline, iconName, popularItems, displayOrder, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const generatedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await db.marketplaceCategory.findUnique({
      where: { slug: generatedSlug },
    });

    if (existing) {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
    }

    const newCategory = await db.marketplaceCategory.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
        mode: mode || 'B2C',
        parentId: parentId || null,
        tagline: tagline ? tagline.trim() : null,
        iconName: iconName || 'Wrench',
        popularItems: Array.isArray(popularItems) ? JSON.stringify(popularItems) : null,
        displayOrder: Number(displayOrder) || 0,
        status: status || 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error: any) {
    console.error('Admin category POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, slug, mode, parentId, tagline, iconName, popularItems, displayOrder, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (slug) {
      updateData.slug = slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    if (mode) updateData.mode = mode;
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (tagline !== undefined) updateData.tagline = tagline ? tagline.trim() : null;
    if (iconName !== undefined) updateData.iconName = iconName;
    if (popularItems !== undefined) {
      updateData.popularItems = Array.isArray(popularItems) ? JSON.stringify(popularItems) : null;
    }
    if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);
    if (status !== undefined) updateData.status = status;

    const updated = await db.marketplaceCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    console.error('Admin category PUT error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Check if category has subcategories
    const childCount = await db.marketplaceCategory.count({ where: { parentId: id } });
    if (childCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. It contains ${childCount} active subcategories. Delete or reassign them first.` },
        { status: 400 }
      );
    }

    await db.marketplaceCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin category DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
