/**
 * lib/status-checker.ts — определяет статус доступности страницы:
 *   LIVE      — оригинал отвечает 2xx/3xx;
 *   ARCHIVED  — оригинал мёртв (4xx/5xx/timeout), но в Wayback есть копия;
 *   LOST      — оригинал мёртв и копии нет.
 *
 * Все сетевые проверки выполняются только на сервере.
 */

import type { ArchivedPage, HNItem, PageStatus, UrlCheckResult } from "./types";
import { buildArchiveUrl, findLatestSnapshot, formatArchiveTimestamp } from "./wayback";

/** Таймаут HEAD-запроса к оригиналу, мс. */
const ORIGINAL_TIMEOUT_MS = 3000;

const USER_AGENT =
  "Mozilla/5.0 (compatible; EphemeralArchive/1.0; +https://github.com/ephemeral-archive)";

/** Извлекает домен из URL; возвращает "news.ycombinator.com" для внутренних ссылок HN. */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

/**
 * Делает HEAD-запрос к оригинальному URL (с fallback на GET для серверов,
 * не поддерживающих HEAD). Считает страницу живой при коде < 400.
 */
export async function checkUrlAlive(url: string): Promise<UrlCheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ORIGINAL_TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
    });
    // Некоторые серверы отдают 405/501 на HEAD — повторяем коротким GET.
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": USER_AGENT },
      });
    }
    return { alive: res.status > 0 && res.status < 400, httpCode: res.status };
  } catch {
    // Таймаут / DNS-ошибка / connection refused → страница мертва.
    return { alive: false, httpCode: null };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Полная проверка одной истории HN: живость оригинала + поиск архивной копии.
 * Архив запрашивается только для «мёртвых» URL — экономим очередь CDX.
 */
export async function resolvePage(item: HNItem): Promise<ArchivedPage> {
  // У Ask HN / Show HN без внешнего URL ссылка ведёт на обсуждение — оно всегда живо.
  const url = item.url ?? `https://news.ycombinator.com/item?id=${item.id}`;

  const base: Omit<ArchivedPage, "status" | "archiveTimestamp" | "archiveDate" | "archiveUrl" | "originalHttpCode"> = {
    id: item.id,
    title: item.title,
    url,
    domain: extractDomain(url),
    score: item.score ?? 0,
    publishedAt: item.time,
  };

  // Внутренние страницы HN не проверяем и не архивируем — считаем LIVE.
  if (!item.url) {
    return { ...base, status: "LIVE", archiveTimestamp: null, archiveDate: null, archiveUrl: null, originalHttpCode: 200 };
  }

  const check = await checkUrlAlive(url);

  if (check.alive) {
    return { ...base, status: "LIVE", archiveTimestamp: null, archiveDate: null, archiveUrl: null, originalHttpCode: check.httpCode };
  }

  const snapshot = await findLatestSnapshot(url);

  if (snapshot) {
    return {
      ...base,
      status: "ARCHIVED" as PageStatus,
      archiveTimestamp: snapshot.timestamp,
      archiveDate: formatArchiveTimestamp(snapshot.timestamp),
      archiveUrl: buildArchiveUrl(snapshot.timestamp, snapshot.url),
      originalHttpCode: check.httpCode,
    };
  }

  return { ...base, status: "LOST", archiveTimestamp: null, archiveDate: null, archiveUrl: null, originalHttpCode: check.httpCode };
}

/**
 * Пакетная проверка историй с ограничением конкурентности HEAD-запросов.
 * Очередь CDX внутри wayback.ts сама гарантирует 1 req/sec.
 */
export async function resolvePages(items: HNItem[], concurrency = 6): Promise<ArchivedPage[]> {
  const results: (ArchivedPage | null)[] = new Array(items.length).fill(null);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      try {
        results[index] = await resolvePage(items[index]);
      } catch {
        // Graceful degradation: если проверка упала — помечаем как LOST.
        const item = items[index];
        const url = item.url ?? `https://news.ycombinator.com/item?id=${item.id}`;
        results[index] = {
          id: item.id,
          title: item.title,
          url,
          domain: extractDomain(url),
          score: item.score ?? 0,
          publishedAt: item.time,
          status: "LOST",
          archiveTimestamp: null,
          archiveDate: null,
          archiveUrl: null,
          originalHttpCode: null,
        };
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results.filter((r): r is ArchivedPage => r !== null);
}
