"use client";
import { useEffect, useRef, useState } from "react";
import { analyzePerson } from "@/lib/engine/analyze";
import { renderReport, type Mode } from "@/lib/engine/modes";
import { REL_STATUS, REL_GAP, JOB_STATUS } from "@/content/deep";
import { supabaseBrowser } from "@/lib/db/browser";
import {
  PersonFields, emptyForm, validDate, personPayload, profileToForm,
  type FormState, type ProfileRow,
} from "./person-form";
import SceneReader from "./SceneReader";

const SUBMIT_LABEL: Record<Mode, string> = {
  saju: "정통사주 감정 보기",
  love: "연애비책 풀이 보기",
  gunghap: "사주궁합 풀이 보기",
  yearly: "올해의 운세 보기",
  daily: "오늘의 운세 보기",
  manse: "만세력 펼쳐 보기",
};

/** AI 스트리밍 출력 — 마크다운 소제목(##)만 가볍게 살려 텍스트로 렌더 (HTML 주입 없음) */
function AiText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const h = line.match(/^#{2,4}\s+(.*)/);
        if (h) return <h3 key={i} className="ai-h">{h[1]}</h3>;
        if (!line.trim()) return null;
        return <p key={i}>{line.replace(/\*\*/g, "")}</p>;
      })}
    </>
  );
}

