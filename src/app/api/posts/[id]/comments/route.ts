import { NextResponse } from "next/server";
import { getComments, createComment } from "@/lib/api";

/**
 * 댓글 목록/작성 프록시.
 * - GET: SWR 재검증용. 백엔드 GET 은 공개지만 브라우저 직접 요청은 CORS 로 막히므로 같은 오리진의 이 라우트를 쓴다.
 * - POST: 서버 사이드에서 X-API-KEY 를 붙여 백엔드로 포워딩(키는 브라우저에 노출되지 않음).
 */
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const postId = Number(params.id);
  if (!Number.isFinite(postId)) {
    return NextResponse.json({ error: "잘못된 게시글 id" }, { status: 400 });
  }
  const comments = await getComments(postId);
  return NextResponse.json(comments, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const postId = Number(params.id);
  if (!Number.isFinite(postId)) {
    return NextResponse.json({ error: "잘못된 게시글 id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json({ error: "내용을 입력하세요." }, { status: 400 });
  }

  const r = await createComment(postId, {
    content: body.content.trim(),
    author: typeof body.author === "string" ? body.author.trim() : undefined,
    password: typeof body.password === "string" ? body.password : undefined,
  });
  if (!r.ok) {
    return NextResponse.json({ error: "댓글 등록에 실패했습니다." }, { status: r.status || 502 });
  }
  return NextResponse.json(r.data ?? { ok: true }, { status: 201 });
}
