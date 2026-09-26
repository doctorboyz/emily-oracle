import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const dbPath = process.env.DB_PATH || "./data/annotations.db";
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS annotations (
  id            TEXT PRIMARY KEY,
  source        TEXT NOT NULL,
  root          INTEGER NOT NULL DEFAULT 0,
  path          TEXT NOT NULL,
  anchor_type   TEXT NOT NULL DEFAULT 'line',
  anchor_start  INTEGER NOT NULL,
  anchor_end    INTEGER NOT NULL,
  anchor_snippet TEXT,
  kind          TEXT NOT NULL,        -- 'highlight' | 'comment'
  color         TEXT,
  body          TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ann_file ON annotations(source, path);
`);

export interface Annotation {
  id: string;
  source: string;
  root: number;
  path: string;
  anchor_type: string;
  anchor_start: number;
  anchor_end: number;
  anchor_snippet: string | null;
  kind: string;
  color: string | null;
  body: string | null;
  created_at: string;
  updated_at: string;
}

const insertStmt = db.prepare(`
  INSERT INTO annotations
    (id, source, root, path, anchor_type, anchor_start, anchor_end, anchor_snippet, kind, color, body, created_at, updated_at)
  VALUES
    (@id, @source, @root, @path, @anchor_type, @anchor_start, @anchor_end, @anchor_snippet, @kind, @color, @body, @created_at, @updated_at)
`);

const updateStmt = db.prepare(`
  UPDATE annotations SET
    anchor_start = @anchor_start,
    anchor_end = @anchor_end,
    anchor_snippet = @anchor_snippet,
    kind = @kind,
    color = @color,
    body = @body,
    updated_at = @updated_at
  WHERE id = @id
`);

const byFileStmt = db.prepare(
  `SELECT * FROM annotations WHERE source = ? AND path = ? ORDER BY anchor_start, created_at`,
);
const byIdStmt = db.prepare(`SELECT * FROM annotations WHERE id = ?`);
const deleteStmt = db.prepare(`DELETE FROM annotations WHERE id = ?`);

export function listByFile(source: string, path: string): Annotation[] {
  return byFileStmt.all(source, path) as Annotation[];
}

export function createAnnotation(input: {
  source: string;
  root?: number;
  path: string;
  anchor_start: number;
  anchor_end: number;
  anchor_snippet?: string | null;
  kind: string;
  color?: string | null;
  body?: string | null;
}): Annotation {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  insertStmt.run({
    id,
    source: input.source,
    root: input.root ?? 0,
    path: input.path,
    anchor_type: "line",
    anchor_start: input.anchor_start,
    anchor_end: input.anchor_end,
    anchor_snippet: input.anchor_snippet ?? null,
    kind: input.kind,
    color: input.color ?? null,
    body: input.body ?? null,
    created_at: now,
    updated_at: now,
  });
  return byIdStmt.get(id) as Annotation;
}

export function updateAnnotation(
  id: string,
  patch: {
    anchor_start?: number;
    anchor_end?: number;
    anchor_snippet?: string | null;
    kind?: string;
    color?: string | null;
    body?: string | null;
  },
): Annotation | null {
  const existing = byIdStmt.get(id) as Annotation | undefined;
  if (!existing) return null;
  updateStmt.run({
    id,
    anchor_start: patch.anchor_start ?? existing.anchor_start,
    anchor_end: patch.anchor_end ?? existing.anchor_end,
    anchor_snippet: patch.anchor_snippet ?? existing.anchor_snippet,
    kind: patch.kind ?? existing.kind,
    color: patch.color ?? existing.color,
    body: patch.body ?? existing.body,
    updated_at: new Date().toISOString(),
  });
  return byIdStmt.get(id) as Annotation;
}

export function deleteAnnotation(id: string): boolean {
  return deleteStmt.run(id).changes > 0;
}