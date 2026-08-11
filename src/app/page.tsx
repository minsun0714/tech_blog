import { getCategories, getPosts, getSeries, getTags } from "@/lib/api";
import { categoryById, enrich, type Filters } from "@/lib/view";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import ClearFilters from "@/components/ClearFilters";

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const fCategory = Number(one(searchParams.category)) || null;
  let fSeries = Number(one(searchParams.series)) || null;
  let fTag = Number(one(searchParams.tag)) || null;
  if (fCategory != null) {
    fSeries = null;
    fTag = null;
  } else if (fSeries) {
    fTag = null;
  }

  // 카테고리/시리즈/태그는 메모리 필터.
  const [posts, categories, series, tags] = await Promise.all([
    getPosts({
      categoryId: fCategory ?? undefined,
      seriesId: fSeries ?? undefined,
      tagId: fTag ?? undefined,
      page: Math.max(0, (Number(one(searchParams.page) ?? "1") || 1) - 1),
      size: 6,
    }),
    getCategories(),
    getSeries(),
    getTags(),
  ]);
  const enriched = posts.content.map((p) => enrich(p, categories, series));
  const tagIds = Object.fromEntries(tags.map((tag) => [tag.name, tag.id]));

  // category/series/tag 는 상호 배타적 — 여러 개가 들어와도 하나만 적용한다.
  // 우선순위: category > series > tag
  const f: Filters = {
    category: fCategory,
    series: fSeries,
    tag: fTag,
    page: Number(one(searchParams.page) ?? "1") || 1,
  };

  const totalPages = Math.max(1, posts.totalPages);
  const page = Math.min(Math.max(1, f.page), totalPages);
  const items = enriched;

  let label = "전체 글";
  if (f.category) label = `카테고리 · ${f.category}`;
  else if (f.series) label = `시리즈 · ${f.series}`;
  else if (f.tag) label = `태그 · #${f.tag}`;

  if (f.category != null) label = categoryById(categories, f.category)?.categoryName ?? label;

  const hasFilter = Boolean(f.category || f.series || f.tag);

  return (
    <>
      <div className="list-head">
        <h1>{label}</h1>
        <span className="n">
          {posts.totalElements} posts {hasFilter && <ClearFilters />}
        </span>
      </div>

      {items.length ? (
        <div className="grid">
          {items.map((p, i) => (
            <PostCard key={p.postId ?? `i${i}`} post={p} tagIds={tagIds} />
          ))}
        </div>
      ) : (
        <div className="empty">조건에 맞는 글이 없습니다.</div>
      )}

      {posts.totalElements > 0 && (
        <Pagination page={page} totalPages={totalPages} count={posts.totalElements} />
      )}
    </>
  );
}
