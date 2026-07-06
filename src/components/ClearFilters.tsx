"use client";
import { useFilters } from "./useFilters";

export default function ClearFilters() {
  const { clearAll } = useFilters();
  return (
    <span className="clear" onClick={clearAll} role="button" tabIndex={0}>
      ✕ 필터 해제
    </span>
  );
}
