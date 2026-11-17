import { db } from './db';

export async function logActivity(params: {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | string | null;
  details?: string | null;
}) {
  try {
    const metaString = params.details 
      ? params.details 
      : typeof params.metadata === 'object' && params.metadata !== null 
      ? JSON.stringify(params.metadata) 
      : (params.metadata as string | null);

    await db.activityLog.create({
      data: {
        userId: params.userId,
        userEmail: params.userEmail,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: metaString,
      },
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}
