import { Hono } from "hono";
import {
  listByFile,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
} from "./db.js";

export const annotations = new Hono();

annotations.get("/", (c) => {
  const source = c.req.query("source") || "";
  const path = c.req.query("path") || "";
  if (!source || !path) return c.json({ error: "source and path required" }, 400);
  return c.json(listByFile(source, path));
});

annotations.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "invalid body" }, 400);

  const { source, path, root, anchor_start, anchor_end, anchor_snippet, kind, color, body: textBody } = body as any;
  if (!source || !path || kind == null || anchor_start == null || anchor_end == null) {
    return c.json({ error: "missing required fields" }, 400);
  }
  if (kind !== "highlight" && kind !== "comment") {
    return c.json({ error: "kind must be highlight or comment" }, 400);
  }
  if (anchor_end < anchor_start) {
    return c.json({ error: "anchor_end must be >= anchor_start" }, 400);
  }

  const ann = createAnnotation({
    source,
    root: Number(root ?? 0),
    path,
    anchor_start: Number(anchor_start),
    anchor_end: Number(anchor_end),
    anchor_snippet: anchor_snippet ?? null,
    kind,
    color: color ?? null,
    body: textBody ?? null,
  });
  return c.json(ann, 201);
});

annotations.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: "invalid body" }, 400);

  const updated = updateAnnotation(id, {
    anchor_start: body.anchor_start != null ? Number(body.anchor_start) : undefined,
    anchor_end: body.anchor_end != null ? Number(body.anchor_end) : undefined,
    anchor_snippet: body.anchor_snippet,
    kind: body.kind,
    color: body.color,
    body: body.body,
  });
  if (!updated) return c.json({ error: "not found" }, 404);
  return c.json(updated);
});

annotations.delete("/:id", (c) => {
  const id = c.req.param("id");
  if (!deleteAnnotation(id)) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});