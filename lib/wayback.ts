/**
 * lib/wayback.ts — клиент Wayback Machine CDX API с очередью и кэшем.
 *
 * API: https://web.archive.org/cdx/search/cdx
 * Бесплатный, без ключей. Internet Archive просит не превышать разумную
 * частоту запросов, поэтому здесь реализовано:
 *   - rate limiting: не более 1 запроса в секунду (FIFO-очередь);
 *   - in-memory кэш результатов на 1 час (не дёргаем Archive при каждом рендере).
 */

import type { WaybackSnapshot } from "./types";

const CDX_ENDPOINT = "https://web.archive.org/cdx/search/cdx";

/** Минимальный интервал между запросами к CDX API, мс (1 req/sec). */
const RATE_LIMIT_MS = 1000;

/** Время жизни записи в кэше, мс (1 час). */
const CACHE_TTL_MS = 60 * 60 * 1000;

/** Таймаут одного CDX-запроса, мс. */
const CDX_TIMEOUT_MS = 10_000;

interface CacheEntry {
  /** null означает «архивной копии нет». */
  snapshot: WaybackSnapshot | null;
  expiresAt: number;
}

/** Кэш сервера процесса (Map живёт всё время жизни Node-процесса). */
const cache = new Map<string, CacheEntry>();

/** FIFO-очередь задач,по очереди одна за другой с паузой RATE_LIMIT_MS. */
type QueueTask<T> = () => Promise<T>;

let queueTail: Promise<void> = Promise.resolve();
let lastTaskAt = 0;

/**
 * Ставит задачу в очередь с гарантированной паузой >= RATE_LIMIT_MS
 * между обращениями к внешнему API.
 */
function enqueue<T>(task: QueueTask<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const now = Date.now();
    const wait = Math.max(0, RATE_LIMIT_MS - (now - lastTaskAt));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastTaskAt = Date.now();
    return task();
  };
  const result = queueTail.then(run, run);
  // Не даём ошибке одной задачи остановить всю очередь.
  queueTail = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

/** Форматирует CDX-таймстамп (YYYYMMDDhhmmss) в человекочитаемую дату. */
export function formatArchiveTimestamp(ts: string): string {
  if (!/^\d{14}$/.test(ts)) return ts;
  const y = ts.slice(0, 4);
  const mo = ts.slice(4, 6);
  const d = ts.slice(6, 8);
  const h = ts.slice(8, 10);
  const mi = ts.slice(10, 12);
  return `${d}.${mo}.${y} ${h}:${mi} UTC`;
}

/** Строит прямую ссылку на снимок. */
export function buildArchiveUrl(timestamp: string, url: string): string {
  return `https://web.archive.org/web/${timestamp}/${url}`;
}

/**
 * Ищет последнюю архивную копию URL через CDX API.
 * Возвращает null, если копий нет или Archive недоступен
 * (в этом случае считаем копию отсутствующей — graceful degradation,
 * но ошибку НЕ кэшируем надолго).
 */
export async function findLatestSnapshot(url: string): Promise<WaybackSnapshot | null> {
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.snapshot;
  }

  const cdxUrl =
    `${CDX_ENDPOINT}?url=${encodeURIComponent(url)}` +
    `&output=json&limit=-1&filter=statuscode:200&collapse=urlkey`;

  try {
    const snapshot = await enqueue(async (): Promise<WaybackSnapshot | null> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CDX_TIMEOUT_MS);
      try {
        const res = await fetch(cdxUrl, { signal: controller.signal });
        if (!res.ok) return null;
        const data: unknown = await res.json();
        // CDX JSON: [header, row1, row2...], limit=-1 возвращает последнюю запись.
        if (Array.isArray(data) && data.length >= 2) {
          const header = data[0] as string[];
          const row = data[data.length - 1] as string[];
          const tsIdx = header.indexOf("timestamp");
          const urlIdx = header.indexOf("original");
          if (tsIdx !== -1 && typeof row[tsIdx] === "string") {
            const timestamp = row[tsIdx];
            const original = urlIdx !== -1 && typeof row[urlIdx] === "string" ? row[urlIdx] : url;
            return { timestamp, url: original };
          }
        }
        return null;
      } finally {
        clearTimeout(timer);
      }
    });

    // Кэшируем только успешный ответ (snapshot найден или явно отсутствует).
    cache.set(url, { snapshot, expiresAt: Date.now() + CACHE_TTL_MS });
    return snapshot;
  } catch {
    // Ошибка сети/таймаут: кратковременный negative-cache (30 сек),
    // чтобы не зацикливать очередь при проблемах у Archive.
    cache.set(url, { snapshot: null, expiresAt: Date.now() + 30_000 });
    return null;
  }
}

/** Статистика кэша (для debug-эндпоинта / health-check). */
export function getWaybackCacheStats(): { entries: number; hitRatioSample: number } {
  return { entries: cache.size, hitRatioSample: 0 };
}
