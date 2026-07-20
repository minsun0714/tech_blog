import { Skeleton } from "./ui/skeleton";

/** 카테고리 로딩 중 표시하는 트리 모양 스켈레톤. 실제 트리 들여쓰기/폭을 흉내낸다. */
const ROWS: { branch: string; w: string }[] = [
  { branch: "", w: "5.5rem" },
  { branch: "├─ ", w: "4.5rem" },
  { branch: "├─ ", w: "6rem" },
  { branch: "└─ ", w: "3.5rem" },
  { branch: "", w: "5rem" },
  { branch: "├─ ", w: "6.5rem" },
  { branch: "└─ ", w: "4rem" },
];

export default function CategoryTreeSkeleton() {
  return (
    <div className="tree" aria-hidden="true">
      {ROWS.map((row, i) => (
        <div key={i} className="node">
          <span className="branch">{row.branch}</span>
          <Skeleton className="h-3 self-center" style={{ width: row.w }} />
        </div>
      ))}
    </div>
  );
}
