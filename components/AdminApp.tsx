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
const MODE_ORDER = ["saju", "love", "gunghap", "yearly", "daily", "manse"];

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}. ${d.getDate()}. ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface AdminUser {
  id: string; email: string; created_at: string;
  has_profile: boolean; profile_name: string | null; readings: number;
}

type Step = "pin" | "login" | "checking" | "denied" | "ok";
type View = "dash" | "members";

export default function AdminApp() {
  const [step, setStep] = useState<Step>("pin");
  const [view, setView] = useState<View>("dash");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);

  const loadUsers = async () => {
    if (users) return;
    const { data: { session } } = await supabaseBrowser().auth.getSession();
    if (!session) return;
    const res = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) setUsers(await res.json());
  };

  const tryStats = async (): Promise<"ok" | "denied" | "anon"> => {
    const { data: { session } } = await supabaseBrowser().auth.getSession();
    if (!session) return "anon";
    const res = await fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) { setStats(await res.json()); return "ok"; }
    return res.status === 403 ? "denied" : "anon";
  };

  const onPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/admin/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "번호가 맞지 않아요.");
      setStep("checking");
      const r = await tryStats(); // 이미 관리자 세션이면 로그인 생략
      if (r === "ok") setStep("ok");
      else if (r === "denied") setStep("denied");
      else setStep("login");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false); setPin("");
    }
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr("");
    try {
      const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password: pw });
      if (error) throw new Error("이메일 또는 비밀번호가 맞지 않아요.");
      const r = await tryStats();
      if (r === "ok") setStep("ok");
      else if (r === "denied") setStep("denied");
      else throw new Error("확인에 실패했어요. 다시 시도해 주세요.");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false); setPw("");
    }
  };

  if (step === "pin") {
    return (
      <div className="adm2-gate adm2-card">
        <h2>관리자 확인</h2>
        <p>1차 보안 — 접속 번호 네 자리를 입력해 주세요.</p>
        <form onSubmit={onPin}>
          <input className="adm2-input adm2-pin" type="password" inputMode="numeric" autoComplete="off"
            maxLength={4} value={pin} aria-label="접속 번호 4자리"
            onChange={e => setPin(e.target.value.replace(/\D/g, ""))} />
          <button className="adm2-btn" type="submit" disabled={busy || pin.length !== 4}>
            {busy ? "확인 중" : "다음"}
          </button>
        </form>
        {err && <p className="adm2-err">{err}</p>}
      </div>
    );
  }

  if (step === "login") {
    return (
      <div className="adm2-gate adm2-card">
        <h2>관리자 로그인</h2>
        <p>2차 보안 — 관리자 계정으로 로그인해 주세요.</p>
        <form onSubmit={onLogin}>
          <input className="adm2-input" type="email" placeholder="관리자 이메일" autoComplete="username"
            value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: 10 }} />
          <input className="adm2-input" type="password" placeholder="비밀번호" autoComplete="current-password"
            value={pw} onChange={e => setPw(e.target.value)} />
          <button className="adm2-btn" type="submit" disabled={busy}>{busy ? "확인 중" : "들어가기"}</button>
        </form>
        {err && <p className="adm2-err">{err}</p>}
      </div>
    );
  }

  if (step === "checking") return <div className="adm2-gate adm2-card"><p>확인하는 중입니다.</p></div>;
  if (step === "denied") return <div className="adm2-gate adm2-card"><h2>접근 불가</h2><p>이 계정에는 관리자 권한이 없어요.</p></div>;
  if (!stats) return null;

  const modeMax = Math.max(1, ...MODE_ORDER.map(m => stats.by_mode[m] ?? 0));
  const dailyMax = Math.max(1, ...stats.daily.map(d => d.n));

  return (
    <>
      <div className="adm2-head">
        <div>
          <h1 className="adm2-title">월하 관리자</h1>
          <p className="adm2-sub">서비스 현황 대시보드</p>
        </div>
        <button className="adm2-out" type="button"
          onClick={async () => { await supabaseBrowser().auth.signOut(); setStep("pin"); setStats(null); }}>
          로그아웃
        </button>
      </div>

      <div className="adm2-tabs">
        <button type="button" className={`adm2-tab${view === "dash" ? " on" : ""}`}
          onClick={() => setView("dash")}>대시보드</button>
        <button type="button" className={`adm2-tab${view === "members" ? " on" : ""}`}
          onClick={() => { setView("members"); loadUsers(); }}>회원 관리</button>
      </div>

      {view === "members" && (
        <>
          <h2 className="adm2-h" style={{ marginTop: 0 }}>회원 {users ? `${users.length}명` : ""}</h2>
          {!users && <p className="adm2-sub">불러오는 중입니다.</p>}
          {users && users.length === 0 && <p className="adm2-sub">아직 회원이 없습니다.</p>}
          {users && users.length > 0 && (
            <div className="adm2-list">
              {users.map(u => (
                <div key={u.id} className="adm2-row" style={{ cursor: "default" }}>
                  <span>
                    {u.email}
                    <span className="sub">
                      가입 {fmtDateTime(u.created_at)} · 프로필 {u.has_profile ? (u.profile_name || "등록") : "없음"}
                    </span>
                  </span>
                  <span className="adm2-badge">감정서 {u.readings}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "dash" && (
        <>
      <div className="adm2-grid">
        <div className="adm2-stat"><b>{stats.readings_total}</b><span>감정서 누적</span></div>
        <div className="adm2-stat"><b>{stats.readings_7d}</b><span>최근 7일</span></div>
        <div className="adm2-stat"><b>{stats.users}</b><span>회원</span></div>
        <div className="adm2-stat"><b>{stats.profiles}</b><span>사주 프로필</span></div>
      </div>

      <h2 className="adm2-h">모드별 감정서</h2>
      <div className="adm2-card">
        {MODE_ORDER.map(m => {
          const n = stats.by_mode[m] ?? 0;
          return (
            <div key={m} className="adm2-bar-row">
              <span>{MODE_TITLE[m]}</span>
              <span className="adm2-track"><i style={{ width: `${(n / modeMax) * 100}%` }} /></span>
              <span className="adm2-n">{n}</span>
            </div>
          );
        })}
      </div>

      <h2 className="adm2-h">최근 14일 흐름</h2>
      <div className="adm2-card">
        {stats.daily.length === 0 && <p className="adm2-sub">아직 기록이 없습니다.</p>}
        {stats.daily.length > 0 && (
          <div className="adm2-spark" role="img" aria-label="최근 14일 일별 감정서 수">
            {stats.daily.map(d => (
              <span key={d.day} className="adm2-col" title={`${d.day} — ${d.n}건`}>
                <i style={{ height: `${Math.max(5, (d.n / dailyMax) * 100)}%` }} />
                <em>{d.day.slice(3)}</em>
              </span>
            ))}
          </div>
        )}
      </div>

      <h2 className="adm2-h">최근 감정서</h2>
      <div className="adm2-list">
        {stats.recent.length === 0 && <p className="adm2-sub" style={{ padding: 18 }}>아직 저장된 감정서가 없습니다.</p>}
        {stats.recent.map(r => (
          <Link key={r.share_id} href={`/r/${r.share_id}`} className="adm2-row">
            <span>
              {MODE_TITLE[r.mode] ?? r.mode}
              <span className="sub">{fmtDateTime(r.created_at)}</span>
            </span>
            <span className="adm2-badge">{r.member ? "회원" : "게스트"}</span>
          </Link>
        ))}
      </div>
        </>
      )}
    </>
  );
}
