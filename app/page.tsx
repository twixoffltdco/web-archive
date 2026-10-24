/**
 * Главная страница (Server Component).
 *
 * - Получает топ-30 новостей HN, проверяет живость оригиналов (HEAD, 3 сек)
 *   и наличие копий в Wayback Machine (CDX, очередь 1 req/sec).
 * - Фильтры и поиск работают через searchParams → фильтрация на сервере,
 *   без client-side fetching.
 * - ISR: revalidate = 1 час (next/cache). Плюс серверный in-memory кэш
 *   в lib/archive-service.ts.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import { getArchiveList } from "@/lib/archive-service";
import type { ArchivedPage, PageStatus } from "@/lib/types";
import FilterBar from "@/components/FilterBar";
import PageCard from "@/components/PageCard";
import { AlertTriangle, TerminalSquare } from "lucide-react";

export const revalidate = 3600; // 1 час — next/cache ISR

export const metadata: Metadata = {
  title: "Ephemeral Archive — то, что не должно исчезнуть",
};

const VALID_STATUSES = new Set<string>(["LIVE", "ARCHIVED", "LOST"]);

interface SearchParams {
  status?: string;
  q?: string;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status: rawStatus, q: rawQuery } = await searchParams;
  const filter: "all" | PageStatus =
    rawStatus && VALID_STATUSES.has(rawStatus) ? (rawStatus as PageStatus) : "all";
  const query = (rawQuery ?? "").trim();

  const { pages, generatedAt, hnUnavailable } = await getArchiveList();

  const counts = {
    all: pages.length,
    LIVE: pages.filter((p) => p.status === "LIVE").length,
    ARCHIVED: pages.filter((p) => p.status === "ARCHIVED").length,
    LOST: pages.filter((p) => p.status === "LOST").length,
  };

  const filtered: ArchivedPage[] = pages.filter((p) => {
    const byStatus = filter === "all" || p.status === filter;
    const byQuery = query === "" || p.title.toLowerCase().includes(query.toLowerCase());
    return byStatus && byQuery;
  });

  return (
    <div>
      {/* Hero */}
      <section className="mb-8">
        <h1 className="flex items-center gap-2 font-mono text-xl font-bold uppercase tracking-[0.15em] text-slate-100 sm:text-2xl">
          <TerminalSquare size={22} className="text-archive-accent" />
          Эфемерный архив
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Мониторим топ Hacker News и сверяем каждую страницу с Wayback Machine.{" "}
          <span className="text-archive-live">LIVE</span> — оригинал доступен,{" "}
          <span className="text-archive-archived">ARCHIVED</span> — оригинал мёртв, но{" "}
          <span className="font-semibold text-archive-archived">СОХРАНЕНО НАВЕЧНО</span>,{" "}
          <span className="text-archive-lost">LOST</span> — утеряно навсегда.
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-slate-600">
          snapshot обновлён: {new Date(generatedAt).toISOString().slice(0, 16).replace("T", " ")} UTC
          · источник: HN top {pages.length} · следующий аудит через ~1 час
        </p>
      </section>

      {/* Graceful degradation: HN API недоступен */}
      {hnUnavailable && (
        <div className="mb-6 flex items-start gap-3 rounded border border-archive-archived/40 bg-archive-archived/10 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-archive-archived" />
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-archive-archived">
              Hacker News API временно недоступен
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Показаны последние успешно полученные данные. Остальные сервисы продолжают работать.
            </p>
          </div>
        </div>
      )}

      <Suspense fallback={<p className="font-mono text-xs text-slate-500">Загрузка панели…</p>}>
        <FilterBar filter={filter} query={query} counts={counts} />
      </Suspense>

      {filtered.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((page, i) => (
            <PageCard key={page.id} page={page} index={i} />
          ))}
        </section>
      ) : (
        <div className="rounded border border-dashed border-archive-border bg-archive-panel/50 py-16 text-center">
          <p className="font-mono text-sm text-slate-500">
            {pages.length === 0
              ? "// нет данных — проверьте доступность внешних API"
              : "// ничего не найдено по заданным условиям"}
          </p>
        </div>
      )}
    </div>
  );
}
