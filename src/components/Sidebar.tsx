import type { ApiCategory } from "@/lib/api";
import CategoryTree from "./CategoryTree";

/** 데스크톱 좌측 레일 (카테고리 트리) */
export default function Sidebar({ categories }: { categories: ApiCategory[] }) {
  return (
    <aside className="rail">
      <div className="rail-block">
        <div className="rail-h">categories</div>
        <CategoryTree categories={categories} />
      </div>
    </aside>
  );
}
