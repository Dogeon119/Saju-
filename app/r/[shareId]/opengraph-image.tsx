/** 공유 감정서의 카톡/SNS 미리보기 카드 — 모드·일주 간지·브랜드 (흑단 판) */
import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/db/supabase";
import { analyzePerson } from "@/lib/engine/analyze";
import { STEMS, BRANCHES } from "@/lib/engine/constants";
import { toInput, type ReadingPayload } from "@/lib/api/person";
import { OG } from "@/content/og-theme";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "월하 사주 감정서";

const MODE_TITLE: Record<string, string> = {
  saju: "정통사주", love: "연애비책", gunghap: "사주궁합", yearly: "올해의운세",
};

/** 구글 폰트에서 필요한 글자만 서브셋으로 받아 satori에 넘긴다 (한글 전체 폰트 번들 회피) */
async function loadFont(text: string): Promise<ArrayBuffer> {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600&text=${encodeURIComponent(text)}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1)" } }, // 구형 UA → ttf 응답
    )
  ).text();
  const m = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/);
  if (!m) throw new Error("폰트 서브셋 로드 실패");
  return await (await fetch(m[1])).arrayBuffer();
}

export default async function OgImage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;

  let modeTitle = "사주";
  let ilju = "";
  if (/^[A-Za-z0-9_-]{8,16}$/.test(shareId)) {
    const { data } = await supabaseAdmin()
      .from("readings").select("mode,payload").eq("share_id", shareId).maybeSingle();
    if (data) {
      const row = data as { mode: string; payload: ReadingPayload };
      modeTitle = MODE_TITLE[row.mode] ?? "사주";
      const meInput = toInput(row.payload.me, "당신");
      if (meInput) {
        const A = analyzePerson(meInput);
        ilju = `${STEMS[A.ds].hj}${BRANCHES[A.db].hj} 일주 (${STEMS[A.ds].kr}${BRANCHES[A.db].kr})`;
      }
    }
  }

  const title = `${modeTitle} 감정서`;
  const sub = "달빛 아래 눌러 쓴 사주 감정서가 도착했어요";
  const brand = "月下 월하 사주";
  const fontData = await loadFont(title + sub + brand + ilju + "wolha-saju.vercel.app");

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "space-between", backgroundColor: OG.ink0,
        padding: "64px 72px", fontFamily: "NotoSerifKR",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="52" height="52" viewBox="0 0 48 48">
            <path d="M30 6a19 19 0 1 0 0 36 21 21 0 0 1 0-36Z" fill={OG.gold} />
          </svg>
          <span style={{ fontSize: 30, color: OG.paperDim, letterSpacing: 6 }}>{brand}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <span style={{ fontSize: 88, color: OG.gold, letterSpacing: 4 }}>{title}</span>
          {ilju && <span style={{ fontSize: 36, color: OG.paper }}>{ilju}</span>}
          <span style={{ fontSize: 30, color: OG.paperDim }}>{sub}</span>
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderTop: `1px solid ${OG.line}`, paddingTop: 28,
        }}>
          <span style={{ fontSize: 24, color: OG.paperDim }}>wolha-saju.vercel.app</span>
          <span style={{ fontSize: 24, color: OG.goldDim }}>가입 없이 바로 열람</span>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "NotoSerifKR", data: fontData, weight: 600, style: "normal" }] },
  );
}
