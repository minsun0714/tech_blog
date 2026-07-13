"use client";
import { useEffect, useState } from "react";
import type { ApiCategory } from "@/lib/api";
import CategoryTree from "./CategoryTree";

/** 데스크톱 좌측 레일 (카테고리 트리). 마운트 시 최신 카테고리를 클라이언트에서 fetch. */
export default function Sidebar() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (alive) setCategories(Array.isArray(d) ? d : []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <aside className="rail">
      <div className="rail-block">
        <div className="rail-h">categories</div>
        <CategoryTree categories={categories} />
      </div>
    </aside>
  );
}
