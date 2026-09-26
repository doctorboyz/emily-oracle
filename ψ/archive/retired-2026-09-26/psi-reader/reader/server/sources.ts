import { readFile } from "node:fs/promises";
import { listDirLocal, readFileLocal, getLocalRoots, type LocalSource } from "./local.js";

export interface AgentSource {
  id: string;
  label: string;
  type: "agent";
  url: string;
  token: string;
}

export type Source = LocalSource | AgentSource;

let sourcesCache: Source[] | null = null;

async function loadSources(): Promise<Source[]> {
  if (sourcesCache) return sourcesCache;

  const file = process.env.SOURCES_FILE;
  if (file) {
    const raw = await readFile(file, "utf8");
    sourcesCache = JSON.parse(raw) as Source[];
    return sourcesCache;
  }

  const inline = process.env.SOURCES;
  if (inline) {
    sourcesCache = JSON.parse(inline) as Source[];
    return sourcesCache;
  }

  throw new Error("No sources configured (set SOURCES_FILE or SOURCES)");
}

export async function getSources(): Promise<Source[]> {
  return loadSources();
}

/** Public view — never expose token/url internals. */
export async function getSourcesPublic(): Promise<
  { id: string; label: string }[]
> {
  const srcs = await loadSources();
  return srcs.map((s) => ({ id: s.id, label: s.label }));
}

export async function getSource(id: string): Promise<Source | null> {
  const srcs = await loadSources();
  return srcs.find((s) => s.id === id) ?? null;
}

export interface TreeEntry {
  name: string;
  type: "file" | "dir";
  size: number;
  mtime: number;
}

// ---- dispatch by source type ----

async function agentFetch(src: AgentSource, path: string, init?: RequestInit) {
  const res = await fetch(`${src.url}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${src.token}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`agent ${src.id} ${res.status}: ${body.slice(0, 200)}`);
  }
  return res;
}

export async function listDir(src: Source, root: number, path: string): Promise<TreeEntry[]> {
  if (src.type === "local") return listDirLocal(src, root, path);
  const res = await agentFetch(src, `/list?root=${root}&path=${encodeURIComponent(path)}`);
  const json = (await res.json()) as { entries: TreeEntry[] };
  return json.entries;
}

export async function readFileFrom(
  src: Source,
  root: number,
  path: string,
): Promise<{ content: Buffer; contentType: string }> {
  if (src.type === "local") return readFileLocal(src, root, path);
  const res = await agentFetch(src, `/file?root=${root}&path=${encodeURIComponent(path)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { content: buf, contentType: res.headers.get("content-type") || "" };
}