/**
 * [id]/page.tsx — страница просмотра одной записи (Server Component).
 *
 * LIVE      → iframe с оригиналом + кнопка перехода;
 * ARCHIVED  → баннер «ОРИГИНАЛ НЕДОСТУПЕН» + iframe web.archive.org;
 * LOST      → баннер «КОНТЕНТ УТЕРЯН НАВСЕГДА» + мета-информация.
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPageById } from "@/lib/archive-service";
import { formatDateTime } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Clock,
  Flame,
  Archive as ArchiveIcon,
  Skull,
  Radio,
} from "lucide-react";

export const revalidate = 3600; // ISR 1 час

interface Props {
  params: Promise<{ id: string }>;
}

async function resolvePage(params: Props["params"]) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();
  return getPageById(numericId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await resolvePage(params);
  if (!page) return { title: "Запись не найдена" };
  return {
    title: page.title.slice(0, 80),
    description: `Статус: ${page.status} · источник ${page.domain}`,
  };
}

export default async function ViewPage({ params }: Props) {
  const page = await resolvePage(params);
  if (!page) notFound();

  return (
    <div className="animate-fade-up">
      {/* Хлебные крошки / мета */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-slate-400 transition-colors hover:text-archive-accent"
        >
          <ArrowLeft size={14} /> к архиву
        </Link>
        <StatusBadge status={page.status} />
      </div>

      <h1 className="text-lg font-bold leading-snug text-slate-100 sm:text-xl">{page.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <Globe size={12} className="text-slate-500" /> {page.domain}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} className="text-slate-500" /> опубликовано:{" "}
          {formatDateTime(page.publishedAt)} UTC
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Flame size={12} className="text-archive-archived" /> рейтинг: {page.score}
        </span>
        <a
          href={`https://news.ycombinator.com/item?id=${page.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-archive-accent underline-offset-2 hover:underline"
        >
          обсуждение HN <ExternalLink size={11} />
        </a>
      </div>

      {/* Баннеры по статусу */}
      {page.status === "ARCHIVED" && (
        <div className="mt-6 rounded-lg border border-archive-archived/50 bg-gradient-to-r from-archive-archived/15 to-transparent p-4">
          <p className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-archive-archived">
            ⚠️ ОРИГИНАЛ НЕДОСТУПЕН ({page.originalHttpCode ?? "TIMEOUT"}). ПОКАЗАНА АРХИВНАЯ КОПИЯ ОТ{" "}
            {page.archiveDate}
          </p>
          <p className="mt-1.5 inline-flex items-center gap-2 font-mono text-xs text-slate-300">
            <ArchiveIcon size={13} className="text-archive-archived" />
            СОХРАНЕНО НАВЕЧНО — снимок Internet Archive недоступен для удаления
          </p>
        </div>
      )}

      {page.status === "LOST" && (
        <div className="mt-6 rounded-lg border border-archive-lost/50 bg-gradient-to-r from-archive-lost/15 to-transparent p-4">
          <p className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-archive-lost">
            <Skull size={16} /> КОНТЕНТ УТЕРЯН НАВСЕГДА
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
            Оригинал отвечает{" "}
            <span className="font-mono text-archive-lost">
              {page.originalHttpCode ?? "NO RESPONSE / TIMEOUT"}
            </span>
            , и в Wayback Machine нет ни одного снимка этого URL. Страница считается безвозвратно
            утраченной.
          </p>
        </div>
      )}

      {page.status === "LIVE" && (
        <div className="mt-6 rounded-lg border border-archive-live/40 bg-archive-live/10 p-4">
          <p className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-archive-live">
            <Radio size={15} /> ОРИГИНАЛ ДОСТУПЕН · HTTP {page.originalHttpCode ?? 200}
          </p>
        </div>
      )}

      {/* Действия */}
      <div className="mt-4 flex flex-wrap gap-3">
        {page.status !== "LOST" && (
          <a
            href={page.status === "ARCHIVED" ? (page.archiveUrl ?? "#") : page.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 rounded px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
              page.status === "ARCHIVED"
                ? "border border-archive-archived/60 bg-archive-archived/15 text-archive-archived hover:bg-archive-archived/25 hover:shadow-[0_0_16px_rgba(249,115,22,0.3)]"
                : "border border-archive-live/60 bg-archive-live/15 text-archive-live hover:bg-archive-live/25"
            }`}
          >
            {page.status === "ARCHIVED" ? "Открыть архив" : "Открыть оригинал"}
            <ExternalLink size={13} />
          </a>
        )}
        <a
          href={page.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded border border-archive-border bg-archive-panel px-4 py-2 font-mono text-xs uppercase tracking-wider text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
        >
          {page.url.length > 58 ? `${page.url.slice(0, 55)}…` : page.url}
        </a>
      </div>

      {/* Контент: iframe или мета-карточка для LOST */}
      {page.status === "LOST" ? (
        <div className="mt-6 rounded-lg border border-dashed border-archive-border bg-archive-panel/60 p-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500">
            {"// мета-информация"}
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-2">
            {[
              ["HN_ID", String(page.id)],
              ["SOURCE_DOMAIN", page.domain],
              ["PUBLISHED_AT_UTC", formatDateTime(page.publishedAt)],
              ["SCORE", String(page.score)],
              ["LAST_KNOWN_URL", page.url],
              ["ORIGINAL_HTTP_CODE", page.originalHttpCode ? String(page.originalHttpCode) : "—"],
              ["WAYBACK_SNAPSHOTS", "0"],
              ["RECOVERY_CHANCES", "NONE"],
            ].map(([k, v]) => (
              <div key={k} className="rounded border border-archive-border bg-archive-bg px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wider text-slate-600">{k}</dt>
                <dd className="mt-0.5 break-all text-slate-300">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-archive-border bg-archive-panel">
          <div className="flex items-center gap-2 border-b border-archive-border px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-archive-lost/70" />
            <span className="h-2 w-2 rounded-full bg-archive-archived/70" />
            <span className="h-2 w-2 rounded-full bg-archive-live/70" />
            <span className="ml-2 truncate font-mono text-[10px] text-slate-500">
              {page.status === "ARCHIVED" ? page.archiveUrl : page.url}
            </span>
          </div>
          {/* iframe может быть заблокирован политикой X-Frame-Options —
              поэтому рядом всегда есть прямая ссылка. */}
          <iframe
            src={page.status === "ARCHIVED" ? (page.archiveUrl ?? page.url) : page.url}
            title={page.title}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
            className="h-[70vh] w-full bg-white"
          />
          <p className="border-t border-archive-border px-3 py-2 font-mono text-[10px] text-slate-600">
            если страница выше пуста — сайт запрещает встраивание (X-Frame-Options). Используйте
            кнопку «Открыть».
          </p>
        </div>
      )}
    </div>
  );
}
