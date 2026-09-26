import { db } from "@/shared/db";
import { horotokenTransactions, users } from "@/shared/db/schema";
import { and, eq, gte } from "drizzle-orm";

const DAILY_LIMIT = Number.parseInt(process.env.HOROTOKEN_DAILY_LIMIT || "10", 10);
const COOLDOWN_HOURS = Number.parseInt(process.env.HOROTOKEN_COOLDOWN_HOURS || "4", 10);
const INITIAL_BALANCE = Number.parseInt(process.env.HOROTOKEN_INITIAL_BALANCE || "5", 10);

export interface TokenCheckResult {
  allowed: boolean;
  balance: number;
  reason?: string;
  cooldownUntil?: Date;
}

export async function checkBalance(userId: string): Promise<number> {
  const rows = await db
    .select({ horotokenBalance: users.horotokenBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0]?.horotokenBalance ?? 0;
}

export async function canSpend(userId: string, amount: number): Promise<TokenCheckResult> {
  const balance = await checkBalance(userId);

  if (balance < amount) {
    return {
      allowed: false,
      balance,
      reason: `horotoken ไม่พอ (มี ${balance}, ต้องการ ${amount})`,
    };
  }

  // Check cooldown
  const cooldownUntil = await getCooldownEnd(userId);
  if (cooldownUntil && cooldownUntil > new Date()) {
    return {
      allowed: false,
      balance,
      reason: "กรุณารอสักครู่ ดูดวงไปแล้วเมื่อสักครู่",
      cooldownUntil,
    };
  }

  // Check daily limit
  const todayReadings = await getTodayReadingCount(userId);
  if (todayReadings >= DAILY_LIMIT) {
    return {
      allowed: false,
      balance,
      reason: `วันนี้ดูดวงครบแล้ว (${DAILY_LIMIT} ครั้ง/วัน) พรุ่งนี้มาใหม่นะคะ`,
    };
  }

  return { allowed: true, balance };
}

export async function spendToken(
  userId: string,
  amount: number,
  transactionType: string,
  referenceId?: string,
  description?: string,
): Promise<{ balanceBefore: number; balanceAfter: number }> {
  const balanceBefore = await checkBalance(userId);

  if (balanceBefore < amount) {
    throw new Error(`Insufficient horotoken balance: ${balanceBefore} < ${amount}`);
  }

  const balanceAfter = balanceBefore - amount;

  await db
    .update(users)
    .set({ horotokenBalance: balanceAfter, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await db.insert(horotokenTransactions).values({
    userId,
    balanceBefore,
    amount: -amount,
    balanceAfter,
    transactionType,
    referenceId: referenceId ?? null,
    description: description ?? null,
  });

  return { balanceBefore, balanceAfter };
}

export async function topUpTokens(
  userId: string,
  amount: number,
  transactionType: string,
  description?: string,
): Promise<{ balanceBefore: number; balanceAfter: number }> {
  const balanceBefore = await checkBalance(userId);
  const balanceAfter = balanceBefore + amount;

  await db
    .update(users)
    .set({ horotokenBalance: balanceAfter, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await db.insert(horotokenTransactions).values({
    userId,
    balanceBefore,
    amount,
    balanceAfter,
    transactionType,
    description: description ?? null,
  });

  return { balanceBefore, balanceAfter };
}

async function getCooldownEnd(userId: string): Promise<Date | null> {
  const rows = await db
    .select({ createdAt: horotokenTransactions.createdAt })
    .from(horotokenTransactions)
    .where(
      and(
        eq(horotokenTransactions.userId, userId),
        eq(horotokenTransactions.transactionType, "reading"),
      ),
    )
    .orderBy(horotokenTransactions.createdAt)
    .limit(1);

  if (!rows.length) return null;

  const lastReading = new Date(rows[0].createdAt as string | number | Date);
  const cooldownEnd = new Date(lastReading.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);

  return cooldownEnd > new Date() ? cooldownEnd : null;
}

async function getTodayReadingCount(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await db
    .select()
    .from(horotokenTransactions)
    .where(
      and(
        eq(horotokenTransactions.userId, userId),
        eq(horotokenTransactions.transactionType, "reading"),
        gte(horotokenTransactions.createdAt, today),
      ),
    );

  return rows.length;
}
