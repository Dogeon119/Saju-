/** 궁합 초대장 OG 카드 — 초대받은 사람이 카톡에서 먼저 보는 미리보기 (바이럴 관문) */
import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/db/supabase";
import { OG } from "@/content/og-theme";
import { loadOgFont } from "@/lib/og-font";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "월하 — 궁합 초대장";

export default async function OgImage({ params }: { params: Promise<{ inviteId: string }> }) {
  const { inviteId } = await params;

  let inviter = "누군가";
  if (/^[A-Za-z0-9_-]{8,16}$/.test(inviteId)) {
    const { data } = await supabaseAdmin()
      .from("invites").select("payload").eq("invite_id", inviteId).maybeSingle();
    const nm = ((data?.payload as { me?: { name?: string } } | null)?.me?.name ?? "").toString().trim();
    if (nm) inviter = nm.slice(0, 12); // satori는 텍스트 노드라 HTML 실행 없음 — 길이만 제한
  }

  const brand = "月下 월하 사주";
  const title = `${inviter}님이`;
  const title2 = "궁합을 청했어요";
  const sub = "생년월일만 알려주시면 두 사람의 궁합이 바로 펼쳐져요";
  const fontData = await loadOgFont(brand + title + title2 + sub + inviter + "가입 없이 열람 wolha-saju.vercel.app");

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

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontSize: 72, color: OG.gold, letterSpacing: -2, lineHeight: 1.15 }}>{title}</span>
          <span style={{ fontSize: 72, color: OG.paper, letterSpacing: -2, lineHeight: 1.15 }}>{title2}</span>
          <span style={{ fontSize: 30, color: OG.paperDim, marginTop: 10 }}>{sub}</span>
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderTop: `1px solid ${OG.line}`, paddingTop: 28,
        }}>
          <span style={{ fontSize: 26, color: OG.paper }}>wolha-saju.vercel.app</span>
          <span style={{ fontSize: 24, color: OG.goldDim }}>가입 없이 열람</span>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "NotoSansKR", data: fontData, weight: 700, style: "normal" }] },
  );
}
