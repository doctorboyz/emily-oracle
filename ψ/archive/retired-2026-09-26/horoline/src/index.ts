import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { webhookRouter } from "./features/line";
import { apiRoutes } from "./routes/api";
import { authRoutes } from "./routes/auth";
import { chatRoutes } from "./routes/chat";
import { healthRoute } from "./routes/health";
import { profileRoutes } from "./routes/profile";
import { authMiddleware } from "./shared/auth/auth-middleware";
import { rateLimiter } from "./shared/middleware/rate-limiter";
import { securityHeaders } from "./shared/middleware/security-headers";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", securityHeaders);
app.use(
  "/api/*",
  cors({
    origin: ["https://horoline.line-apps.com", "http://localhost:5173", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-LIFF-Token"],
  }),
);

// Rate limiting
app.use("/api/chat/*", rateLimiter(10, 60_000, "chat")); // 10 req/min per token for AI chat
app.use("/api/auth/*", rateLimiter(20, 60_000, "auth")); // 20 req/min per IP for auth
app.use("/api/profile/*", rateLimiter(30, 60_000, "profile")); // 30 req/min per token for profile

// Routes
app.route("/webhook/line", webhookRouter);
app.route("/api/auth", authRoutes);

// Protected routes (require JWT)
app.use("/api/chat/*", authMiddleware);
app.use("/api/profile/*", authMiddleware);
app.use("/api/*", authMiddleware);

app.route("/api/chat", chatRoutes);
app.route("/api/profile", profileRoutes);
app.route("/api", apiRoutes);
app.route("/", healthRoute);

// Chat canvas (serve HTML file) — no-cache so updates show immediately
app.get("/chat", (c) => {
  const html = readFileSync(resolve(process.cwd(), "public/chat.html"), "utf-8");
  return c.html(html, 200, { "Cache-Control": "no-cache, no-store, must-revalidate" });
});

// Root
app.get("/", (c) =>
  c.json({
    name: "Horoline",
    version: "0.1.0",
    description: "AI Fortune-Telling with Empathy",
    status: "ok",
    chatCanvas: "/chat",
    endpoints: {
      health: "/health",
      chat: "/api/chat",
      models: "/api/chat/models",
      profile: "/api/profile/:anonymousId",
      webhook: "/webhook/line",
    },
  }),
);

const port = Number(process.env.PORT) || 3000;

console.log(`🔮 Horoline starting on port ${port}`);
console.log(`📝 Chat canvas: http://localhost:${port}/chat`);

// Start server
import { serve } from "@hono/node-server";
serve({ fetch: app.fetch, port }, () => {
  console.log(`🔮 Horoline running at http://localhost:${port}`);
  console.log(`📝 Chat canvas at http://localhost:${port}/chat`);
  console.log(`📡 API at http://localhost:${port}/api/chat`);
});
