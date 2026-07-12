"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/db/browser";
import {
  PersonFields, emptyForm, validDate, profileToForm, formToProfile,
  type FormState, type ProfileRow,
} from "./person-form";

const MODE_TITLE: Record<string, string> = {
  saju: "정통사주", love: "연애비책", gunghap: "사주궁합", yearly: "올해의운세",
};

interface HistRow { share_id: string; mode: string; created_at: string; }

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

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

  /* 프로필 · 히스토리 */
  const [form, setForm] = useState<FormState>(() => emptyForm("F"));
  const [profBusy, setProfBusy] = useState(false);
  const [profMsg, setProfMsg] = useState("");
  const [profErr, setProfErr] = useState("");
  const [hist, setHist] = useState<HistRow[]>([]);
  const [histLoaded, setHistLoaded] = useState(false);

  const loadMine = useCallback(async (uid: string) => {
    const sb = supabaseBrowser();
    const [{ data: prof }, { data: rows }] = await Promise.all([
      sb.from("profiles").select("*").eq("id", uid).maybeSingle(),
      sb.from("readings").select("share_id,mode,created_at").order("created_at", { ascending: false }).limit(30),
    ]);
    if (prof) setForm(profileToForm(prof as ProfileRow));
    setHist((rows as HistRow[]) ?? []);
    setHistLoaded(true);
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
      else { setHist([]); setHistLoaded(false); setForm(emptyForm("F")); }
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
        const { data, error } = await sb.auth.signUp({
          email, password: pw,
          options: { emailRedirectTo: `${window.location.origin}/account` },
        });
        if (error) throw error;
        if (data.session) setNotice("서재가 열렸어요. 아래에 사주 프로필을 등록해 보세요.");
        else setNotice("확인 메일을 보냈어요. 메일함에서 인증을 마치면 로그인할 수 있어요.");
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
      setProfMsg("사주 프로필을 저장했어요. 이제 어느 풀이든 생일 입력 없이 시작돼요.");
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

  if (!ready) return <p className="ai-wait">서재를 여는 중이에요.</p>;

  if (!session) {
    return (
      <form onSubmit={onAuth} noValidate>
        <fieldset>
          <legend>내 서재</legend>
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
          {authBusy ? "확인하는 중이에요" : tab === "up" ? "서재 만들기" : "서재 열기"}
        </button>
        {notice && <p className="notice">{notice}</p>}
        {authErr && <p className="err" style={{ display: "block" }}>{authErr}</p>}
        <p className="form-hint">
          사주 프로필을 한 번 등록해 두면, 모든 풀이가 생일 입력 없이 시작되고 만든 감정서가 여기 모여요.
        </p>
      </form>
    );
  }

  return (
    <>
      <div className="acct-row">
        <div>
          <p className="acct-email">{session.user.email}</p>
          <p className="acct-sub">월하의 서재 회원</p>
        </div>
        <button className="ghost-btn acct-out" type="button" onClick={onSignOut}>로그아웃</button>
      </div>

      <form onSubmit={onSaveProfile} noValidate>
        <PersonFields legend="내 사주 프로필" form={form} setForm={setForm} idPrefix="p" />
        <button className="submit" type="submit" disabled={profBusy}>
          {profBusy ? "저장하는 중이에요" : "사주 프로필 저장"}
        </button>
        {profMsg && <p className="notice">{profMsg}</p>}
        {profErr && <p className="err" style={{ display: "block" }}>{profErr}</p>}
      </form>

      <h2 className="acct-h">내 감정서</h2>
      {!histLoaded && <p className="ai-wait">감정서를 찾는 중이에요.</p>}
      {histLoaded && hist.length === 0 && (
        <p className="acct-empty">
          아직 서재에 감정서가 없어요. 풀이 결과에서 &ldquo;감정서 공유 링크 만들기&rdquo;를 누르면 여기에 보관돼요.
        </p>
      )}
      {hist.length > 0 && (
        <div className="mode-list">
          {hist.map(h => (
            <Link key={h.share_id} href={`/r/${h.share_id}`} className="mode-row">
              <span className="mk">{{ saju: "命", love: "戀", gunghap: "緣", yearly: "歲" }[h.mode] ?? "命"}</span>
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
