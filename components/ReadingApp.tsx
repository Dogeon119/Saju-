"use client";
import { useRef, useState } from "react";
import { HOURS } from "@/lib/engine/constants";
import { analyzePerson, type Sex } from "@/lib/engine/analyze";
import { renderReport, type Mode } from "@/lib/engine/modes";
import { REL_STATUS, REL_GAP, JOB_STATUS } from "@/content/deep";
import SceneReader from "./SceneReader";

const SUBMIT_LABEL: Record<Mode, string> = {
  saju: "정통사주 감정 보기",
  love: "연애비책 풀이 보기",
  gunghap: "사주궁합 풀이 보기",
  yearly: "올해의 운세 보기",
};

type Calendar = "solar" | "lunar" | "lunar-leap";
interface FormState { name: string; sex: Sex; cal: Calendar; y: number; m: number; d: number; hourIdx: number; }
const emptyForm = (sex: Sex): FormState => ({ name: "", sex, cal: "solar", y: 0, m: 0, d: 0, hourIdx: -1 });

const YEARS = Array.from({ length: 2012 - 1930 + 1 }, (_, i) => 2012 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function validDate(f: FormState): string | null {
  if (!f.y || !f.m || !f.d) return "생년월일을 선택해 주세요.";
  if (f.cal === "solar") {
    const dt = new Date(f.y, f.m - 1, f.d);
    if (dt.getMonth() !== f.m - 1 || dt.getDate() !== f.d) return `${f.m}월에는 ${f.d}일이 없습니다. 날짜를 확인해 주세요.`;
  } else if (f.d > 30) {
    return "음력은 30일까지만 있습니다. 날짜를 확인해 주세요.";
  }
  return null;
}

function PersonFields({ legend, form, setForm, idPrefix }: {
  legend: string;
  form: FormState;
  setForm: (f: FormState) => void;
  idPrefix: string;
}) {
  return (
    <fieldset>
      <legend>{legend}</legend>
      <div className="grid">
        <div className="field">
          <label htmlFor={`${idPrefix}-name`}>이름</label>
          <input id={`${idPrefix}-name`} type="text" placeholder="이름 또는 별칭" autoComplete="off"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <span className="field-label">성별</span>
          <div className="seg" role="group" aria-label="성별">
            {([["F", "여성"], ["M", "남성"]] as [Sex, string][]).map(([v, t]) => (
              <button key={v} type="button" aria-pressed={form.sex === v}
                className={`seg-btn${form.sex === v ? " on" : ""}`}
                onClick={() => setForm({ ...form, sex: v })}>{t}</button>
            ))}
          </div>
        </div>
        <div className="field full">
          <span className="field-label">생년월일</span>
          <div className="seg" role="group" aria-label="양력/음력">
            {([["solar", "양력"], ["lunar", "음력"], ["lunar-leap", "음력(윤달)"]] as [Calendar, string][]).map(([v, t]) => (
              <button key={v} type="button" aria-pressed={form.cal === v}
                className={`seg-btn${form.cal === v ? " on" : ""}`}
                onClick={() => setForm({ ...form, cal: v })}>{t}</button>
            ))}
          </div>
          <div className="dob-row">
            <select id={`${idPrefix}-y`} aria-label="년" value={form.y}
              onChange={e => setForm({ ...form, y: Number(e.target.value) })}>
              <option value={0}>년</option>
              {YEARS.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
            <select id={`${idPrefix}-m`} aria-label="월" value={form.m}
              onChange={e => setForm({ ...form, m: Number(e.target.value) })}>
              <option value={0}>월</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
            <select id={`${idPrefix}-d`} aria-label="일" value={form.d}
              onChange={e => setForm({ ...form, d: Number(e.target.value) })}>
              <option value={0}>일</option>
              {DAYS.map(d => <option key={d} value={d}>{d}일</option>)}
            </select>
          </div>
        </div>
        <div className="field full">
          <label htmlFor={`${idPrefix}-hour`}>태어난 시간 (시진)</label>
          <select id={`${idPrefix}-hour`} value={form.hourIdx}
            onChange={e => setForm({ ...form, hourIdx: Number(e.target.value) })}>
            {HOURS.map((h, i) => <option key={h} value={i - 1}>{h}</option>)}
          </select>
        </div>
      </div>
    </fieldset>
  );
}

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
  const resultRef = useRef<HTMLDivElement>(null);

  const askRel = mode === "love" || mode === "gunghap";

  const toPerson = (f: FormState, fallbackName: string) =>
    analyzePerson({
      name: f.name, sex: f.sex, year: f.y, month: f.m, day: f.d, hourIdx: f.hourIdx,
      calendar: f.cal === "solar" ? "solar" : "lunar",
      leap: f.cal === "lunar-leap",
      fallbackName,
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      const errA = validDate(formA);
      if (errA) { setErr("나의 정보: " + errA); return; }
      const A = toPerson(formA, "당신");
      let B = undefined;
      if (mode === "gunghap") {
        const errB = validDate(formB);
        if (errB) { setErr("상대의 정보: " + errB); return; }
        B = toPerson(formB, "상대");
      }
      setHtml(renderReport(mode, A, { B, relStatus, relGap, job }));
      setAi(""); setAiErr("");
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (ex) {
      setErr("풀이 중 오류가 났습니다: " + (ex instanceof Error ? ex.message : String(ex)));
    }
  };

  const personPayload = (f: FormState) => ({
    name: f.name, sex: f.sex, year: f.y, month: f.m, day: f.d, hourIdx: f.hourIdx,
    calendar: f.cal === "solar" ? "solar" : "lunar",
    leap: f.cal === "lunar-leap",
  });

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
        <PersonFields legend="나의 정보" form={formA} setForm={setFormA} idPrefix="a" />
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
      </form>

      {html && (
        <div id="result" ref={resultRef} style={{ display: "block" }}>
          <SceneReader html={html} />

          <div className="ai-sec">
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
