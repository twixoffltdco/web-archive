/**
 * lib/format.ts — утилиты форматирования (сервер + клиент).
 */

/** Unix timestamp (сек) → "05 окт 2026, 14:32". */
export function formatDateTime(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/** Относительная дата: "4 ч назад". */
export function timeAgo(unixSeconds: number): string {
  const diffSec = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}
