"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { qs, type Filters } from "@/lib/view";

/** 필터 상태를 URL searchParams 로 관리하는 클라이언트 훅. 모든 필터 변경은 홈(`/`)으로 이동한다. */
export function useFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const current: Filters = {
    category: sp.get("category"),
    series: sp.get("series"),
    tag: sp.get("tag"),
    q: sp.get("q") || "",
    page: Number(sp.get("page") || "1") || 1,
  };

  const go = (f: Partial<Filters>) => router.push("/" + qs(f));

  return {
    current,
    /**
     * category/series/tag 는 상호 배타적 — 하나를 고르면 나머지 둘은 해제된다.
     * 같은 값이면 해제. 페이지는 1로 초기화. 검색(q)은 유지.
     */
    toggle: (key: "category" | "series" | "tag", value: string) => {
      const next: Filters = { ...current, category: null, series: null, tag: null, page: 1 };
      if (current[key] !== value) next[key] = value;
      go(next);
    },
    setSearch: (q: string) => go({ ...current, q: q || undefined, page: 1 }),
    gotoPage: (n: number) => {
      go({ ...current, page: n });
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    },
    clearAll: () => router.push("/"),
  };
}
