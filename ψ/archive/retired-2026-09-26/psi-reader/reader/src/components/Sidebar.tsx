import { useEffect, useState } from "react";
import { api, type Source, type TreeEntry } from "../api";

interface Props {
  source: Source | null;
  onSourceChange: (s: Source) => void;
  onOpenFile: (path: string) => void;
  currentPath: string | null;
}

export function Sidebar({ source, onSourceChange, onOpenFile, currentPath }: Props) {
  const [sources, setSources] = useState<Source[]>([]);
  const [tree, setTree] = useState<Record<string, TreeEntry[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set([""]));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.sources().then(setSources).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setTree({});
    setExpanded(new Set([""]));
    if (!source) return;
    loadDir("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.id]);

  async function loadDir(path: string) {
    if (!source) return;
    try {
      const { entries } = await api.tree(source.id, 0, path);
      setTree((t) => ({ ...t, [path]: entries }));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function toggleDir(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else {
        next.add(path);
        if (!tree[path]) loadDir(path);
      }
      return next;
    });
  }

  function full(parent: string, name: string) {
    return parent ? `${parent}/${name}` : name;
  }

  function renderDir(path: string, depth: number): React.ReactNode {
    const entries = tree[path];
    const isOpen = expanded.has(path);
    if (!isOpen || !entries) return null;
    return (
      <ul>
        {entries.map((e) => {
          const fp = full(path, e.name);
          const isCurrent = fp === currentPath;
          return (
            <li key={fp}>
              {e.type === "dir" ? (
                <button
                  onClick={() => toggleDir(fp)}
                  className="flex w-full items-center gap-1 px-2 py-1 text-left text-sm hover:bg-stone-200/70 dark:hover:bg-stone-800"
                  style={{ paddingLeft: depth * 12 + 8 }}
                >
                  <span className="text-xs">{expanded.has(fp) ? "▾" : "▸"}</span>
                  <span className="text-amber-600 dark:text-amber-400">📁</span>
                  <span className="truncate">{e.name}</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenFile(fp)}
                  className={`flex w-full items-center gap-1 px-2 py-1 text-left text-sm hover:bg-stone-200/70 dark:hover:bg-stone-800 ${
                    isCurrent ? "bg-sky-100 dark:bg-sky-900/40 font-medium" : ""
                  }`}
                  style={{ paddingLeft: depth * 12 + 8 }}
                >
                  <span className="text-sky-600 dark:text-sky-400">📄</span>
                  <span className="truncate">{e.name}</span>
                </button>
              )}
              {e.type === "dir" && renderDir(fp, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-stone-200 p-3 dark:border-stone-800">
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
          Source
        </label>
        <select
          value={source?.id ?? ""}
          onChange={(e) => {
            const s = sources.find((x) => x.id === e.target.value);
            if (s) onSourceChange(s);
          }}
          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm dark:border-stone-700 dark:bg-stone-800"
        >
          <option value="">— select —</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-auto py-2">
        {error && <div className="px-3 text-sm text-red-500">{error}</div>}
        {source && renderDir("", 0)}
      </div>
    </div>
  );
}