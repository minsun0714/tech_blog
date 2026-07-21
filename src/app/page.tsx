import { getCategories, getPosts, getSeries } from "@/lib/api";
import { enrich, filterPosts, type Filters } from "@/lib/view";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import ClearFilters from "@/components/ClearFilters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 6;

type SearchParams = { [key: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  // 카테고리/시리즈/태그는 메모리 필터.
  const [posts, categories, series] = await Promise.all([
    getPosts(),
    getCategories(),
    getSeries(),
  ]);
  const enriched = posts.map((p) => enrich(p, categories, series));

  // category/series/tag 는 상호 배타적 — 여러 개가 들어와도 하나만 적용한다.
  // 우선순위: category > series > tag
  const fCategory = one(searchParams.category);
  let fSeries = one(searchParams.series);
  let fTag = one(searchParams.tag);
  if (fCategory) {
    fSeries = null;
    fTag = null;
  } else if (fSeries) {
    fTag = null;
  }

  const f: Filters = {
    category: fCategory,
    series: fSeries,
    tag: fTag,
    page: Number(one(searchParams.page) ?? "1") || 1,
  };

  const filtered = filterPosts(enriched, f);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, f.page), totalPages);
  const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  let label = "전체 글";
  if (f.category) label = `카테고리 · ${f.category}`;
  else if (f.series) label = `시리즈 · ${f.series}`;
  else if (f.tag) label = `태그 · #${f.tag}`;

  const hasFilter = Boolean(f.category || f.series || f.tag);

  return (
    <>
      <div className="list-head">
        <h1>{label}</h1>
        <span className="n">
          {filtered.length} posts {hasFilter && <ClearFilters />}
        </span>
      </div>

      {items.length ? (
        <div className="grid">
          {items.map((p, i) => (
            <PostCard key={p.postId ?? `i${i}`} post={p} />
          ))}
        </div>
      ) : (
        <div className="empty">조건에 맞는 글이 없습니다.</div>
      )}

      {filtered.length > 0 && (
        <Pagination page={page} totalPages={totalPages} count={filtered.length} />
      )}
    </>
  );
}
