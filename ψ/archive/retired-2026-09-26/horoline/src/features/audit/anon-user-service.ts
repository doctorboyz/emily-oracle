import { db } from "@/shared/db";
import { users } from "@/shared/db/schema";
import { eq } from "drizzle-orm";

export async function findOrCreateAnonymousUser(anonymousId: string): Promise<string> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.anonymousId, anonymousId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [created] = await db
    .insert(users)
    .values({
      anonymousId,
      lineUserId: `anon_${anonymousId.slice(0, 16)}`,
      displayName: "ผู้ใช้ทดสอบ",
      tier: "free",
      horotokenBalance: 5,
    })
    .returning({ id: users.id });

  return created.id;
}

export async function findUserByAnonymousId(anonymousId: string): Promise<string | null> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.anonymousId, anonymousId))
    .limit(1);

  return rows.length > 0 ? rows[0].id : null;
}

export async function linkAnonymousToUser(anonymousId: string, lineUserId: string): Promise<void> {
  const anonUser = await findUserByAnonymousId(anonymousId);
  if (!anonUser) return;

  await db.update(users).set({ lineUserId }).where(eq(users.id, anonUser));
}
