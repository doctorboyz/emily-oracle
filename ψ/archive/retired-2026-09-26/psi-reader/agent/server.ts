/**
 * psi-reader agent — tiny read-only file server.
 *
 * Exposes configured root directories over HTTP (intended for the Tailscale
 * network only). The reader backend proxies this to render .md files and
 * store annotations in its own SQLite (this agent never writes anything).
 *
 * Env:
 *   ROOTS     comma-separated absolute paths to expose (read-only)
 *   TOKEN     shared bearer token (reader must send the same)
 *   BIND      IP to listen on — use the Tailscale IP, never 0.0.0.0
 *   PORT      port (default 7801)
 *   ALLOW_EXT comma-separated allowed file extensions (default .md,.markdown,.txt,.png,.jpg,.jpeg)
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, join, basename, extname } from "node:path";
import { createServer } from "node:http";

const ROOTS = (process.env.ROOTS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((p) => resolve(p.replace(/^~(?=$|\/|\\)/, process.env.HOME ?? "")));

const TOKEN = process.env.TOKEN || "";
const BIND = process.env.BIND || "127.0.0.1";
const PORT = Number(process.env.PORT || 7801);
const ALLOW_EXT = new Set(
  (process.env.ALLOW_EXT || ".md,.markdown,.txt,.png,.jpg,.jpeg")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

const MIME: Record<string, string> = {
  ".md": "text/markdown; charset=utf-8",
  ".markdown": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

if (ROOTS.length === 0) {
  console.error("✗ ROOTS env is required (comma-separated absolute paths)");
  process.exit(1);
}
if (!TOKEN) {
  console.error("✗ TOKEN env is required");
  process.exit(1);
}

const app = new Hono();

/** Bearer token check — every endpoint except /healthz. */
app.use("*", async (c, next) => {
  if (c.req.path === "/healthz") return next();
  const auth = c.req.header("Authorization") || "";
  const expected = `Bearer ${TOKEN}`;
  if (auth !== expected) {
    return c.json({ error: "unauthorized" }, 401);
  }
  await next();
});

app.get("/healthz", (c) => c.text("ok"));

app.get("/roots", (c) => {
  return c.json(
    ROOTS.map((path, id) => ({ id, name: basename(path) || path, path })),
  );
});

/** Resolve a (root, path) request into an absolute path within that root.
 *  Returns null on traversal attempt or out-of-root symlink. */
async function safeResolve(rootId: number, sub: string): Promise<string | null> {
  const root = ROOTS[rootId];
  if (!root) return null;
  const target = resolve(root, sub || ".");
  const rel = relative(root, target);
  if (rel.startsWith("..") || rel.includes("\0")) return null;
  // Reject symlinks that escape root: lstat the resolved path's parent chain.
  try {
    const real = await realpathWithin(root, target);
    if (!real.startsWith(root + "/") && real !== root) return null;
    return target;
  } catch {
    return null;
  }
}

async function realpathWithin(root: string, target: string): Promise<string> {
  // Walk component-by-component resolving symlinks, stop if we leave root.
  const parts = target.slice(root.length).split("/").filter(Boolean);
  let cur = root;
  for (const part of parts) {
    cur = join(cur, part);
    let st;
    try {
      st = await stat(cur);
    } catch {
      throw new Error("not found");
    }
    if (st.isSymbolicLink()) {
      const link = await readFile(cur, "utf8");
      const resolved = resolve(cur, link);
      const rel = relative(root, resolved);
      if (rel.startsWith("..")) throw new Error("escape");
      cur = resolved;
    }
  }
  return cur;
}

app.get("/list", async (c) => {
  const rootId = Number(c.req.query("root") ?? 0);
  const path = c.req.query("path") ?? "";
  const dir = await safeResolve(rootId, path);
  if (!dir) return c.json({ error: "forbidden" }, 403);
  let st;
  try {
    st = await stat(dir);
  } catch {
    return c.json({ error: "not found" }, 404);
  }
  if (!st.isDirectory()) return c.json({ error: "not a directory" }, 400);

  const entries = await readdir(dir, { withFileTypes: true });
  const out = await Promise.all(
    entries
      .filter((e) => !e.name.startsWith("."))
      .map(async (e) => {
        let size = 0;
        let mtime = 0;
        try {
          const s = await stat(join(dir, e.name));
          size = s.size;
          mtime = Math.floor(s.mtimeMs);
        } catch {
          // skip stat errors (e.g. broken symlink) — still list the name
        }
        return {
          name: e.name,
          type: e.isDirectory() ? "dir" : "file",
          size,
          mtime,
        };
      }),
  );
  out.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
  return c.json({ entries: out });
});

app.get("/file", async (c) => {
  const rootId = Number(c.req.query("root") ?? 0);
  const path = c.req.query("path") ?? "";
  const file = await safeResolve(rootId, path);
  if (!file) return c.json({ error: "forbidden" }, 403);

  const ext = extname(file).toLowerCase();
  if (!ALLOW_EXT.has(ext)) return c.json({ error: "extension not allowed" }, 403);

  let st;
  try {
    st = await stat(file);
  } catch {
    return c.json({ error: "not found" }, 404);
  }
  if (!st.isFile()) return c.json({ error: "not a file" }, 400);

  const body = await readFile(file);
  const type = MIME[ext] || "application/octet-stream";
  c.header("Content-Type", type);
  c.header("Content-Length", String(body.length));
  return c.body(body);
});

const server = serve({ fetch: app.fetch, port: PORT, hostname: BIND }, (info) => {
  console.log(`✓ psi-reader agent on http://${BIND}:${info.port}`);
  console.log(`  roots: ${ROOTS.map((r, i) => `\n    [${i}] ${r}`).join("")}`);
  console.log(`  allow: ${[...ALLOW_EXT].join(", ")}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log("\n shutting down…");
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);