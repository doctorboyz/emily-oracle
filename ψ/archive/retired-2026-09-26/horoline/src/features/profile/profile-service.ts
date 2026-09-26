import { db } from "@/shared/db";
import { userProfiles, users } from "@/shared/db/schema";
import { eq } from "drizzle-orm";
import { computeDerivedFromBirthDate } from "./derived-calculator";

export interface ProfileData {
  displayName?: string;
  pronoun?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: Record<string, unknown>;
  preferredTopics?: string[];
  readingFrequency?: string;
  customPronoun?: string;
  aiTrainingConsent?: boolean;
}

export interface ProfileResponse {
  anonymousId: string;
  displayName: string | null;
  pronoun: string;
  birthDate: string | null;
  birthTime: string | null;
  birthLocation: Record<string, unknown> | null;
  preferredTopics: string[];
  readingFrequency: string;
  profileTier: number;
  aiTrainingConsent: boolean;
  derived: {
    thaiRasi: string | null;
    thaiRasiEn: string | null;
    westernSign: string | null;
    westernSignEn: string | null;
    chineseZodiac: string | null;
    chineseZodiacEn: string | null;
    lifePathNumber: number | null;
    birthDayOfWeek: string | null;
    birthDayOfWeekEn: string | null;
    elementThai: string | null;
    elementChinese: string | null;
    personalYear: number | null;
  } | null;
  missingData: string[];
}

export async function getOrCreateProfile(anonymousId: string): Promise<ProfileResponse> {
  // Ensure user exists
  const userId = await findOrCreateUser(anonymousId);

  // Find or create profile
  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  let profile: typeof userProfiles.$inferSelect;
  if (existing.length > 0) {
    profile = existing[0];
  } else {
    const [created] = await db.insert(userProfiles).values({ userId }).returning();
    profile = created;
  }

  // Get user for display name / pronoun
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  // Compute derived data if birthDate exists
  let derived: ProfileResponse["derived"] = null;
  if (profile.birthDate) {
    const d = computeDerivedFromBirthDate(new Date(profile.birthDate));
    derived = {
      thaiRasi: d.thaiRasi,
      thaiRasiEn: d.thaiRasiEn,
      westernSign: d.westernSign,
      westernSignEn: d.westernSignEn,
      chineseZodiac: d.chineseZodiac,
      chineseZodiacEn: d.chineseZodiacEn,
      lifePathNumber: d.lifePathNumber,
      birthDayOfWeek: d.birthDayOfWeek,
      birthDayOfWeekEn: d.birthDayOfWeekEn,
      elementThai: d.elementThai,
      elementChinese: d.elementChinese,
      personalYear: d.personalYear,
    };
  }

  const missingData = getMissingFields(profile);

  // Extract aiTrainingConsent from user consentRecords
  const consentRecords = (user?.consentRecords as Array<Record<string, unknown>>) ?? [];
  const aiTrainingRecord = consentRecords.find(
    (r: Record<string, unknown>) => r.type === "ai_training",
  );
  const aiTrainingConsent = aiTrainingRecord ? aiTrainingRecord.granted === true : false;

  return {
    anonymousId,
    displayName: user?.displayName ?? null,
    pronoun: user?.pronoun ?? "คุณ",
    birthDate: profile.birthDate ?? null,
    birthTime: profile.birthTime ?? null,
    birthLocation: profile.birthLocation as Record<string, unknown> | null,
    preferredTopics: (profile.preferredTopics as string[]) ?? ["general"],
    readingFrequency: profile.readingFrequency ?? "daily",
    profileTier: profile.profileTier ?? 0,
    aiTrainingConsent,
    derived,
    missingData,
  };
}

export async function updateProfile(
  anonymousId: string,
  data: ProfileData,
): Promise<ProfileResponse> {
  const userId = await findOrCreateUser(anonymousId);

  // Update user fields
  const userUpdates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.displayName !== undefined) userUpdates.displayName = data.displayName;
  if (data.pronoun !== undefined) userUpdates.pronoun = data.pronoun;
  if (data.customPronoun !== undefined) userUpdates.pronoun = data.customPronoun;

  // Handle AI training consent — store in consentRecords JSONB
  if (data.aiTrainingConsent !== undefined) {
    const [existingUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const existingRecords = (existingUser?.consentRecords as Array<Record<string, unknown>>) ?? [];
    const filtered = existingRecords.filter(
      (r: Record<string, unknown>) => r.type !== "ai_training",
    );
    filtered.push({
      type: "ai_training",
      granted: data.aiTrainingConsent,
      timestamp: new Date().toISOString(),
      version: "v1",
    });
    userUpdates.consentRecords = filtered;
  }

  if (Object.keys(userUpdates).length > 1) {
    await db.update(users).set(userUpdates).where(eq(users.id, userId));
  }

  // Find or create profile
  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const profileUpdates: Record<string, unknown> = { updatedAt: new Date() };

  if (data.birthDate !== undefined) {
    profileUpdates.birthDate = data.birthDate || null;
    // Recompute derived data
    if (data.birthDate) {
      const d = computeDerivedFromBirthDate(new Date(data.birthDate));
      profileUpdates.thaiRasi = d.thaiRasi;
      profileUpdates.westernSign = d.westernSign;
      profileUpdates.chineseZodiac = d.chineseZodiac;
      profileUpdates.lifePathNumber = d.lifePathNumber;
      profileUpdates.birthDayOfWeek = d.birthDayOfWeek;
      profileUpdates.elementThai = d.elementThai;
      profileUpdates.elementChinese = d.elementChinese;
      profileUpdates.profileTier = 1;
    } else {
      profileUpdates.profileTier = 0;
    }
  }

  if (data.birthTime !== undefined) {
    profileUpdates.birthTime = data.birthTime || null;
    if (data.birthTime && data.birthDate) {
      profileUpdates.profileTier = 2;
    }
  }

  if (data.birthLocation !== undefined) {
    profileUpdates.birthLocation = data.birthLocation || null;
  }

  if (data.preferredTopics !== undefined) {
    profileUpdates.preferredTopics = data.preferredTopics;
  }

  if (data.readingFrequency !== undefined) {
    profileUpdates.readingFrequency = data.readingFrequency;
  }

  if (existing.length > 0) {
    await db.update(userProfiles).set(profileUpdates).where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({
      userId,
      ...profileUpdates,
    });
  }

  return getOrCreateProfile(anonymousId);
}

async function findOrCreateUser(anonymousId: string): Promise<string> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.anonymousId, anonymousId))
    .limit(1);

  if (existing.length > 0) {
    // Update last active
    await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, existing[0].id));
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

function getMissingFields(profile: typeof userProfiles.$inferSelect): string[] {
  const missing: string[] = [];
  if (!profile.birthDate) missing.push("birthDate");
  if (!profile.birthTime) missing.push("birthTime");
  if (!profile.birthLocation) missing.push("birthLocation");
  return missing;
}
