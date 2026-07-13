import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPosts, getCategories, getSeries, getComments } from "@/lib/api";
import { enrich } from "@/lib/view";
import Thumbnail from "@/components/Thumbnail";
import LikeButton from "@/components/LikeButton";
import Comments from "@/components/Comments";
import { qs } from "@/lib/view";

export const dynamic = "force-dynamic";

export default async function PostDetail({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const [detail, posts, categories, series, comments] = await Promise.all([
    getPost(id),
    getPosts(),
    getCategories(),
    getSeries(),
    getComments(id),
  ]);

  // 상세 API 응답이 비어도 목록 데이터로 폴백
  const base = detail ?? posts.find((p) => p.postId === id);
  if (!base) notFound();

  const p = enrich(base, categories, series);
  const html = (p.content || "").trim();

  return (
    <>
      <Link href="/" className="back">
        ← 목록으로
      </Link>

      <div className="post-hero">
        <Thumbnail seed={id} label={p.categoryName} src={p.thumbnailImage} />
      </div>

      <div className="post-meta">
        {p.categoryName && (
          <Link className="cat" href={`/${qs({ category: p.categoryName })}`}>
            {p.categoryName}
          </Link>
        )}
        {p.seriesName && (
          <>
            <span>/</span>
            <Link href={`/${qs({ series: p.seriesName })}`}>{p.seriesName}</Link>
          </>
        )}
        <span>·</span>
        <span>#{id}</span>
      </div>

      <h1 className="post-title">{p.title}</h1>

      <div className="post-tags">
        {p.tagNames.map((t) => (
          <Link key={t} className="chip plain" href={`/${qs({ tag: t })}`}>
            {t}
          </Link>
        ))}
        <span className="spacer" />
        <LikeButton postId={id} variant="lg" />
      </div>

      {html ? (
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className="prose">
          <p style={{ color: "var(--ink-3)" }}>본문이 없습니다.</p>
        </div>
      )}

      <Comments postId={id} initial={comments} />
    </>
  );
}
