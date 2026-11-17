import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    const pages = await db.seoLandingPage.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Error fetching public SEO pages:', error);
    return NextResponse.json({ pages: [] }, { status: 500 });
  }
}
