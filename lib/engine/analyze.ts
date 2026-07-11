/** ssaju 엔진 어댑터 — 입력값 → 앱 공용 Person 형태 (프론트·서버 공용, DOM 무관) */
import { calculateSaju, type SajuResult } from "ssaju";
import { EK } from "./constants";

export type Sex = "F" | "M";

export interface PersonInput {
  name?: string;
  sex: Sex;
  year: number;
  month: number;
  day: number;
  /** 12지시 인덱스 (0=자시 … 11=해시), 모름이면 -1 */
  hourIdx: number;
  /** 기본 이름: 본인 "당신" / 상대 "상대" */
  fallbackName?: string;
}

export interface Person {
  name: string;
  sex: Sex;
  y: number;
  m: number;
  d: number;
  r: SajuResult;
  hourKnown: boolean;
  /** 오행 분포 [목,화,토,금,수] — 시간 모름이면 시주 기여분 차감 */
  elems: number[];
  /** 일간 인덱스 (0=甲…9=癸) */
  ds: number;
  /** 일지 인덱스 (0=子…11=亥) */
  db: number;
}

export function escapeHtml(s: string): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return s.replace(/[&<>"']/g, ch => map[ch]);
}

export function analyzePerson(input: PersonInput): Person {
  const { sex, year: y, month: m, day: d, hourIdx } = input;
  const name = escapeHtml((input.name ?? "").trim() || input.fallbackName || "당신");
  const opt: Parameters<typeof calculateSaju>[0] = {
    year: y, month: m, day: d,
    gender: sex === "F" ? "여" : "남",
  };
  const hourKnown = hourIdx >= 0;
  if (hourKnown) { opt.hour = hourIdx * 2; opt.minute = 0; }
  const r = calculateSaju(opt);

  /* 오행 분포: 시간 모름이면 ssaju 기본값(오시) 시주 기여분 제거 */
  const elems = EK.map(k => (r.fiveElements as Record<string, number>)[k] || 0);
  if (!hourKnown) {
    const he = r.pillarDetails.hour.element;
    const si = EK.indexOf(he.stem), bi = EK.indexOf(he.branch);
    if (si >= 0 && elems[si] > 0) elems[si]--;
    if (bi >= 0 && elems[bi] > 0) elems[bi]--;
  }
  return {
    name, sex, y, m, d, r, hourKnown, elems,
    ds: r.pillarDetails.day.stemIdx,
    db: r.pillarDetails.day.branchIdx,
  };
}
