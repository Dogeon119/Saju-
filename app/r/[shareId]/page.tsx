/** 공유된 감정서 — 저장된 입력을 서버에서 ssaju 재계산해 그대로 재현한다 (게스트 열람, 가입 불필요) */
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import PageHead from "@/components/PageHead";
import SceneReader from "@/components/SceneReader";
import { supabaseAdmin } from "@/lib/db/supabase";
import { analyzePerson } from "@/lib/engine/analyze";
import { renderReport, type Mode } from "@/lib/engine/modes";
import { toInput, type ReadingPayload } from "@/lib/api/person";

// 감정서 payload는 불변 — 오픈마다 재계산하지 않고 24h ISR 캐시 (성장경로 지연·DB부하 감소)
export const revalidate = 86400;

const MODE_TITLE: Record<Mode, string> = {
  saju: "정통사주", love: "연애비책", gunghap: "사주궁합", yearly: "올해의운세",
  daily: "오늘의운세", manse: "만세력",
};
const MODE_MK: Record<Mode, string> = {
  saju: "命", love: "戀", gunghap: "緣", yearly: "歲", daily: "日", manse: "曆",
};

type Row = { mode: Mode; payload: ReadingPayload };

const loadReading = cache(async (shareId: string): Promise<Row | null> => {
  if (!/^[A-Za-z0-9_-]{8,16}$/.test(shareId)) return null;
  const db = supabaseAdmin();
  const { data } = await db.from("readings").select("mode,payload").eq("share_id", shareId).maybeSingle();
  return (data as Row | null) ?? null;
});

export async function generateMetadata(
  { params }: { params: Promise<{ shareId: string }> },
): Promise<Metadata> {
  const { shareId } = await params;
  const row = await loadReading(shareId);
  if (!row) return { title: "감정서를 찾을 수 없어요", robots: { index: false, follow: false } };
  const t = `${MODE_TITLE[row.mode]} 감정서`;
  const d = "달빛 아래 눌러 쓴 사주 감정서가 도착했어요. 지금 펼쳐 보세요.";
  // 개인 감정서는 공유 링크 전용 — 검색 색인 제외(프라이버시·중복 방지)
  return {
    title: t,
    description: d,
    robots: { index: false, follow: false },
    openGraph: { title: `월하 — ${t}`, description: d },
  };
}

export default async function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  const row = await loadReading(shareId);
  if (!row) notFound();

  const meInput = toInput(row.payload.me, "당신");
  if (!meInput) notFound();
  const A = analyzePerson(meInput);
  let B;
  if (row.mode === "gunghap" && row.payload.partner) {
    const partnerInput = toInput(row.payload.partner, "상대");
    if (partnerInput) B = analyzePerson(partnerInput);
  }
  const html = renderReport(row.mode, A, {
    B,
    relStatus: row.payload.relStatus,
    relGap: row.payload.relGap,
    job: row.payload.job,
  });

  return (
    <div className="wrap">
      <SiteHeader />
      <PageHead mk={MODE_MK[row.mode]} title={`${MODE_TITLE[row.mode]} 감정서`}
        desc="공유받은 감정서예요. 보낸 분의 사주를 그대로 펼쳤어요." />
      <SceneReader html={html} />
      <Link href={`/${row.mode}`} className="submit cta-link">나도 내 사주 펼쳐 보기</Link>
      <p className="disclaimer">
        본 풀이는 전통 명리학의 틀을 빌린 재미와 성찰을 위한 콘텐츠입니다.<br />
        인생의 진짜 주인은 사주가 아니라 오늘의 당신입니다.
      </p>
    </div>
  );
}
