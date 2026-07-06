"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiTag } from "@/lib/api";
import type { ApiCategory } from "@/lib/api";
import { useFilters } from "./useFilters";
import CategoryTree from "./CategoryTree";

export interface SeriesWithCount {
  id: number;
  name: string;
  count: number;
}

export default function Header({
  categories,
  series,
  tags,
}: {
  categories: ApiCategory[];
  series: SeriesWithCount[];
  tags: ApiTag[];
}) {
  const router = useRouter();
  const { current, toggle, setSearch } = useFilters();

  const [openDD, setOpenDD] = useState<null | "series" | "tags">(null);
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState(current.q);
  const [tagFilter, setTagFilter] = useState("");
  const ddRef = useRef<HTMLElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // 검색: 350ms 디바운스 후 URL 반영
  const onSearchInput = (v: string) => {
    setQ(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(v.trim()), 350);
  };

  // 드롭다운 바깥 클릭 / ESC 닫기
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setOpenDD(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDD(null);
        setDrawer(false);
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // 드로어 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const shownTags = tags.filter(
    (t) => !tagFilter || t.name.toLowerCase().includes(tagFilter.toLowerCase()),
  );

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

          <nav className="top" ref={ddRef}>
            <div className={`dd${openDD === "series" ? " open" : ""}`}>
              <button onClick={() => setOpenDD(openDD === "series" ? null : "series")}>
                series <span className="arw">▼</span>
              </button>
              <div className="popover">
                <div className="pop-h">series</div>
                <div>
                  {series.length ? (
                    series.map((s) => (
                      <button
                        key={s.id}
                        className={`series-item${current.series === s.name ? " active" : ""}`}
                        onClick={() => {
                          toggle("series", s.name);
                          setOpenDD(null);
                        }}
                      >
                        <span className="name">{s.name}</span>
                        <span className="num">{s.count}</span>
                      </button>
                    ))
                  ) : (
                    <div className="pop-empty">시리즈 없음</div>
                  )}
                </div>
              </div>
            </div>

            <div className={`dd${openDD === "tags" ? " open" : ""}`}>
              <button onClick={() => setOpenDD(openDD === "tags" ? null : "tags")}>
                tags <span className="arw">▼</span>
              </button>
              <div className="popover">
                <div className="pop-h">tags</div>
                <input
                  className="pop-filter"
                  placeholder="태그 검색"
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  autoComplete="off"
                />
                <div className="pop-scroll">
                  <div className="tagcloud">
                    {shownTags.length ? (
                      shownTags.map((t) => (
                        <span
                          key={t.id}
                          className={`chip${current.tag === t.name ? " active" : ""}`}
                          onClick={() => {
                            toggle("tag", t.name);
                            setOpenDD(null);
                          }}
                        >
                          {t.name}
                        </span>
                      ))
                    ) : (
                      <div className="pop-empty">일치하는 태그 없음</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
          <CategoryTree categories={categories} onNavigate={() => setDrawer(false)} />
        </div>
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--ink-3)",
            lineHeight: 1.7,
          }}
        >
          시리즈·태그는 상단 헤더에서 선택하세요.
        </p>
      </aside>
    </>
  );
}
