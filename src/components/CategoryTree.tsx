"use client";
import type { ApiCategory } from "@/lib/api";
import { flattenCategories } from "@/lib/view";
import { useFilters } from "./useFilters";

/** 사이드바/드로어 공용 카테고리 트리. 클릭 시 해당 카테고리로 필터링. */
export default function CategoryTree({
  categories,
  onNavigate,
}: {
  categories: ApiCategory[];
  onNavigate?: () => void;
}) {
  const { current, toggle } = useFilters();
  const rows = flattenCategories(categories);

  if (!rows.length) {
    return <div className="pop-empty">카테고리 없음</div>;
  }

  return (
    <div className="tree">
      {rows.map((row) => {
        const active = current.category === row.name;
        return (
          <button
            key={row.name}
            className={`node${active ? " active" : ""}`}
            onClick={() => {
              toggle("category", row.name);
              onNavigate?.();
            }}
          >
            <span className="branch">{row.branch}</span>
            <span>{row.name}</span>
          </button>
        );
      })}
    </div>
  );
}
