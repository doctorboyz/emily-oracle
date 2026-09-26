import { Hono } from "hono";
import { PROMPT_VERSION } from "../ai/system-prompt";
import { logAudit } from "../features/audit/audit-service";
import { computeDerivedFromBirthDate } from "../features/profile/derived-calculator";
import {
  type ProfileData,
  getOrCreateProfile,
  updateProfile,
} from "../features/profile/profile-service";
import { getAuth } from "../shared/auth/auth-middleware";
import { profileUpdateSchema } from "../shared/validation/schemas";

export const profileRoutes = new Hono();

function authorizeProfile(c: import("hono").Context, anonymousId: string) {
  const auth = getAuth(c);
  if (auth.anonymousId !== anonymousId) {
    return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }
}

// GET /api/profile/:anonymousId — get or create profile
profileRoutes.get("/:anonymousId", async (c) => {
  const anonymousId = c.req.param("anonymousId");
  if (!anonymousId || anonymousId.length < 10) {
    return c.json({ error: "Invalid anonymousId" }, 400);
  }

  const forbidden = authorizeProfile(c, anonymousId);
  if (forbidden) return forbidden;

  try {
    const profile = await getOrCreateProfile(anonymousId);
    return c.json(profile);
  } catch (err) {
    console.error("Profile get error:", err);
    return c.json({ error: "Failed to load profile" }, 500);
  }
});

// PUT /api/profile/:anonymousId — update profile
profileRoutes.put("/:anonymousId", async (c) => {
  const anonymousId = c.req.param("anonymousId");
  if (!anonymousId || anonymousId.length < 10) {
    return c.json({ error: "Invalid anonymousId" }, 400);
  }

  const forbidden = authorizeProfile(c, anonymousId);
  if (forbidden) return forbidden;

  const parsed = profileUpdateSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);
  }
  const body = parsed.data as ProfileData;

  try {
    const profile = await updateProfile(anonymousId, body);

    logAudit({
      eventType: "profile.updated",
      actorType: "user",
      actorId: anonymousId,
      details: {
        fields: Object.keys(body),
        hasBirthDate: !!body.birthDate,
        profileTier: profile.profileTier,
      },
      promptVersion: PROMPT_VERSION,
    });

    return c.json(profile);
  } catch (err) {
    console.error("Profile update error:", err);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

// POST /api/profile/:anonymousId/derive — recompute derived data
profileRoutes.post("/:anonymousId/derive", async (c) => {
  const anonymousId = c.req.param("anonymousId");
  if (!anonymousId || anonymousId.length < 10) {
    return c.json({ error: "Invalid anonymousId" }, 400);
  }

  const forbidden = authorizeProfile(c, anonymousId);
  if (forbidden) return forbidden;

  try {
    const profile = await getOrCreateProfile(anonymousId);

    if (!profile.birthDate) {
      return c.json({ error: "Birth date required for derivation" }, 400);
    }

    const derived = computeDerivedFromBirthDate(new Date(profile.birthDate));
    return c.json({ derived, profileTier: profile.profileTier });
  } catch (err) {
    console.error("Derive error:", err);
    return c.json({ error: "Failed to compute derived data" }, 500);
  }
});
