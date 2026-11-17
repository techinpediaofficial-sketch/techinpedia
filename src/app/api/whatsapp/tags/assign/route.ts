import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { contactIds = [], tag, action = 'ADD' } = body; // action: 'ADD' | 'REMOVE'

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'No contacts selected.' }, { status: 400 });
    }
    if (!tag || !tag.trim()) {
      return NextResponse.json({ error: 'Tag name is required.' }, { status: 400 });
    }

    const cleanTag = tag.trim();
    const isTenant = session.isTenant;
    const companyId = isTenant && session.companyId ? session.companyId : body.companyId || undefined;

    // Fetch contacts with tenant isolation
    const contacts = await db.contact.findMany({
      where: {
        id: { in: contactIds },
        ...(companyId ? { companyId } : {}),
      },
      select: { id: true, tags: true },
    });

    let updatedCount = 0;
    for (const c of contacts) {
      let currentTags: string[] = [];
      try {
        if (c.tags) {
          const parsed = JSON.parse(c.tags);
          if (Array.isArray(parsed)) currentTags = parsed;
          else currentTags = [c.tags];
        }
      } catch {
        currentTags = c.tags ? c.tags.split(',').map((t: string) => t.trim()) : [];
      }

      let newTags: string[] = [];
      if (action === 'ADD') {
        if (!currentTags.includes(cleanTag)) {
          newTags = [...currentTags, cleanTag];
        } else {
          newTags = currentTags;
        }
      } else {
        newTags = currentTags.filter((t) => t.toLowerCase() !== cleanTag.toLowerCase());
      }

      await db.contact.update({
        where: { id: c.id },
        data: { tags: JSON.stringify(newTags) },
      });
      updatedCount++;
    }

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: action === 'ADD' ? 'BULK_ADD_TAG' : 'BULK_REMOVE_TAG',
      entityType: 'Contact',
      metadata: { tag: cleanTag, updatedCount, totalSelected: contactIds.length },
    });

    return NextResponse.json({
      success: true,
      action,
      tag: cleanTag,
      updatedCount,
    });
  } catch (error: any) {
    console.error('Bulk tag assign error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update tags.' }, { status: 500 });
  }
}
