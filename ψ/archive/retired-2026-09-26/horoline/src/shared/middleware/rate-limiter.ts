import type { Context, Next } from "hono";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(prefix: string): Map<string, RateLimitEntry> {
  let store = stores.get(prefix);
  if (!store) {
    store = new Map();
    stores.set(prefix, store);
  }
  return store;
}

// Cleanup stale entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const store of stores.values()) {
      for (const [key, entry] of store) {
        if (entry.resetAt < now) store.delete(key);
      }
    }
  },
  5 * 60 * 1000,
).unref();

export function rateLimiter(maxRequests: number, windowMs: number, prefix: string) {
  return async (c: Context, next: Next) => {
    const token = c.req.header("Authorization")?.slice(7) ?? "anon";
    const key = `${token.slice(0, 20)}`;

    const store = getStore(prefix);
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    c.res.headers.set("X-RateLimit-Limit", String(maxRequests));
    c.res.headers.set("X-RateLimit-Remaining", String(Math.max(0, maxRequests - entry.count)));
    c.res.headers.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > maxRequests) {
      return c.json({ error: "คำขอถี่เกินไป กรุณารอสักครู่", code: "RATE_LIMITED" }, 429);
    }

    await next();
  };
}
