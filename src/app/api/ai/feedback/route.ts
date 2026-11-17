import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { resolveEffectiveCompanyId } from '@/lib/access-policy';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { messageId, rating, correction, userQuestion } = body;
    const companyId = await resolveEffectiveCompanyId(session, body.companyId);

    if (!companyId) {
      return NextResponse.json({ error: 'No active company found. Please create or configure a company first.' }, { status: 400 });
    }

    if (!rating || !['HELPFUL', 'INCORRECT', 'NEEDS_IMPROVEMENT'].includes(rating)) {
      return NextResponse.json({ error: 'Invalid rating. Expected HELPFUL, INCORRECT, or NEEDS_IMPROVEMENT' }, { status: 400 });
    }

    const feedback = await db.aiFeedback.create({
      data: {
        companyId,
        messageId: messageId || null,
        rating,
        correction: correction?.trim() || null,
        createdById: session.userId,
      },
    });

    // If an incorrect response had a correction and a question, propose as a Knowledge Suggestion!
    if ((rating === 'INCORRECT' || rating === 'NEEDS_IMPROVEMENT') && correction && userQuestion) {
      await db.aiKnowledgeSuggestion.create({
        data: {
          companyId,
          question: userQuestion.trim(),
          proposedAnswer: correction.trim(),
          frequency: 1,
          sourceQuery: userQuestion.trim(),
          status: 'PENDING',
        },
      });
    }

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error: any) {
    console.error('Error recording AI feedback:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
