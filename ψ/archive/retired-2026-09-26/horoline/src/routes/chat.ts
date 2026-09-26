import { Hono } from "hono";
import {
  AVAILABLE_MODELS,
  getDefaultModelId,
  getModelInfo,
  getRandomModelId,
  sendChat,
} from "../ai/openrouter-client";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "../ai/system-prompt";
import { findOrCreateAnonymousUser } from "../features/audit/anon-user-service";
import { logAudit } from "../features/audit/audit-service";
import { completeSession, ensureSession, saveMessage } from "../features/chat/chat-session-service";
import { canSpend, spendToken } from "../features/horotoken/token-balance";
import { computeDerivedFromBirthDate } from "../features/profile/derived-calculator";
import { getOrCreateProfile } from "../features/profile/profile-service";
import {
  type ReadingPeriod,
  buildReadingPrompt,
  formatReadingOutput,
  getPeriodConfig,
} from "../features/reading/reading-engine";
import { checkSafety, insertDisclaimer, reframeWithCBT } from "../features/safety/safety-checker";
import {
  calculateScores,
  getScoreSummary,
  getScoreTrend,
  saveScores,
} from "../features/scoring/score-service";
import { LRUCache } from "../shared/middleware/lru-cache";
import { chatSchema, endSessionSchema, idleSchema, rateSchema } from "../shared/validation/schemas";

// === Chat Canvas API Routes ===
// This is a test interface — NOT for production LINE integration

export const chatRoutes = new Hono();

// Store conversation history per session (LRU: max 500 sessions, 1hr TTL)
const sessions = new LRUCache<string, Array<{ role: "user" | "assistant"; content: string }>>(
  500,
  60 * 60 * 1000,
);

// GET /api/chat/models — list available models
chatRoutes.get("/models", (c) => {
  return c.json({
    models: Object.entries(AVAILABLE_MODELS).map(([key, model]) => ({
      key,
      id: model.id,
      name: model.name,
      description: model.description,
      cost: model.cost,
      thaiQuality: model.thaiQuality,
      speed: model.speed,
      provider: model.provider,
    })),
    default: getDefaultModelId(),
  });
});

