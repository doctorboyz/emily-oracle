import { db } from "@/shared/db";
import { chatSessions } from "@/shared/db/schema";
import { and, eq, lte, sql } from "drizzle-orm";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const COMPLETION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const ARCHIVE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function sweepIdleSessions(): Promise<number> {
  const idleCutoff = new Date(Date.now() - COMPLETION_TIMEOUT_MS);
  const result = await db
    .update(chatSessions)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(chatSessions.status, "idle"), lte(chatSessions.updatedAt, idleCutoff)));
  return result.count ?? 0;
}

export async function sweepActiveToIdle(): Promise<number> {
  const activeCutoff = new Date(Date.now() - IDLE_TIMEOUT_MS);
  const result = await db
    .update(chatSessions)
    .set({ status: "idle", updatedAt: new Date() })
    .where(and(eq(chatSessions.status, "active"), lte(chatSessions.updatedAt, activeCutoff)));
  return result.count ?? 0;
}

export async function sweepCompletedSessions(): Promise<number> {
  const archiveCutoff = new Date(Date.now() - ARCHIVE_TIMEOUT_MS);
  const result = await db
    .update(chatSessions)
    .set({ status: "archived", archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(chatSessions.status, "completed"), lte(chatSessions.completedAt, archiveCutoff)));
  return result.count ?? 0;
}

export async function runSessionSweep(): Promise<{
  idled: number;
  completed: number;
  archived: number;
}> {
  const idled = await sweepActiveToIdle();
  const completed = await sweepIdleSessions();
  const archived = await sweepCompletedSessions();
  return { idled, completed, archived };
}
