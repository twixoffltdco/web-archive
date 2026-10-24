import Link from "next/link";
import type { ArchivedPage } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import StatusBadge from "./StatusBadge";
import { ArrowUpRight, Clock, Flame, Globe, Archive as ArchiveIcon } from "lucide-react";

/**
 * Карточка страницы в сетке главной. Чистый Server Component:
 * фильтры/поиск приходят через searchParams и применяются на сервере.
 */
export default function PageCard({ page, index }: { page: ArchivedPage; index: number }) {
  return (
    <article
      className="group relative flex animate-fade-up flex-col justify-between rounded-lg border border-archive-border bg-archive-panel p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-archive-accent/40 hover:shadow-[0_0_24px_rgba(56,189,248,0.08)]"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={page.status} />
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
          <Flame size={11} className="text-archive-archived" />
          {page.score}
        </span>
      </div>

      <Link href={`/${page.id}`} className="mt-3 block">
        <h2 className="line-clamp-3 text-sm font-semibold leading-snug text-slate-100 transition-colors group-hover:text-archive-accent">
          {page.title}
        </h2>
      </Link>

      <div className="mt-4 flex flex-col gap-2 border-t border-archive-border pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-slate-400">
            <Globe size={11} className="shrink-0 text-slate-500" />
            <span className="truncate">{page.domain}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-slate-500">
            <Clock size={10} />
            {formatDateTime(page.publishedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          {page.status === "ARCHIVED" ? (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-archive-archived">
              <ArchiveIcon size={10} />
              СОХРАНЕНО НАВЕЧНО · {page.archiveDate}
            </span>
          ) : page.status === "LOST" ? (
            <span className="font-mono text-[10px] uppercase tracking-wider text-archive-lost">
              утеряно навсегда
            </span>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              оригинал доступен
            </span>
          )}
          <Link
            href={`/${page.id}`}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-archive-accent opacity-70 transition-opacity hover:opacity-100"
          >
            {page.status === "ARCHIVED" ? "Архив" : "Открыть"}
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}
