import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ContentStatus } from '@prisma/client';
import { requireAuth } from '@/lib/auth';
import { notifyIndexNow } from '@/lib/indexnow';
import { logActivity } from '@/lib/activity';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
    }

    const { title, slug, shortDescription, description, icon, technologies, image, seoTitle, seoDescription, status, displayOrder } = body;

    const updated = await db.service.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        slug: slug !== undefined ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : existing.slug,
        shortDescription: shortDescription !== undefined ? shortDescription : existing.shortDescription,
        description: description !== undefined ? description : existing.description,
        icon: icon !== undefined ? icon : existing.icon,
        technologies: technologies !== undefined ? (typeof technologies === 'object' ? JSON.stringify(technologies) : technologies) : existing.technologies,
        image: image !== undefined ? image : existing.image,
        seoTitle: seoTitle !== undefined ? seoTitle : existing.seoTitle,
        seoDescription: seoDescription !== undefined ? seoDescription : existing.seoDescription,
        status: status !== undefined ? status : existing.status,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : existing.displayOrder,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_SERVICE',
      entityType: 'Service',
      entityId: id,
    });

    if (updated.status === ContentStatus.PUBLISHED) {
      notifyIndexNow(`/services/${updated.slug}`);
      if (existing.status === ContentStatus.PUBLISHED && existing.slug !== updated.slug) {
        notifyIndexNow(`/services/${existing.slug}`);
      }
    } else if (existing.status === ContentStatus.PUBLISHED && true) {
      notifyIndexNow(`/services/${existing.slug}`);
    }
    return NextResponse.json({ success: true, service: updated });
  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json({ error: 'Failed to update service.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await db.service.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_SERVICE',
      entityType: 'Service',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'Service deleted.' });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json({ error: 'Failed to delete service.' }, { status: 500 });
  }
}
