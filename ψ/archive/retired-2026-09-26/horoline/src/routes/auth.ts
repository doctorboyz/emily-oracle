import { Hono } from "hono";
import { findOrCreateAnonymousUser } from "../features/audit/anon-user-service";
import { generateToken } from "../shared/auth/token-service";
import { loginSchema } from "../shared/validation/schemas";

export const authRoutes = new Hono();

// POST /api/auth/login — anonymous login (exchange anonymousId for JWT)
authRoutes.post("/login", async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);
  }
  const { anonymousId } = parsed.data;

  try {
    const userId = await findOrCreateAnonymousUser(anonymousId);
    const token = await generateToken(userId, anonymousId);

    return c.json({
      token,
      userId,
      anonymousId,
      expiresIn: "7d",
    });
  } catch (err) {
    console.error("Login error:", err);
    return c.json({ error: "Login failed" }, 500);
  }
});

// POST /api/auth/verify — verify token is still valid
authRoutes.post("/verify", async (c) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ valid: false, reason: "no_token" }, 401);
  }

  const { verifyToken } = await import("../shared/auth/token-service");
  const payload = await verifyToken(authHeader.slice(7));

  if (!payload) {
    return c.json({ valid: false, reason: "expired_or_invalid" }, 401);
  }

  return c.json({
    valid: true,
    userId: payload.sub,
    anonymousId: payload.anonymousId,
  });
});
