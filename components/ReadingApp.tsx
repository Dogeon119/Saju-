"use client";
import { useRef, useState } from "react";
import { HOURS } from "@/lib/engine/constants";
import { analyzePerson, type Sex } from "@/lib/engine/analyze";
import { renderReading, type Mode } from "@/lib/engine/render";

const SUBMIT_LABEL: Record<Mode, string> = {
  love: "연애운 풀이 보기",
  gunghap: "궁합 풀이 보기",
  forecast: "인연 예보 보기",
  marriage: "결혼운 풀이 보기",
  today: "오늘의 연애 보기",
};

interface FormState { name: string; sex: Sex; dob: string; hourIdx: number; }
const emptyForm = (sex: Sex): FormState => ({ name: "", sex, dob: "", hourIdx: -1 });

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
          <label htmlFor={`${idPrefix}-sex`}>성별</label>
          <select id={`${idPrefix}-sex`} value={form.sex}
            onChange={e => setForm({ ...form, sex: e.target.value as Sex })}>
            <option value="F">여성</option>
            <option value="M">남성</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-dob`}>생년월일 (양력)</label>
          <input id={`${idPrefix}-dob`} type="date" min="1930-01-01" max="2012-12-31"
            value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor={`${idPrefix}-hour`}>태어난 시간</label>
          <select id={`${idPrefix}-hour`} value={form.hourIdx}
            onChange={e => setForm({ ...form, hourIdx: Number(e.target.value) })}>
            {HOURS.map((h, i) => <option key={h} value={i - 1}>{h}</option>)}
          </select>
        </div>
      </div>
    </fieldset>
  );
}

export default function ReadingApp({ mode }: { mode: Mode }) {
  const [formA, setFormA] = useState<FormState>(() => emptyForm("F"));
  const [formB, setFormB] = useState<FormState>(() => emptyForm("M"));
  const [html, setHtml] = useState("");
  const [err, setErr] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const toPerson = (f: FormState, fallbackName: string) => {
    if (!f.dob) return null;
    const [y, m, d] = f.dob.split("-").map(Number);
    return analyzePerson({ name: f.name, sex: f.sex, year: y, month: m, day: d, hourIdx: f.hourIdx, fallbackName });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      const A = toPerson(formA, "당신");
      if (!A) { setErr("나의 생년월일을 입력해 주세요."); return; }
      let B = undefined;
      if (mode === "gunghap") {
        B = toPerson(formB, "상대") ?? undefined;
        if (!B) { setErr("상대의 생년월일을 입력해 주세요."); return; }
      }
      setHtml(renderReading(mode, A, B));
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (ex) {
      setErr("풀이 중 오류가 났습니다: " + (ex instanceof Error ? ex.message : String(ex)));
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} noValidate>
        <PersonFields legend="나의 정보" form={formA} setForm={setFormA} idPrefix="a" />
        {mode === "gunghap" && (
          <PersonFields legend="상대의 정보" form={formB} setForm={setFormB} idPrefix="b" />
        )}
        <button className="submit" type="submit">{SUBMIT_LABEL[mode]}</button>
        {err && <p className="err" style={{ display: "block" }}>{err}</p>}
      </form>

      {html && (
        <div id="result" ref={resultRef} style={{ display: "block" }}>
          {/* 풀이 HTML은 이스케이프된 사용자 입력 + 자체 콘텐츠만 포함 (analyzePerson에서 escapeHtml 처리) */}
          <div dangerouslySetInnerHTML={{ __html: html }} />
          <button className="again" type="button"
            onClick={() => { setHtml(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            ↺ 다시 풀이하기
          </button>
        </div>
      )}

      <p className="disclaimer">
        본 풀이는 전통 명리학의 틀을 빌린 재미와 성찰을 위한 콘텐츠입니다.<br />
        인생의 진짜 주인은 사주가 아니라 오늘의 당신입니다. 🌙
      </p>
      <p className="powered">만세력 계산: ssaju 엔진 (진태양시·절기 기반)</p>
    </>
  );
}
