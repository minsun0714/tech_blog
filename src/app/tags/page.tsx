import Link from "next/link";
import { getTags } from "@/lib/api";
import { qs } from "@/lib/view";

export const dynamic = "force-dynamic";

/** 태그 목록 페이지. 태그 클릭 시 홈(`/?tag=이름`)으로 이동해 해당 태그 글만 표시. */
export default async function TagsPage() {
  const tags = await getTags();

  return (
    <>
      <div className="list-head">
        <h1>태그</h1>
        <span className="n">{tags.length} tags</span>
      </div>

      {tags.length ? (
        <div className="tagcloud lg">
          {tags.map((t) => (
            <Link key={t.id} className="chip plain" href={`/${qs({ tag: t.name })}`}>
              {t.name}
              {typeof t.postCount === "number" && <span className="chip-num">{t.postCount}</span>}
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">등록된 태그가 없습니다.</div>
      )}
    </>
  );
}
