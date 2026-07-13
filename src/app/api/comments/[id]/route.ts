import { NextResponse } from "next/server";
import { updateComment, deleteComment } from "@/lib/api";

/** 댓글 수정/삭제 프록시: PATCH/DELETE /api/comments/{id}. 서버에서 X-API-KEY 주입. */
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "잘못된 댓글 id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json({ error: "내용을 입력하세요." }, { status: 400 });
  }

  const r = await updateComment(id, {
    content: body.content.trim(),
    password: typeof body.password === "string" ? body.password : undefined,
  });
  if (!r.ok) {
    // 백엔드가 비밀번호 불일치를 403 으로 준다면 그대로 전달
    const msg = r.status === 403 ? "비밀번호가 일치하지 않습니다." : "댓글 수정에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: r.status || 502 });
  }
  return NextResponse.json(r.data ?? { ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "잘못된 댓글 id" }, { status: 400 });
  }
  // password 는 게스트 검증용(백엔드 추가 예정). 바디 없이 올 수도 있으므로 optional 처리.
  const body = await req.json().catch(() => null);
  const password = body && typeof body.password === "string" ? body.password : undefined;

  const r = await deleteComment(id, password);
  if (!r.ok) {
    const msg = r.status === 403 ? "비밀번호가 일치하지 않습니다." : "댓글 삭제에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: r.status || 502 });
  }
  return NextResponse.json({ ok: true });
}
