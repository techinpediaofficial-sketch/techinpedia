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

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const {
      title,
      slug,
      category,
      clientType,
      shortDesc,
      description,
      problem,
      solution,
      features,
      technologies,
      results,
      featuredImage,
      gallery,
      featured,
      status,
      displayOrder,
    } = body;

    const updated = await db.project.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        slug: slug !== undefined ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : existing.slug,
        category: category !== undefined ? category : existing.category,
        clientType: clientType !== undefined ? clientType : existing.clientType,
        shortDesc: shortDesc !== undefined ? shortDesc : existing.shortDesc,
        description: description !== undefined ? description : existing.description,
        problem: problem !== undefined ? problem : existing.problem,
        solution: solution !== undefined ? solution : existing.solution,
        features: features !== undefined ? (typeof features === 'object' ? JSON.stringify(features) : features) : existing.features,
        technologies: technologies !== undefined ? (typeof technologies === 'object' ? JSON.stringify(technologies) : technologies) : existing.technologies,
        results: results !== undefined ? (typeof results === 'object' ? JSON.stringify(results) : results) : existing.results,
        featuredImage: featuredImage !== undefined ? featuredImage : existing.featuredImage,
        gallery: gallery !== undefined ? (typeof gallery === 'object' ? JSON.stringify(gallery) : gallery) : existing.gallery,
        featured: featured !== undefined ? !!featured : existing.featured,
        status: status !== undefined ? status : existing.status,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : existing.displayOrder,
      },
    });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_PROJECT',
      entityType: 'Project',
      entityId: id,
    });

    if (updated.status === ContentStatus.PUBLISHED) {
      notifyIndexNow(`/work/${updated.slug}`);
      if (existing.status === ContentStatus.PUBLISHED && existing.slug !== updated.slug) {
        notifyIndexNow(`/work/${existing.slug}`);
      }
    } else if (existing.status === ContentStatus.PUBLISHED && true) {
      notifyIndexNow(`/work/${existing.slug}`);
    }
    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json({ error: 'Failed to update project.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    await db.project.delete({ where: { id } });

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_PROJECT',
      entityType: 'Project',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'Project deleted.' });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json({ error: 'Failed to delete project.' }, { status: 500 });
  }
}
