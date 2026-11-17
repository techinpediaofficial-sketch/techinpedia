import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, requireAuth } from '@/lib/auth';
import { notifyIndexNow } from '@/lib/indexnow';
import { logActivity } from '@/lib/activity';
import { ContentStatus } from '@prisma/client';

import { getAllCatalogBlogs } from '@/lib/blogsCatalog';

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

    const dbPosts = await db.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);

    if (dbPosts && dbPosts.length > 0) {
      return NextResponse.json({ posts: dbPosts });
    }

    // Fallback to catalog blogs
    let catalogPosts = getAllCatalogBlogs();
    if (category && category !== 'All') {
      catalogPosts = catalogPosts.filter((p) => p.category === category);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase();
      catalogPosts = catalogPosts.filter(
        (p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ posts: catalogPosts });
  } catch (error) {
    console.error('Fetch blog posts error:', error);
    return NextResponse.json({ posts: getAllCatalogBlogs() });
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

    const post = await db.blogPost.create({
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
      entityType: 'BlogPost',
      entityId: post.id,
    });

    if (isPublished) notifyIndexNow(`/blog/${cleanSlug}`);
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Create blog post error:', error);
    return NextResponse.json({ error: 'Failed to create blog post.' }, { status: 500 });
  }
}
