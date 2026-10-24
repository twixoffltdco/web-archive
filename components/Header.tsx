import Link from "next/link";
import { Archive, Github, Database } from "lucide-react";
import { getArchiveList, countSaved } from "@/lib/archive-service";

/**
 * HEADER (Server Component): логотип, счётчик «Сохранено: X страниц»,
 * ссылка на GitHub.
 */
export default async function Header() {
  // Данные берутся из серверного кэша — без дополнительных сетевых запросов,
  // если список уже собран главной страницей.
  const { pages } = await getArchiveList();
  const saved = countSaved(pages);

  return (
    <header className="sticky top-0 z-50 border-b border-archive-border bg-archive-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded border border-archive-accent/40 bg-archive-accent/10 text-archive-accent transition-colors group-hover:bg-archive-accent/20">
            <Archive size={18} strokeWidth={2} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-slate-100">
              Ephemeral&nbsp;Archive
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-widest text-slate-500 sm:block">
              nothing dies twice
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 rounded border border-archive-border bg-archive-panel px-3 py-1.5">
            <Database size={14} className="text-archive-archived" />
            <span className="font-mono text-xs text-slate-300">
              Сохранено:{" "}
              <span className="font-bold text-archive-archived">{saved}</span>{" "}
              страниц
            </span>
          </div>
          <a
            href="https://github.com/ephemeral-archive/ephemeral-archive"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub репозиторий"
            className="flex h-9 w-9 items-center justify-center rounded border border-archive-border text-slate-400 transition-colors hover:border-archive-accent/50 hover:text-archive-accent"
          >
            <Github size={16} />
          </a>
        </div>
      </div>
    </header>
  );
}
