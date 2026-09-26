import { db } from "@/shared/db";
import { userProfiles, users } from "@/shared/db/schema";
import { eq } from "drizzle-orm";

type UserInsert = typeof users.$inferInsert;

export async function findUserByLineId(lineUserId: string) {
  const rows = await db.select().from(users).where(eq(users.lineUserId, lineUserId)).limit(1);
  return rows[0] ?? null;
}

export async function createUser(data: UserInsert) {
  const [user] = await db.insert(users).values(data).returning();
  // Create empty profile
  await db.insert(userProfiles).values({ userId: user.id });
  return user;
}

export async function findOrCreateUser(lineUserId: string, displayName?: string) {
  const existing = await findUserByLineId(lineUserId);
  if (existing) return existing;
  return createUser({
    lineUserId,
    displayName: displayName ?? null,
    pronoun: "คุณ",
    tier: "free",
    horotokenBalance: 5,
    status: "active",
  });
}

export async function updateUser(id: string, data: Partial<typeof users.$inferInsert>) {
  const [updated] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated;
}

export async function getUserProfile(userId: string) {
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function updateProfile(
  userId: string,
  data: Partial<typeof userProfiles.$inferInsert>,
) {
  const existing = await getUserProfile(userId);
  if (!existing) {
    const [profile] = await db
      .insert(userProfiles)
      .values({ userId, ...data })
      .returning();
    return profile;
  }
  const [profile] = await db
    .update(userProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userProfiles.userId, userId))
    .returning();
  return profile;
}

export async function deleteUser(id: string) {
  await db.delete(users).where(eq(users.id, id));
}
