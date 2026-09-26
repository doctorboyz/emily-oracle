import { z } from "zod";

export const loginSchema = z.object({
  anonymousId: z.string().min(10, "Invalid anonymousId (min 10 characters)"),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().max(100).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .optional(),
  birthTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use HH:MM or HH:MM:SS format")
    .optional(),
  pronoun: z.enum(["คุณ", "พี่", "น้อง", "หนู", "ฉัน"]).optional(),
  preferredTopics: z.array(z.string().max(50)).max(10).optional(),
  aiTrainingConsent: z.boolean().optional(),
});

export const chatSchema = z.object({
  message: z.string().min(1, "กรุณาพิมพ์ข้อความ").max(2000, "ข้อความยาวเกินไป"),
  sessionId: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  period: z.enum(["daily", "weekly", "monthly", "yearly", "deep"]).optional(),
  anonymousId: z.string().min(10).max(100).optional(),
});

export const rateSchema = z.object({
  messageId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  tags: z.array(z.string().max(50)).max(10).optional(),
  feedbackText: z.string().max(500).optional(),
});

export const endSessionSchema = z.object({
  sessionId: z.string().min(1).max(100),
});

export const idleSchema = z.object({
  sessionId: z.string().max(100).optional(),
  anonymousId: z.string().max(100).optional(),
});
