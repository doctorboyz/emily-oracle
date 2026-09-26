import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Annotation, type Source } from "./api";
import { Sidebar } from "./components/Sidebar";
import { MarkdownView } from "./components/MarkdownView";
import { AnnotationRail } from "./components/AnnotationRail";

export default function App() {
  const [source, setSource] = useState<Source | null>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  const loadFile = useCallback(
    async (path: string) => {
      if (!source) return;
      setLoading(true);
      setError(null);
      setCurrentPath(path);
      try {
        const [text, anns] = await Promise.all([
          api.file(source.id, 0, path),
          api.annotations(source.id, path),
        ]);
        setContent(text);
        setAnnotations(anns);
      } catch (e) {
        setError((e as Error).message);
        setContent("");
        setAnnotations([]);
      } finally {
        setLoading(false);
      }
    },
    [source],
  );

  const refreshAnnotations = useCallback(async () => {
    if (!source || !currentPath) return;
    try {
      setAnnotations(await api.annotations(source.id, currentPath));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [source, currentPath]);

  const onAnnotate = useCallback(
    async (snippet: string, kind: "highlight" | "comment") => {
      if (!source || !currentPath) return;
      let body: string | undefined;
      if (kind === "comment") {
        body = window.prompt("Comment:", "") ?? undefined;
        if (body === undefined) return;
      }
      try {
        await api.createAnnotation({
          source: source.id,
          path: currentPath,
          anchor_start: 0,
          anchor_end: snippet.length,
          anchor_snippet: snippet.slice(0, 200),
          kind,
          color: kind === "highlight" ? "#ffd54f" : undefined,
          body: body || undefined,
        });
        await refreshAnnotations();
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [source, currentPath, refreshAnnotations],
  );

  const onDelete = useCallback(
    async (id: string) => {
      try {
        await api.deleteAnnotation(id);
        await refreshAnnotations();
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [refreshAnnotations],
  );

  const onJump = useCallback((id: string) => {
    const mark = document.querySelector(`mark.psi-mark[data-id="${id}"]`);
    if (mark) {
      mark.scrollIntoView({ behavior: "smooth", block: "center" });
      (mark as HTMLElement).style.outline = "2px solid #f59e0b";
      setTimeout(() => ((mark as HTMLElement).style.outline = ""), 1200);
    }
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-72 shrink-0 border-r border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center gap-2 border-b border-stone-200 px-3 py-3 dark:border-stone-800">
          <span className="text-lg">ψ</span>
          <span className="font-semibold">reader</span>
        </div>
        <Sidebar
          source={source}
          onSourceChange={setSource}
          onOpenFile={loadFile}
          currentPath={currentPath}
        />
      </aside>

      <main className="flex-1 overflow-hidden">
        {error && (
          <div className="bg-red-100 px-4 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">
            {error}
          </div>
        )}
        {!currentPath && !loading && (
          <div className="flex h-full items-center justify-center text-stone-400">
            เลือกไฟล์จากแถบซ้ายเพื่อเริ่มอ่าน
          </div>
        )}
        {currentPath && (
          <>
            <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-2 text-sm text-stone-500 dark:border-stone-800">
              <span className="font-mono text-xs">{source?.label}</span>
              <span>›</span>
              <span className="truncate font-mono text-xs">{currentPath}</span>
            </div>
            <div className="h-[calc(100%-2.5rem)]">
              <MarkdownView
                content={content}
                annotations={annotations}
                onAnnotate={onAnnotate}
                onAnnotationClick={onJump}
              />
            </div>
          </>
        )}
      </main>

      <aside
        ref={railRef}
        className="w-72 shrink-0 border-l border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900"
      >
        <AnnotationRail
          annotations={annotations}
          onDelete={onDelete}
          onJump={onJump}
        />
      </aside>
    </div>
  );
}