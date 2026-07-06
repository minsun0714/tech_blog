import { cache } from "react";

/**
 * 백엔드 GET API 클라이언트.
 * NEXT_PUBLIC_API_URL 에 프로토콜이 없으면 https:// 를 붙인다.
 * 유저 블로그는 인증 없는 GET 만 사용한다.
 */
const RAW = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const API_BASE = /^https?:\/\//.test(RAW) ? RAW : `https://${RAW}`;

/* ---------------- API 응답 타입 (문서 기준) ---------------- */
export interface ApiCategory {
  categoryId: number;
  parentId: number | null;
  categoryName: string;
  childrenCategoryList: ApiCategory[];
}
interface CategoriesResponse {
  categoryList: ApiCategory[];
}

export interface ApiSeries {
  id: number;
  name: string;
}
interface SeriesResponse {
  seriesResponseList: ApiSeries[];
}

export interface ApiTag {
  id: number;
  name: string;
}

export interface ApiPost {
  postId: number | null;
  title: string;
  content: string;
  openStatus: string;
  tagNames: string[];
  categoryId: number | null;
  seriesId: number | null;
}
interface PageResponse<T> {
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

export interface ApiComment {
  commentId: number;
  commentParentId: number | null;
  content: string;
  childrenCommentList: ApiComment[];
}
interface CommentsResponse {
  commentResponseList: ApiComment[];
}

/* ---------------- fetch helper ---------------- */
async function getJSON<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    // 백엔드가 꺼져 있어도 페이지는 렌더되도록 fallback 반환
    return fallback;
  }
}

/* ---------------- GET fetchers (요청 단위로 memoize) ---------------- */
export const getCategories = cache(async (): Promise<ApiCategory[]> => {
  const d = await getJSON<CategoriesResponse>("/api/categories", {
    categoryList: [],
  });
  return d.categoryList ?? [];
});

export const getSeries = cache(async (): Promise<ApiSeries[]> => {
  const d = await getJSON<SeriesResponse>("/api/series", {
    seriesResponseList: [],
  });
  return d.seriesResponseList ?? [];
});

export const getTags = cache(async (): Promise<ApiTag[]> => {
  return getJSON<ApiTag[]>("/api/tags", []);
});

export const getPosts = cache(async (): Promise<ApiPost[]> => {
  const d = await getJSON<PageResponse<ApiPost>>("/api/posts?size=200", {
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 0,
    first: true,
    last: true,
    numberOfElements: 0,
    empty: true,
  });
  return d.content ?? [];
});

export const getPost = cache(async (id: number): Promise<ApiPost | null> => {
  return getJSON<ApiPost | null>(`/api/posts/${id}`, null);
});

export const getComments = cache(async (postId: number): Promise<ApiComment[]> => {
  const d = await getJSON<CommentsResponse>(`/api/posts/${postId}/comments`, {
    commentResponseList: [],
  });
  return d.commentResponseList ?? [];
});
