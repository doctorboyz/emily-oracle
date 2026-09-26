// Core types for Horoline
// These interfaces match the knowledge base definitions

// === Safety Pipeline ===

export interface SafetyCheck {
  hasNegativeContent: boolean; // must be false
  hasFearLanguage: boolean; // must be false
  hasFatalisticLanguage: boolean; // must be false (no "ต้อง", "กำหนด")
  empowersUser: boolean; // must be true
  hasPracticalAdvice: boolean; // must be true
  hasDisclaimer: boolean; // must be true (when health/finance mentioned)
  respectsUserAgency: boolean; // must be true
  passesBarnumTest: boolean; // must be true (swapping signs changes reading)
}

// === Multi-Source Convergence ===

export interface SourceReading {
  source: string; // 'thai' | 'western' | 'chinese' | 'numerology' | 'tarot' | 'iching' | 'vedic'
  prediction: string; // specific prediction from this source
  confidence: number; // 0-1, how specific this source is
  data: Record<string, unknown>; // source-specific data (rasi, sign, number, etc.)
}

export interface ConvergenceResult {
  concordPoints: string[]; // points where 2+ systems agree
  complementPoints: string[]; // points where systems complement each other
  emphasis: string; // which perspective to emphasize
  tensionPoints?: string[]; // where systems disagree (framed as creative choice)
}

export interface MultiSourceReading {
  userId: string;
  date: string;
  sources: SourceReading[];
  convergence: ConvergenceResult;
  output: ReadingOutput;
  safetyCheck: SafetyCheck;
}

export interface ReadingOutput {
  period?: string; // reading period label (e.g. "รายวัน", "รายสัปดาห์")
  mainReading: string; // main reading text
  summary: string; // combined summary
  highlight?: string; // key highlight sentence
  practical: string[]; // practical advice (at least 2 specific actions)
  empower: string; // empowering closing statement
  luckyTip: string; // light lucky tip (color/number)
  sourcesDisplay: string[]; // which systems were used
}

// === User Profile ===

export interface UserProfile {
  userId: string;
  birthDate: string; // YYYY-MM-DD
  birthTime?: string; // HH:mm (optional, Tier 2)
  birthLocation?: LocationData; // optional, Tier 3

  // Derived Tier 1 (computed from birthDate)
  thaiRasi?: string;
  westernSign?: string;
  chineseZodiac?: string;
  lifePathNumber?: number;
  birthDayOfWeek?: string;
  elementThai?: string;
  elementChinese?: string;

  // Derived Tier 2 (requires birthTime)
  lagna?: string;
  westernRising?: string;
  sawaeyAyu?: SawaeAyuData;
  naksatra?: string;
  thaksa?: string;

  // Preferences
  preferredTopics: string[];
  readingFrequency: "daily" | "weekly" | "monthly";
  pronoun: string; // default 'คุณ', user can change
  displayName?: string;

  // Profile completeness
  profileTier: 1 | 2 | 3;
  missingData: MissingDataField[];
}

export interface LocationData {
  lat: number;
  lng: number;
  name: string;
}

export interface SawaeAyuData {
  planet: string;
  startAge: number;
  endAge: number;
  currentPeriod?: string; // which planet period user is currently in
}

export interface MissingDataField {
  field: string; // 'birthTime' | 'birthLocation' etc.
  label: string; // Thai label for the question
  neededFor: string; // 'Tier 2 deep reading' etc.
}

// === Horotoken ===

export interface CoolDownConfig {
  consecutiveReadingsAlert: number; // 3
  consecutiveReadingsLimit: number; // 5
  coolDownMinutes: number; // 30
  coolDownMessage: string;
  dailySpendingLimitTHB: number; // 500
  monthlySpendingAlertTHB: number; // 2000
}

export interface HorotokenTransaction {
  userId: string;
  balanceBefore: number;
  amount: number;
  balanceAfter: number;
  transactionType:
    | "reading"
    | "topup"
    | "subscription"
    | "admin_adjust"
    | "cooldown_refund"
    | "welcome_bonus";
  referenceId?: string;
  description?: string;
}

// === Reading ===

export type ReadingType = "daily" | "weekly" | "monthly" | "yearly" | "deep" | "question";

export interface ReadingRequest {
  userId: string;
  type: ReadingType;
  question?: string; // for question-based readings
  sources?: string[]; // optional: user-selected sources
  periodStart?: string; // defaults to today
}

// === Session ===

export type SessionState =
  | "idle"
  | "onboarding_age_gate"
  | "onboarding_consent"
  | "onboarding_name"
  | "onboarding_birthdate"
  | "onboarding_birthtime"
  | "onboarding_topics"
  | "reading_selecting"
  | "reading_asking"
  | "reading_in_progress"
  | "reading_result"
  | "satisfaction_survey"
  | "cooldown_active"
  | "self_exclude_confirm";

// === Shrine ===

export interface Shrine {
  id: string;
  nameTh: string;
  nameEn: string;
  description: string;
  location: ShrineLocation;
  deity: ShrineDeity[];
  religion: "buddhist" | "hindu" | "chinese" | "animist" | "mixed";
  tradition: ("thai" | "chinese" | "vedic")[];
  suitableFor: ShrineSuitability[];
  worshipGuide: ShrineWorshipGuide;
  popularity: number;
  rating: number;
}

export interface ShrineLocation {
  lat: number;
  lng: number;
  province: string;
  district: string;
  address: string;
  googleMapsUrl?: string;
  openingHours?: string;
}

export interface ShrineDeity {
  id: string;
  nameTh: string;
  nameEn: string;
}

export interface ShrineSuitability {
  rasi?: string[];
  element?: string[];
  lifePath?: number[];
  purpose?: string; // 'career' | 'love' | 'health' | 'prosperity' | 'spiritual'
  sawaeyPlanet?: string[];
}

export interface ShrineWorshipGuide {
  offering: string;
  prayer: string;
  etiquette: string;
}

// === Satisfaction ===

export interface SatisfactionRating {
  userId: string;
  readingId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedbackTags: string[];
  freeText?: string;
}

// === Age Gate ===

export interface AgeGate {
  minimumAge: number; // 13
  restrictedAge: number; // 18
  premiumMinimumAge: number; // 18
  parentalConsentRequired: boolean; // true
  verificationMethod: "self_declaration" | "id_verification";
}

// === Consent ===

export interface ConsentRecord {
  userId: string;
  consentType: "registration" | "prediction" | "marketing" | "analytics";
  granted: boolean;
  grantedAt: Date | null;
  revokedAt: Date | null;
  version: string;
  method: "explicit" | "implicit";
}
