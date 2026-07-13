import { NextResponse } from "next/server";
import { createReply } from "@/lib/api";

/** 답글 작성 프록시: POST /api/comments/{parentId}/replies (바디 {postId, content, ...}). */
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const parentId = Number(params.id);
  if (!Number.isFinite(parentId)) {
    return NextResponse.json({ error: "잘못된 부모 댓글 id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.postId !== "number" ||
    typeof body.content !== "string" ||
    !body.content.trim()
  ) {
    return NextResponse.json({ error: "postId 와 내용이 필요합니다." }, { status: 400 });
  }

  const r = await createReply(parentId, body.postId, {
    content: body.content.trim(),
    author: typeof body.author === "string" ? body.author.trim() : undefined,
    password: typeof body.password === "string" ? body.password : undefined,
  });
  if (!r.ok) {
    return NextResponse.json({ error: "답글 등록에 실패했습니다." }, { status: r.status || 502 });
  }
  return NextResponse.json(r.data ?? { ok: true }, { status: 201 });
}
