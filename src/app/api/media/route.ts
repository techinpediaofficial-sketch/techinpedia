import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { uploadMediaFile } from '@/lib/storage';
import { logActivity } from '@/lib/activity';

export async function GET() {
  try {
    await requireAuth();
    const media = await db.media.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ media });
  } catch (error) {
    console.error('Fetch media list error:', error);
    return NextResponse.json({ error: 'Failed to fetch media list.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const uploaded = await uploadMediaFile(file);

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPLOAD_MEDIA',
      entityType: 'Media',
      entityId: uploaded.id,
      metadata: { filename: uploaded.filename, url: uploaded.url, size: uploaded.size },
    });

    return NextResponse.json({ success: true, media: uploaded });
  } catch (error) {
    console.error('Media upload error:', error);
    const msg = error instanceof Error ? error.message : 'Upload failed.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
