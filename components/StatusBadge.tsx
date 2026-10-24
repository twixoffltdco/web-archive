import type { PageStatus } from "@/lib/types";
import { Radio, ArchiveRestore, Skull } from "lucide-react";

const CONFIG: Record<
  PageStatus,
  { label: string; dot: string; text: string; border: string; bg: string; Icon: typeof Radio }
> = {
  LIVE: {
    label: "LIVE",
    dot: "bg-archive-live",
    text: "text-archive-live",
    border: "border-archive-live/40",
    bg: "bg-archive-live/10",
    Icon: Radio,
  },
  ARCHIVED: {
    label: "ARCHIVED",
    dot: "bg-archive-archived",
    text: "text-archive-archived",
    border: "border-archive-archived/40",
    bg: "bg-archive-archived/10",
    Icon: ArchiveRestore,
  },
  LOST: {
    label: "LOST",
    dot: "bg-archive-lost",
    text: "text-archive-lost",
    border: "border-archive-lost/40",
    bg: "bg-archive-lost/10",
    Icon: Skull,
  },
};

/**
 * Моноширинный индикатор статуса с пульсирующей точкой.
 * Server Component — рендерится на сервере, анимация чистым CSS.
 */
export default function StatusBadge({ status }: { status: PageStatus }) {
  const c = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border ${c.border} ${c.bg} px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${c.text}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className={`absolute inline-flex h-full w-full rounded-full ${c.dot} animate-pulse-dot`} />
      </span>
      {c.label}
    </span>
  );
}
