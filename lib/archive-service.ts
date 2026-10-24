/**
 * lib/archive-service.ts — сервисный слой: собирает данные HN, проверяет
 * статусы и кэширует результат всего запроса в памяти сервера (1 час).
 * Используется Server Components. Никаких клиентских fetch-запросов.
 */

import "server-only";

import type { ArchivedPage } from "./types";
import { getTopStories } from "./hn-api";
import { resolvePages } from "./status-checker";

/** Сколько новостей брать из топа HN. */
export const STORIES_LIMIT = 30;

/** TTL кэша списка, мс (1 час). */
const LIST_CACHE_TTL_MS = 60 * 60 * 1000;

interface ListCacheEntry {
  pages: ArchivedPage[];
  generatedAt: number;
  /** true, если HN API был недоступен (graceful degradation флаг). */
  hnUnavailable: boolean;
}

let listCache: ListCacheEntry | null = null;
let inflight: Promise<ListCacheEntry> | null = null;

async function buildList(): Promise<ListCacheEntry> {
  try {
    const items = await getTopStories(STORIES_LIMIT);
    const pages = await resolvePages(items);
    return { pages, generatedAt: Date.now(), hnUnavailable: false };
  } catch (err) {
    console.error("[archive-service] Hacker News API unavailable:", err);
    // Graceful degradation: возвращаем протухший кэш, если он есть.
    if (listCache) {
      return { ...listCache, hnUnavailable: true };
    }
    return { pages: [], generatedAt: Date.now(), hnUnavailable: true };
  }
}

/**
 * Возвращает список проверенных страниц. Кэшируется на 1 час;
 * параллельные вызовы разделяют один общий запрос (single-flight).
 */
export async function getArchiveList(): Promise<ListCacheEntry> {
  if (listCache && Date.now() < listCache.generatedAt + LIST_CACHE_TTL_MS && !listCache.hnUnavailable) {
    return listCache;
  }
  if (!inflight) {
    inflight = buildList().then((entry) => {
      // Не перетираем свежий кэш устаревшим результатом гонки.
      if (!listCache || entry.generatedAt >= listCache.generatedAt) {
        listCache = entry;
      }
      inflight = null;
      return listCache!;
    });
  }
  return inflight;
}

/** Находит одну страницу по id HN (из кэшированного списка). */
export async function getPageById(id: number): Promise<ArchivedPage | null> {
  const { pages } = await getArchiveList();
  return pages.find((p) => p.id === id) ?? null;
}

/** Количество сохранённых (ARCHIVED) страниц — для счётчика в header. */
export function countSaved(pages: ArchivedPage[]): number {
  return pages.filter((p) => p.status === "ARCHIVED").length;
}
