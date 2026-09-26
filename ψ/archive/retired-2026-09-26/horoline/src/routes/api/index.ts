import { Hono } from "hono";

export const apiRoutes = new Hono();

// Profile
apiRoutes.get("/profile", (c) => c.json({ message: "GET /api/profile - TODO" }));
apiRoutes.post("/profile", (c) => c.json({ message: "POST /api/profile - TODO" }));
apiRoutes.patch("/profile", (c) => c.json({ message: "PATCH /api/profile - TODO" }));
apiRoutes.post("/profile/consent", (c) => c.json({ message: "POST /api/profile/consent - TODO" }));
apiRoutes.delete("/profile", (c) => c.json({ message: "DELETE /api/profile - TODO" }));

// Readings
apiRoutes.post("/readings", (c) => c.json({ message: "POST /api/readings - TODO" }));
apiRoutes.get("/readings", (c) => c.json({ message: "GET /api/readings - TODO" }));
apiRoutes.get("/readings/recommend", (c) =>
  c.json({ message: "GET /api/readings/recommend - TODO" }),
);

// Tokens
apiRoutes.get("/tokens/balance", (c) => c.json({ message: "GET /api/tokens/balance - TODO" }));
apiRoutes.post("/tokens/topup", (c) => c.json({ message: "POST /api/tokens/topup - TODO" }));

// Satisfaction
apiRoutes.post("/satisfaction", (c) => c.json({ message: "POST /api/satisfaction - TODO" }));

// Shrines
apiRoutes.get("/shrines", (c) => c.json({ message: "GET /api/shrines - TODO" }));
apiRoutes.get("/shrines/recommend", (c) =>
  c.json({ message: "GET /api/shrines/recommend - TODO" }),
);

// Onboarding
apiRoutes.post("/onboarding/start", (c) =>
  c.json({ message: "POST /api/onboarding/start - TODO" }),
);
apiRoutes.post("/onboarding/step", (c) => c.json({ message: "POST /api/onboarding/step - TODO" }));

// Cooldown & Self-exclusion
apiRoutes.post("/cooldown/status", (c) => c.json({ message: "POST /api/cooldown/status - TODO" }));
apiRoutes.post("/self-exclusion/start", (c) =>
  c.json({ message: "POST /api/self-exclusion/start - TODO" }),
);
