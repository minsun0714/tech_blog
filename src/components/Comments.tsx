"use client";
import { useRef, useState, type ReactNode } from "react";
import type { ApiComment } from "@/lib/api";
import { countComments, type CommentNode } from "@/lib/view";

/**
 * 댓글 영역. 표시는 GET /api/posts/{id}/comments 응답(서버에서 주입)으로 하고,
 * 작성/답글/수정은 유저용 쓰기 API 가 없어 로컬 상태로만 처리한다(디자인 재현).
 */
export default function Comments({ postId, initial }: { postId: number; initial: ApiComment[] }) {
  const [list, setList] = useState<CommentNode[]>(() => toNodes(initial));
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const seq = useRef(1_000_000);

  const total = countComments(list);

  const addRoot = (name: string, pw: string, content: string) => {
    setList((prev) => [
      ...prev,
      {
        commentId: ++seq.current,
        commentParentId: null,
        who: name,
        pw: pw || null,
        content,
        childrenCommentList: [],
      },
    ]);
  };

  const addReply = (parentId: number, name: string, pw: string, content: string) => {
    setList((prev) => {
      const next = structuredClone(prev) as CommentNode[];
      const parent = findComment(next, parentId);
      parent?.childrenCommentList.push({
        commentId: ++seq.current,
        commentParentId: parentId,
        who: name,
        pw: pw || null,
        content,
        childrenCommentList: [],
      });
      return next;
    });
    setReplyTo(null);
  };

  const saveEdit = (id: number, pw: string, content: string): boolean => {
    let ok = false;
    setList((prev) => {
      const next = structuredClone(prev) as CommentNode[];
      const c = findComment(next, id);
      if (!c) return prev;
      if (c.pw == null) {
        alert(
          "이 댓글은 비밀번호가 없어 수정할 수 없습니다. (게스트 댓글만 본인 비밀번호로 수정 가능)",
        );
        return prev;
      }
      if (pw !== c.pw) {
        alert("비밀번호가 일치하지 않습니다.");
        return prev;
      }
      c.content = content;
      ok = true;
      return next;
    });
    if (ok) setEditing(null);
    return ok;
  };

  const rows: ReactNode[] = [];
  const walk = (nodes: CommentNode[], depth: number) => {
    nodes.forEach((c) => {
      rows.push(
        <div className={`cmt${depth > 0 ? " reply" : ""}`} key={c.commentId}>
          <div className="cmt-top">
            <span className="who">{c.who ?? "guest"}</span>
            <span className="id">#{c.commentId}</span>
            <span className="cmt-actions">
              <button
                onClick={() => (
                  setReplyTo(replyTo === c.commentId ? null : c.commentId),
                  setEditing(null)
                )}
              >
                답글
              </button>
              <button
                onClick={() => (
                  setEditing(editing === c.commentId ? null : c.commentId),
                  setReplyTo(null)
                )}
              >
                수정
              </button>
            </span>
          </div>
          {editing === c.commentId ? (
            <EditForm comment={c} onCancel={() => setEditing(null)} onSave={saveEdit} />
          ) : (
            <div className="txt">{c.content}</div>
          )}
          {replyTo === c.commentId && (
            <ReplyForm
              parentId={c.commentId}
              onCancel={() => setReplyTo(null)}
              onSubmit={addReply}
            />
          )}
        </div>,
      );
      if (c.childrenCommentList.length) walk(c.childrenCommentList, depth + 1);
    });
  };
  walk(list, 0);

  return (
    <section className="comments" data-post-id={postId}>
      <div className="comments-h">
        comments <b>{total}</b>
      </div>
      {list.length ? rows : <div className="empty">첫 댓글을 남겨보세요.</div>}
      <RootForm onSubmit={addRoot} />
    </section>
  );
}

/* ---------------- forms ---------------- */
function RootForm({ onSubmit }: { onSubmit: (name: string, pw: string, content: string) => void }) {
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [content, setContent] = useState("");
  const submit = () => {
    if (!name.trim() || !content.trim()) return alert("이름과 내용을 입력하세요.");
    onSubmit(name.trim(), pw, content.trim());
    setName("");
    setPw("");
    setContent("");
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
        <button className="btn" onClick={submit}>
          등록
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
  onSubmit: (parentId: number, name: string, pw: string, content: string) => void;
}) {
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [content, setContent] = useState("");
  const submit = () => {
    if (!name.trim() || !content.trim()) return alert("이름과 내용을 입력하세요.");
    onSubmit(parentId, name.trim(), pw, content.trim());
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
          <button className="btn ghost sm" onClick={onCancel}>
            취소
          </button>
          <button className="btn sm" onClick={submit}>
            답글 등록
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
  onSave: (id: number, pw: string, content: string) => boolean;
}) {
  const [content, setContent] = useState(comment.content);
  const [pw, setPw] = useState("");
  const submit = () => {
    if (!content.trim()) return alert("내용을 입력하세요.");
    onSave(comment.commentId, pw, content.trim());
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
        <button className="btn ghost sm" onClick={onCancel}>
          취소
        </button>
        <button className="btn sm" onClick={submit}>
          저장
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
    childrenCommentList: toNodes(c.childrenCommentList ?? []),
  }));
}

function findComment(list: CommentNode[], id: number): CommentNode | null {
  for (const c of list) {
    if (c.commentId === id) return c;
    const f = findComment(c.childrenCommentList, id);
    if (f) return f;
  }
  return null;
}
