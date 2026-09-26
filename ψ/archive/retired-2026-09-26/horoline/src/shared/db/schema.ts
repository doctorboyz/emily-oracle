import {
  boolean,
  date,
  decimal,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// === Users ===

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  lineUserId: varchar("line_user_id", { length: 64 }).unique(),
  anonymousId: varchar("anonymous_id", { length: 64 }).unique(),
  displayName: varchar("display_name", { length: 100 }),
  pronoun: varchar("pronoun", { length: 20 }).default("คุณ"),
  ageVerified: boolean("age_verified").default(false),
  ageGate: jsonb("age_gate"),
  consentRecords: jsonb("consent_records").default([]),
  tier: varchar("tier", { length: 10 }).default("free"),
  horotokenBalance: integer("horotoken_balance").default(5),
  status: varchar("status", { length: 20 }).default("active"),
  selfExcludeUntil: timestamp("self_exclude_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow(),
});

// === User Profiles (JSONB for flexibility) ===

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),

  // Tier 1: birth date only (required)
  birthDate: date("birth_date"),

  // Tier 2: birth time + location (optional)
  birthTime: time("birth_time"),
  birthLocation: jsonb("birth_location"),

  // Derived Tier 1 (computed from birth_date)
  thaiRasi: varchar("thai_rasi", { length: 20 }),
  westernSign: varchar("western_sign", { length: 20 }),
  chineseZodiac: varchar("chinese_zodiac", { length: 20 }),
  lifePathNumber: integer("life_path_number"),
  birthDayOfWeek: varchar("birth_day_of_week", { length: 15 }),
  elementThai: varchar("element_thai", { length: 10 }),
  elementChinese: varchar("element_chinese", { length: 10 }),

  // Derived Tier 2 (requires birth_time)
  lagna: varchar("lagna", { length: 20 }),
  westernRising: varchar("western_rising", { length: 20 }),
  sawaeyAyu: jsonb("sawaey_ayu"),
  naksatra: varchar("naksatra", { length: 30 }),
  thaksa: varchar("thaksa", { length: 20 }),

  // User preferences
  preferredTopics: jsonb("preferred_topics").default(["general"]),
  readingFrequency: varchar("reading_frequency", { length: 20 }).default("daily"),
  shrinePreferences: jsonb("shrine_preferences").default({}),
  customPronoun: varchar("custom_pronoun", { length: 20 }),

  // Profile tracking
  profileTier: integer("profile_tier").default(1),
  missingData: jsonb("missing_data").default([]),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// === Readings ===

export const readings = pgTable("readings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  readingType: varchar("reading_type", { length: 20 }).notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end"),
  sourcesUsed: jsonb("sources_used").default([]),
  tierUsed: integer("tier_used").default(1),
  userQuestion: text("user_question"),

  sourceReadings: jsonb("source_readings").default({}),
  convergence: jsonb("convergence").default({}),
  output: jsonb("output").default({}),
  safetyCheck: jsonb("safety_check").default({}),

  horotokenCost: integer("horotoken_cost").default(1),
  shrineRecommendations: jsonb("shrine_recommendations").default([]),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// === Horotoken Transactions ===

