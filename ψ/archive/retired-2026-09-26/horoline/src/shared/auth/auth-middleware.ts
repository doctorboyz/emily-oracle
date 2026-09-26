import type { Context, Next } from "hono";
import { verifyToken } from "./token-service";

export interface AuthContext {
  userId: string;
  anonymousId: string;
}

/**
 * Extracts and verifies JWT from Authorization header.
 * On success: sets userId + anonymousId in context vars.
 * On failure: returns 401 (does not throw).
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "กรุณารีเฟรชหน้าใหม่เพื่อเชื่อมต่อ", code: "UNAUTHORIZED" }, 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return c.json({ error: "การเชื่อมต่อหมดอายุ กรุณารีเฟรชหน้าใหม่", code: "TOKEN_EXPIRED" }, 401);
  }

  c.set("auth", {
    userId: payload.sub,
    anonymousId: payload.anonymousId,
  } as AuthContext);

  await next();
}

/** Read auth context from request (must be called after authMiddleware) */
export function getAuth(c: Context): AuthContext {
  return c.get("auth") as AuthContext;
}
