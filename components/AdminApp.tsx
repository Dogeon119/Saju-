"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/db/browser";

interface Stats {
  users: number;
  profiles: number;
  readings_total: number;
  readings_7d: number;
  by_mode: Record<string, number>;
  daily: { day: string; n: number }[];
  recent: { share_id: string; mode: string; created_at: string; member: boolean }[];
}

const MODE_TITLE: Record<string, string> = {
  saju: "정통사주", love: "연애비책", gunghap: "사주궁합", yearly: "올해의운세",
  daily: "오늘의운세", manse: "만세력",
};
const MODE_MK: Record<string, string> = {
  saju: "命", love: "戀", gunghap: "緣", yearly: "歲", daily: "日", manse: "曆",
};
const MODE_ORDER = ["saju", "love", "gunghap", "yearly", "daily", "manse"];

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}. ${d.getDate()}. ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AdminApp() {
  const [state, setState] = useState<"loading" | "anon" | "denied" | "error" | "ok">("loading");
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabaseBrowser().auth.getSession();
        if (!session) { setState("anon"); return; }
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const j = await res.json();
        if (res.status === 401) { setState("anon"); return; }
        if (res.status === 403) { setState("denied"); setMsg(j.error ?? ""); return; }
        if (!res.ok) { setState("error"); setMsg(j.error ?? `오류 (${res.status})`); return; }
        setStats(j as Stats);
        setState("ok");
      } catch {
        setState("error"); setMsg("통계를 불러오지 못했어요.");
      }
    })();
  }, []);

  if (state === "loading") return <p className="ai-wait">장부를 펼치는 중이에요.</p>;
  if (state === "anon") {
    return (
      <p className="acct-empty">
        관리자 계정으로 로그인해야 볼 수 있는 장부예요. <Link href="/account" className="adm-link">내 서재에서 로그인</Link> 후 다시 열어 주세요.
      </p>
    );
  }
  if (state === "denied") return <p className="acct-empty">이 계정에는 관리자 권한이 없어요.</p>;
  if (state === "error" || !stats) return <p className="err" style={{ display: "block" }}>{msg}</p>;

  const modeMax = Math.max(1, ...MODE_ORDER.map(m => stats.by_mode[m] ?? 0));
  const dailyMax = Math.max(1, ...stats.daily.map(d => d.n));

  return (
    <>
      <div className="stat-grid">
        <div className="stat-tile"><span className="stat-n">{stats.readings_total}</span><span className="stat-l">감정서 누적</span></div>
        <div className="stat-tile"><span className="stat-n">{stats.readings_7d}</span><span className="stat-l">최근 7일</span></div>
        <div className="stat-tile"><span className="stat-n">{stats.users}</span><span className="stat-l">회원</span></div>
        <div className="stat-tile"><span className="stat-n">{stats.profiles}</span><span className="stat-l">사주 프로필</span></div>
      </div>

      <h2 className="acct-h">모드별 감정서</h2>
      <div className="adm-card">
        {MODE_ORDER.map(m => {
          const n = stats.by_mode[m] ?? 0;
          return (
            <div key={m} className="adm-bar-row">
              <span className="adm-bar-label">{MODE_TITLE[m]}</span>
              <span className="adm-bar-track"><i style={{ width: `${(n / modeMax) * 100}%` }} /></span>
              <span className="adm-bar-n">{n}</span>
            </div>
          );
        })}
      </div>

      <h2 className="acct-h">최근 14일 흐름</h2>
      <div className="adm-card">
        {stats.daily.length === 0 && <p className="acct-empty">아직 기록이 없어요.</p>}
        {stats.daily.length > 0 && (
          <div className="spark" role="img" aria-label="최근 14일 일별 감정서 수">
            {stats.daily.map(d => (
              <span key={d.day} className="spark-col" title={`${d.day} — ${d.n}건`}>
                <i style={{ height: `${Math.max(6, (d.n / dailyMax) * 100)}%` }} />
                <em>{d.day.slice(3)}</em>
              </span>
            ))}
          </div>
        )}
      </div>

      <h2 className="acct-h">최근 감정서</h2>
      {stats.recent.length === 0 && <p className="acct-empty">아직 저장된 감정서가 없어요.</p>}
      {stats.recent.length > 0 && (
        <div className="mode-list">
          {stats.recent.map(r => (
            <Link key={r.share_id} href={`/r/${r.share_id}`} className="mode-row">
              <span className="mk">{MODE_MK[r.mode] ?? "命"}</span>
              <span>
                <span className="mt">{MODE_TITLE[r.mode] ?? r.mode}</span>
                <span className="md">{fmtDateTime(r.created_at)} · {r.member ? "회원" : "게스트"}</span>
              </span>
              <span className="chev" aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
