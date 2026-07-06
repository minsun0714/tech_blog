import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty" style={{ padding: "80px 0" }}>
      <p style={{ fontSize: 15, marginBottom: 16 }}>404 · 존재하지 않는 글입니다.</p>
      <Link href="/" className="back">
        ← 목록으로
      </Link>
    </div>
  );
}
