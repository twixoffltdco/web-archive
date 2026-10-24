/**
 * lib/hn-api.ts — клиент Hacker News Firebase API.
 *
 * Документация: https://github.com/HackerNews/API
 * Бесплатный API, не требует ключей авторизации.
 * Все запросы выполняются только с сервера.
 */

import type { HNItem } from "./types";

const HN_BASE = "https://hacker-news.firebaseio.com/v0";

/** Таймаут запроса к HN API, мс. */
const HN_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Получает массив ID топ-историй Hacker News.
 * При недоступности API бросает ошибку — вызывающий код обязан
 * обеспечить graceful degradation.
 */
export async function getTopStoryIds(limit: number): Promise<number[]> {
  const res = await fetchWithTimeout(`${HN_BASE}/topstories.json`, HN_TIMEOUT_MS);
  if (!res.ok) {
    throw new Error(`HN API: unexpected status ${res.status} for topstories.json`);
  }
  const ids: unknown = await res.json();
  if (!Array.isArray(ids)) {
    throw new Error("HN API: malformed response for topstories.json");
  }
  return ids.slice(0, limit).filter((id): id is number => typeof id === "number");
}

/**
 * Получает детали одного элемента (story).
 * Возвращает null, если элемент не найден или ответ некорректен.
 */
export async function getItem(id: number): Promise<HNItem | null> {
  try {
    const res = await fetchWithTimeout(`${HN_BASE}/item/${id}.json`, HN_TIMEOUT_MS);
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (
      data &&
      typeof data === "object" &&
      "id" in data &&
      "title" in data &&
      typeof (data as HNItem).title === "string"
    ) {
      return data as HNItem;
    }
    return null;
  } catch {
    // Graceful degradation: одна упавшая история не ломает весь список.
    return null;
  }
}

/**
 * Получает топ-N новостей с деталями (параллельно, с ограничением конкурентности).
 * Ошибки отдельных элементов пропускаются молча.
 */
export async function getTopStories(count = 30): Promise<HNItem[]> {
  const ids = await getTopStoryIds(count);
  const items = await Promise.all(ids.map((id) => getItem(id)));
  return items.filter((item): item is HNItem => item !== null);
}
