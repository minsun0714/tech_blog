import type { ApiCategory, ApiPost, ApiSeries } from "./api";

/** 목록/상세 렌더에 필요한 형태로 가공한 글. API 응답이 희소하므로 이름은 id로 유도한다. */

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}
export interface EnrichedPost {
  postId: number | null;
  title: string;
  content: string;
  excerpt: string;
  categoryId: number | null;
  categoryName: string | null;
  seriesId: number | null;
  seriesName: string | null;
  tagNames: string[];
  thumbnailImageUrl: string | null;
}

export interface Filters {
  category: string | null;
  series: string | null;
  tag: string | null;
  q: string;
  page: number;
}

/** 카테고리 트리를 평면화하며 각 노드에 트리 브랜치 문자열을 붙인다. */
export interface FlatCategory {
  name: string;
  branch: string;
}
export function flattenCategories(nodes: ApiCategory[]): FlatCategory[] {
  const rows: FlatCategory[] = [];
  const walk = (list: ApiCategory[], prefix: string, root: boolean) => {
    list.forEach((n, i) => {
      const last = i === list.length - 1;
      const branch = root ? "" : prefix + (last ? "└─ " : "├─ ");
      rows.push({ name: n.categoryName, branch });
      if (n.childrenCategoryList.length) {
        walk(n.childrenCategoryList, root ? "" : prefix + (last ? "   " : "│  "), false);
      }
    });
  };
  walk(nodes, "", true);
  return rows;
}

/** id 로 카테고리 이름 찾기 (트리 재귀 탐색). */
export function categoryNameById(nodes: ApiCategory[], id: number | null): string | null {
  if (id == null) return null;
  for (const n of nodes) {
    if (n.categoryId === id) return n.categoryName;
    const found = categoryNameById(n.childrenCategoryList, id);
    if (found) return found;
  }
  return null;
}

export function seriesNameById(series: ApiSeries[], id: number | null): string | null {
  if (id == null) return null;
  return series.find((s) => s.id === id)?.name ?? null;
}

/** 시리즈별 글 개수 */
export function seriesCounts(posts: ApiPost[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const p of posts) {
    if (p.seriesId != null) counts[p.seriesId] = (counts[p.seriesId] ?? 0) + 1;
  }
  return counts;
}

function stripHtml(s: string): string {
  return (s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(content: string, n = 120): string {
  const t = stripHtml(content);
  return t.length > n ? t.slice(0, n).trim() + "…" : t;
}

export function enrich(
  post: ApiPost,
  categories: ApiCategory[],
  series: PageResponse<ApiSeries>,
): EnrichedPost {
  return {
    postId: post.postId,
    title: post.title,
    content: post.content,
    excerpt: excerpt(post.content),
    categoryId: post.categoryId,
    categoryName: categoryNameById(categories, post.categoryId),
    seriesId: post.seriesId,
    seriesName: seriesNameById(series?.content, post.seriesId),
    tagNames: post.tagNames ?? [],
    thumbnailImageUrl: post.thumbnailImageUrl ?? null,
  };
}

export function filterPosts(posts: EnrichedPost[], f: Filters): EnrichedPost[] {
  const q = f.q.trim().toLowerCase();
  return posts.filter((p) => {
    if (f.category && p.categoryName !== f.category) return false;
    if (f.series && p.seriesName !== f.series) return false;
    if (f.tag && !p.tagNames.includes(f.tag)) return false;
    if (q) {
      const hay = [
        p.title,
        p.content,
        p.tagNames.join(" "),
        p.categoryName ?? "",
        p.seriesName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** 필터 상태를 쿼리스트링으로 직렬화 (`?category=...&page=2` 또는 ``). */
export function qs(f: Partial<Filters>): string {
  const p = new URLSearchParams();
  if (f.category) p.set("category", f.category);
  if (f.series) p.set("series", f.series);
  if (f.tag) p.set("tag", f.tag);
  if (f.q) p.set("q", f.q);
  if (f.page && f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** 페이지네이션 버튼 창 (1 … 4 5 6 … N) */
export function pageWindow(cur: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (cur <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (cur >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", cur - 1, cur, cur + 1, "…", total];
}

/** 재귀 댓글 개수 (대댓글 포함) */
export interface CommentNode {
  commentId: number;
  commentParentId: number | null;
  content: string;
  who?: string;
  pw?: string | null;
  childrenCommentList: CommentNode[];
}
export function countComments(list: CommentNode[]): number {
  return list.reduce((n, c) => n + 1 + countComments(c.childrenCommentList), 0);
}
