"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApiCategory } from "@/lib/api";
import { useFilters } from "./useFilters";
import CategoryTree from "./CategoryTree";
import CategoryTreeSkeleton from "./CategoryTreeSkeleton";

export default function Header() {
  const router = useRouter();
  const { current, setSearch } = useFilters();

  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState(current.q);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // 검색: 350ms 디바운스 후 URL 반영
  const onSearchInput = (v: string) => {
    setQ(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v.trim()), 350);
  };

  // ESC 로 드로어 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // 드로어 열릴 때: 스크롤 잠금 + 카테고리를 매번 새로 fetch (중간 갱신 반영)
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    if (!drawer) return () => {};

    let alive = true;
    setCatLoading(true);
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (alive) setCategories(Array.isArray(d) ? d : []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setCatLoading(false);
      });

    return () => {
      alive = false;
      document.body.style.overflow = "";
    };
  }, [drawer]);

  return (
    <>
      <header className="site">
        <div className="site-inner">
          <button
            className="hamburger"
            aria-label="메뉴 열기"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="wordmark" onClick={() => router.push("/")}>
            <span className="glyph">
              <span className="caret">&gt;</span> stdout
            </span>
            <span className="tag">backend 개발 기록</span>
          </div>

          <div className="search">
            <span className="mag">⌕</span>
            <input
              type="search"
              placeholder="제목·내용·태그 검색"
              value={q}
              onChange={(e) => onSearchInput(e.target.value)}
              autoComplete="off"
            />
          </div>

          <nav className="top">
            <Link className="topnav" href="/series">
              series
            </Link>
            <Link className="topnav" href="/tags">
              tags
            </Link>
          </nav>
        </div>
      </header>

      {/* 모바일 드로어 */}
      <div className={`backdrop${drawer ? " open" : ""}`} onClick={() => setDrawer(false)} />
      <aside className={`drawer${drawer ? " open" : ""}`} aria-hidden={!drawer}>
        <div className="drawer-top">
          <span className="glyph">
            <span className="caret">&gt;</span> stdout
          </span>
          <button className="drawer-close" onClick={() => setDrawer(false)} aria-label="메뉴 닫기">
            ✕
          </button>
        </div>

        <div className="rail-block">
          <div className="rail-h">categories</div>
          {catLoading && !categories.length ? (
            <CategoryTreeSkeleton />
          ) : (
            <CategoryTree categories={categories} onNavigate={() => setDrawer(false)} />
          )}
        </div>

        <div className="rail-block">
          <div className="rail-h">explore</div>
          <nav className="drawer-nav">
            <Link href="/series" onClick={() => setDrawer(false)}>
              series <span className="arw">→</span>
            </Link>
            <Link href="/tags" onClick={() => setDrawer(false)}>
              tags <span className="arw">→</span>
            </Link>
          </nav>
        </div>
      </aside>
    </>
  );
}
