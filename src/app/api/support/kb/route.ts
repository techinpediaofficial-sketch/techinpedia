import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const visibility = searchParams.get('visibility');
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (category) where.category = category;
    if (visibility) where.visibility = visibility;
    if (search.trim()) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const articles = await db.knowledgeArticle.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    const categories = await db.knowledgeArticle.groupBy({
      by: ['category'],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      articles,
      categories,
    });
  } catch (error) {
    console.error('Fetch knowledge base error:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge articles.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { title, category = 'General', content, visibility = 'INTERNAL' } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 });
    }

    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const article = await db.knowledgeArticle.create({
      data: {
        title,
        slug,
        category,
        content,
        visibility,
      },
    });

    await logActivity({
      userId: session.userId,
      action: 'CREATE',
      entityType: 'KB_ARTICLE',
      entityId: article.id,
      details: `Created knowledge article: ${title} (${visibility})`,
    });

    return NextResponse.json({ success: true, article });
  } catch (error) {
    console.error('Create knowledge article error:', error);
    return NextResponse.json({ error: 'Failed to create article.' }, { status: 500 });
  }
}
