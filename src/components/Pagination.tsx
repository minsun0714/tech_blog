"use client";
import { pageWindow } from "@/lib/view";
import { useFilters } from "./useFilters";

export default function Pagination({
  page,
  totalPages,
  count,
}: {
  page: number;
  totalPages: number;
  count: number;
}) {
  const { gotoPage } = useFilters();

  return (
    <div className="pager">
      <button disabled={page <= 1} onClick={() => gotoPage(page - 1)} aria-label="이전">
        ←
      </button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span className="gap" key={`gap${i}`}>
            …
          </span>
        ) : (
          <button
            key={p}
            className={p === page ? "active" : ""}
            disabled={p === page}
            onClick={() => gotoPage(p)}
          >
            {p}
          </button>
        ),
      )}
      <button disabled={page >= totalPages} onClick={() => gotoPage(page + 1)} aria-label="다음">
        →
      </button>
      <div className="pginfo">
        page {page} / {totalPages} · 총 {count}개
      </div>
    </div>
  );
}
