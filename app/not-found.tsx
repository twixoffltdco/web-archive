/**
 * not-found.tsx — 404 в стиле архива.
 */

import Link from "next/link";
import { Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Ghost size={40} className="mb-4 text-slate-600" />
      <h1 className="font-mono text-lg font-bold uppercase tracking-[0.2em] text-slate-300">
        404 · запись не найдена
      </h1>
      <p className="mt-2 max-w-md font-mono text-xs leading-relaxed text-slate-500">
        Возможно, эта страница ещё не прошла аудит или выпала из текущего топ-30 Hacker News.
        Статусы пересчитываются каждый час.
      </p>
      <Link
        href="/"
        className="mt-6 rounded border border-archive-accent/50 bg-archive-accent/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-archive-accent transition-colors hover:bg-archive-accent/20"
      >
        ← вернуться к архиву
      </Link>
    </div>
  );
}