export const horotokenTransactions = pgTable("horotoken_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  balanceBefore: integer("balance_before").notNull(),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),

  transactionType: varchar("transaction_type", { length: 20 }).notNull(),
  referenceId: uuid("reference_id"),
  description: text("description"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// === Sessions (LINE conversation state) ===

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),

  state: varchar("state", { length: 30 }).default("idle"),
  stateData: jsonb("state_data").default({}),
  lastReadingType: varchar("last_reading_type", { length: 20 }),
  lastReadingAt: timestamp("last_reading_at", { withTimezone: true }),

  readingsToday: integer("readings_today").default(0),
  readingsTodayDate: date("readings_today_date"),

  onboardingStep: integer("onboarding_step").default(0),
  onboardingComplete: boolean("onboarding_complete").default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// === Satisfaction Ratings ===

export const satisfactionRatings = pgTable("satisfaction_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  readingId: uuid("reading_id")
    .references(() => readings.id, { onDelete: "cascade" })
    .notNull(),

  rating: smallint("rating").notNull(),
  feedbackTags: jsonb("feedback_tags").default([]),
  freeText: text("free_text"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// === Shrines ===

export const shrines = pgTable("shrines", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameTh: varchar("name_th", { length: 200 }).notNull(),
  nameEn: varchar("name_en", { length: 200 }),
  description: text("description"),

  location: jsonb("location").notNull(),
  deity: jsonb("deity").default([]),
  religion: varchar("religion", { length: 20 }),
  tradition: jsonb("tradition").default([]),
  suitableFor: jsonb("suitable_for").default([]),
  worshipGuide: jsonb("worship_guide").default({}),

  popularity: integer("popularity").default(0),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),

  // Detailed content (from knowledge/shrine/ files)
  detail: jsonb("detail").default({}),
  transport: jsonb("transport").default({}),
  tips: jsonb("tips").default({}),
  stories: jsonb("stories").default({}),
  extras: jsonb("extras").default({}),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// === Knowledge Sources ===

export const knowledgeSources = pgTable("knowledge_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  domain: varchar("domain", { length: 50 }).notNull(),
  topic: varchar("topic", { length: 100 }).notNull(),
  tier: integer("tier").default(1),
  priority: varchar("priority", { length: 2 }).default("P1"),

  content: text("content").notNull(),
  frontmatter: jsonb("frontmatter").default({}),

  version: integer("version").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// === Proactive Messages ===

export const proactiveMessages = pgTable("proactive_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  messageType: varchar("message_type", { length: 30 }).notNull(),
  readingType: varchar("reading_type", { length: 20 }),
  content: jsonb("content").notNull(),

  sentAt: timestamp("sent_at", { withTimezone: true }),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// === Chat Sessions (canvas test interface) ===

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id", { length: 100 }).primaryKey(),
  // nullable user_id — canvas sessions are anonymous until linked
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  anonymousId: varchar("anonymous_id", { length: 64 }),
  fingerprint: jsonb("fingerprint").default({}),
  birthDate: date("birth_date"),
  period: varchar("period", { length: 20 }),
  model: varchar("model", { length: 100 }),
  messageCount: integer("message_count").default(0),
  status: varchar("status", { length: 20 }).default("created"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// === Chat Messages (every message + response stored for learning) ===

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id", { length: 100 })
    .references(() => chatSessions.id, { onDelete: "cascade" })
    .notNull(),

  role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),

  // Model & inference metadata
  model: varchar("model", { length: 100 }),
  modelName: varchar("model_name", { length: 100 }),
  tokensPrompt: integer("tokens_prompt"),
  tokensCompletion: integer("tokens_completion"),
  tokensTotal: integer("tokens_total"),
  latencyMs: integer("latency_ms"),

  // Safety & confidence
  safetyCheck: jsonb("safety_check").default({}),
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00–1.00

  // Context that produced this message
  userBirthDate: date("user_birth_date"),
  userPeriod: varchar("user_period", { length: 20 }),
  derivedContext: jsonb("derived_context").default({}), // rasi, sign, element, etc.
  promptVersion: varchar("prompt_version", { length: 20 }).default("v1"),

  // Learning & analytics
  feedbackRating: smallint("feedback_rating"), // 1-5, null until user rates
  feedbackTags: jsonb("feedback_tags").default([]),
  feedbackText: text("feedback_text"), // user text feedback
  flagged: boolean("flagged").default(false), // for review/audit
  notes: text("notes"), // admin notes

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// === Audit Logs ===

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  actorType: varchar("actor_type", { length: 20 }).default("system"),
  actorId: varchar("actor_id", { length: 100 }),
  sessionId: varchar("session_id", { length: 100 }).references(() => chatSessions.id, {
    onDelete: "set null",
  }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  details: jsonb("details").default({}),
  promptVersion: varchar("prompt_version", { length: 20 }).default("v1"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// === Reading Scores (improvement metrics) ===

export const readingScores = pgTable("reading_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id")
    .references(() => chatMessages.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  sessionId: varchar("session_id", { length: 100 }).references(() => chatSessions.id, {
    onDelete: "set null",
  }),

  safetyScore: integer("safety_score"),
  qualityScore: integer("quality_score"),
  costEfficiency: integer("cost_efficiency"),

  safetyFlagsCount: integer("safety_flags_count").default(0),
  hasReframe: boolean("has_reframe").default(false),
  hasDisclaimer: boolean("has_disclaimer").default(false),
  hasPracticalAdvice: boolean("has_practical_advice").default(false),
  responseLengthBucket: varchar("response_length_bucket", { length: 10 }),
  userRating: smallint("user_rating"),
  tokensPerCharRatio: decimal("tokens_per_char_ratio", { precision: 5, scale: 2 }),
  promptVersion: varchar("prompt_version", { length: 20 }).default("v1"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
