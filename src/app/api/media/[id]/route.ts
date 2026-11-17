import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { deleteMediaFile } from '@/lib/storage';
import { logActivity } from '@/lib/activity';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const deleted = await deleteMediaFile(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Media file not found or deletion failed.' }, { status: 404 });
    }

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'DELETE_MEDIA',
      entityType: 'Media',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'Media file deleted.' });
  } catch (error) {
    console.error('Delete media error:', error);
    return NextResponse.json({ error: 'Failed to delete media file.' }, { status: 500 });
  }
}
