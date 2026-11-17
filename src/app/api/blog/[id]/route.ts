import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { notifyIndexNow } from '@/lib/indexnow';
import { logActivity } from '@/lib/activity';
import { ContentStatus } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await db.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
    }

    const { title, slug, excerpt, content, featuredImage, category, tags, author, seoTitle, seoDescription, status } = body;
    const isNewPublish = status === ContentStatus.PUBLISHED && existing.status !== ContentStatus.PUBLISHED;

    const updated = await db.blogPost.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        slug: slug !== undefined ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : existing.slug,
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        content: content !== undefined ? content : existing.content,
        featuredImage: featuredImage !== undefined ? featuredImage : existing.featuredImage,
        category: category !== undefined ? category : existing.category,
        tags: tags !== undefined ? tags : existing.tags,
        author: author !== undefined ? author : existing.author,
        seoTitle: seoTitle !== undefined ? seoTitle : existing.seoTitle,
        seoDescription: seoDescription !== undefined ? seoDescription : existing.seoDescription,
        status: status !== undefined ? status : existing.status,
        publishedAt: isNewPublish ? new Date() : existing.publishedAt,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_BLOG_POST',
      entityType: 'BlogPost',
      entityId: id,
    });

    if (updated.status === ContentStatus.PUBLISHED) {
      notifyIndexNow(`/blog/${updated.slug}`);
      if (existing.status === ContentStatus.PUBLISHED && existing.slug !== updated.slug) {
        notifyIndexNow(`/blog/${existing.slug}`);
      }
    } else if (existing.status === ContentStatus.PUBLISHED && true) {
      notifyIndexNow(`/blog/${existing.slug}`); // notify unpublish
    }
    return NextResponse.json({ success: true, post: updated });
  } catch (error) {
    console.error('Update blog post error:', error);
    return NextResponse.json({ error: 'Failed to update blog post.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await db.blogPost.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_BLOG_POST',
      entityType: 'BlogPost',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'Blog post deleted.' });
  } catch (error) {
    console.error('Delete blog post error:', error);
    return NextResponse.json({ error: 'Failed to delete blog post.' }, { status: 500 });
  }
}
