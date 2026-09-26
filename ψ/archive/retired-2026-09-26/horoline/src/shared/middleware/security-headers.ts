import type { Context, Next } from "hono";

export async function securityHeaders(c: Context, next: Next) {
  await next();

  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("X-XSS-Protection", "0");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  c.res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // CSP for HTML pages only
  const contentType = c.res.headers.get("Content-Type") ?? "";
  if (contentType.includes("text/html")) {
    c.res.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
  }

  // HSTS (only meaningful behind HTTPS reverse proxy)
  if (process.env.NODE_ENV === "production") {
    c.res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
}