export default function ReadingApp({ mode }: { mode: Mode }) {
  const [formA, setFormA] = useState<FormState>(() => emptyForm("F"));
  const [formB, setFormB] = useState<FormState>(() => emptyForm("M"));
  const [relStatus, setRelStatus] = useState(0);
  const [relGap, setRelGap] = useState(0);
  const [job, setJob] = useState<string>(JOB_STATUS[0]);
  const [html, setHtml] = useState("");
  const [err, setErr] = useState("");
  const [ai, setAi] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [shareErr, setShareErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteErr, setInviteErr] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const dirtyA = useRef(false); // 유저가 직접 입력을 시작했는지

  const askRel = mode === "love" || mode === "gunghap";

  const toPerson = (f: FormState, fallbackName: string) =>
    analyzePerson({ ...personPayload(f), fallbackName });

  /** 폼 상태로 풀이 실행 — 제출 버튼과 자동 실행이 공유 */
  const runReading = (fA: FormState, fB?: FormState): boolean => {
    setErr("");
    try {
      const errA = validDate(fA);
      if (errA) { setErr("나의 정보: " + errA); return false; }
      const A = toPerson(fA, "당신");
      let B = undefined;
      if (mode === "gunghap") {
        const errB = validDate(fB ?? formB);
        if (errB) { setErr("상대의 정보: " + errB); return false; }
        B = toPerson(fB ?? formB, "상대");
      }
      setHtml(renderReport(mode, A, { B, relStatus, relGap, job }));
      setAi(""); setAiErr("");
      setShareUrl(""); setShareErr(""); setCopied(false);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return true;
    } catch (ex) {
      setErr("풀이 중 오류가 났습니다: " + (ex instanceof Error ? ex.message : String(ex)));
      return false;
    }
  };

  /* 로그인 + 프로필 저장 유저는 생일을 다시 입력하지 않는다.
     오늘의운세 탭은 프로필이 있으면 아예 자동으로 펼쳐진다. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sb = supabaseBrowser();
        const { data: { session } } = await sb.auth.getSession();
        if (!session || cancelled) return;
        const { data } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
        if (!data || cancelled || dirtyA.current) return;
        const p = data as ProfileRow;
        if (!p.year || !p.month || !p.day) return;
        const nf = profileToForm(p);
        setFormA(nf);
        setPrefilled(true);
        if (mode === "daily") runReading(nf); // 오늘 탭은 원클릭도 없이 바로
      } catch { /* 게스트 흐름은 그대로 */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runReading(formA, formB);
  };

  const onShare = async () => {
    if (shareBusy) return;
    setShareBusy(true); setShareErr(""); setCopied(false);
    try {
      // 로그인 상태면 감정서를 계정 히스토리에 함께 묶는다
      let auth: Record<string, string> = {};
      try {
        const { data: { session } } = await supabaseBrowser().auth.getSession();
        if (session) auth = { Authorization: `Bearer ${session.access_token}` };
      } catch { /* 게스트 저장 */ }
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({
          mode,
          me: personPayload(formA),
          partner: mode === "gunghap" ? personPayload(formB) : undefined,
          relStatus, relGap, job,
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || `요청 실패 (${res.status})`);
      const url = `${window.location.origin}${j.path}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch { /* 클립보드 권한 없으면 링크 표시만 */ }
    } catch (ex) {
      setShareErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setShareBusy(false);
    }
  };

  const onInvite = async () => {
    if (inviteBusy) return;
    setInviteErr(""); setInviteCopied(false);
    const errA = validDate(formA);
    if (errA) { setInviteErr("나의 정보: " + errA); return; }
    setInviteBusy(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ me: personPayload(formA), relStatus, relGap }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error || `요청 실패 (${res.status})`);
      const url = `${window.location.origin}${j.path}`;
      setInviteUrl(url);
      try { await navigator.clipboard.writeText(url); setInviteCopied(true); } catch { /* 표시만 */ }
    } catch (ex) {
      setInviteErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setInviteBusy(false);
    }
  };

  const onAiReading = async () => {
    if (aiBusy) return;
    setAiBusy(true); setAi(""); setAiErr("");
    try {
      const res = await fetch("/api/ai-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          me: personPayload(formA),
          partner: mode === "gunghap" ? personPayload(formB) : undefined,
          relStatus, relGap, job,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `요청 실패 (${res.status})`);
      }
      if (!res.body) throw new Error("스트리밍을 지원하지 않는 환경이에요.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) setAi(prev => prev + chunk);
      }
    } catch (ex) {
      setAiErr(ex instanceof Error ? ex.message : String(ex));
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} noValidate>
        {prefilled && <p className="form-hint">회원 프로필로 채워 뒀어요. 수정해도 프로필은 바뀌지 않아요.</p>}
        <PersonFields legend="나의 정보" form={formA}
          setForm={f => { dirtyA.current = true; setFormA(f); }} idPrefix="a" />
        {mode === "gunghap" && (
          <PersonFields legend="상대의 정보" form={formB} setForm={setFormB} idPrefix="b" />
        )}

        {askRel && (
          <fieldset>
            <legend>지금의 관계</legend>
            <div className="grid">
              <div className="field">
                <label htmlFor="rel-status">{mode === "gunghap" ? "두 사람의 관계는?" : "지금 나의 연애 상태는?"}</label>
                <select id="rel-status" value={relStatus} onChange={e => setRelStatus(Number(e.target.value))}>
                  {REL_STATUS.map((s, i) => <option key={s} value={i}>{s}</option>)}
                </select>
              </div>
              {relStatus > 0 && (
                <div className="field">
                  <label htmlFor="rel-gap">그 상태가 된 지 얼마나 되었나요?</label>
                  <select id="rel-gap" value={relGap} onChange={e => setRelGap(Number(e.target.value))}>
                    {REL_GAP.map((g, i) => <option key={g} value={i}>{g}</option>)}
                  </select>
                </div>
              )}
            </div>
            <p className="form-hint">상태를 알려 주시면 그 상황에 맞춘 처방 장(章)이 더 정확해집니다.</p>
          </fieldset>
        )}

        {mode === "yearly" && (
          <fieldset>
            <legend>나의 현재</legend>
            <div className="grid">
              <div className="field">
                <label htmlFor="job">현재 무슨 일을 하고 계신가요?</label>
                <select id="job" value={job} onChange={e => setJob(e.target.value)}>
                  {JOB_STATUS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
            </div>
            <p className="form-hint">직장·학업 상태에 맞춰 5장(직장운)과 6장(학업·계약운)의 무게가 달라집니다.</p>
          </fieldset>
        )}

        <button className="submit" type="submit">{SUBMIT_LABEL[mode]}</button>
        {err && <p className="err" style={{ display: "block" }}>{err}</p>}

        {mode === "gunghap" && (
          <div className="invite-sec">
            <p className="form-hint">
              상대의 생년월일을 모르세요? 나의 정보만 채우고 초대 링크를 보내면, 상대가 자기 생일을 입력하는 순간 궁합이 펼쳐져요.
            </p>
            {!inviteUrl && (
              <button className="ghost-btn" type="button" onClick={onInvite} disabled={inviteBusy}>
                {inviteBusy ? "초대장을 만드는 중이에요" : "상대에게 보낼 초대 링크 만들기"}
              </button>
            )}
            {inviteUrl && (
              <div className="share-done">
                <p className="share-note">{inviteCopied ? "초대 링크를 복사했어요. 상대에게 보내 보세요." : "아래 초대 링크를 복사해서 보내 보세요."}</p>
                <p className="share-link">{inviteUrl}</p>
              </div>
            )}
            {inviteErr && <p className="err" style={{ display: "block" }}>{inviteErr}</p>}
          </div>
        )}
      </form>

      {html && (
        <div id="result" ref={resultRef} style={{ display: "block" }}>
          <SceneReader html={html} />

          <div className="share-sec">
            {!shareUrl && (
              <button className="ghost-btn" type="button" onClick={onShare} disabled={shareBusy}>
                {shareBusy ? "링크를 만드는 중이에요" : "감정서 공유 링크 만들기"}
              </button>
            )}
            {shareUrl && (
              <div className="share-done">
                <p className="share-note">{copied ? "링크를 복사했어요. 카톡에 붙여 넣어 보내 보세요." : "아래 링크를 복사해서 보내 보세요."}</p>
                <p className="share-link">{shareUrl}</p>
              </div>
            )}
            {shareErr && <p className="err" style={{ display: "block" }}>{shareErr}</p>}
          </div>

          <div className="ai-sec" style={mode === "manse" ? { display: "none" } : undefined}>
            {!ai && !aiBusy && (
              <button className="ghost-btn" type="button" onClick={onAiReading}>
                AI 심층 풀이 받기
              </button>
            )}
            {aiBusy && !ai && <p className="ai-wait">월하가 사주를 깊이 들여다보고 있어요. 풀이를 준비하고 있어요.</p>}
            {ai && (
              <div className="ai-rp">
                <h2 className="scene-title">AI 심층 풀이</h2>
                <AiText text={ai} />
                {aiBusy && <p className="ai-wait">계속 적는 중이에요</p>}
              </div>
            )}
            {aiErr && <p className="err" style={{ display: "block" }}>{aiErr}</p>}
          </div>

          <button className="again" type="button"
            onClick={() => { setHtml(""); setAi(""); setAiErr(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            다시 풀이하기
          </button>
        </div>
      )}

      <p className="disclaimer">
        본 풀이는 전통 명리학의 틀을 빌린 재미와 성찰을 위한 콘텐츠입니다.<br />
        인생의 진짜 주인은 사주가 아니라 오늘의 당신입니다.
      </p>
      <p className="powered">만세력 계산: ssaju 엔진 (진태양시·절기 기반) · 시진 경계는 한국 표준(동경시 보정 +30분)을 따릅니다</p>
    </>
  );
}
