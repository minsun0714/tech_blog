import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getCategories, getSeries, getTags, getComments } from "@/lib/api";
import { enrich } from "@/lib/view";
import Thumbnail from "@/components/Thumbnail";
import Comments from "@/components/Comments";
import { qs } from "@/lib/view";

export const dynamic = "force-dynamic";

export default async function PostDetail({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const [detail, categories, series, tags, comments] = await Promise.all([
    getPost(id),
    getCategories(),
    getSeries(),
    getTags(),
    getComments(id),
  ]);

  // 상세 API 응답이 비어도 목록 데이터로 폴백
  if (!detail) notFound();

  const p = enrich(detail, categories, series);
  const tagIds = Object.fromEntries(tags.map((tag) => [tag.name, tag.id]));
  console.log("post thumbnail", detail);
  const html = (p.content || "").trim();

  return (
    <>
      <Link href="/" className="back">
        ← 목록으로
      </Link>

      <div className="post-content">
        <div className="post-hero">
          <Thumbnail seed={id} label={p.categoryName} src={p.thumbnailImageUrl} />
        </div>

        <div className="post-meta">
          {p.categoryName && p.categoryId != null && (
            <Link className="cat" href={`/${qs({ category: p.categoryId })}`}>
              {p.categoryName}
            </Link>
          )}
          {p.seriesName && p.seriesId != null && (
            <>
              <span>/</span>
              <Link href={`/${qs({ series: p.seriesId })}`}>{p.seriesName}</Link>
            </>
          )}
          <span>·</span>
          <span>#{id}</span>
        </div>

        <h1 className="post-title">{p.title}</h1>

        <div className="post-tags">
          {p.tagNames.map((t) =>
            tagIds[t] != null ? (
              <Link key={t} className="chip plain" href={`/${qs({ tag: tagIds[t] })}`}>
                {t}
              </Link>
            ) : (
              <span key={t} className="chip plain">{t}</span>
            ),
          )}
        </div>

        {html ? (
          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="prose">
            <p style={{ color: "var(--ink-3)" }}>본문이 없습니다.</p>
          </div>
        )}

        <Comments postId={id} initial={comments} />
      </div>
    </>
  );
}
