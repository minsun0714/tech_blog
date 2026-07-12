import Link from "next/link";
import { getSeries } from "@/lib/api";
import { qs } from "@/lib/view";

export const dynamic = "force-dynamic";

/** 시리즈 목록 페이지. 항목 클릭 시 홈(`/?series=이름`)으로 이동해 해당 시리즈 글만 표시. */
export default async function SeriesPage() {
  const series = await getSeries();

  return (
    <>
      <div className="list-head">
        <h1>시리즈</h1>
        <span className="n">{series.length} series</span>
      </div>

      {series.length ? (
        <div className="index-list">
          {series.map((s) => (
            <Link key={s.id} className="series-item" href={`/${qs({ series: s.name })}`}>
              <span className="name">{s.name}</span>
              {typeof s.postCount === "number" && <span className="num">{s.postCount} posts</span>}
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">등록된 시리즈가 없습니다.</div>
      )}
    </>
  );
}
