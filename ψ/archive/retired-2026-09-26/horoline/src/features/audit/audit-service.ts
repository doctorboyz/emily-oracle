import { db } from "@/shared/db";
import { auditLogs } from "@/shared/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export interface AuditEvent {
  eventType: string;
  actorType?: string;
  actorId?: string;
  sessionId?: string;
  userId?: string;
  details?: Record<string, unknown>;
  promptVersion?: string;
}

export async function logAudit(event: AuditEvent): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      eventType: event.eventType,
      actorType: event.actorType ?? "system",
      actorId: event.actorId ?? null,
      sessionId: event.sessionId ?? null,
      userId: event.userId ?? null,
      details: event.details ?? {},
      promptVersion: event.promptVersion ?? "v1",
    });
  } catch (err) {
    // Audit logging must never break the main flow
    console.error("Audit log error:", err);
  }
}

export async function logAuditBatch(events: AuditEvent[]): Promise<void> {
  try {
    await db.insert(auditLogs).values(
      events.map((e) => ({
        eventType: e.eventType,
        actorType: e.actorType ?? "system",
        actorId: e.actorId ?? null,
        sessionId: e.sessionId ?? null,
        userId: e.userId ?? null,
        details: e.details ?? {},
        promptVersion: e.promptVersion ?? "v1",
      })),
    );
  } catch (err) {
    console.error("Audit batch log error:", err);
  }
}

export async function getAuditEvents(filter: {
  eventType?: string;
  sessionId?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const conditions = [];
  if (filter.eventType) conditions.push(eq(auditLogs.eventType, filter.eventType));
  if (filter.sessionId) conditions.push(eq(auditLogs.sessionId, filter.sessionId));
  if (filter.userId) conditions.push(eq(auditLogs.userId, filter.userId));

  const query = db
    .select()
    .from(auditLogs)
    .where(conditions.length > 0 ? sql`${sql.join(conditions, sql` AND `)}` : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(filter.limit ?? 100);

  return query;
}

export async function getAuditSummary(from: Date, to: Date) {
  const events = await db
    .select()
    .from(auditLogs)
    .where(sql`${auditLogs.createdAt} >= ${from} AND ${auditLogs.createdAt} <= ${to}`);

  const byType: Record<string, number> = {};
  let errorCount = 0;
  let safetyFlagCount = 0;

  for (const e of events) {
    byType[e.eventType] = (byType[e.eventType] ?? 0) + 1;
    if (e.eventType.startsWith("error.")) errorCount++;
    if (e.eventType.startsWith("safety.")) safetyFlagCount++;
  }

  return {
    totalEvents: events.length,
    byType,
    errorCount,
    safetyFlagRate: events.length > 0 ? safetyFlagCount / events.length : 0,
  };
}
