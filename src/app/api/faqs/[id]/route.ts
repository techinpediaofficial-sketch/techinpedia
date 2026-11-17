import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await db.faq.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'FAQ not found.' }, { status: 404 });
    }

    const { question, answer, category, displayOrder, status } = body;

    const updated = await db.faq.update({
      where: { id },
      data: {
        question: question !== undefined ? question : existing.question,
        answer: answer !== undefined ? answer : existing.answer,
        category: category !== undefined ? category : existing.category,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : existing.displayOrder,
        status: status !== undefined ? status : existing.status,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_FAQ',
      entityType: 'Faq',
      entityId: id,
    });

    return NextResponse.json({ success: true, faq: updated });
  } catch (error) {
    console.error('Update FAQ error:', error);
    return NextResponse.json({ error: 'Failed to update FAQ.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await db.faq.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_FAQ',
      entityType: 'Faq',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'FAQ deleted.' });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    return NextResponse.json({ error: 'Failed to delete FAQ.' }, { status: 500 });
  }
}
