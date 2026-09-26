import type { Annotation } from "../api";

interface Props {
  annotations: Annotation[];
  onDelete: (id: string) => void;
  onJump: (id: string) => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function AnnotationRail({ annotations, onDelete, onJump }: Props) {
  const highlights = annotations.filter((a) => a.kind === "highlight");
  const comments = annotations.filter((a) => a.kind === "comment");

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-stone-200 p-3 dark:border-stone-800">
        <h2 className="text-sm font-semibold">Notation</h2>
        <p className="text-xs text-stone-500">
          {highlights.length} highlight · {comments.length} comment
        </p>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {annotations.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-stone-400">
            เลือกข้อความในเนื้อหาแล้วกด Highlight หรือ Comment
          </p>
        )}

        {annotations.map((a) => (
          <div
            key={a.id}
            data-ann={a.id}
            onClick={() => onJump(a.id)}
            className="group mb-2 cursor-pointer rounded-md border border-stone-200 bg-stone-50 p-2 hover:border-sky-300 dark:border-stone-800 dark:bg-stone-800/50"
          >
            <div className="mb-1 flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: a.color ?? "#ffd54f" }}
              />
              <span className="text-xs font-medium uppercase text-stone-500">
                {a.kind}
              </span>
              <span className="ml-auto text-xs text-stone-400">
                {timeAgo(a.created_at)}
              </span>
            </div>
            {a.anchor_snippet && (
              <p className="mb-1 line-clamp-2 text-xs italic text-stone-500">
                “{a.anchor_snippet}”
              </p>
            )}
            {a.body && (
              <p className="text-sm text-stone-700 dark:text-stone-200">{a.body}</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(a.id);
              }}
              className="mt-1 hidden text-xs text-red-400 hover:text-red-600 group-hover:inline"
            >
              ลบ
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}