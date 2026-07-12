"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/db/browser";
import { todayGanzhi, type DayGanzhi } from "@/lib/engine/today";

const MODE_TITLE: Record<string, string> = {
  saju: "정통사주", love: "연애비책", gunghap: "사주궁합", yearly: "올해의운세",
  daily: "오늘의운세", manse: "만세력",
};
const MODE_MK: Record<string, string> = {
  saju: "命", love: "戀", gunghap: "緣", yearly: "歲", daily: "日", manse: "曆",
};
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

interface Recent { share_id: string; mode: string; created_at: string; }

/** 홈 위젯 — 오늘의 일진(전원) + 개인화 인사·최근 감정서(회원) */
export default function HomeGreeting() {
  const [gz, setGz] = useState<DayGanzhi | null>(null);
  const [dateStr, setDateStr] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [recent, setRecent] = useState<Recent | null>(null);

  useEffect(() => {
    // 일진은 사용자 기기의 오늘 기준 — 서버(UTC) 프리렌더와 어긋나지 않게 마운트 뒤 계산
    const now = new Date();
    setGz(todayGanzhi(now));
    setDateStr(`${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEK[now.getDay()]}요일`);

    (async () => {
      try {
        const sb = supabaseBrowser();
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return;
        const [{ data: prof }, { data: hist }] = await Promise.all([
          sb.from("profiles").select("name,year").eq("id", session.user.id).maybeSingle(),
          sb.from("readings").select("share_id,mode,created_at").order("created_at", { ascending: false }).limit(1),
        ]);
        if (prof?.year) setName((prof.name as string | null)?.trim() || "회원");
        if (hist && hist[0]) setRecent(hist[0] as Recent);
      } catch { /* 게스트 홈 그대로 */ }
    })();
  }, []);

  if (!gz) return null;

  return (
    <nav className="mode-list stagger" aria-label="오늘 위젯" style={{ marginBottom: 12 }}>
      <Link href="/daily" className="mode-row">
        <span className="mk">日</span>
        <span>
          <span className="mt">
            {name ? `${name}님의 오늘` : "오늘의 일진"} — <span className="gz-inline">{gz.hj}</span>
          </span>
          <span className="md">{dateStr} · {gz.line}</span>
        </span>
        <span className="chev" aria-hidden="true">›</span>
      </Link>
      {recent && (
        <Link href={`/r/${recent.share_id}`} className="mode-row">
          <span className="mk">{MODE_MK[recent.mode] ?? "冊"}</span>
          <span>
            <span className="mt">서재의 최근 감정서</span>
            <span className="md">
              {MODE_TITLE[recent.mode] ?? recent.mode} · {new Date(recent.created_at).getMonth() + 1}월 {new Date(recent.created_at).getDate()}일에 만들었어요
            </span>
          </span>
          <span className="chev" aria-hidden="true">›</span>
        </Link>
      )}
    </nav>
  );
}
