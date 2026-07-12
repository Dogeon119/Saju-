"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/db/browser";

const MODE_TITLE: Record<string, string> = {
  saju: "정통사주", love: "연애비책", gunghap: "사주궁합", yearly: "올해의운세",
  daily: "오늘의운세", manse: "만세력",
};
const MODE_MK: Record<string, string> = {
  saju: "命", love: "戀", gunghap: "緣", yearly: "歲", daily: "日", manse: "曆",
};

interface HistRow { share_id: string; mode: string; created_at: string; }

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

/** 서재 — 내가 만든 감정서 보관함 */
export default function LibraryApp() {
  const [state, setState] = useState<"loading" | "anon" | "ok">("loading");
  const [hist, setHist] = useState<HistRow[]>([]);

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { setState("anon"); return; }
      const { data } = await sb.from("readings")
        .select("share_id,mode,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      setHist((data as HistRow[]) ?? []);
      setState("ok");
    })();
  }, []);

  if (state === "loading") return <p className="ai-wait">서재를 여는 중이에요.</p>;

  if (state === "anon") {
    return (
      <p className="acct-empty">
        서재는 회원의 감정서 보관함이에요. <Link href="/account" className="adm-link">회원 탭에서 로그인</Link>하고
        풀이 결과에서 &ldquo;감정서 공유 링크 만들기&rdquo;를 누르면, 그 감정서가 여기에 차곡차곡 모여요.
      </p>
    );
  }

  return (
    <>
      {hist.length === 0 && (
        <p className="acct-empty">
          아직 서재가 비어 있어요. <Link href="/" className="adm-link">홈에서 풀이</Link>를 받고
          &ldquo;감정서 공유 링크 만들기&rdquo;를 누르면 여기에 보관돼요.
        </p>
      )}
      {hist.length > 0 && (
        <div className="mode-list">
          {hist.map(h => (
            <Link key={h.share_id} href={`/r/${h.share_id}`} className="mode-row">
              <span className="mk">{MODE_MK[h.mode] ?? "命"}</span>
              <span>
                <span className="mt">{MODE_TITLE[h.mode] ?? h.mode} 감정서</span>
                <span className="md">{fmtDate(h.created_at)}</span>
              </span>
              <span className="chev" aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
