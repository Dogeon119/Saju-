"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/db/browser";
import { HOURS } from "@/lib/engine/constants";
import {
  PersonFields, emptyForm, validDate, profileToForm, formToProfile,
  type FormState, type ProfileRow,
} from "./person-form";

type Sec = "saju" | "theme" | "security" | "leave";

/** 정리 카드 — 아코디언 한 칸 */
function Disc({ mk, title, desc, danger, open, onToggle, children }: {
  mk: string; title: string; desc: string; danger?: boolean;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <section className={`disc${open ? " open" : ""}${danger ? " danger" : ""}`}>
      <button type="button" className="disc-head" aria-expanded={open} onClick={onToggle}>
        <span className="mk" aria-hidden="true">{mk}</span>
        <span>
          <span className="dt">{title}</span>
          <span className="dd">{desc}</span>
        </span>
        <span className="disc-chev" aria-hidden="true">›</span>
      </button>
      <div className="disc-body">
        <div className="disc-inner" inert={!open}>
          <div className="disc-pad">{children}</div>
        </div>
      </div>
    </section>
  );
}

const CAL_LABEL: Record<FormState["cal"], string> = {
  solar: "양력", lunar: "음력", "lunar-leap": "음력(윤달)",
};

export default function AccountApp() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  /* 로그인 폼 */
  const [tab, setTab] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authErr, setAuthErr] = useState("");
  const [notice, setNotice] = useState("");

  /* 사주 프로필 */
  const [form, setForm] = useState<FormState>(() => emptyForm("F"));
  const [hasProfile, setHasProfile] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const [profBusy, setProfBusy] = useState(false);
  const [profMsg, setProfMsg] = useState("");
  const [profErr, setProfErr] = useState("");
  const sajuRef = useRef<HTMLDivElement>(null);

  /* 정리 카드 (아코디언) */
  const [openSec, setOpenSec] = useState<Sec | null>(null);
  const toggle = (s: Sec) => setOpenSec(v => (v === s ? null : s));

  /* 보안 · 화면 · 탈퇴 */
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [dark, setDark] = useState(false);
  const [delStep, setDelStep] = useState(0);
  const [delBusy, setDelBusy] = useState(false);
  const [delErr, setDelErr] = useState("");

  useEffect(() => {
    // 화이트가 기본 — 명시적 dark만 다크로 본다
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const setTheme = (toDark: boolean) => {
    setDark(toDark);
    if (toDark) document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme; // 밝음 = 기본(속성 제거)
    try { localStorage.setItem("wolha-theme", toDark ? "dark" : "light"); } catch { /* 무시 */ }
  };

  const onChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwBusy) return;
    setPwBusy(true); setPwMsg(""); setPwErr("");
    try {
      if (pw1.length < 6) throw new Error("비밀번호는 6자 이상이어야 해요.");
      if (pw1 !== pw2) throw new Error("두 비밀번호가 서로 달라요.");
      const { error } = await supabaseBrowser().auth.updateUser({ password: pw1 });
      if (error) throw new Error("변경에 실패했어요. 다시 로그인한 뒤 시도해 주세요.");
      setPwMsg("비밀번호를 바꿨어요. 다음 로그인부터 새 비밀번호를 쓰시면 돼요.");
      setPw1(""); setPw2("");
    } catch (ex) {
      setPwErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setPwBusy(false);
    }
  };

  const onDelete = async () => {
    if (delBusy || !session) return;
    setDelBusy(true); setDelErr("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "탈퇴에 실패했어요.");
      await supabaseBrowser().auth.signOut();
      setDelStep(0); setOpenSec(null);
      setNotice("탈퇴가 완료됐어요. 그동안 월하와 함께해 주셔서 고마웠어요.");
    } catch (ex) {
      setDelErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setDelBusy(false);
    }
  };

  const loadMine = useCallback(async (uid: string) => {
    const sb = supabaseBrowser();
    const [{ data: prof }, { count }] = await Promise.all([
      sb.from("profiles").select("*").eq("id", uid).maybeSingle(),
      sb.from("readings").select("share_id", { count: "exact", head: true }),
    ]);
    setReadCount(count ?? 0);
    if (prof && (prof as ProfileRow).year) {
      setForm(profileToForm(prof as ProfileRow));
      setHasProfile(true);
    } else {
      setHasProfile(false);
      setOpenSec("saju"); // 프로필이 없으면 등록 칸을 열어 안내
    }
  }, []);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setReady(true);
      if (session) loadMine(session.user.id);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) loadMine(s.user.id);
      else { setForm(emptyForm("F")); setHasProfile(false); setReadCount(0); setOpenSec(null); }
    });
    return () => subscription.unsubscribe();
  }, [loadMine]);

  const onAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authBusy) return;
    setAuthBusy(true); setAuthErr(""); setNotice("");
    const sb = supabaseBrowser();
    try {
      if (!/.+@.+\..+/.test(email)) throw new Error("이메일 형식을 확인해 주세요.");
      if (pw.length < 6) throw new Error("비밀번호는 6자 이상이어야 해요.");
      if (tab === "up") {
        const { data, error } = await sb.auth.signUp({ email, password: pw });
        if (error) throw error;
        if (data.session) {
          setNotice("가입 완료! 이제 이름과 태어난 날·시간을 알려 주세요. 한 번만 등록하면 모든 풀이가 자동으로 시작되고, 오늘의 운세가 매일 준비돼요.");
          setOpenSec("saju");
          setTimeout(() => sajuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
        } else setNotice("가입은 됐는데 자동 로그인이 안 됐어요. 로그인 탭으로 들어와 주세요.");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      }
      setPw("");
    } catch (ex) {
      const msg = ex instanceof Error ? ex.message : String(ex);
      setAuthErr(
        /Invalid login credentials/i.test(msg) ? "이메일 또는 비밀번호가 맞지 않아요." :
        /already registered/i.test(msg) ? "이미 가입된 이메일이에요. 로그인으로 들어와 주세요." :
        /Email not confirmed/i.test(msg) ? "아직 이메일 인증 전이에요. 메일함의 인증 링크를 눌러 주세요." :
        msg,
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profBusy || !session) return;
    setProfBusy(true); setProfMsg(""); setProfErr("");
    try {
      const v = validDate(form);
      if (v) throw new Error(v);
      const { error } = await supabaseBrowser()
        .from("profiles")
        .upsert({ id: session.user.id, ...formToProfile(form), updated_at: new Date().toISOString() });
      if (error) throw new Error("저장에 실패했어요. 잠시 뒤 다시 시도해 주세요.");
      setHasProfile(true);
      setProfMsg(`${form.name.trim() || "회원"}님의 사주를 기억해 둘게요. 이제 어느 풀이든 생일 입력 없이 시작되고, 오늘 탭을 열면 하루 운세가 바로 펼쳐져요.`);
    } catch (ex) {
      setProfErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setProfBusy(false);
    }
  };

  const onSignOut = async () => {
    await supabaseBrowser().auth.signOut();
    setNotice(""); setAuthErr("");
  };

  if (!ready) return <p className="ai-wait">회원 정보를 확인하는 중이에요.</p>;

  if (!session) {
    return (
      <form onSubmit={onAuth} noValidate>
        <fieldset>
          <legend>월하 회원</legend>
          <div className="seg auth-seg" role="group" aria-label="로그인/회원가입">
            {([["in", "로그인"], ["up", "회원가입"]] as const).map(([v, t]) => (
              <button key={v} type="button" aria-pressed={tab === v}
                className={`seg-btn${tab === v ? " on" : ""}`}
                onClick={() => { setTab(v); setAuthErr(""); setNotice(""); }}>{t}</button>
            ))}
          </div>
          <div className="grid">
            <div className="field full">
              <label htmlFor="acct-email">이메일</label>
              <input id="acct-email" type="email" autoComplete="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="field full">
              <label htmlFor="acct-pw">비밀번호</label>
              <input id="acct-pw" type="password" autoComplete={tab === "up" ? "new-password" : "current-password"}
                placeholder="6자 이상" value={pw} onChange={e => setPw(e.target.value)} />
            </div>
          </div>
        </fieldset>
        <button className="submit" type="submit" disabled={authBusy}>
          {authBusy ? "확인하는 중이에요" : tab === "up" ? "가입하기" : "로그인"}
        </button>
        {notice && <p className="notice" role="status">{notice}</p>}
        {authErr && <p className="err" role="alert" style={{ display: "block" }}>{authErr}</p>}
        <p className="form-hint">
          사주 프로필을 한 번 등록해 두면 모든 풀이가 생일 입력 없이 시작되고, 만든 감정서는 서재 탭에 모여요.
        </p>
      </form>
    );
  }

  /* ── 로그인 상태 ── */
  const name = form.name.trim();
  const joined = session.user.created_at ? new Date(session.user.created_at) : null;
  const days = joined ? Math.max(1, Math.floor((Date.now() - joined.getTime()) / 86400000) + 1) : 1;
  const hourLabel = form.hourIdx >= 0 ? HOURS[form.hourIdx + 1].split(" ")[0] : null;
  const sajuDesc = hasProfile
    ? `${form.y}. ${form.m}. ${form.d}. ${CAL_LABEL[form.cal]}${hourLabel ? ` · ${hourLabel}` : ""}`
    : "이름과 태어난 날·시간을 등록해 주세요";

  return (
    <div className="stagger">
      {/* 프로필 히어로 */}
      <div className="acct-hero">
        <div className="acct-hero-top">
          <div className="acct-ava" aria-hidden="true">{name ? name.charAt(0) : "月"}</div>
          <div style={{ minWidth: 0 }}>
            <p className="acct-name">{name ? `${name}님` : "월하 회원"}</p>
            <p className="acct-email">{session.user.email}</p>
          </div>
          <button className="ghost-btn acct-out" type="button" onClick={onSignOut}>로그아웃</button>
        </div>
        <div className="acct-stats">
          <span className="acct-stat">서재의 감정서 <b>{readCount}권</b></span>
          <span className="acct-stat">월하와 <b>{days}일째</b></span>
          <span className="acct-stat">사주 프로필 <b>{hasProfile ? "등록됨" : "아직"}</b></span>
        </div>
      </div>

      {notice && <p className="notice" style={{ margin: "0 0 16px" }}>{notice}</p>}

      {/* 바로가기 */}
      <div className="mode-list" style={{ marginBottom: 16 }}>
        <Link href="/daily" className="mode-row">
          <span className="mk" aria-hidden="true">日</span>
          <span>
            <span className="mt">오늘의 운세</span>
            <span className="md">{hasProfile ? "프로필로 바로 열려요" : "프로필을 등록하면 자동으로 열려요"}</span>
          </span>
          <span className="chev" aria-hidden="true">›</span>
        </Link>
        <Link href="/library" className="mode-row">
          <span className="mk" aria-hidden="true">冊</span>
          <span>
            <span className="mt">나의 서재</span>
            <span className="md">내가 만든 감정서 보관함으로 가기</span>
          </span>
          <span className="chev" aria-hidden="true">›</span>
        </Link>
      </div>

      {/* 사주 정보 */}
      <div ref={sajuRef}>
        <Disc mk="命" title="내 사주 정보" desc={sajuDesc}
          open={openSec === "saju"} onToggle={() => toggle("saju")}>
          <form onSubmit={onSaveProfile} noValidate>
            <PersonFields legend="내 사주 프로필" form={form} setForm={setForm} idPrefix="p" />
            <button className="submit" type="submit" disabled={profBusy}>
              {profBusy ? "저장하는 중이에요" : "사주 프로필 저장"}
            </button>
            {profMsg && (
              <>
                <p className="notice">{profMsg}</p>
                <Link href="/daily" className="ghost-btn cta-link" style={{ marginTop: 12 }}>
                  오늘의 운세 바로 보기
                </Link>
              </>
            )}
            {profErr && <p className="err" role="alert" style={{ display: "block" }}>{profErr}</p>}
          </form>
        </Disc>
      </div>

      {/* 화면 */}
      <Disc mk="燈" title="화면" desc={dark ? "흑단 (어두움) 사용 중" : "한지 (밝음) 사용 중"}
        open={openSec === "theme"} onToggle={() => toggle("theme")}>
        <div className="seg" role="group" aria-label="화면 밝기">
          <button type="button" className={`seg-btn${!dark ? " on" : ""}`} aria-pressed={!dark}
            onClick={() => setTheme(false)}>한지 (밝음)</button>
          <button type="button" className={`seg-btn${dark ? " on" : ""}`} aria-pressed={dark}
            onClick={() => setTheme(true)}>흑단 (어두움)</button>
        </div>
        <p className="form-hint">선택은 이 기기에 저장돼요.</p>
      </Disc>

      {/* 보안 */}
      <Disc mk="密" title="보안" desc="비밀번호 변경"
        open={openSec === "security"} onToggle={() => toggle("security")}>
        <form onSubmit={onChangePw} noValidate>
          <div className="grid">
            <div className="field full">
              <label htmlFor="pw-new">새 비밀번호</label>
              <input id="pw-new" type="password" autoComplete="new-password" placeholder="6자 이상"
                value={pw1} onChange={e => setPw1(e.target.value)} />
            </div>
            <div className="field full">
              <label htmlFor="pw-new2">새 비밀번호 확인</label>
              <input id="pw-new2" type="password" autoComplete="new-password" placeholder="한 번 더"
                value={pw2} onChange={e => setPw2(e.target.value)} />
            </div>
          </div>
          <button className="ghost-btn" type="submit" disabled={pwBusy} style={{ marginTop: 8 }}>
            {pwBusy ? "바꾸는 중이에요" : "비밀번호 바꾸기"}
          </button>
          {pwMsg && <p className="notice">{pwMsg}</p>}
          {pwErr && <p className="err" role="alert" style={{ display: "block" }}>{pwErr}</p>}
        </form>
      </Disc>

      {/* 계정 정리 */}
      <Disc mk="別" title="계정 정리" desc="회원 탈퇴와 데이터 삭제 안내" danger
        open={openSec === "leave"} onToggle={() => { toggle("leave"); setDelStep(0); setDelErr(""); }}>
        {delStep === 0 && (
          <>
            <p className="form-hint" style={{ margin: "0 0 12px" }}>
              탈퇴하면 사주 프로필과 서재 연결이 지워져요. 아래 버튼을 누르면 한 번 더 확인해요.
            </p>
            <button className="ghost-btn" type="button" onClick={() => setDelStep(1)}>회원 탈퇴</button>
          </>
        )}
        {delStep === 1 && (
          <>
            <p className="form-hint" style={{ margin: "0 0 12px" }}>
              탈퇴하면 사주 프로필과 서재 연결이 지워지고 되돌릴 수 없어요. 이미 공유한 감정서 링크는 익명으로 남아요. 정말 진행할까요?
            </p>
            <div className="seg" role="group" aria-label="탈퇴 확인">
              <button type="button" className="seg-btn" onClick={() => setDelStep(0)}>돌아가기</button>
              <button type="button" className="seg-btn danger" disabled={delBusy} onClick={onDelete}>
                {delBusy ? "처리 중이에요" : "탈퇴할게요"}
              </button>
            </div>
          </>
        )}
        {delErr && <p className="err" role="alert" style={{ display: "block" }}>{delErr}</p>}
      </Disc>
    </div>
  );
}
