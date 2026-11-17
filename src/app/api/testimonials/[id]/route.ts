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

    const existing = await db.testimonial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Testimonial not found.' }, { status: 404 });
    }

    const { clientName, company, designation, testimonial, image, rating, displayOrder, status } = body;

    const updated = await db.testimonial.update({
      where: { id },
      data: {
        clientName: clientName !== undefined ? clientName : existing.clientName,
        company: company !== undefined ? company : existing.company,
        designation: designation !== undefined ? designation : existing.designation,
        testimonial: testimonial !== undefined ? testimonial : existing.testimonial,
        image: image !== undefined ? image : existing.image,
        rating: rating !== undefined ? parseInt(rating) : existing.rating,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : existing.displayOrder,
        status: status !== undefined ? status : existing.status,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_TESTIMONIAL',
      entityType: 'Testimonial',
      entityId: id,
    });

    return NextResponse.json({ success: true, testimonial: updated });
  } catch (error) {
    console.error('Update testimonial error:', error);
    return NextResponse.json({ error: 'Failed to update testimonial.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await db.testimonial.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_TESTIMONIAL',
      entityType: 'Testimonial',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'Testimonial deleted.' });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    return NextResponse.json({ error: 'Failed to delete testimonial.' }, { status: 500 });
  }
}
