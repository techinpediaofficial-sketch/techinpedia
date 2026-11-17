import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, requireAuth } from '@/lib/auth';
import { notifyIndexNow } from '@/lib/indexnow';
import { logActivity } from '@/lib/activity';
import { ContentStatus } from '@prisma/client';

import { SERVICES_CATALOG } from '@/lib/servicesCatalog';

export async function GET() {
  try {
    const session = await getAuthSession().catch(() => null);
    const where = session ? {} : { status: ContentStatus.PUBLISHED };

    const dbServices = await db.service.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    }).catch(() => []);

    if (dbServices && dbServices.length > 0) {
      return NextResponse.json({ services: dbServices });
    }

    const catalogServices = Object.values(SERVICES_CATALOG).map((s, idx) => ({
      id: `cat-${s.slug}`,
      title: s.title,
      slug: s.slug,
      shortDescription: s.shortDescription,
      description: s.description,
      icon: s.category === 'Marketing & Growth' ? 'Megaphone' : 'Code2',
      technologies: JSON.stringify(s.technologies),
      image: '/og-image.jpg',
      seoTitle: s.seoTitle,
      seoDescription: s.seoDescription,
      status: 'PUBLISHED',
      displayOrder: idx + 1,
    }));

    return NextResponse.json({ services: catalogServices });
  } catch (error) {
    console.error('Fetch services error:', error);
    const fallback = Object.values(SERVICES_CATALOG).map((s, idx) => ({
      id: `cat-${s.slug}`,
      title: s.title,
      slug: s.slug,
      shortDescription: s.shortDescription,
      description: s.description,
      icon: 'Code2',
      technologies: JSON.stringify(s.technologies),
      image: '/og-image.jpg',
      seoTitle: s.seoTitle,
      seoDescription: s.seoDescription,
      status: 'PUBLISHED',
      displayOrder: idx + 1,
    }));
    return NextResponse.json({ services: fallback });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { title, slug, shortDescription, description, icon, technologies, image, seoTitle, seoDescription, status, displayOrder } = body;

    if (!title || !shortDescription || !description) {
      return NextResponse.json({ error: 'Title, short description, and description are required.' }, { status: 400 });
    }

    const cleanSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const service = await db.service.create({
      data: {
        title,
        slug: cleanSlug,
        shortDescription,
        description,
        icon: icon || 'Code',
        technologies: typeof technologies === 'object' ? JSON.stringify(technologies) : (technologies || '[]'),
        image: image || null,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || shortDescription,
        status: status || ContentStatus.PUBLISHED,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_SERVICE',
      entityType: 'Service',
      entityId: service.id,
    });

    if (service.status === 'PUBLISHED') {
      notifyIndexNow([`/services/${service.slug}`]);
    }

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ error: 'Failed to create service.' }, { status: 500 });
  }
}
