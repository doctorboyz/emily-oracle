import type { userProfiles } from "@/shared/db/schema";

type UserProfile = typeof userProfiles.$inferSelect;
import { getMissingFields, getProfileTier } from "../profile/derived-calculator";

export type OnboardingStep =
  | "age_gate"
  | "consent"
  | "display_name"
  | "birth_date"
  | "birth_time"
  | "preferred_topics"
  | "welcome_reading"
  | "complete";

export interface OnboardingState {
  step: OnboardingStep;
  stepIndex: number;
  data: Record<string, unknown>;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  "age_gate",
  "consent",
  "display_name",
  "birth_date",
  "birth_time",
  "preferred_topics",
  "welcome_reading",
];

export function getInitialOnboardingState(): OnboardingState {
  return { step: "age_gate", stepIndex: 0, data: {} };
}

export function getNextStep(current: OnboardingStep, profile?: UserProfile): OnboardingStep | null {
  const idx = ONBOARDING_STEPS.indexOf(current);
  if (idx === -1) return null;

  // Skip birth_time if user declines (optional step)
  if (current === "birth_date" && profile?.birthTime === undefined) {
    // birth_time is optional — move to preferred_topics
    return "preferred_topics";
  }

  const next = ONBOARDING_STEPS[idx + 1];
  return next ?? null;
}

export function determineStepFromProfile(profile: UserProfile | null): OnboardingStep {
  if (!profile) return "age_gate";
  if (!profile.birthDate) return "birth_date";
  if (!profile.missingData) return "welcome_reading";

  const missing = getMissingFields(profile);
  if (missing.includes("birthDate")) return "birth_date";
  if (missing.includes("birthTime")) return "birth_time";

  return "welcome_reading";
}

export function getStepPrompt(step: OnboardingStep): string {
  const prompts: Record<OnboardingStep, string> = {
    age_gate: "ก่อนเริ่ม ขอยืนยันว่าคุณมีอายุ 15 ปีขึ้นไป ค่ะ 🙏",
    consent: "ขอสอบถามการยินยอมเก็บข้อมูลส่วนบุคคล (PDPA) ค่ะ",
    display_name: "เรียนคุณว่าอะไรดีคะ? 💫",
    birth_date: "วันเกิดของคุณคือวันไหนคะ? (เช่น 15 มกราคม 2533 หรือ 15/01/1990)",
    birth_time: "ถ้าจำเวลาเกิดได้ จะช่วยให้ดูดวงได้ละเอียดขึ้นค่ะ จำได้ไหมคะ? 🕐 (ข้ามได้ถ้าจำไม่ได้)",
    preferred_topics:
      "สนใจเรื่องอะไรเป็นพิเศษคะ? เลือกได้หลายอย่าง\n- 💼 การงาน\n- 💕 ความรัก\n- 💰 การเงิน\n- 🏥 สุขภาพ\n- 🧘 จิตวิญญาณ\n- 🎯 ทั่วไป",
    welcome_reading: "ข้อมูลครบแล้วค่ะ! ขออนุญาตทำนายรายวันให้เป็นการต้อนรับนะคะ ✨",
    complete: "ยินดีต้อนรับสู่ Horoline ค่ะ! 🌟",
  };
  return prompts[step] ?? "";
}

export function isOnboardingComplete(profile: UserProfile): boolean {
  return getProfileTier(profile) >= 1;
}
