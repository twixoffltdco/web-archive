/**
 * error.tsx — глобальный обработчик ошибок рендера (Client Component —
 * единственное место, где допустим клиентский компонент для UI-ошибки).
 * Данные всё равно никогда не запрашиваются с клиента.
 */

"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <TriangleAlert size={40} className="mb-4 text-archive-lost" />
      <h1 className="font-mono text-lg font-bold uppercase tracking-[0.2em] text-slate-300">
        Сбой при обращении к архиву
      </h1>
      <p className="mt-2 max-w-md font-mono text-xs leading-relaxed text-slate-500">
        Внешний API (Hacker News или Wayback Machine) может быть временно недоступен.
        Сервис использует graceful degradation — попробуйте обновить страницу.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[10px] text-slate-700">digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded border border-archive-accent/50 bg-archive-accent/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-archive-accent transition-colors hover:bg-archive-accent/20"
      >
        <RotateCcw size={13} /> повторить
      </button>
    </div>
  );
}
