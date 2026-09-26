import {
  type RasiResult,
  calculatePersonalYear,
  calculateRasiFromBirthDate,
} from "@/shared/constants/thai-rasi";
import type { userProfiles } from "@/shared/db/schema";

type UserProfile = typeof userProfiles.$inferSelect;

export interface DerivedData {
  thaiRasi: string;
  thaiRasiEn: string;
  westernSign: string;
  westernSignEn: string;
  chineseZodiac: string;
  chineseZodiacEn: string;
  lifePathNumber: number;
  birthDayOfWeek: string;
  birthDayOfWeekEn: string;
  elementThai: string;
  elementChinese: string;
  personalYear: number;
}

export function computeDerivedFromBirthDate(birthDate: Date): DerivedData {
  const result: RasiResult = calculateRasiFromBirthDate(birthDate);
  return {
    thaiRasi: result.thaiRasi,
    thaiRasiEn: result.thaiRasiEn,
    westernSign: result.westernSign,
    westernSignEn: result.westernSignEn,
    chineseZodiac: result.chineseZodiac,
    chineseZodiacEn: result.chineseZodiacEn,
    lifePathNumber: result.lifePathNumber,
    birthDayOfWeek: result.birthDayOfWeek,
    birthDayOfWeekEn: result.birthDayOfWeekEn,
    elementThai: result.elementThai,
    elementChinese: result.elementChinese,
    personalYear: result.personalYear,
  };
}

export function getMissingFields(profile: UserProfile): string[] {
  const missing: string[] = [];
  if (!profile.birthDate) missing.push("birthDate");
  // Tier 2 fields
  if (!profile.birthTime) missing.push("birthTime");
  if (!profile.birthLocation) missing.push("birthLocation");
  return missing;
}

export function getProfileTier(profile: UserProfile): number {
  if (!profile.birthDate) return 0;
  if (profile.birthTime) return 2;
  return 1;
}
