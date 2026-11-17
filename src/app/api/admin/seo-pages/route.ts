import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { notifyIndexNow } from '@/lib/indexnow';
import { hasPermission } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session, 'admin.seo_pages.view') && !hasPermission(session, 'admin.seo_pages.manage')) {
      if (session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { internalName: { contains: search } },
        { title: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const [total, pages] = await Promise.all([
      db.seoLandingPage.count({ where }),
      db.seoLandingPage.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      })
    ]);

    return NextResponse.json({
      pages,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching SEO pages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session, 'admin.seo_pages.manage')) {
      if (session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { internalName, title, slug } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }

    const existingPage = await db.seoLandingPage.findUnique({
      where: { slug }
    });

    if (existingPage) {
      return NextResponse.json({ error: 'Slug is already in use' }, { status: 400 });
    }

    const newPage = await db.seoLandingPage.create({
      data: {
        internalName: internalName || title,
        title,
        slug,
        status: 'DRAFT',
        createdBy: session.name || 'Admin',
        updatedBy: session.name || 'Admin',
      }
    });

    return NextResponse.json(newPage);
  } catch (error) {
    console.error('Error creating SEO page:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
