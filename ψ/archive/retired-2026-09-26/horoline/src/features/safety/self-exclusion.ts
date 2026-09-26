import { db } from "@/shared/db";
import { sessions, users } from "@/shared/db/schema";
import { eq } from "drizzle-orm";

export interface ExclusionResult {
  excluded: boolean;
  until: Date | null;
  reason?: string;
}

export async function startSelfExclusion(
  userId: string,
  durationHours: number = 24 * 30, // Default 30 days
): Promise<ExclusionResult> {
  const until = new Date();
  until.setHours(until.getHours() + durationHours);

  await db
    .update(users)
    .set({
      status: "self_excluded",
      selfExcludeUntil: until,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Clear session state
  await db
    .update(sessions)
    .set({ state: "excluded", stateData: {}, updatedAt: new Date() })
    .where(eq(sessions.userId, userId));

  return {
    excluded: true,
    until,
    reason: `ขออภัยที่ทำให้รู้สึกไม่สบายใจ ระบบจะพักการใช้งานของคุณชั่วคราวจนถึง ${until.toLocaleDateString("th-TH")}`,
  };
}

export async function checkExclusion(userId: string): Promise<ExclusionResult> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = rows[0];

  if (!user || user.status !== "self_excluded") {
    return { excluded: false, until: null };
  }

  const until = user.selfExcludeUntil ? new Date(user.selfExcludeUntil) : null;

  // Auto-restore if exclusion period ended
  if (until && until <= new Date()) {
    await db
      .update(users)
      .set({ status: "active", selfExcludeUntil: null, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { excluded: false, until: null };
  }

  return {
    excluded: true,
    until,
    reason: "คุณอยู่ในช่วงพักการใช้งาน",
  };
}

export async function endSelfExclusion(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ status: "active", selfExcludeUntil: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
