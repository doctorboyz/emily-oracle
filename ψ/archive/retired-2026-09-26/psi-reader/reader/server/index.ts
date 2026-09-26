import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { getSourcesPublic, getSource, listDir, readFileFrom } from "./sources.js";
import { annotations } from "./annotations.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, "..", "dist");
const PORT = Number(process.env.PORT || 3000);

const app = new Hono();

// Dev: allow Vite dev server (5173) to call API
app.use("/api/*", cors());

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.get("/api/sources", async (c) => {
  try {
    return c.json(await getSourcesPublic());
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

app.get("/api/tree", async (c) => {
  const sourceId = c.req.query("source") || "";
  const root = Number(c.req.query("root") ?? 0);
  const path = c.req.query("path") ?? "";
  const src = await getSource(sourceId);
  if (!src) return c.json({ error: "unknown source" }, 404);
  try {
    return c.json({ entries: await listDir(src, root, path) });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

app.get("/api/file", async (c) => {
  const sourceId = c.req.query("source") || "";
  const root = Number(c.req.query("root") ?? 0);
  const path = c.req.query("path") || "";
  const src = await getSource(sourceId);
  if (!src) return c.json({ error: "unknown source" }, 404);
  try {
    const { content, contentType } = await readFileFrom(src, root, path);
    if (contentType.startsWith("text/")) {
      return c.text(content.toString("utf8"));
    }
    // binary (images) — return raw with content-type
    c.header("Content-Type", contentType);
    return c.body(content);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 502);
  }
});

app.route("/api/annotations", annotations);

// --- Serve built SPA (production) -----------------------------------------
if (existsSync(DIST_DIR)) {
  app.use("/*", serveStatic({ root: DIST_DIR, rewriteRequestPath: (p) => (p === "/" ? "/index.html" : p) }));
  // SPA fallback: any non-api, non-asset path → index.html
  app.get("/*", async (c) => {
    const index = await readFile(join(DIST_DIR, "index.html"), "utf8");
    return c.html(index);
  });
}

serve({ fetch: app.fetch, port: PORT, hostname: "0.0.0.0" }, (info) => {
  console.log(`✓ psi-reader on http://0.0.0.0:${info.port}`);
  if (existsSync(DIST_DIR)) console.log(`  serving SPA from ${DIST_DIR}`);
  else console.log(`  (no dist/ yet — run "npm run build" or use Vite dev)`);
});