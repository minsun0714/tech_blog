"use client";
import { useState, type ReactNode } from "react";
import useSWR from "swr";
import type { ApiComment } from "@/lib/api";
import { countComments, type CommentNode } from "@/lib/view";

/**
 * 댓글 영역.
 * - 목록: 같은 오리진 프록시 GET /api/posts/{id}/comments 를 SWR 로 구독(초기값은 서버에서 주입).
 * - 작성/답글/수정: 같은 오리진 프록시(POST/PATCH)로 전송 → 서버가 X-API-KEY 를 붙여 백엔드로 포워딩.
 *   성공하면 mutate() 로 재검증 → 새로고침해도 유지된다.
 */
const fetcher = async (url: string): Promise<ApiComment[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("댓글을 불러오지 못했습니다.");
  return res.json();
};

// 백엔드는 현재 댓글 쓰기 바디로 {content, password}만 받는다. author 를 보내면 400.
// 백엔드가 작성자 이름 필드를 추가하면 true 로 바꾸면 입력한 이름이 전송된다(표시는 GET 응답에 author 가 실려야 함).
const SEND_AUTHOR = false;

async function postError(res: Response, fallback: string): Promise<string> {
  const e = await res.json().catch(() => null);
  return (e && typeof e.error === "string" && e.error) || fallback;
}

