"use client";
import { useRef, useState } from "react";
import { HOURS } from "@/lib/engine/constants";
import { analyzePerson, type Sex } from "@/lib/engine/analyze";
import { renderReport, type Mode } from "@/lib/engine/modes";
import { REL_STATUS, REL_GAP, JOB_STATUS } from "@/content/deep";

const SUBMIT_LABEL: Record<Mode, string> = {
  saju: "정통사주 감정 보기",
  love: "연애비책 풀이 보기",
  gunghap: "사주궁합 풀이 보기",
  yearly: "올해의 운세 보기",
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
  const [relStatus, setRelStatus] = useState(0);
  const [relGap, setRelGap] = useState(0);
  const [job, setJob] = useState<string>(JOB_STATUS[0]);
  const [html, setHtml] = useState("");
  const [err, setErr] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const askRel = mode === "love" || mode === "gunghap";

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
      setHtml(renderReport(mode, A, { B, relStatus, relGap, job }));
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
