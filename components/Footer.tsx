import { Star, Scale } from "lucide-react";

/** FOOTER (Server Component). */
export default function Footer() {
  return (
    <footer className="mt-16 border-t border-archive-border bg-archive-panel/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left">
        <p className="font-mono text-xs text-slate-500">
          EPHEMERAL&nbsp;ARCHIVE © {new Date().getFullYear()} — данные: Hacker News API ·
          Wayback Machine CDX
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/ephemeral-archive/ephemeral-archive"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-archive-archived/40 bg-archive-archived/10 px-3 py-1.5 font-mono text-xs text-archive-archived transition-all hover:bg-archive-archived/20 hover:shadow-[0_0_12px_rgba(249,115,22,0.25)]"
          >
            <Star size={13} />
            Как тебе проект? ⭐ Star on GitHub
          </a>
          <a
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400 transition-colors hover:text-archive-accent"
          >
            <Scale size={13} />
            MIT LICENSE
          </a>
        </div>
      </div>
    </footer>
  );
}
