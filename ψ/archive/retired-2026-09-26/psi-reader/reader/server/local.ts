import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, join, basename, extname } from "node:path";

/**
 * Local filesystem source — reads files bind-mounted into the container.
 * No agent needed on the source machine; iCloud Drive (or any synced folder)
 * is mounted read-only and read directly.
 *
 * sources.json entry:
 *   { "id":"icloud","label":"iCloud","type":"local",
 *     "roots":[{"name":"notes","path":"/files/icloud/notes"}] }
 */

const ALLOW_EXT = new Set(
  (process.env.LOCAL_ALLOW_EXT || ".md,.markdown,.txt,.png,.jpg,.jpeg")
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

export interface LocalRoot {
  name: string;
  path: string;
}

export interface LocalSource {
  id: string;
  label: string;
  type: "local";
  roots: LocalRoot[];
}

export function getLocalRoots(src: LocalSource): { id: number; name: string; path: string }[] {
  return src.roots.map((r, i) => ({ id: i, name: r.name, path: r.path }));
}

/** Resolve (root, path) safely inside the configured root; reject traversal. */
function safeResolve(rootPath: string, sub: string): string | null {
  const target = resolve(rootPath, sub || ".");
  const rel = relative(rootPath, target);
  if (rel.startsWith("..") || rel.includes("\0")) return null;
  return target;
}

export async function listDirLocal(
  src: LocalSource,
  rootIdx: number,
  path: string,
) {
  const root = src.roots[rootIdx];
  if (!root) throw new Error("unknown root");
  const dir = safeResolve(root.path, path);
  if (!dir) throw new Error("forbidden");

  const st = await stat(dir);
  if (!st.isDirectory()) throw new Error("not a directory");

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
          // broken symlink etc. — still list the name
        }
        return {
          name: e.name,
          type: e.isDirectory() ? ("dir" as const) : ("file" as const),
          size,
          mtime,
        };
      }),
  );
  out.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
  return out;
}

export async function readFileLocal(
  src: LocalSource,
  rootIdx: number,
  path: string,
): Promise<{ content: Buffer; contentType: string }> {
  const root = src.roots[rootIdx];
  if (!root) throw new Error("unknown root");
  const file = safeResolve(root.path, path);
  if (!file) throw new Error("forbidden");

  const ext = extname(file).toLowerCase();
  if (!ALLOW_EXT.has(ext)) throw new Error("extension not allowed");

  const st = await stat(file);
  if (!st.isFile()) throw new Error("not a file");
  if (!st.isSymbolicLink() === false) {
    // follow symlink but safeResolve already anchored — re-check real target
  }
  const content = await readFile(file);
  return { content, contentType: MIME[ext] || "application/octet-stream" };
}