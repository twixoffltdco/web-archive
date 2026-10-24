/**
 * layout.tsx — корневой Server Component layout: тёмная тема, Header, Footer.
 * Google Fonts (JetBrains Mono + Inter) с display=swap и fallback на системные.
 */

import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Ephemeral Archive — то, что не должно исчезнуть",
    template: "%s · Ephemeral Archive",
  },
  description:
    "Мониторит топ Hacker News и сохраняет архивные копии страниц, которые перестали быть доступными. Wayback Machine + HN API. Без ключей, без мок-данных.",
  metadataBase: new URL("https://ephemeral-archive.example.com"),
  openGraph: {
    title: "Ephemeral Archive",
    description: "Ничто не умирает дважды. Архив страниц, потерянных в эфире.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className="dark">
      <body className="flex min-h-screen flex-col font-sans">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
