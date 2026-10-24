/**
 * Ephemeral Archive — общие типы данных.
 */

/** Статус доступности страницы. */
export type PageStatus = "LIVE" | "ARCHIVED" | "LOST";

/** Новость Hacker News (сырые данные из Firebase API). */
export interface HNItem {
  id: number;
  title: string;
  /** URL оригинальной статьи (отсутствует у Ask/Show HN без ссылки). */
  url?: string;
  score: number;
  /** Unix timestamp публикации (секунды). */
  time: number;
  by?: string;
  descendants?: number;
  type?: string;
}

/** Запись, готовая для отображения в интерфейсе. */
export interface ArchivedPage {
  id: number;
  title: string;
  /** Оригинальный URL (или ссылка на обсуждение HN, если URL отсутствует). */
  url: string;
  domain: string;
  score: number;
  /** Unix timestamp публикации. */
  publishedAt: number;
  status: PageStatus;
  /** TIMESTAMPE последней архивной копии (YYYYMMDDhhmmss), если есть. */
  archiveTimestamp: string | null;
  /** Отформатированная дата архивной копии. */
  archiveDate: string | null;
  /** Прямая ссылка на снимок Wayback Machine. */
  archiveUrl: string | null;
  /** Код HTTP ответа оригинала (если удалось получить). */
  originalHttpCode: number | null;
}

/** Результат проверки живости URL. */
export interface UrlCheckResult {
  alive: boolean;
  httpCode: number | null;
}

/** Результат поиска архивной копии. */
export interface WaybackSnapshot {
  timestamp: string;
  url: string;
}
