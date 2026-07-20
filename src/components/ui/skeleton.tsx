import { cn } from "@/lib/utils";

/** shadcn Skeleton. bg는 이 프로젝트 페이퍼 톤(--muted)에 맞춤. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export { Skeleton };