// POST /api/chat — main chat endpoint
chatRoutes.post("/", async (c) => {
  const startTime = Date.now();

  const parsed = chatSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);
  }
  const body = parsed.data;

  if (!body.message?.trim()) {
    return c.json({ error: "กรุณาพิมพ์ข้อความ" }, 400);
  }

  const sessionId = body.sessionId ?? crypto.randomUUID?.() ?? `s-${Date.now()}`;
  const modelId = body.model ?? getRandomModelId();

  // Resolve or create anonymous user
  let userId: string | undefined;
  if (body.anonymousId) {
    try {
      userId = await findOrCreateAnonymousUser(body.anonymousId);
    } catch {
      // Non-blocking — proceed without user linkage
    }
  }

  // Get or create session history
  const history = sessions.get(sessionId) ?? [];
  history.push({ role: "user", content: body.message });

  // Build context from profile + birth date
  let userContext = "";
  let derivedContext: Record<string, unknown> | undefined;

  // Load profile if anonymousId provided
  let userProfile: {
    displayName: string | null;
    pronoun: string;
    preferredTopics: string[];
  } | null = null;
  if (body.anonymousId) {
    try {
      const profile = await getOrCreateProfile(body.anonymousId);
      userProfile = {
        displayName: profile.displayName,
        pronoun: profile.pronoun,
        preferredTopics: profile.preferredTopics,
      };
      // Use profile birthDate if not provided in request
      if (!body.birthDate && profile.birthDate) {
        body.birthDate = profile.birthDate;
      }
    } catch {
      // Non-blocking — proceed without profile
    }
  }

  if (body.birthDate) {
    try {
      const derived = computeDerivedFromBirthDate(new Date(body.birthDate));
      userContext = "\n## ข้อมูลผู้ใช้\n";
      if (userProfile?.displayName) {
        userContext += `- ชื่อ: ${userProfile.displayName}\n`;
      }
      if (userProfile?.pronoun) {
        userContext += `- เรียกผู้ใช้ว่า: ${userProfile.pronoun}\n`;
      }
      userContext += `- ราศีไทย: ${derived.thaiRasi} (${derived.thaiRasiEn})\n- ราศีตะวันตก: ${derived.westernSignEn}\n- ปีนักษัตร: ${derived.chineseZodiac} (${derived.chineseZodiacEn})\n- เลขชีวิต: ${derived.lifePathNumber}\n- วันเกิด: ${derived.birthDayOfWeek} (${derived.birthDayOfWeekEn})\n- ธาตุไทย: ${derived.elementThai}\n- ธาตุจีน: ${derived.elementChinese}\n- ปีเสวย: ${derived.personalYear}\n`;
      if (
        userProfile?.preferredTopics &&
        userProfile.preferredTopics.length > 0 &&
        !(userProfile.preferredTopics.length === 1 && userProfile.preferredTopics[0] === "general")
      ) {
        userContext += `- สนใจเรื่อง: ${userProfile.preferredTopics.join(", ")}\n`;
      }
      derivedContext = {
        thaiRasi: derived.thaiRasi,
        thaiRasiEn: derived.thaiRasiEn,
        westernSignEn: derived.westernSignEn,
        chineseZodiac: derived.chineseZodiac,
        chineseZodiacEn: derived.chineseZodiacEn,
        lifePathNumber: derived.lifePathNumber,
        birthDayOfWeek: derived.birthDayOfWeek,
        birthDayOfWeekEn: derived.birthDayOfWeekEn,
        elementThai: derived.elementThai,
        elementChinese: derived.elementChinese,
        personalYear: derived.personalYear,
      };
    } catch {
      // Invalid date, skip context
    }
  } else if (userProfile) {
    // No birthDate but have profile name/pronoun
    userContext = "\n## ข้อมูลผู้ใช้\n";
    if (userProfile.displayName) {
      userContext += `- ชื่อ: ${userProfile.displayName}\n`;
    }
    if (userProfile.pronoun && userProfile.pronoun !== "คุณ") {
      userContext += `- เรียกผู้ใช้ว่า: ${userProfile.pronoun}\n`;
    }
  }

  // Build reading prompt if period specified
  let readingContext = "";
  if (body.period) {
    const config = getPeriodConfig(body.period);
    if (!config) {
      return c.json(
        {
          error: `ประเภทการทำนายไม่ถูกต้อง: ${body.period} (ใช้ daily, weekly, monthly, yearly, deep)`,
        },
        400,
      );
    }
    readingContext = `\n## ประเภทการทำนาย\n- ประเภท: ${body.period}\n- ค่า horotoken: ${config.horotokenCost}\n`;
  }

  // Token balance enforcement
  const horotokenCost = body.period ? (getPeriodConfig(body.period)?.horotokenCost ?? 1) : 1;
  if (userId) {
    const check = await canSpend(userId, horotokenCost);
    if (!check.allowed) {
      return c.json({ error: check.reason, code: "TOKEN_INSUFFICIENT" }, 402);
    }
  }

  // Build messages for OpenRouter
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT + userContext + readingContext },
    ...history.slice(-10), // Keep last 10 messages for context
  ];

  // Audit: session created (only for new sessions)
  if (sessions.get(sessionId) === undefined) {
    logAudit({
      eventType: "session.created",
      actorType: "user",
      actorId: body.anonymousId,
      sessionId,
      userId,
      details: {
        source: "canvas",
        model: modelId,
        hasBirthDate: !!body.birthDate,
        period: body.period,
      },
      promptVersion: PROMPT_VERSION,
    });
  }

  try {
    const response = await sendChat(messages, { model: modelId });
    const latencyMs = Date.now() - startTime;

    // Audit: model call
    logAudit({
      eventType: "model.call",
      actorType: "user",
      actorId: body.anonymousId,
      sessionId,
      userId,
      details: {
        model: response.model,
        modelName: response.modelName,
        tokensPrompt: response.tokensUsed.prompt,
        tokensCompletion: response.tokensUsed.completion,
        tokensTotal: response.tokensUsed.total,
        latencyMs,
      },
      promptVersion: PROMPT_VERSION,
    });

    // Safety check on output
    const safetyResult = checkSafety(response.text);

    let finalText = response.text;
    if (safetyResult.needsCBTReframe) {
      finalText = reframeWithCBT(finalText);
      logAudit({
        eventType: "safety.reframed",
        sessionId,
        userId,
        details: { flags: ["needsCBTReframe"] },
        promptVersion: PROMPT_VERSION,
      });
    }
    if (safetyResult.disclaimerNeeded) {
      const disclaimerType = safetyResult.hasMedicalClaim
        ? ("medical" as const)
        : safetyResult.hasFinancialAdvice
          ? ("financial" as const)
          : ("general" as const);
      finalText = insertDisclaimer(finalText, disclaimerType);
      logAudit({
        eventType: "safety.disclaimer_added",
        sessionId,
        userId,
        details: { type: disclaimerType },
        promptVersion: PROMPT_VERSION,
      });
    }

    if (safetyResult.hasFearLanguage || safetyResult.hasDeterministicLanguage) {
      logAudit({
        eventType: "safety.flagged",
        sessionId,
        userId,
        details: {
          hasNegativeContent: safetyResult.hasNegativeContent,
          hasFearLanguage: safetyResult.hasFearLanguage,
          hasDeterministicLanguage: safetyResult.hasDeterministicLanguage,
          hasMedicalClaim: safetyResult.hasMedicalClaim,
          hasFinancialAdvice: safetyResult.hasFinancialAdvice,
        },
        promptVersion: PROMPT_VERSION,
      });
    }

    // Store assistant response in memory
    history.push({ role: "assistant", content: finalText });
    sessions.set(sessionId, history);

    // Calculate reading scores (1-5 scale)
    const scores = calculateScores({
      safetyCheck: {
        hasNegativeContent: safetyResult.hasNegativeContent,
        hasFearLanguage: safetyResult.hasFearLanguage,
        hasMedicalClaim: safetyResult.hasMedicalClaim,
        hasFinancialAdvice: safetyResult.hasFinancialAdvice,
        needsReframe: safetyResult.needsCBTReframe,
      },
      content: finalText,
      tokensTotal: response.tokensUsed.total,
      model: response.model,
      hasReframe: safetyResult.needsCBTReframe,
      hasDisclaimer: safetyResult.disclaimerNeeded,
      promptVersion: PROMPT_VERSION,
    });

    // Persist to database (sequential — session must exist before messages)
    const safetyCheck = {
      hasNegativeContent: safetyResult.hasNegativeContent,
      hasFearLanguage: safetyResult.hasFearLanguage,
      hasMedicalClaim: safetyResult.hasMedicalClaim,
      hasFinancialAdvice: safetyResult.hasFinancialAdvice,
      needsReframe: safetyResult.needsCBTReframe,
      disclaimerAdded: safetyResult.disclaimerNeeded,
    };

    let savedAssistantId: string | undefined;

    try {
      await ensureSession(sessionId, {
        birthDate: body.birthDate,
        period: body.period,
        model: modelId,
        anonymousId: body.anonymousId,
        userId,
      });

      await saveMessage(sessionId, "user", body.message, {
        userBirthDate: body.birthDate,
        userPeriod: body.period,
        promptVersion: PROMPT_VERSION,
      });

      const savedMsg = await saveMessage(sessionId, "assistant", finalText, {
        model: response.model,
        modelName: response.modelName,
        tokensPrompt: response.tokensUsed.prompt,
        tokensCompletion: response.tokensUsed.completion,
        tokensTotal: response.tokensUsed.total,
        latencyMs,
        safetyCheck,
        userBirthDate: body.birthDate,
        userPeriod: body.period,
        derivedContext,
        promptVersion: PROMPT_VERSION,
      });

      savedAssistantId = savedMsg.id;

      // Deduct token after successful save
      if (userId) {
        await spendToken(userId, horotokenCost, "chat_prediction", savedAssistantId);
      }

      // Calculate and save reading scores
      const scores = calculateScores({
        safetyCheck,
        content: finalText,
        tokensTotal: response.tokensUsed.total,
        model: response.model,
        hasReframe: safetyResult.needsCBTReframe,
        hasDisclaimer: safetyResult.disclaimerNeeded,
        promptVersion: PROMPT_VERSION,
      });

      await saveScores(sessionId, savedAssistantId, scores);
    } catch (dbErr) {
      console.error("DB persist error:", dbErr);
      logAudit({
        eventType: "error.db",
        sessionId,
        userId,
        details: { operation: "persist_message", error: String(dbErr) },
        promptVersion: PROMPT_VERSION,
      });
    }

    return c.json({
      text: finalText,
      model: response.model,
      modelName: response.modelName,
      tokensUsed: response.tokensUsed,
      latencyMs,
      safetyCheck: {
        hasNegativeContent: safetyResult.hasNegativeContent,
        hasFearLanguage: safetyResult.hasFearLanguage,
        needsReframe: safetyResult.needsCBTReframe,
        disclaimerAdded: safetyResult.disclaimerNeeded,
      },
      scores: scores
        ? { safety: scores.safetyScore, quality: scores.qualityScore, cost: scores.costEfficiency }
        : undefined,
      sessionId,
      messageId: savedAssistantId ?? null,
      promptVersion: PROMPT_VERSION,
    });
  } catch (error) {
    console.error("Chat error:", error);
    logAudit({
      eventType: "error.api",
      actorId: body.anonymousId,
      sessionId,
      userId,
      details: {
        endpoint: "/api/chat",
        error: error instanceof Error ? error.message : String(error),
      },
      promptVersion: PROMPT_VERSION,
    });
    return c.json(
      {
        error: "ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง",
      },
      500,
    );
  }
});

