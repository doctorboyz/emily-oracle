import { db } from "@/shared/db";
import { users } from "@/shared/db/schema";
import { eq } from "drizzle-orm";

type User = typeof users.$inferSelect;

export interface ConsentRecord {
  type: "pdpa" | "terms" | "marketing";
  version: string;
  acceptedAt: string;
  ipAddress?: string;
}

const CURRENT_CONSENT_VERSION = "1.0";

export async function recordConsent(
  userId: string,
  type: ConsentRecord["type"],
  accepted: boolean,
  ipAddress?: string,
): Promise<User> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]) throw new Error("User not found");

  const existing: ConsentRecord[] = (user[0].consentRecords as ConsentRecord[]) ?? [];
  const record: ConsentRecord = {
    type,
    version: CURRENT_CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    ipAddress,
  };

  // Replace existing record of same type, append new
  const updated = existing.filter((r) => r.type !== type);
  if (accepted) updated.push(record);

  const [result] = await db
    .update(users)
    .set({ consentRecords: updated, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return result;
}

export async function hasConsent(userId: string, type: ConsentRecord["type"]): Promise<boolean> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]) return false;

  const records: ConsentRecord[] = (user[0].consentRecords as ConsentRecord[]) ?? [];
  return records.some((r) => r.type === type);
}

export async function deleteUserData(userId: string): Promise<void> {
  // PDPA right to erasure — cascade deletes profile, sessions, readings, etc.
  await db.delete(users).where(eq(users.id, userId));
}
