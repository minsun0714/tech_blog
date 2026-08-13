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
  postCount?: number; // 백엔드가 시리즈 목록에 실어주면 사용 (없으면 개수 미표시)
}

export interface ApiTag {
  id: number;
  name: string;
  postCount?: number; // 백엔드가 태그 목록에 실어주면 사용 (없으면 개수 미표시)
}

export interface ApiPost {
  postId: number | null;
  title: string;
  content: string;
  publishStatus: string;
  tagNames: string[];
  categoryId: number | null;
  seriesId: number | null;
  // 백엔드가 곧 추가 예정. 없거나 null이면 기본 썸네일로 폴백한다.
  thumbnailImageUrl?: string | null;
  commentCount: number;
}

export interface PageSort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: PageSort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PageResponse<T> {
  content: T[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  sort: PageSort;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ApiComment {
  commentId: number;
  commentParentId: number | null;
  content: string;
  // 백엔드가 곧 추가 예정(작성자 이름). 없으면 "guest"로 표시.
  author?: string | null;
  childrenCommentList: ApiComment[];
}

/**
 * 댓글 쓰기 바디. 백엔드가 author/password 를 추가하기 전까지는 무시될 수 있다.
 * 백엔드 확정 필드명이 다르면 buildWriteBody 한 곳만 고치면 된다.
 */
export interface CommentWriteInput {
  content: string;
  author?: string;
  password?: string;
}
interface CommentsResponse {
  commentResponseList: ApiComment[];
}

/* ---------------- fetch helper ---------------- */
async function getJSON<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } catch {
    // 백엔드가 꺼져 있어도 페이지는 렌더되도록 fallback 반환
    throw new Error(`Failed to fetch ${path} from API_BASE=${API_BASE}`);
  }
}

/* ---------------- GET fetchers (요청 단위로 memoize) ---------------- */
export const getCategories = cache(async (): Promise<ApiCategory[]> => {
  const d = await getJSON<CategoriesResponse>("/api/categories");
  return d.categoryList ?? [];
});

export const getSeries = cache(async (): Promise<PageResponse<ApiSeries>> => {
  const d = await getJSON<PageResponse<ApiSeries>>("/api/series");
  console.log("getSeries", d);
  return d;
});

export const getTags = cache(async (): Promise<ApiTag[]> => {
  return getJSON<ApiTag[]>("/api/tags");
});

export interface PostQuery {
  categoryId?: number;
  seriesId?: number;
  tagId?: number;
  page?: number;
  size?: number;
}

export const getPosts = cache(async (query: PostQuery = {}): Promise<PageResponse<ApiPost>> => {
  const params = new URLSearchParams({
    page: String(query.page ?? 0),
    size: String(query.size ?? 6),
  });
  if (query.categoryId != null) params.set("categoryId", String(query.categoryId));
  if (query.seriesId != null) params.set("seriesId", String(query.seriesId));
  if (query.tagId != null) params.set("tagId", String(query.tagId));
  const d = await getJSON<PageResponse<ApiPost>>(`/api/posts?${params}`);
  return { ...d, content: d.content ?? [] };
});

export const getPost = cache(async (id: number): Promise<ApiPost | null> => {
  return getJSON<ApiPost | null>(`/api/posts/${id}`);
});

export const getComments = cache(async (postId: number): Promise<ApiComment[]> => {
  const d = await getJSON<CommentsResponse>(`/api/posts/${postId}/comments`);
  return d.commentResponseList ?? [];
});

/* ---------------- 인증 붙은 쓰기 (서버 전용) ----------------
 * 키는 NEXT_PUBLIC_ 이 아니므로 서버(Route Handler)에서만 읽힌다 → 브라우저 노출 없음.
 * 이 함수들은 반드시 서버 사이드(app/api/*)에서만 호출할 것.
 *
 * 환경변수 이름과 헤더 이름은 별개다:
 *   Vercel 은 환경변수 이름에 하이픈을 허용하지 않으므로 X_API_KEY 로 등록하고,
 *   백엔드로 나갈 때만 헤더명 X-API-KEY 로 바꿔서 보낸다.
 *   로컬 .env 의 기존 X-API-KEY 표기도 계속 지원한다(둘 중 있는 쪽 사용).
 */
function getApiKey(): string {
  // 모듈 로드 시점이 아니라 호출 시점에 읽는다(빌드 타임 인라인 방지).
  return process.env.X_API_KEY ?? process.env["X-API-KEY"] ?? "";
}

export interface WriteResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
}

async function sendJSON<T>(
  path: string,
  body: unknown,
  method: "POST" | "PATCH" | "DELETE" = "POST",
): Promise<WriteResult<T>> {
  const apiKey = getApiKey();
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data: T | null = null;
    try {
      data = (await res.json()) as T;
    } catch {
      // 바디 없는 응답(예: 204)일 수 있음
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

/** 백엔드 필드명이 확정되면 이 매핑만 수정한다. */
function buildWriteBody(input: CommentWriteInput, extra?: Record<string, unknown>) {
  return {
    content: input.content,
    ...(input.author ? { author: input.author } : {}),
    ...(input.password ? { password: input.password } : {}),
    ...extra,
  };
}

/** 루트 댓글 작성: POST /api/posts/{postId}/comments */
export function createComment(postId: number, input: CommentWriteInput) {
  return sendJSON(`/api/posts/${postId}/comments`, buildWriteBody(input));
}

/** 답글 작성: POST /api/comments/{parentId}/replies (바디에 postId 포함) */
export function createReply(parentId: number, postId: number, input: CommentWriteInput) {
  return sendJSON(`/api/comments/${parentId}/replies`, buildWriteBody(input, { postId }));
}

/** 댓글 수정: PATCH /api/comments/{id} (게스트 검증용 password 포함) */
export function updateComment(id: number, input: CommentWriteInput) {
  return sendJSON(`/api/comments/${id}`, buildWriteBody(input), "PATCH");
}

/**
 * 댓글 삭제: DELETE /api/comments/{id}
 * 게스트 검증용 password 는 백엔드 추가 예정 → password 있으면 바디로 보낸다(수정과 동일 규약).
 * 백엔드가 쿼리파라미터 방식을 택하면 이 함수 한 곳만 고치면 된다.
 */
export function deleteComment(id: number, password?: string) {
  return sendJSON(`/api/comments/${id}`, password ? { password } : undefined, "DELETE");
}
