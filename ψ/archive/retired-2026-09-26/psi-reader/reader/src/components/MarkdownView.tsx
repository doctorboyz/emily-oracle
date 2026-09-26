import { memo, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Annotation } from "../api";

interface Props {
  content: string;
  annotations: Annotation[];
  onAnnotate: (snippet: string, kind: "highlight" | "comment") => void;
  onAnnotationClick: (id: string) => void;
}

/** Walk text nodes under `root`; return the first one containing `snippet`. */
function findTextNode(root: Node, snippet: string): Text | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const t = node.nodeValue ?? "";
      // skip script/style/code text
      const parent = node.parentElement;
      const tag = parent?.tagName.toLowerCase();
      if (tag === "code" || tag === "pre" || tag === "script" || tag === "style")
        return NodeFilter.FILTER_REJECT;
      return t.includes(snippet) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  return (walker.nextNode() as Text) ?? null;
}

/** Remove all existing psi marks, restoring text nodes. */
function clearMarks(root: HTMLElement) {
  root.querySelectorAll("mark.psi-mark").forEach((m) => {
    const parent = m.parentNode;
    if (!parent) return;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parent.normalize();
  });
}

function applyHighlights(root: HTMLElement, annotations: Annotation[]) {
  clearMarks(root);
  for (const ann of annotations) {
    if (ann.kind !== "highlight") continue;
    const snippet = ann.anchor_snippet;
    if (!snippet || snippet.length < 2) continue;
    const textNode = findTextNode(root, snippet);
    if (!textNode || !textNode.nodeValue) continue;
    const idx = textNode.nodeValue.indexOf(snippet);
    const after = textNode.splitText(idx + snippet.length);
    textNode.splitText(idx);
    const mark = document.createElement("mark");
    mark.className = "psi-mark";
    mark.dataset.id = ann.id;
    if (ann.color) mark.style.background = ann.color;
    mark.addEventListener("click", () => {
      mark.dispatchEvent(
        new CustomEvent("psi:ann-click", { bubbles: true, detail: { id: ann.id } }),
      );
    });
    mark.appendChild(after.previousSibling!); // the split middle text node
    after.parentNode?.insertBefore(mark, after);
  }
}

const MarkdownBody = memo(function MarkdownBody({ content }: { content: string }) {
  return (
    <div className="prose-psi">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // disallow raw HTML pass-through (XSS guard)
          // react-markdown v9 ignores raw HTML by default — good.
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

export function MarkdownView({
  content,
  annotations,
  onAnnotate,
  onAnnotationClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [popup, setPopup] = useState<{ x: number; y: number; snippet: string } | null>(
    null,
  );

  useEffect(() => {
    if (containerRef.current) applyHighlights(containerRef.current, annotations);
  }, [annotations, content]);

  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      if (id) onAnnotationClick(id);
    };
    document.addEventListener("psi:ann-click", handler);
    return () => document.removeEventListener("psi:ann-click", handler);
  }, [onAnnotationClick]);

  function onMouseUp() {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    if (!text || text.length < 2) {
      setPopup(null);
      return;
    }
    const range = sel?.getRangeAt(0);
    if (!range) return;
    const rect = range.getBoundingClientRect();
    setPopup({ x: rect.left + rect.width / 2, y: rect.top, snippet: text });
  }

  return (
    <div className="relative h-full overflow-auto bg-white dark:bg-stone-900">
      <div
        ref={containerRef}
        className="mx-auto max-w-3xl px-8 py-10"
        onMouseUp={onMouseUp}
      >
        <MarkdownBody content={content} />
      </div>

      {popup && (
        <div
          className="fixed z-50 flex gap-1 rounded-lg border border-stone-200 bg-white p-1 shadow-lg dark:border-stone-700 dark:bg-stone-800"
          style={{ left: popup.x - 60, top: popup.y - 48 }}
        >
          <button
            className="rounded-md bg-amber-300 px-2.5 py-1 text-xs font-medium text-amber-950 hover:bg-amber-400"
            onClick={() => {
              onAnnotate(popup.snippet, "highlight");
              setPopup(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            🖆 Highlight
          </button>
          <button
            className="rounded-md bg-stone-200 px-2.5 py-1 text-xs font-medium hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600"
            onClick={() => {
              onAnnotate(popup.snippet, "comment");
              setPopup(null);
              window.getSelection()?.removeAllRanges();
            }}
          >
            💬 Comment
          </button>
        </div>
      )}
    </div>
  );
}