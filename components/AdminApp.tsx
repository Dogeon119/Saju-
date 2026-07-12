"use client";
import { useEffect, useRef, useState } from "react";
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
/** 삭제 확인 모달 대상 */
interface DelTarget { kind: "user" | "reading"; id: string; label: string; }

const MODE_TITLE: Record<string, string> = {
  saju: "정통사주", love: "연애비책", gunghap: "사주궁합", yearly: "올해의운세",
  daily: "오늘의운세", manse: "만세력",
};
const MODE_MK: Record<string, string> = {
  saju: "命", love: "戀", gunghap: "緣", yearly: "歲", daily: "日", manse: "曆",
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

  /* 삭제 3박자: 모달 확인 → 행 퇴장 → 토스트 */
  const [delTarget, setDelTarget] = useState<DelTarget | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [leaving, setLeaving] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  };
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

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

  /* ── 삭제 실행 (모달 확인 뒤) ── */
  const onConfirmDelete = async () => {
    if (!delTarget || delBusy) return;
    setDelBusy(true);
    const { kind, id } = delTarget;
    const res = await authedFetch(kind === "user" ? "/api/admin/users/delete" : "/api/admin/readings/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kind === "user" ? { user_id: id } : { share_id: id }),
    });
    setDelBusy(false);
    if (!res.ok) {
      setDelTarget(null);
      showToast((await res.json().catch(() => null))?.error ?? "삭제에 실패했어요.");
      return;
    }
    setDelTarget(null);
    setLeaving(id);
    setTimeout(async () => {
      if (kind === "user") await Promise.all([loadUsers(true), loadStats()]);
      else await loadStats();
      setLeaving("");
      showToast(kind === "user" ? "회원을 삭제했어요." : "감정서를 삭제했어요.");
    }, 260);
  };

  /* ── 게이트 화면 ── */
  if (step === "pin") {
    return (
      <div className="adm2-gate adm2-card">
        <div className="adm2-seal">月</div>
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
        <div className="adm2-seal">月</div>
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
  if (step === "checking") return <div className="adm2-gate adm2-card"><p style={{ margin: 0 }}>확인하는 중입니다.</p></div>;
  if (step === "denied") return <div className="adm2-gate adm2-card"><h2>접근 불가</h2><p style={{ margin: 0 }}>이 계정에는 관리자 권한이 없어요.</p></div>;
  if (!stats) return null;

  const modeMax = Math.max(1, ...MODE_ORDER.map(m => stats.by_mode[m] ?? 0));
  const dailyMax = Math.max(1, ...stats.daily.map(d => d.n));
  const memberRate = stats.readings_total > 0 ? Math.round((stats.member_readings / stats.readings_total) * 100) : 0;
  const topMode = MODE_ORDER.reduce((a, b) => (stats.by_mode[a] ?? 0) >= (stats.by_mode[b] ?? 0) ? a : b);
  const filteredUsers = (users ?? []).filter(u => !search || u.email.toLowerCase().includes(search.toLowerCase()) || (u.profile_name ?? "").includes(search));
  const filteredReadings = stats.recent.filter(r => modeFilter === "all" || r.mode === modeFilter);

  return (
    <>
      <div className="adm2-head">
        <div className="adm2-brand">
          <div className="adm2-seal">月</div>
          <div>
            <h1 className="adm2-title">월하 관리자</h1>
            <p className="adm2-sub">서비스 운영 콘솔</p>
          </div>
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

      <nav className="adm2-nav" aria-label="콘솔 구역">
        {([
          ["dash", "대시보드", null],
          ["members", "회원", stats.users],
          ["readings", "감정서", stats.readings_total],
          ["system", "시스템", null],
        ] as [View, string, number | null][]).map(([v, t, n]) => (
          <button key={v} type="button" className={`adm2-tab${view === v ? " on" : ""}`}
            onClick={() => {
              setView(v);
              if (v === "members") loadUsers();
              if (v === "system") loadSystem();
            }}>
            {t}{n !== null && <span className="adm2-navn">{n}</span>}
          </button>
        ))}
      </nav>

      {/* ══ 대시보드 ══ */}
      {view === "dash" && (
        <>
          <div className="adm2-grid stagger">
            <div className="adm2-stat hero"><span>오늘 (24시간)</span><b>{stats.readings_today}</b><em>새 감정서</em></div>
            <div className="adm2-stat"><span>최근 7일</span><b>{stats.readings_7d}</b><em>감정서</em></div>
            <div className="adm2-stat"><span>감정서 누적</span><b>{stats.readings_total}</b><em>전체 기간</em></div>
            <div className="adm2-stat"><span>회원 감정서 비율</span><b>{memberRate}%</b><em>{stats.member_readings}건이 회원</em></div>
            <div className="adm2-stat"><span>회원</span><b>{stats.users}</b><em>가입 계정</em></div>
            <div className="adm2-stat"><span>사주 프로필</span><b>{stats.profiles}</b><em>등록 완료</em></div>
            <div className="adm2-stat"><span>궁합 초대장</span><b>{stats.invites_total}</b><em>발행 누적</em></div>
            <div className="adm2-stat"><span>최다 모드</span><b>{stats.by_mode[topMode] ?? 0}</b><em>{MODE_TITLE[topMode]}</em></div>
          </div>

          <h2 className="adm2-h">이용 분포</h2>
          <div className="adm2-card">
            <div className="adm2-cardh"><b>모드별 감정서</b><span>전체 기간</span></div>
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

          <h2 className="adm2-h">흐름</h2>
          <div className="adm2-card">
            <div className="adm2-cardh"><b>일별 감정서</b><span>최근 30일</span></div>
            {stats.daily.length === 0 && <p className="adm2-sub">아직 기록이 없습니다.</p>}
            {stats.daily.length > 0 && (
              <div className="adm2-spark" role="img" aria-label="최근 30일 일별 감정서 수">
                {stats.daily.map((d, i) => (
                  <span key={d.day} className="adm2-col" title={`${d.day} — ${d.n}건`}>
                    <i style={{ height: `${Math.max(5, (d.n / dailyMax) * 100)}%`, animationDelay: `${i * 12}ms` }} />
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
                <div key={u.id} className={`adm2-row${leaving === u.id ? " out" : ""}`}>
                  <span className="adm2-ava">{u.email.charAt(0)}</span>
                  <span>
                    {u.email}
                    {u.has_profile && <span className="adm2-tag indigo">{u.profile_name || "프로필"}</span>}
                    {u.readings > 0 && <span className="adm2-tag">감정서 {u.readings}</span>}
                    <span className="sub">가입 {fmtDateTime(u.created_at)}</span>
                  </span>
                  <button className="adm2-act danger" type="button"
                    onClick={() => setDelTarget({ kind: "user", id: u.id, label: u.email })}>삭제</button>
                </div>
              ))}
            </div>
          )}
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
                <div key={r.share_id} className={`adm2-row${leaving === r.share_id ? " out" : ""}`}>
                  <span className="adm2-ava">{MODE_MK[r.mode] ?? "命"}</span>
                  <span>
                    <Link href={`/r/${r.share_id}`} className="adm2-link" target="_blank">
                      {MODE_TITLE[r.mode] ?? r.mode} · {r.share_id}
                    </Link>
                    <span className={`adm2-tag${r.member ? " indigo" : ""}`}>{r.member ? "회원" : "게스트"}</span>
                    <span className="sub">{fmtDateTime(r.created_at)}</span>
                  </span>
                  <button className="adm2-act danger" type="button"
                    onClick={() => setDelTarget({ kind: "reading", id: r.share_id, label: `${MODE_TITLE[r.mode] ?? r.mode} · ${r.share_id}` })}>삭제</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══ 시스템 ══ */}
      {view === "system" && (
        <>
          {!system && <p className="adm2-sub">점검하는 중입니다.</p>}
          {system && (
            <>
              <div className="adm2-grid stagger">
                <div className="adm2-stat">
                  <span>DB 상태</span>
                  <b><i className={`adm2-dot ${system.db.ok ? "g" : "r"}`} aria-hidden="true" />{system.db.ok ? "정상" : "오류"}</b>
                  <em>Supabase</em>
                </div>
                <div className="adm2-stat"><span>DB 응답속도</span><b>{system.db.latency_ms}ms</b><em>왕복 기준</em></div>
                <div className="adm2-stat"><span>readings 행</span><b>{system.db.counts.readings}</b><em>감정서 테이블</em></div>
                <div className="adm2-stat"><span>invites 행</span><b>{system.db.counts.invites}</b><em>초대장 테이블</em></div>
              </div>

              <h2 className="adm2-h">환경</h2>
              <div className="adm2-card">
                <div className="adm2-cardh"><b>환경변수</b><span>서버 기준</span></div>
                {Object.entries(system.env).map(([k, v]) => (
                  <div key={k} className="adm2-kv">
                    <span>{ENV_LABEL[k] ?? k}</span>
                    <span className={v ? "adm2-pill-ok" : "adm2-pill-bad"}>{v ? "설정됨" : "없음"}</span>
                  </div>
                ))}
              </div>

              <h2 className="adm2-h">배포</h2>
              <div className="adm2-card">
                <div className="adm2-cardh"><b>배포 정보</b><span>현재 인스턴스</span></div>
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

      {/* ── 삭제 확인 모달 ── */}
      {delTarget && (
        <div className="adm2-dim" role="presentation" onClick={e => { if (e.target === e.currentTarget && !delBusy) setDelTarget(null); }}>
          <div className="adm2-modal" role="alertdialog" aria-modal="true" aria-labelledby="adm-del-t">
            <div className="adm2-micon" aria-hidden="true">!</div>
            <h3 id="adm-del-t">{delTarget.kind === "user" ? "이 회원을 삭제할까요?" : "이 감정서를 삭제할까요?"}</h3>
            <p>
              {delTarget.label}
              <br />
              {delTarget.kind === "user"
                ? "계정과 사주 프로필이 함께 지워지고 되돌릴 수 없어요."
                : "공유 링크도 즉시 열리지 않게 되고 되돌릴 수 없어요."}
            </p>
            <div className="adm2-mbtns">
              <button className="adm2-mbtn ghost" type="button" disabled={delBusy} onClick={() => setDelTarget(null)}>취소</button>
              <button className="adm2-mbtn danger" type="button" disabled={delBusy} onClick={onConfirmDelete}>
                {delBusy ? "삭제 중" : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 토스트 ── */}
      {toast && <div className="adm2-toast" role="status">{toast}</div>}
    </>
  );
}
