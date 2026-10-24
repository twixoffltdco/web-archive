/**
 * app/api/health/route.ts — Route Handler (только серверный).
 * Возвращает состояние внешних зависимостей и статистику кэша.
 * GET /api/health
 */

import { NextResponse } from "next/server";
import { getWaybackCacheStats } from "@/lib/wayback";

export const dynamic = "force-dynamic";

async function ping(name: string, url: string): Promise<{ name: string; ok: boolean; ms: number }> {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    return { name, ok: res.ok, ms: Date.now() - started };
  } catch {
    return { name, ok: false, ms: Date.now() - started };
  }
}

export async function GET() {
  const [hn, archive] = await Promise.all([
    ping("hacker-news", "https://hacker-news.firebaseio.com/v0/topstories.json"),
    ping("wayback-cdx", "https://web.archive.org/cdx/search/cdx?url=example.com&limit=1&output=json"),
  ]);

  return NextResponse.json({
    service: "ephemeral-archive",
    time: new Date().toISOString(),
    dependencies: { hn, wayback: archive },
    waybackCache: getWaybackCacheStats(),
    degraded: !hn.ok || !archive.ok,
  });
}
