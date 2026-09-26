import type { ReadingOutput, UserProfile } from "@/shared/types/reading";
import { type DerivedData, computeDerivedFromBirthDate } from "../profile/derived-calculator";

export type ReadingPeriod = "daily" | "weekly" | "monthly" | "yearly" | "deep";

export interface ReadingRequest {
  userId: string;
  profile: UserProfile;
  period: ReadingPeriod;
  question?: string;
  sources?: string[];
}

export interface SourceReading {
  source: string;
  content: string;
  score: number;
  highlights: string[];
}

export interface ConvergenceInput {
  derived: DerivedData;
  period: ReadingPeriod;
  question?: string;
  sourceReadings: SourceReading[];
}

const PERIOD_CONFIG: Record<ReadingPeriod, { horotokenCost: number; maxPerDay: number }> = {
  daily: { horotokenCost: 1, maxPerDay: 3 },
  weekly: { horotokenCost: 2, maxPerDay: 2 },
  monthly: { horotokenCost: 3, maxPerDay: 1 },
  yearly: { horotokenCost: 5, maxPerDay: 1 },
  deep: { horotokenCost: 3, maxPerDay: 1 },
};

export function getPeriodConfig(period: ReadingPeriod) {
  return PERIOD_CONFIG[period];
}

export function getDerivedDataForReading(profile: UserProfile): DerivedData | null {
  if (!profile.birthDate) return null;
  return computeDerivedFromBirthDate(new Date(profile.birthDate));
}

export function buildReadingPrompt(input: ConvergenceInput): string {
  const { derived, period, question, sourceReadings } = input;

  const periodLabels: Record<ReadingPeriod, string> = {
    daily: "รายวัน",
    weekly: "รายสัปดาห์",
    monthly: "รายเดือน",
    yearly: "รายปี",
    deep: "เชิงลึก",
  };

  let prompt = `คุณคือ Horoline — ผู้ทำนายที่เข้าใจใจคน ให้การทำนาย${periodLabels[period]}\n\n`;
  prompt += "## ข้อมูลผู้ใช้\n";
  prompt += `- ราศีไทย: ${derived.thaiRasi} (${derived.thaiRasiEn})\n`;
  prompt += `- ราศีตะวันตก: ${derived.westernSignEn}\n`;
  prompt += `-ปีนักษัตร: ${derived.chineseZodiac} (${derived.chineseZodiacEn})\n`;
  prompt += `- เลขชีวิต: ${derived.lifePathNumber}\n`;
  prompt += `- วันเกิด: ${derived.birthDayOfWeek} (${derived.birthDayOfWeekEn})\n`;
  prompt += `- ธาตุไทย: ${derived.elementThai}\n`;
  prompt += `- ธาตุจีน: ${derived.elementChinese}\n`;
  prompt += `- ปีเสวย: ${derived.personalYear}\n\n`;

  if (question) {
    prompt += `## คำถามผู้ใช้\n${question}\n\n`;
  }

  if (sourceReadings.length > 0) {
    prompt += "## ตำราที่ใช้\n";
    for (const src of sourceReadings) {
      prompt += `### ${src.source}\n${src.content}\n\n`;
    }
  }

  prompt += "## กฎสำคัญ\n";
  prompt += "1. ใช้ภาษาไทยเป็นหลัก\n";
  prompt += "2. เป็นกลางๆ ไม่ใช้คำสร้างกลัว\n";
  prompt += "3. เสริมพลังงานบวก ไม่ใช่ด่าที่\n";
  prompt += "4. ให้คำแนะนำที่เป็นไปได้จริง\n";
  prompt += `5. ห้ามใช้คำว่า "ต้อง", "จะแย่", "โชคร้าย"\n`;
  prompt += "6. ทุก output ต้องผ่าน SafetyCheck\n";
  prompt += "7. ใช้การทำนายหลายตำรามารวมกัน (convergence)\n";

  return prompt;
}

export function formatReadingOutput(raw: string, period: ReadingPeriod): ReadingOutput {
  const periodLabels: Record<ReadingPeriod, string> = {
    daily: "รายวัน",
    weekly: "รายสัปดาห์",
    monthly: "รายเดือน",
    yearly: "รายปี",
    deep: "เชิงลึก",
  };

  // Split into sections: main reading and highlight
  const sections = raw.split(/\n{2,}/);
  const mainReading = sections.slice(0, -1).join("\n\n") || raw;
  const highlight = sections[sections.length - 1] || "";

  return {
    period: periodLabels[period],
    mainReading,
    summary: mainReading.split("\n")[0] || mainReading.slice(0, 100),
    highlight: highlight.length < mainReading.length ? highlight : undefined,
    practical: [],
    empower: "",
    luckyTip: "",
    sourcesDisplay: [],
  };
}