export default function Comments({ postId, initial }: { postId: number; initial: ApiComment[] }) {
  const key = `/api/posts/${postId}/comments`;
  const { data, mutate } = useSWR<ApiComment[]>(key, fetcher, {
    fallbackData: initial,
    revalidateOnFocus: false,
  });

  const list = toNodes(data ?? initial);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const total = countComments(list);

  const addRoot = async (name: string, pw: string, content: string): Promise<boolean> => {
    const res = await fetch(key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        password: pw || undefined,
        ...(SEND_AUTHOR ? { author: name } : {}),
      }),
    });
    if (!res.ok) {
      alert(await postError(res, "댓글 등록에 실패했습니다."));
      return false;
    }
    await mutate();
    return true;
  };

  const addReply = async (
    parentId: number,
    name: string,
    pw: string,
    content: string,
  ): Promise<boolean> => {
    const res = await fetch(`/api/comments/${parentId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        content,
        password: pw || undefined,
        ...(SEND_AUTHOR ? { author: name } : {}),
      }),
    });
    if (!res.ok) {
      alert(await postError(res, "답글 등록에 실패했습니다."));
      return false;
    }
    await mutate();
    setReplyTo(null);
    return true;
  };

  const saveEdit = async (id: number, pw: string, content: string): Promise<boolean> => {
    const res = await fetch(`/api/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, password: pw || undefined }),
    });
    if (!res.ok) {
      alert(await postError(res, "댓글 수정에 실패했습니다."));
      return false;
    }
    await mutate();
    setEditing(null);
    return true;
  };

  const removeComment = async (id: number, pw: string): Promise<boolean> => {
    const res = await fetch(`/api/comments/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw || undefined }),
    });
    if (!res.ok) {
      alert(await postError(res, "댓글 삭제에 실패했습니다."));
      return false;
    }
    await mutate();
    setDeleting(null);
    return true;
  };

  // 재귀 중첩 렌더: 자식 댓글을 부모 div 안에 넣어 깊이만큼 들여쓰기가 누적되게 한다.
  // (flat 렌더는 depth 1·2·3 이 모두 같은 위치라 대댓글의 대댓글이 구분되지 않았음)
  const renderNode = (c: CommentNode, depth: number): ReactNode => (
    <div className={`cmt${depth > 0 ? " reply" : ""}`} key={c.commentId}>
      <div className="cmt-top">
        <span className="who">{c.who ?? "guest"}</span>
        <span className="id">#{c.commentId}</span>
        <span className="cmt-actions">
          <button
            onClick={() => (
              setReplyTo(replyTo === c.commentId ? null : c.commentId),
              setEditing(null),
              setDeleting(null)
            )}
          >
            답글
          </button>
          <button
            onClick={() => (
              setEditing(editing === c.commentId ? null : c.commentId),
              setReplyTo(null),
              setDeleting(null)
            )}
          >
            수정
          </button>
          <button
            onClick={() => (
              setDeleting(deleting === c.commentId ? null : c.commentId),
              setReplyTo(null),
              setEditing(null)
            )}
          >
            삭제
          </button>
        </span>
      </div>
      {editing === c.commentId ? (
        <EditForm comment={c} onCancel={() => setEditing(null)} onSave={saveEdit} />
      ) : (
        <div className="txt">{c.content}</div>
      )}
      {replyTo === c.commentId && (
        <ReplyForm parentId={c.commentId} onCancel={() => setReplyTo(null)} onSubmit={addReply} />
      )}
      {deleting === c.commentId && (
        <DeleteForm onCancel={() => setDeleting(null)} onDelete={(pw) => removeComment(c.commentId, pw)} />
      )}
      {c.childrenCommentList.map((child) => renderNode(child, depth + 1))}
    </div>
  );

  return (
    <section className="comments" data-post-id={postId}>
      <div className="comments-h">
        comments <b>{total}</b>
      </div>
      {list.length ? (
        list.map((c) => renderNode(c, 0))
      ) : (
        <div className="empty">첫 댓글을 남겨보세요.</div>
      )}
      <RootForm onSubmit={addRoot} />
    </section>
  );
}

/* ---------------- forms ---------------- */
function RootForm({
  onSubmit,
}: {
  onSubmit: (name: string, pw: string, content: string) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!name.trim() || !content.trim()) return alert("이름과 내용을 입력하세요.");
    setBusy(true);
    const ok = await onSubmit(name.trim(), pw, content.trim());
    setBusy(false);
    if (ok) {
      setName("");
      setPw("");
      setContent("");
    }
  };
  return (
    <div className="cbox" style={{ marginTop: 22 }}>
      <div className="form-title">댓글 작성</div>
      <div className="row">
        <input placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          type="password"
          placeholder="비밀번호 (수정 시 필요)"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
      </div>
      <textarea
        placeholder="댓글을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="submit-row">
        <span className="hint">이름·비밀번호는 이 댓글에만 사용됩니다</span>
        <button className="btn" onClick={submit} disabled={busy}>
          {busy ? "등록 중…" : "등록"}
        </button>
      </div>
    </div>
  );
}

function ReplyForm({
  parentId,
  onCancel,
  onSubmit,
}: {
  parentId: number;
  onCancel: () => void;
  onSubmit: (parentId: number, name: string, pw: string, content: string) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!name.trim() || !content.trim()) return alert("이름과 내용을 입력하세요.");
    setBusy(true);
    await onSubmit(parentId, name.trim(), pw, content.trim());
    setBusy(false);
  };
  return (
    <div className="cbox">
      <div className="form-title">답글 작성</div>
      <div className="row">
        <input placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
      </div>
      <textarea
        placeholder="답글을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="submit-row">
        <span className="hint"></span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost sm" onClick={onCancel} disabled={busy}>
            취소
          </button>
          <button className="btn sm" onClick={submit} disabled={busy}>
            {busy ? "등록 중…" : "답글 등록"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditForm({
  comment,
  onCancel,
  onSave,
}: {
  comment: CommentNode;
  onCancel: () => void;
  onSave: (id: number, pw: string, content: string) => Promise<boolean>;
}) {
  const [content, setContent] = useState(comment.content);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!content.trim()) return alert("내용을 입력하세요.");
    setBusy(true);
    await onSave(comment.commentId, pw, content.trim());
    setBusy(false);
  };
  return (
    <div className="cmt-edit">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: "100%",
          minHeight: 70,
          fontFamily: "var(--sans)",
          fontSize: 14,
          border: "1px solid var(--line-2)",
          borderRadius: 8,
          padding: "9px 12px",
          resize: "vertical",
          lineHeight: 1.6,
        }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={{
            flex: 1,
            fontSize: 14,
            border: "1px solid var(--line-2)",
            borderRadius: 8,
            padding: "9px 12px",
          }}
        />
        <button className="btn ghost sm" onClick={onCancel} disabled={busy}>
          취소
        </button>
        <button className="btn sm" onClick={submit} disabled={busy}>
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}

function DeleteForm({
  onCancel,
  onDelete,
}: {
  onCancel: () => void;
  onDelete: (pw: string) => Promise<boolean>;
}) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    await onDelete(pw);
    setBusy(false);
  };
  return (
    <div className="cmt-edit">
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span className="hint" style={{ flex: 1 }}>
          삭제하려면 비밀번호를 입력하세요. 이 작업은 되돌릴 수 없습니다.
        </span>
        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={{
            width: 140,
            fontSize: 14,
            border: "1px solid var(--line-2)",
            borderRadius: 8,
            padding: "9px 12px",
          }}
        />
        <button className="btn ghost sm" onClick={onCancel} disabled={busy}>
          취소
        </button>
        <button className="btn sm" onClick={submit} disabled={busy}>
          {busy ? "삭제 중…" : "삭제"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function toNodes(list: ApiComment[]): CommentNode[] {
  return list.map((c) => ({
    commentId: c.commentId,
    commentParentId: c.commentParentId,
    content: c.content,
    who: c.author ?? undefined,
    childrenCommentList: toNodes(c.childrenCommentList ?? []),
  }));
}
