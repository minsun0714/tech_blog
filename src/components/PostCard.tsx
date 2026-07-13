import Link from "next/link";
import type { EnrichedPost } from "@/lib/view";
import { qs } from "@/lib/view";
import Thumbnail from "./Thumbnail";
import LikeButton from "./LikeButton";

/** 목록 카드. 카드 전체가 링크는 아니고, 썸네일/제목/메타/태그가 각각 링크(중첩 앵커 방지). */
export default function PostCard({ post }: { post: EnrichedPost }) {
  const href = post.postId != null ? `/posts/${post.postId}` : undefined;

  return (
    <article className="card">
      {href ? (
        <Link href={href} className="thumb" aria-label={post.title}>
          <Thumbnail seed={post.postId ?? 0} label={post.categoryName} src={post.thumbnailImage} />
        </Link>
      ) : (
        <div className="thumb">
          <Thumbnail seed={0} label={post.categoryName} src={post.thumbnailImage} />
        </div>
      )}

      <div className="card-inner">
        <div className="card-meta">
          {post.categoryName && (
            <Link className="cat" href={`/${qs({ category: post.categoryName })}`}>
              {post.categoryName}
            </Link>
          )}
          {post.seriesName && (
            <>
              <span className="sep">/</span>
              <Link href={`/${qs({ series: post.seriesName })}`}>{post.seriesName}</Link>
            </>
          )}
          {post.postId != null && (
            <>
              <span className="sep">·</span>
              <span>#{post.postId}</span>
            </>
          )}
        </div>

        {href ? (
          <Link href={href}>
            <h2 className="card-title">{post.title}</h2>
          </Link>
        ) : (
          <h2 className="card-title">{post.title}</h2>
        )}

        {post.excerpt && <p className="card-excerpt">{post.excerpt}</p>}

        {post.tagNames.length > 0 && (
          <div className="card-tags">
            {post.tagNames.map((t) => (
              <Link key={t} className="chip sm" href={`/${qs({ tag: t })}`}>
                {t}
              </Link>
            ))}
          </div>
        )}

        <div className="card-foot">
          {post.postId != null && <LikeButton postId={post.postId} />}
        </div>
      </div>
    </article>
  );
}
