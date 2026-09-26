import { db } from "@/shared/db";
import { users } from "@/shared/db/schema";
import { eq } from "drizzle-orm";

type User = typeof users.$inferSelect;

const MINIMUM_AGE = 15;

export interface AgeGateResult {
  passed: boolean;
  age: number | null;
  reason?: string;
}

export function verifyAge(birthDate: Date): AgeGateResult {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < MINIMUM_AGE) {
    return {
      passed: false,
      age,
      reason: `ต้องมีอายุ ${MINIMUM_AGE} ปีขึ้นไป`,
    };
  }

  return { passed: true, age };
}

export async function setAgeVerified(userId: string): Promise<User> {
  const [updated] = await db
    .update(users)
    .set({ ageVerified: true, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}

export async function setAgeGate(
  userId: string,
  birthDate: string,
  passed: boolean,
): Promise<User> {
  const [updated] = await db
    .update(users)
    .set({
      ageVerified: passed,
      ageGate: { birthDate, passed, verifiedAt: new Date().toISOString() },
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  return updated;
}
