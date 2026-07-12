import { NextResponse } from "next/server";
import { getCategories } from "@/lib/api";

/**
 * 카테고리 프록시. 백엔드가 브라우저 직접 요청(Origin 헤더)을 CORS로 막으므로,
 * 클라이언트(햄버거 드로어·데스크톱 레일)는 같은 오리진의 이 라우트를 호출한다.
 * 서버사이드에서 백엔드로 no-store fetch → 열 때마다 최신 카테고리를 받는다.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await getCategories();
  return NextResponse.json(categories, {
    headers: { "Cache-Control": "no-store" },
  });
}
