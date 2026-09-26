import { db } from "@/shared/db";
import { readingScores } from "@/shared/db/schema";
import { desc, eq, sql } from "drizzle-orm";

const PRACTICAL_ADVICE_KEYWORDS = [
  "แนะนำ",
  "ลอง",
  "ทำได้",
  "เป็นไปได้",
  "วิธี",
  "ควร",
  "เตรียม",
  "ระวัง",
  "หลีกเลี่ยง",
  "ปรับปรุง",
  "ข้อเสนอ",
  "เคล็ดลับ",
  "ทางเลือก",
];

const CULTURAL_MARKER_KEYWORDS = [
  "ราศี",
  "ธาตุ",
  "ดวง",
  "ชะตา",
  "นักษัตร",
  "เลขชีวิต",
  "ปีเสวย",
  "วันเกิด",
  "สวดมนต์",
  "บูชา",
  "ศาลเจ้า",
  "พระ",
  "บุญ",
  "กรรม",
  "เสริมดวง",
];

export interface ScoreInput {
  safetyCheck: Record<string, boolean>;
  content: string;
  tokensTotal: number;
  model: string;
  hasReframe: boolean;
  hasDisclaimer: boolean;
  promptVersion: string;
}

export interface ScoreResult {
  safetyScore: number; // 1-100
  qualityScore: number; // 1-100
  costEfficiency: number; // 1-100
  safetyFlagsCount: number;
  hasReframe: boolean;
  hasDisclaimer: boolean;
  hasPracticalAdvice: boolean;
  responseLengthBucket: "short" | "medium" | "long";
  tokensPerCharRatio: number;
  promptVersion: string;
}

function countSafetyFlags(safetyCheck: Record<string, boolean>): number {
  const flagKeys = [
    "hasFearLanguage",
    "hasDeterministicLanguage",
    "hasMedicalClaim",
    "hasFinancialAdvice",
    "hasNegativeContent",
  ];
  return flagKeys.filter((k) => safetyCheck[k]).length;
}

function hasKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

function getResponseLengthBucket(len: number): "short" | "medium" | "long" {
  if (len < 200) return "short";
  if (len <= 800) return "medium";
  return "long";
}

export function calculateScores(input: ScoreInput): ScoreResult {
  const { safetyCheck, content, tokensTotal, model, hasReframe, hasDisclaimer, promptVersion } =
    input;
  const contentLength = content.length;
  const flagsCount = countSafetyFlags(safetyCheck);
  const hasPractical = hasKeyword(content, PRACTICAL_ADVICE_KEYWORDS);
  const hasCultural = hasKeyword(content, CULTURAL_MARKER_KEYWORDS);
  const lengthBucket = getResponseLengthBucket(contentLength);
  const tokensPerCharRatio =
    contentLength > 0 ? Number((tokensTotal / contentLength).toFixed(2)) : 0;

  // Safety Score (1-100): start 100, -25 per flag, +10 if caught+fixed
  let safetyScore = 100;
  safetyScore -= flagsCount * 25;
  if (hasReframe) safetyScore += 10;
  if (hasDisclaimer) safetyScore += 10;
  safetyScore = Math.max(1, Math.min(100, safetyScore));

  // Quality Score (1-100): baseline 40, add bonuses
  let qualityScore = 40;
  if (hasPractical) qualityScore += 20;
  if (lengthBucket === "medium") qualityScore += 20;
  if (hasCultural) qualityScore += 10;
  qualityScore = Math.max(1, Math.min(100, qualityScore));

  // Cost Efficiency (1-100): lower tokens/char = better
  let costEfficiency = 100 - Math.min(tokensPerCharRatio * 10, 80);
  if (model.includes("haiku") || model.includes("flash") || model.includes("cloud"))
    costEfficiency += 10;
  costEfficiency = Math.round(Math.max(1, Math.min(100, costEfficiency)));

  return {
    safetyScore,
    qualityScore,
    costEfficiency,
    safetyFlagsCount: flagsCount,
    hasReframe,
    hasDisclaimer,
    hasPracticalAdvice: hasPractical,
    responseLengthBucket: lengthBucket,
    tokensPerCharRatio,
    promptVersion,
  };
}

export async function saveScores(
  sessionId: string,
  messageId: string,
  scores: ScoreResult,
): Promise<void> {
  try {
    await db.insert(readingScores).values({
      messageId,
      sessionId,
      safetyScore: scores.safetyScore,
      qualityScore: scores.qualityScore,
      costEfficiency: scores.costEfficiency,
      safetyFlagsCount: scores.safetyFlagsCount,
      hasReframe: scores.hasReframe,
      hasDisclaimer: scores.hasDisclaimer,
      hasPracticalAdvice: scores.hasPracticalAdvice,
      responseLengthBucket: scores.responseLengthBucket,
      tokensPerCharRatio: Math.min(scores.tokensPerCharRatio, 999.99).toFixed(2),
      promptVersion: scores.promptVersion,
    });
  } catch (err) {
    console.error("Score save error:", err);
  }
}

export async function getScoreSummary(from: Date, to: Date) {
  const scores = await db
    .select()
    .from(readingScores)
    .where(sql`${readingScores.createdAt} >= ${from} AND ${readingScores.createdAt} <= ${to}`);

  if (scores.length === 0) {
    return {
      totalMessages: 0,
      avgSafetyScore: 0,
      avgQualityScore: 0,
      avgCostEfficiency: 0,
      safetyFlagRate: 0,
      averageRating: 0,
    };
  }

  const sum = (field: "safetyScore" | "qualityScore" | "costEfficiency") =>
    scores.reduce((acc, s) => acc + (s[field] ?? 0), 0);

  const ratedScores = scores.filter((s) => s.userRating !== null);
  const avgRating =
    ratedScores.length > 0
      ? ratedScores.reduce((acc, s) => acc + (s.userRating ?? 0), 0) / ratedScores.length
      : 0;

  return {
    totalMessages: scores.length,
    avgSafetyScore: Math.round(sum("safetyScore") / scores.length),
    avgQualityScore: Math.round(sum("qualityScore") / scores.length),
    avgCostEfficiency: Math.round(sum("costEfficiency") / scores.length),
    safetyFlagRate: scores.filter((s) => (s.safetyFlagsCount ?? 0) > 0).length / scores.length,
    averageRating: Math.round(avgRating * 10) / 10,
  };
}

export async function getScoreTrend(days: number) {
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const scores = await db
    .select()
    .from(readingScores)
    .where(sql`${readingScores.createdAt} >= ${from}`)
    .orderBy(desc(readingScores.createdAt));

  // Group by date
  const byDate: Record<string, { safety: number[]; quality: number[]; cost: number[] }> = {};
  for (const s of scores) {
    const date = (s.createdAt as Date).toISOString().slice(0, 10);
    if (!byDate[date]) byDate[date] = { safety: [], quality: [], cost: [] };
    if (s.safetyScore !== null) byDate[date].safety.push(s.safetyScore);
    if (s.qualityScore !== null) byDate[date].quality.push(s.qualityScore);
    if (s.costEfficiency !== null) byDate[date].cost.push(s.costEfficiency);
  }

  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      safetyScore: avg(v.safety),
      qualityScore: avg(v.quality),
      costEfficiency: avg(v.cost),
    }));
}
