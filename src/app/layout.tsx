import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Header, { type SeriesWithCount } from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { getCategories, getSeries, getTags, getPosts } from "@/lib/api";
import { seriesCounts } from "@/lib/view";

export const metadata: Metadata = {
  title: "stdout — backend 개발 기록",
  description: "Spring · JPA · DDD 등 백엔드 개발 기록을 담은 기술 블로그",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [categories, series, tags, posts] = await Promise.all([
    getCategories(),
    getSeries(),
    getTags(),
    getPosts(),
  ]);

  const counts = seriesCounts(posts);
  const seriesWithCount: SeriesWithCount[] = series.map((s) => ({
    id: s.id,
    name: s.name,
    count: counts[s.id] ?? 0,
  }));

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <Suspense>
          <Header categories={categories} series={seriesWithCount} tags={tags} />
        </Suspense>
        <div className="shell">
          <Suspense>
            <Sidebar categories={categories} />
          </Suspense>
          <main id="main">{children}</main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
