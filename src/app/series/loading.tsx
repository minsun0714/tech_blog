import { Skeleton } from "@/components/ui/skeleton";

const WIDTHS = ["11rem", "8rem", "13rem", "9.5rem", "10rem", "7rem", "12rem"];

/** /series 데이터 로딩 중 표시. 실제 목록 레이아웃을 그대로 흉내낸다. */
export default function SeriesLoading() {
  return (
    <>
      <div className="list-head">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>

      <div className="index-list">
        {WIDTHS.map((w, i) => (
          <div key={i} className="series-item">
            <Skeleton className="h-4" style={{ width: w }} />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </>
  );
}
