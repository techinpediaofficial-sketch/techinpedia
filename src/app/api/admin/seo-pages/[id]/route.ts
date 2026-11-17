import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { notifyIndexNow } from '@/lib/indexnow';
import { hasPermission } from '@/lib/permissions';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session, 'admin.seo_pages.view') && !hasPermission(session, 'admin.seo_pages.manage')) {
      if (session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const page = await db.seoLandingPage.findUnique({
      where: { id }
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('Error fetching SEO page:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
    const {
      internalName,
      title,
      slug,
      metaTitle,
      metaDescription,
      focusKeyword,
      canonicalUrl,
      robotsIndex,
      robotsFollow,
      ogTitle,
      ogDescription,
      ogImage,
      heroHeading,
      heroSubheading,
      heroImage,
      heroImageAlt,
      primaryCtaText,
      primaryCtaLink,
      secondaryCtaText,
      secondaryCtaLink,
      blocks,
      status
    } = body;

    const existingPage = await db.seoLandingPage.findUnique({
      where: { id }
    });

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existingPage.slug) {
      const slugExists = await db.seoLandingPage.findUnique({
        where: { slug }
      });
      if (slugExists) {
        return NextResponse.json({ error: 'Slug is already in use' }, { status: 400 });
      }

      // Add to redirect history
      await db.seoPageRedirect.create({
        data: {
          oldPath: existingPage.slug,
          newPath: slug,
          pageId: existingPage.id
        }
      });
    }

    const publishedAt = status === 'PUBLISHED' && existingPage.status !== 'PUBLISHED'
      ? new Date()
      : existingPage.publishedAt;

    const updatedPage = await db.seoLandingPage.update({
      where: { id },
      data: {
        internalName,
        title,
        slug,
        metaTitle,
        metaDescription,
        focusKeyword,
        canonicalUrl,
        robotsIndex,
        robotsFollow,
        ogTitle,
        ogDescription,
        ogImage,
        heroHeading,
        heroSubheading,
        heroImage,
        heroImageAlt,
        primaryCtaText,
        primaryCtaLink,
        secondaryCtaText,
        secondaryCtaLink,
        blocks,
        status,
        publishedAt,
        updatedBy: session.name || 'Admin'
      }
    });

    const notifyUrls: string[] = [];
    if (updatedPage.status === 'PUBLISHED') {
      notifyUrls.push(`/${updatedPage.slug}`);
      if (existingPage.slug !== updatedPage.slug && existingPage.status === 'PUBLISHED') {
        notifyUrls.push(`/${existingPage.slug}`);
      }
    } else if (existingPage.status === 'PUBLISHED') {
      notifyUrls.push(`/${existingPage.slug}`);
    }

    if (notifyUrls.length > 0) {
      notifyIndexNow(notifyUrls);
    }

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('Error updating SEO page:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session, 'admin.seo_pages.manage')) {
      if (session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const existingPage = await db.seoLandingPage.findUnique({
      where: { id }
    });

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Archive instead of delete as per requirements "Prefer archive over destructive deletion"
    if (existingPage.status !== 'ARCHIVED') {
      await db.seoLandingPage.update({
        where: { id },
        data: { status: 'ARCHIVED' }
      });
      
      if (existingPage.status === 'PUBLISHED') {
        notifyIndexNow([`/${existingPage.slug}`]);
      }
      
      return NextResponse.json({ message: 'Page archived successfully' });
    } else {
      // If already archived, hard delete
      await db.seoLandingPage.delete({
        where: { id }
      });
      return NextResponse.json({ message: 'Page deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting SEO page:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
