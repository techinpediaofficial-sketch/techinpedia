import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthSession, requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { ContentStatus } from '@prisma/client';

export async function GET() {
  try {
    const session = await getAuthSession();
    const where = session ? {} : { status: ContentStatus.PUBLISHED };

    const faqs = await db.faq.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Fetch FAQs error:', error);
    return NextResponse.json({ error: 'Failed to fetch FAQs.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { question, answer, category, displayOrder, status } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required.' }, { status: 400 });
    }

    const faq = await db.faq.create({
      data: {
        question,
        answer,
        category: category || 'General',
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        status: status || ContentStatus.PUBLISHED,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'CREATE_FAQ',
      entityType: 'Faq',
      entityId: faq.id,
    });

    return NextResponse.json({ success: true, faq });
  } catch (error) {
    console.error('Create FAQ error:', error);
    return NextResponse.json({ error: 'Failed to create FAQ.' }, { status: 500 });
  }
}
