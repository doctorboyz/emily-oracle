import { db } from "@/shared/db";
import { chatMessages, chatSessions } from "@/shared/db/schema";
import { desc, eq } from "drizzle-orm";

// Ensure session exists before saving messages (avoids FK violation)
export async function ensureSession(
  sessionId: string,
  data: {
    userId?: string;
    birthDate?: string;
    period?: string;
    model?: string;
    anonymousId?: string;
  },
) {
  const existing = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);

  if (existing.length > 0) {
    const currentStatus = existing[0].status;
    const updateData: Record<string, unknown> = {
      messageCount: (existing[0].messageCount ?? 0) + 1,
      updatedAt: new Date(),
    };
    if (data.birthDate) updateData.birthDate = data.birthDate;
    if (data.period) updateData.period = data.period;
    if (data.model) updateData.model = data.model;
    if (data.userId) updateData.userId = data.userId;
    if (data.anonymousId) updateData.anonymousId = data.anonymousId;

    // Transition: created/idle → active
    if (currentStatus === "created" || currentStatus === "idle") {
      updateData.status = "active";
    }

    await db.update(chatSessions).set(updateData).where(eq(chatSessions.id, sessionId));
  } else {
    await db.insert(chatSessions).values({
      id: sessionId,
      userId: data.userId ?? null,
      anonymousId: data.anonymousId ?? null,
      birthDate: data.birthDate ?? null,
      period: data.period ?? null,
      model: data.model ?? null,
      messageCount: 1,
      status: "created",
    });
  }
}

export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  meta?: {
    model?: string;
    modelName?: string;
    tokensPrompt?: number;
    tokensCompletion?: number;
    tokensTotal?: number;
    latencyMs?: number;
    safetyCheck?: Record<string, unknown>;
    confidence?: number;
    userBirthDate?: string;
    userPeriod?: string;
    derivedContext?: Record<string, unknown>;
    promptVersion?: string;
  },
) {
  const [msg] = await db
    .insert(chatMessages)
    .values({
      sessionId,
      role,
      content,
      model: meta?.model ?? null,
      modelName: meta?.modelName ?? null,
      tokensPrompt: meta?.tokensPrompt ?? null,
      tokensCompletion: meta?.tokensCompletion ?? null,
      tokensTotal: meta?.tokensTotal ?? null,
      latencyMs: meta?.latencyMs ?? null,
      safetyCheck: meta?.safetyCheck ?? null,
      confidence: meta?.confidence ? String(meta.confidence) : null,
      userBirthDate: meta?.userBirthDate ?? null,
      userPeriod: meta?.userPeriod ?? null,
      derivedContext: meta?.derivedContext ?? null,
      promptVersion: meta?.promptVersion ?? "v1",
    })
    .returning();
  return msg;
}

export async function getSessionHistory(sessionId: string, limit = 20) {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

export async function rateMessage(
  messageId: string,
  rating: number,
  tags?: string[],
  feedbackText?: string,
) {
  const updateData: Record<string, unknown> = {
    feedbackRating: rating,
    feedbackTags: tags ?? [],
  };
  if (feedbackText !== undefined) {
    updateData.feedbackText = feedbackText;
  }
  await db.update(chatMessages).set(updateData).where(eq(chatMessages.id, messageId));
}

export async function completeSession(sessionId: string) {
  await db
    .update(chatSessions)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(chatSessions.id, sessionId));
}
