export interface Source {
  id: string;
  label: string;
}

export interface TreeEntry {
  name: string;
  type: "file" | "dir";
  size: number;
  mtime: number;
}

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

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  sources: () => fetch("/api/sources").then(j<Source[]>),

  tree: (source: string, root: number, path: string) =>
    fetch(
      `/api/tree?source=${encodeURIComponent(source)}&root=${root}&path=${encodeURIComponent(path)}`,
    ).then(j<{ entries: TreeEntry[] }>),

  file: async (source: string, root: number, path: string) => {
    const res = await fetch(
      `/api/file?source=${encodeURIComponent(source)}&root=${root}&path=${encodeURIComponent(path)}`,
    );
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.text();
  },

  annotations: (source: string, path: string) =>
    fetch(
      `/api/annotations?source=${encodeURIComponent(source)}&path=${encodeURIComponent(path)}`,
    ).then(j<Annotation[]>),

  createAnnotation: (a: {
    source: string;
    path: string;
    anchor_start: number;
    anchor_end: number;
    anchor_snippet: string;
    kind: "highlight" | "comment";
    color?: string;
    body?: string;
  }) =>
    fetch("/api/annotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(a),
    }).then(j<Annotation>),

  updateAnnotation: (id: string, patch: Partial<Annotation>) =>
    fetch(`/api/annotations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(j<Annotation>),

  deleteAnnotation: (id: string) =>
    fetch(`/api/annotations/${id}`, { method: "DELETE" }).then((r) =>
      r.ok ? Promise.resolve({ ok: true }) : Promise.reject(new Error(`${r.status}`)),
    ),
};