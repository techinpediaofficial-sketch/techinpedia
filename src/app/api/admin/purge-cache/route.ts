import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST() {
  try {
    const session = await requireAuth();

    // Revalidate root layout and all primary public routes
    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/about');
    revalidatePath('/services');
    revalidatePath('/work');
    revalidatePath('/workflows');
    revalidatePath('/blog');
    revalidatePath('/contact');
    revalidatePath('/start-project');

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      action: 'PURGE_CACHE',
      entityType: 'SystemCache',
      metadata: { timestamp: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      message: 'Website cache successfully purged and live content synchronized.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Purge cache error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to purge cache' },
      { status: 500 }
    );
  }
}
