import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, requireAuth } from '@/lib/auth';
import { notifyIndexNow } from '@/lib/indexnow';
import { logActivity } from '@/lib/activity';
import { ContentStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';

    const session = await getAuthSession();
    const where: Record<string, unknown> = session ? {} : { status: ContentStatus.PUBLISHED };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (featured) {
      where.featured = true;
    }

    const projects = await db.project.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Fetch projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const {
      title,
      slug,
      category,
      clientType,
      shortDesc,
      description,
      problem,
      solution,
      features,
      technologies,
      results,
      featuredImage,
      gallery,
      featured,
      status,
      displayOrder,
    } = body;

    if (!title || !category || !shortDesc || !description || !featuredImage) {
      return NextResponse.json({ error: 'Title, category, shortDesc, description, and featuredImage are required.' }, { status: 400 });
    }

    const cleanSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const project = await db.project.create({
      data: {
        title,
        slug: cleanSlug,
        category,
        clientType: clientType || null,
        shortDesc,
        description,
        problem: problem || null,
        solution: solution || null,
        features: typeof features === 'object' ? JSON.stringify(features) : (features || '[]'),
        technologies: typeof technologies === 'object' ? JSON.stringify(technologies) : (technologies || '[]'),
        results: typeof results === 'object' ? JSON.stringify(results) : (results || '[]'),
        featuredImage,
        gallery: typeof gallery === 'object' ? JSON.stringify(gallery) : (gallery || '[]'),
        featured: !!featured,
        status: status || ContentStatus.PUBLISHED,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_PROJECT',
      entityType: 'Project',
      entityId: project.id,
    });

    if (project.status === 'PUBLISHED') {
      notifyIndexNow([`/work/${project.slug}`]);
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Failed to create project.' }, { status: 500 });
  }
}
