import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Generate unique slug
    let duplicateSlug = `${existingPage.slug}-copy`;
    let counter = 1;
    while (await db.seoLandingPage.findUnique({ where: { slug: duplicateSlug } })) {
      duplicateSlug = `${existingPage.slug}-copy-${counter}`;
      counter++;
    }

    const duplicatedPage = await db.seoLandingPage.create({
      data: {
        internalName: `${existingPage.internalName} (Copy)`,
        title: existingPage.title,
        slug: duplicateSlug,
        metaTitle: existingPage.metaTitle,
        metaDescription: existingPage.metaDescription,
        focusKeyword: existingPage.focusKeyword,
        canonicalUrl: existingPage.canonicalUrl,
        robotsIndex: existingPage.robotsIndex,
        robotsFollow: existingPage.robotsFollow,
        ogTitle: existingPage.ogTitle,
        ogDescription: existingPage.ogDescription,
        ogImage: existingPage.ogImage,
        heroHeading: existingPage.heroHeading,
        heroSubheading: existingPage.heroSubheading,
        heroImage: existingPage.heroImage,
        heroImageAlt: existingPage.heroImageAlt,
        primaryCtaText: existingPage.primaryCtaText,
        primaryCtaLink: existingPage.primaryCtaLink,
        secondaryCtaText: existingPage.secondaryCtaText,
        secondaryCtaLink: existingPage.secondaryCtaLink,
        blocks: existingPage.blocks,
        status: 'DRAFT',
        createdBy: session.name || 'Admin',
        updatedBy: session.name || 'Admin'
      }
    });

    return NextResponse.json(duplicatedPage);
  } catch (error) {
    console.error('Error duplicating SEO page:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
