/** 사이트 기본 OG 카드 — 홈·전 모드 페이지가 상속 (카톡/SNS 공유 미리보기, 화이트 프리미엄 판) */
import { ImageResponse } from "next/og";
import { OG } from "@/content/og-theme";
import { loadOgFont } from "@/lib/og-font";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "월하 사주 — 정통사주·연애비책·사주궁합·올해의운세";

export default async function OgImage() {
  const brand = "月下 월하 사주";
  const title = "달빛 아래, 당신의 사주를";
  const sub = "생년월일시만 알려주시면 다정하게 풀어드려요";
  const foot = "정통사주 · 연애비책 · 사주궁합 · 올해의운세";
  const fontData = await loadOgFont(brand + title + sub + foot + "무료로 시작 wolha-saju.vercel.app");

  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "space-between", backgroundColor: OG.ink0,
        padding: "64px 72px", fontFamily: "NotoSansKR",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="52" height="52" viewBox="0 0 48 48">
            <rect width="48" height="48" rx="12" fill={OG.gold} />
            <path d="M30 8a17 17 0 1 0 0 32 19 19 0 0 1 0-32Z" fill={OG.goldDim} />
          </svg>
          <span style={{ fontSize: 30, color: OG.paperDim, letterSpacing: 6 }}>{brand}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 74, color: OG.gold, letterSpacing: -2, lineHeight: 1.15 }}>{title}</span>
          <span style={{ fontSize: 32, color: OG.paperDim }}>{sub}</span>
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderTop: `1px solid ${OG.line}`, paddingTop: 28,
        }}>
          <span style={{ fontSize: 26, color: OG.paper }}>{foot}</span>
          <span style={{ fontSize: 24, color: OG.goldDim }}>무료로 시작</span>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "NotoSansKR", data: fontData, weight: 700, style: "normal" }] },
  );
}
