/** 궁합 초대장 — 초대한 사람의 정보는 담겨 있고, 받은 사람은 자기 생일만 입력한다 */
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import InviteApp from "@/components/InviteApp";
import { supabaseAdmin } from "@/lib/db/supabase";
import { escapeHtml } from "@/lib/engine/analyze";
import type { PersonPayload } from "@/lib/api/person";

export const dynamic = "force-dynamic";

type InvitePayload = { me: PersonPayload; relStatus: number; relGap: number };

const loadInvite = cache(async (inviteId: string): Promise<InvitePayload | null> => {
  if (!/^[A-Za-z0-9_-]{8,16}$/.test(inviteId)) return null;
  const db = supabaseAdmin();
  const { data } = await db.from("invites").select("payload").eq("invite_id", inviteId).maybeSingle();
  return (data?.payload as InvitePayload) ?? null;
});

export async function generateMetadata(
  { params }: { params: Promise<{ inviteId: string }> },
): Promise<Metadata> {
  const { inviteId } = await params;
  const inv = await loadInvite(inviteId);
  if (!inv) return { title: "초대장을 찾을 수 없어요", robots: { index: false, follow: false } };
  const d = "생년월일만 알려 주면 두 사람의 궁합 감정서가 바로 펼쳐져요. 가입 필요 없음.";
  // 개인 초대 링크 — 검색 색인 제외
  return {
    title: "궁합 초대장",
    description: d,
    robots: { index: false, follow: false },
    openGraph: { title: "월하 — 궁합 초대장이 도착했어요", description: d },
  };
}

export default async function InvitePage({ params }: { params: Promise<{ inviteId: string }> }) {
  const { inviteId } = await params;
  const inv = await loadInvite(inviteId);
  if (!inv) notFound();

  const inviterName = escapeHtml((inv.me.name ?? "").trim()) || "상대방";

  return (
    <div className="wrap">
      <SiteHeader />
      <section className="home-hero">
        <h1><b>{inviterName}</b>님이<br />궁합을 청했어요</h1>
      </section>
      <InviteApp inviterName={inviterName} me={inv.me} relStatus={inv.relStatus} relGap={inv.relGap} />
      <p className="disclaimer">
        본 풀이는 전통 명리학의 틀을 빌린 재미와 성찰을 위한 콘텐츠입니다.<br />
        인생의 진짜 주인은 사주가 아니라 오늘의 당신입니다.
      </p>
    </div>
  );
}
