import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { note } = body;

    if (!note || typeof note !== 'string' || note.trim() === '') {
      return NextResponse.json({ error: 'Note text cannot be empty.' }, { status: 400 });
    }

    const newNote = await db.enquiryNote.create({
      data: {
        enquiryId: id,
        userId: session.userId,
        note: note.trim(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'ADD_ENQUIRY_NOTE',
      entityType: 'Enquiry',
      entityId: id,
      metadata: { noteId: newNote.id },
    });

    return NextResponse.json({ success: true, note: newNote });
  } catch (error) {
    console.error('Add enquiry note error:', error);
    return NextResponse.json({ error: 'Failed to add note.' }, { status: 500 });
  }
}
