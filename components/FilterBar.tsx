import Link from "next/link";
import { Search } from "lucide-react";
import type { PageStatus } from "@/lib/types";

type Filter = "all" | PageStatus;

const FILTERS: { key: Filter; label: string; activeClass: string }[] = [
  { key: "all", label: "Все", activeClass: "border-archive-accent/60 bg-archive-accent/15 text-archive-accent" },
  { key: "LIVE", label: "Live", activeClass: "border-archive-live/60 bg-archive-live/15 text-archive-live" },
  { key: "ARCHIVED", label: "Archived", activeClass: "border-archive-archived/60 bg-archive-archived/15 text-archive-archived" },
  { key: "LOST", label: "Lost", activeClass: "border-archive-lost/60 bg-archive-lost/15 text-archive-lost" },
];

/**
 * Панель фильтров + поиска. Форма с method="GET" — серверный роутинг,
 * без client-side JS для фильтрации (фильтрация происходит в Server Component).
 */
export default function FilterBar({
  filter,
  query,
  counts,
}: {
  filter: Filter;
  query: string;
  counts: Record<Filter, number>;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <nav className="flex flex-wrap items-center gap-2" aria-label="Фильтр по статусу">
        {FILTERS.map((f) => {
          const isActive = f.key === filter;
          const href =
            f.key === "all"
              ? query ? `/?q=${encodeURIComponent(query)}` : "/"
              : `/?status=${f.key}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
          return (
            <Link
              key={f.key}
              href={href}
              scroll={false}
              className={`rounded border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? f.activeClass
                  : "border-archive-border bg-archive-panel text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-60">{counts[f.key]}</span>
            </Link>
          );
        })}
      </nav>

      <form method="GET" action="/" className="relative sm:w-72">
        {filter !== "all" && <input type="hidden" name="status" value={filter} />}
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Поиск по заголовку…"
          className="w-full rounded border border-archive-border bg-archive-panel py-2 pl-9 pr-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-archive-accent/60 focus:outline-none focus:ring-1 focus:ring-archive-accent/30"
        />
      </form>
    </div>
  );
}