// POST /api/chat/rate — rate a message (for learning)
chatRoutes.post("/rate", async (c) => {
  const parsed = rateSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);
  }
  const body = parsed.data;
  const { rateMessage } = await import("../features/chat/chat-session-service");
  await rateMessage(body.messageId, body.rating, body.tags, body.feedbackText);

  logAudit({
    eventType: "rating.submitted",
    actorType: "user",
    details: {
      messageId: body.messageId,
      rating: body.rating,
      tags: body.tags,
      feedbackText: body.feedbackText,
    },
    promptVersion: PROMPT_VERSION,
  });

  return c.json({ ok: true });
});

// POST /api/chat/end-session — end conversation
chatRoutes.post("/end-session", async (c) => {
  const parsed = endSessionSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);
  }
  const { sessionId } = parsed.data;
  await completeSession(sessionId);
  sessions.delete(sessionId);

  logAudit({
    eventType: "session.completed",
    sessionId,
    details: { reason: "user_action" },
    promptVersion: PROMPT_VERSION,
  });

  return c.json({ ok: true, status: "completed" });
});

// POST /api/chat/idle — beacon for page unload
chatRoutes.post("/idle", async (c) => {
  try {
    const parsed = idleSchema.safeParse(await c.req.json());
    if (parsed.success && parsed.data.sessionId) {
      const body = parsed.data;
      logAudit({
        eventType: "session.idle",
        sessionId: body.sessionId,
        actorId: body.anonymousId,
        details: { reason: "page_unload" },
        promptVersion: PROMPT_VERSION,
      });
    }
  } catch {
    // Beacon endpoint — never fail
  }
  return c.json({ ok: true });
});

// DELETE /api/chat/session — clear in-memory session
chatRoutes.delete("/session", (c) => {
  const sessionId = c.req.query("sessionId") ?? "default";
  sessions.delete(sessionId);
  return c.json({ ok: true, message: "Session cleared" });
});

// GET /api/chat/scores/summary — aggregate score metrics
chatRoutes.get("/scores/summary", async (c) => {
  const fromDate = c.req.query("from");
  const toDate = c.req.query("to");
  const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = toDate ? new Date(toDate) : new Date();
  const summary = await getScoreSummary(from, to);
  return c.json(summary);
});

// GET /api/chat/scores/trend — daily score averages
chatRoutes.get("/scores/trend", async (c) => {
  const days = Number.parseInt(c.req.query("days") ?? "30");
  const trend = await getScoreTrend(days);
  return c.json(trend);
});
