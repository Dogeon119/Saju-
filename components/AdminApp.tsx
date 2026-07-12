"use client";
import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/db/browser";

/* ── 타입 ── */
interface Stats {
  users: number;
  profiles: number;
  readings_total: number;
  readings_today: number;
  readings_7d: number;
  invites_total: number;
  member_readings: number;
  by_mode: Record<string, number>;
  daily: { day: string; n: number }[];
  recent: { share_id: string; mode: string; created_at: string; member: boolean }[];
}
interface AdminUser {
  id: string; email: string; created_at: string;
  has_profile: boolean; profile_name: string | null; readings: number;
}
interface SystemInfo {
  db: { ok: boolean; latency_ms: number; counts: { readings: number; profiles: number; invites: number } };
  env: Record<string, boolean>;
  deploy: { commit: string | null; branch: string | null; region: string; node: string; server_time: string };
}

const MODE_TITLE: Record<string, string> = {
  saju: "정통사주", love: "연애비책", gunghap: "사주궁합", yearly: "올해의운세",
  daily: "오늘의운세", manse: "만세력",
};
const MODE_ORDER = ["saju", "love", "gunghap", "yearly", "daily", "manse"];
const ENV_LABEL: Record<string, string> = {
  supabase: "Supabase 연결",
  admin_emails: "ADMIN_EMAILS",
  admin_pin_env: "ADMIN_PIN (환경변수)",
  nim_api_key: "NIM_API_KEY (AI 무료)",
  anthropic_api_key: "ANTHROPIC_API_KEY (AI 유료)",
};

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}. ${d.getDate()}. ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabaseBrowser().auth.getSession();
  return fetch(path, {
    ...init,
    headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${session?.access_token ?? ""}` },
  });
}

type Step = "pin" | "login" | "checking" | "denied" | "ok";
type View = "dash" | "members" | "readings" | "system";

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
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [confirmDel, setConfirmDel] = useState<string>(""); // user_id 또는 share_id
  const [actErr, setActErr] = useState("");

  /* ── 데이터 로드 ── */
  const loadStats = async (): Promise<boolean> => {
    const res = await authedFetch("/api/admin/stats");
    if (res.ok) { setStats(await res.json()); return true; }
    return false;
  };
  const loadUsers = async (force = false) => {
    if (users && !force) return;
    const res = await authedFetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  };
  const loadSystem = async (force = false) => {
    if (system && !force) return;
    const res = await authedFetch("/api/admin/system");
    if (res.ok) setSystem(await res.json());
  };
  const refresh = async () => {
    setBusy(true);
    await Promise.all([loadStats(), loadUsers(true), loadSystem(true)]);
    setBusy(false);
  };

  const tryEnter = async (): Promise<"ok" | "denied" | "anon"> => {
    const { data: { session } } = await supabaseBrowser().auth.getSession();
    if (!session) return "anon";
    const res = await authedFetch("/api/admin/stats");
    if (res.ok) { setStats(await res.json()); return "ok"; }
    return res.status === 403 ? "denied" : "anon";
  };

  /* ── 게이트 ── */
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
      const r = await tryEnter();
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
      const r = await tryEnter();
      if (r === "ok") setStep("ok");
      else if (r === "denied") setStep("denied");
      else throw new Error("확인에 실패했어요. 다시 시도해 주세요.");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setBusy(false); setPw("");
    }
  };

  /* ── 관리 액션 ── */
  const onDeleteUser = async (userId: string) => {
    setActErr("");
    const res = await authedFetch("/api/admin/users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) { setActErr((await res.json().catch(() => null))?.error ?? "삭제 실패"); return; }
    setConfirmDel("");
    await Promise.all([loadUsers(true), loadStats()]);
  };
  const onDeleteReading = async (shareId: string) => {
    setActErr("");
    const res = await authedFetch("/api/admin/readings/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ share_id: shareId }),
    });
    if (!res.ok) { setActErr((await res.json().catch(() => null))?.error ?? "삭제 실패"); return; }
    setConfirmDel("");
    await loadStats();
  };

  /* ── 게이트 화면 ── */
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
  const memberRate = stats.readings_total > 0 ? Math.round((stats.member_readings / stats.readings_total) * 100) : 0;
  const filteredUsers = (users ?? []).filter(u => !search || u.email.toLowerCase().includes(search.toLowerCase()) || (u.profile_name ?? "").includes(search));
  const filteredReadings = stats.recent.filter(r => modeFilter === "all" || r.mode === modeFilter);

  return (
    <>
      <div className="adm2-head">
        <div>
          <h1 className="adm2-title">월하 관리자</h1>
          <p className="adm2-sub">서비스 운영 콘솔</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="adm2-out" type="button" disabled={busy} onClick={refresh}>
            {busy ? "갱신 중" : "새로고침"}
          </button>
          <button className="adm2-out" type="button"
            onClick={async () => { await supabaseBrowser().auth.signOut(); setStep("pin"); setStats(null); setUsers(null); setSystem(null); }}>
            로그아웃
          </button>
        </div>
      </div>

      <div className="adm2-tabs">
        {([["dash", "대시보드"], ["members", "회원"], ["readings", "감정서"], ["system", "시스템"]] as [View, string][]).map(([v, t]) => (
          <button key={v} type="button" className={`adm2-tab${view === v ? " on" : ""}`}
            onClick={() => {
              setView(v); setConfirmDel(""); setActErr("");
              if (v === "members") loadUsers();
              if (v === "system") loadSystem();
            }}>{t}</button>
        ))}
      </div>

      {/* ══ 대시보드 ══ */}
      {view === "dash" && (
        <>
          <div className="adm2-grid">
            <div className="adm2-stat"><b>{stats.readings_today}</b><span>오늘 (24시간)</span></div>
            <div className="adm2-stat"><b>{stats.readings_7d}</b><span>최근 7일</span></div>
            <div className="adm2-stat"><b>{stats.readings_total}</b><span>감정서 누적</span></div>
            <div className="adm2-stat"><b>{memberRate}%</b><span>회원 감정서 비율</span></div>
            <div className="adm2-stat"><b>{stats.users}</b><span>회원</span></div>
            <div className="adm2-stat"><b>{stats.profiles}</b><span>사주 프로필</span></div>
            <div className="adm2-stat"><b>{stats.invites_total}</b><span>궁합 초대장</span></div>
            <div className="adm2-stat"><b>{stats.by_mode[MODE_ORDER.reduce((a, b) => (stats.by_mode[a] ?? 0) >= (stats.by_mode[b] ?? 0) ? a : b)] ?? 0}</b><span>최다 모드 · {MODE_TITLE[MODE_ORDER.reduce((a, b) => (stats.by_mode[a] ?? 0) >= (stats.by_mode[b] ?? 0) ? a : b)]}</span></div>
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

          <h2 className="adm2-h">최근 30일 흐름</h2>
          <div className="adm2-card">
            {stats.daily.length === 0 && <p className="adm2-sub">아직 기록이 없습니다.</p>}
            {stats.daily.length > 0 && (
              <div className="adm2-spark" role="img" aria-label="최근 30일 일별 감정서 수">
                {stats.daily.map(d => (
                  <span key={d.day} className="adm2-col" title={`${d.day} — ${d.n}건`}>
                    <i style={{ height: `${Math.max(5, (d.n / dailyMax) * 100)}%` }} />
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ 회원 ══ */}
      {view === "members" && (
        <>
          <div className="adm2-toolbar">
            <h2 className="adm2-h" style={{ margin: 0 }}>회원 {users ? `${filteredUsers.length}명` : ""}</h2>
            <input className="adm2-input adm2-search" type="search" placeholder="이메일·이름 검색"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {!users && <p className="adm2-sub">불러오는 중입니다.</p>}
          {users && filteredUsers.length === 0 && <p className="adm2-sub">결과가 없습니다.</p>}
          {filteredUsers.length > 0 && (
            <div className="adm2-list">
              {filteredUsers.map(u => (
                <div key={u.id} className="adm2-row" style={{ cursor: "default" }}>
                  <span>
                    {u.email}
                    <span className="sub">
                      가입 {fmtDateTime(u.created_at)} · 프로필 {u.has_profile ? (u.profile_name || "등록") : "없음"} · 감정서 {u.readings}
                    </span>
                  </span>
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {confirmDel !== u.id && (
                      <button className="adm2-act" type="button" onClick={() => setConfirmDel(u.id)}>삭제</button>
                    )}
                    {confirmDel === u.id && (
                      <>
                        <button className="adm2-act" type="button" onClick={() => setConfirmDel("")}>취소</button>
                        <button className="adm2-act danger" type="button" onClick={() => onDeleteUser(u.id)}>정말 삭제</button>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
          {actErr && <p className="adm2-err">{actErr}</p>}
        </>
      )}

      {/* ══ 감정서 ══ */}
      {view === "readings" && (
        <>
          <div className="adm2-toolbar">
            <h2 className="adm2-h" style={{ margin: 0 }}>최근 감정서 {filteredReadings.length}건</h2>
            <div className="adm2-chips">
              {[["all", "전체"], ...MODE_ORDER.map(m => [m, MODE_TITLE[m]])].map(([v, t]) => (
                <button key={v} type="button" className={`adm2-chip${modeFilter === v ? " on" : ""}`}
                  onClick={() => setModeFilter(v)}>{t}</button>
              ))}
            </div>
          </div>
          {filteredReadings.length === 0 && <p className="adm2-sub">해당하는 감정서가 없습니다.</p>}
          {filteredReadings.length > 0 && (
            <div className="adm2-list">
              {filteredReadings.map(r => (
                <div key={r.share_id} className="adm2-row" style={{ cursor: "default" }}>
                  <span>
                    <Link href={`/r/${r.share_id}`} className="adm2-link" target="_blank">
                      {MODE_TITLE[r.mode] ?? r.mode} · {r.share_id}
                    </Link>
                    <span className="sub">{fmtDateTime(r.created_at)} · {r.member ? "회원" : "게스트"}</span>
                  </span>
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {confirmDel !== r.share_id && (
                      <button className="adm2-act" type="button" onClick={() => setConfirmDel(r.share_id)}>삭제</button>
                    )}
                    {confirmDel === r.share_id && (
                      <>
                        <button className="adm2-act" type="button" onClick={() => setConfirmDel("")}>취소</button>
                        <button className="adm2-act danger" type="button" onClick={() => onDeleteReading(r.share_id)}>정말 삭제</button>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
          {actErr && <p className="adm2-err">{actErr}</p>}
        </>
      )}

      {/* ══ 시스템 ══ */}
      {view === "system" && (
        <>
          {!system && <p className="adm2-sub">점검하는 중입니다.</p>}
          {system && (
            <>
              <div className="adm2-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                <div className="adm2-stat"><b>{system.db.ok ? "정상" : "오류"}</b><span>DB 상태</span></div>
                <div className="adm2-stat"><b>{system.db.latency_ms}ms</b><span>DB 응답속도</span></div>
                <div className="adm2-stat"><b>{system.db.counts.readings}</b><span>readings 행</span></div>
                <div className="adm2-stat"><b>{system.db.counts.invites}</b><span>invites 행</span></div>
              </div>

              <h2 className="adm2-h">환경변수</h2>
              <div className="adm2-card">
                {Object.entries(system.env).map(([k, v]) => (
                  <div key={k} className="adm2-kv">
                    <span>{ENV_LABEL[k] ?? k}</span>
                    <span className={v ? "adm2-ok" : "adm2-bad"}>{v ? "설정됨" : "없음"}</span>
                  </div>
                ))}
              </div>

              <h2 className="adm2-h">배포 정보</h2>
              <div className="adm2-card">
                <div className="adm2-kv"><span>커밋</span><span>{system.deploy.commit ?? "(로컬)"}</span></div>
                <div className="adm2-kv"><span>브랜치</span><span>{system.deploy.branch ?? "-"}</span></div>
                <div className="adm2-kv"><span>리전</span><span>{system.deploy.region}</span></div>
                <div className="adm2-kv"><span>Node</span><span>{system.deploy.node}</span></div>
                <div className="adm2-kv"><span>서버 시각</span><span>{fmtDateTime(system.deploy.server_time)}</span></div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
