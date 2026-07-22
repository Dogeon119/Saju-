"use client";
import { HOURS } from "@/lib/engine/constants";
import type { Sex } from "@/lib/engine/analyze";

export type Calendar = "solar" | "lunar" | "lunar-leap";
export interface FormState { name: string; sex: Sex; cal: Calendar; y: number; m: number; d: number; hourIdx: number; }
export const emptyForm = (sex: Sex): FormState => ({ name: "", sex, cal: "solar", y: 0, m: 0, d: 0, hourIdx: -1 });

const MAX_YEAR = new Date().getFullYear(); // 하드코딩 상한 제거 — 매년 자동 확장(10대 유입 차단 방지)
const YEARS = Array.from({ length: MAX_YEAR - 1930 + 1 }, (_, i) => MAX_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function validDate(f: FormState): string | null {
  if (!f.y || !f.m || !f.d) return "생년월일을 선택해 주세요.";
  if (f.cal === "solar") {
    const dt = new Date(f.y, f.m - 1, f.d);
    if (dt.getMonth() !== f.m - 1 || dt.getDate() !== f.d) return `${f.m}월에는 ${f.d}일이 없습니다. 날짜를 확인해 주세요.`;
  } else if (f.d > 30) {
    return "음력은 30일까지만 있습니다. 날짜를 확인해 주세요.";
  }
  return null;
}

/** API·DB 페이로드 공용 변환 */
export const personPayload = (f: FormState) => ({
  name: f.name, sex: f.sex, year: f.y, month: f.m, day: f.d, hourIdx: f.hourIdx,
  calendar: f.cal === "solar" ? ("solar" as const) : ("lunar" as const),
  leap: f.cal === "lunar-leap",
});

export function PersonFields({ legend, form, setForm, idPrefix }: {
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

/** profiles 테이블 행 ↔ FormState 변환 */
export interface ProfileRow {
  name: string | null; sex: string | null; year: number | null; month: number | null; day: number | null;
  hour_idx: number | null; calendar: string | null; leap: boolean | null;
}

export function profileToForm(p: ProfileRow): FormState {
  return {
    name: p.name ?? "",
    sex: p.sex === "M" ? "M" : "F",
    cal: p.calendar === "lunar" ? (p.leap ? "lunar-leap" : "lunar") : "solar",
    y: p.year ?? 0, m: p.month ?? 0, d: p.day ?? 0,
    hourIdx: typeof p.hour_idx === "number" ? p.hour_idx : -1,
  };
}

export function formToProfile(f: FormState) {
  return {
    name: f.name.trim() || null,
    sex: f.sex,
    year: f.y || null, month: f.m || null, day: f.d || null,
    hour_idx: f.hourIdx,
    calendar: f.cal === "solar" ? "solar" : "lunar",
    leap: f.cal === "lunar-leap",
  };
}
