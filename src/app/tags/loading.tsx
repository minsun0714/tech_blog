import { Skeleton } from "@/components/ui/skeleton";

const WIDTHS = [
  "4rem",
  "6rem",
  "3.5rem",
  "7rem",
  "5rem",
  "4.5rem",
  "8rem",
  "3rem",
  "6.5rem",
  "5.5rem",
  "4rem",
  "7.5rem",
  "3.5rem",
  "6rem",
  "5rem",
  "4.5rem",
];

/** /tags 데이터 로딩 중 표시. 실제 태그 클라우드 레이아웃을 흉내낸다. */
export default function TagsLoading() {
  return (
    <>
      <div className="list-head">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>

      <div className="tagcloud lg">
        {WIDTHS.map((w, i) => (
          <Skeleton key={i} className="h-8 rounded-full" style={{ width: w }} />
        ))}
      </div>
    </>
  );
}
