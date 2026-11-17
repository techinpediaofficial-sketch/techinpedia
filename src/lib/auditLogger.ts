import { db } from '@/lib/db';

export interface AuditDiff {
  field: string;
  before: any;
  after: any;
}

export interface LogAuditParams {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  details?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Computes field-level difference between two object states.
 */
export function computeObjectDiff(
  before?: Record<string, any> | null,
  after?: Record<string, any> | null
): AuditDiff[] {
  if (!before && !after) return [];
  const diffs: AuditDiff[] = [];

  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);

  // Keys to ignore during diff comparison
  const ignoredKeys = new Set(['updatedAt', 'password', 'createdAt', 'rawWebhookPayload']);

  for (const key of keys) {
    if (ignoredKeys.has(key)) continue;

    const valBefore = before ? before[key] : undefined;
    const valAfter = after ? after[key] : undefined;

    // Convert dates to timestamps for comparison
    const normBefore = valBefore instanceof Date ? valBefore.getTime() : valBefore;
    const normAfter = valAfter instanceof Date ? valAfter.getTime() : valAfter;

    if (JSON.stringify(normBefore) !== JSON.stringify(normAfter)) {
      diffs.push({
        field: key,
        before: valBefore !== undefined ? valBefore : null,
        after: valAfter !== undefined ? valAfter : null,
      });
    }
  }

  return diffs;
}

/**
 * Centrally records an auditable event with structured before/after diff tracking.
 */
export async function logAuditEvent(params: LogAuditParams) {
  try {
    const diffs = computeObjectDiff(params.before, params.after);

    const metadataPayload: Record<string, any> = {
      diffs,
      details: params.details || null,
      ip: params.ip || null,
      userAgent: params.userAgent || null,
    };

    if (params.before) metadataPayload.beforeSnapshot = params.before;
    if (params.after) metadataPayload.afterSnapshot = params.after;

    const record = await db.activityLog.create({
      data: {
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        metadata: JSON.stringify(metadataPayload),
      },
    });

    return record;
  } catch (error) {
    console.error('[AuditLogger] Failed to record audit log:', error);
    return null;
  }
}
