import type { userProfiles } from "@/shared/db/schema";

type UserProfile = typeof userProfiles.$inferSelect;
import { computeDerivedFromBirthDate } from "../profile/derived-calculator";

export interface ShrineMatch {
  shrineId: string;
  shrineNameTh: string;
  shrineNameEn: string;
  region: string;
  score: number;
  reasons: string[];
  purpose: string[];
}

const RASI_SHRINE_MAP: Record<string, string[]> = {
  เมษ: ["prosperity", "career", "success"],
  พฤษภ: ["stability", "prosperity", "health"],
  เมถุน: ["communication", "wisdom", "trade"],
  กรกฎ: ["love", "family", "protection"],
  สิงห์: ["power", "leadership", "career"],
  กันย์: ["health", "service", "wisdom"],
  ตุลย์: ["balance", "relationship", "harmony"],
  พิจิก: ["transformation", "depth", "protection"],
  ธนู: ["travel", "philosophy", "luck"],
  มังกร: ["career", "discipline", "wealth"],
  กุมภ์: ["innovation", "humanity", "wisdom"],
  มีน: ["spirituality", "letting_go", "healing"],
};

const ELEMENT_SHRINE_MAP: Record<string, string[]> = {
  ไฟ: ["prosperity", "career", "success", "power"],
  ดิน: ["stability", "health", "wealth", "discipline"],
  ลม: ["communication", "wisdom", "innovation", "trade"],
  น้ำ: ["love", "spirituality", "healing", "intuition"],
  โลหะ: ["wealth", "protection", "discipline", "strength"],
  ไม้: ["growth", "creativity", "flexibility", "new_beginnings"],
};

export function getShrineRecommendationReasons(profile: UserProfile): {
  purposes: string[];
  rasiPurposes: string[];
  elementPurposes: string[];
  dayPurposes: string[];
} {
  if (!profile.birthDate) {
    return { purposes: ["general"], rasiPurposes: [], elementPurposes: [], dayPurposes: [] };
  }

  const derived = computeDerivedFromBirthDate(new Date(profile.birthDate));
  const rasiPurposes = RASI_SHRINE_MAP[derived.thaiRasi] ?? ["general"];
  const elementPurposes = ELEMENT_SHRINE_MAP[derived.elementThai] ?? ["general"];
  const dayPurposes: string[] = [];

  // Day-specific purposes
  const dayPurposesMap: Record<string, string[]> = {
    อาทิตย์: ["power", "success", "career"],
    จันทร์: ["love", "intuition", "family"],
    อังคาร: ["courage", "energy", "protection"],
    พุธ: ["wisdom", "trade", "communication"],
    พฤหัสบดี: ["dharma", "learning", "blessings"],
    ศุกร์: ["love", "beauty", "art"],
    เสาร์: ["discipline", "endurance", "protection"],
  };

  const dayPurposesList = dayPurposesMap[derived.birthDayOfWeek];
  if (dayPurposesList) dayPurposes.push(...dayPurposesList);

  // Merge all purposes, deduplicate
  const allPurposes = [...new Set([...rasiPurposes, ...elementPurposes, ...dayPurposes])];

  return {
    purposes: allPurposes,
    rasiPurposes,
    elementPurposes,
    dayPurposes,
  };
}

export function matchShrines(
  profile: UserProfile,
  shrines: Array<{
    id: string;
    nameTh: string;
    nameEn: string;
    region: string;
    suitableFor: {
      rasi?: string[];
      element?: string[];
      purpose?: string[];
      sawaey_planet?: string[];
    };
  }>,
  preferredRegion?: string,
): ShrineMatch[] {
  if (!profile.birthDate) {
    // Return most popular shrines if no birth date
    return shrines.slice(0, 5).map((s) => ({
      shrineId: s.id,
      shrineNameTh: s.nameTh,
      shrineNameEn: s.nameEn,
      region: s.region,
      score: 0,
      reasons: ["แนะนำสถานที่ยอดนิยม"],
      purpose: s.suitableFor.purpose ?? ["general"],
    }));
  }

  const derived = computeDerivedFromBirthDate(new Date(profile.birthDate));
  const { purposes } = getShrineRecommendationReasons(profile);

  const matches: ShrineMatch[] = shrines
    .map((shrine) => {
      let score = 0;
      const reasons: string[] = [];

      // Rasi match
      if (shrine.suitableFor.rasi?.includes(derived.thaiRasi)) {
        score += 3;
        reasons.push(`ตรงกับราศี${derived.thaiRasi}`);
      }

      // Element match
      if (shrine.suitableFor.element?.includes(derived.elementThai)) {
        score += 2;
        reasons.push(`เสริมธาตุ${derived.elementThai}`);
      }

      // Purpose match
      const purposeMatch = (shrine.suitableFor.purpose ?? []).filter((p) => purposes.includes(p));
      if (purposeMatch.length > 0) {
        score += purposeMatch.length;
        reasons.push(`เหมาะกับ${purposeMatch.join("และ")}`);
      }

      // Sawaey planet match
      if (shrine.suitableFor.sawaey_planet?.includes(derived.birthDayOfWeekEn)) {
        score += 1;
        reasons.push("ตรงกับดาวเสวยอายุ");
      }

      // Region preference
      if (preferredRegion && shrine.region === preferredRegion) {
        score += 2;
        reasons.push("ใกล้คุณ");
      }

      return {
        shrineId: shrine.id,
        shrineNameTh: shrine.nameTh,
        shrineNameEn: shrine.nameEn,
        region: shrine.region,
        score,
        reasons,
        purpose: shrine.suitableFor.purpose ?? ["general"],
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  return matches.slice(0, 5);
}
