import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { ContentStatus } from '@prisma/client';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const session = await getAuthSession().catch(() => null);
    const where: Record<string, unknown> = session ? {} : { status: ContentStatus.PUBLISHED };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const dbPosts = await db.newsPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);

    return NextResponse.json({ posts: dbPosts || [] });
  } catch (error) {
    console.error('Fetch news posts error:', error);
    return NextResponse.json({ posts: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { title, slug, excerpt, content, featuredImage, category, tags, author, seoTitle, seoDescription, status } = body;

    if (!title || !excerpt || !content || !category) {
      return NextResponse.json({ error: 'Title, excerpt, content, and category are required.' }, { status: 400 });
    }

    const cleanSlug = (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const isPublished = status === ContentStatus.PUBLISHED;

    const post = await db.newsPost.create({
      data: {
        title,
        slug: cleanSlug,
        excerpt,
        content,
        featuredImage: featuredImage || null,
        category,
        tags: tags || null,
        author: author || 'TechInPedia Team',
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt,
        status: status || ContentStatus.DRAFT,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_BLOG_POST',
      entityType: 'NewsPost',
      entityId: post.id,
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Create news post error:', error);
    return NextResponse.json({ error: 'Failed to create news post.' }, { status: 500 });
  }
}
