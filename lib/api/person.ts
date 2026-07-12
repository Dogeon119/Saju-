/** API 공용 — 클라이언트가 보낸 생년월일 페이로드 검증. 원국은 신뢰하지 않고 서버에서 ssaju 재계산한다. */
import type { PersonInput, Sex } from "../engine/analyze";
import type { Mode } from "../engine/modes";

export const MODES: Mode[] = ["saju", "love", "gunghap", "yearly"];

export interface PersonPayload {
  name?: string; sex?: string; year?: number; month?: number; day?: number;
  hourIdx?: number; calendar?: string; leap?: boolean;
}

export function toInput(p: PersonPayload, fallbackName: string): PersonInput | null {
  const { year, month, day } = p;
  if (!year || !month || !day) return null;
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const hourIdx = typeof p.hourIdx === "number" && p.hourIdx >= 0 && p.hourIdx <= 11 ? p.hourIdx : -1;
  return {
    name: String(p.name ?? "").slice(0, 20),
    sex: (p.sex === "M" ? "M" : "F") as Sex,
    year, month, day, hourIdx,
    calendar: p.calendar === "lunar" ? "lunar" : "solar",
    leap: !!p.leap,
    fallbackName,
  };
}

/** 저장·재현에 쓰는 정규화 페이로드 — toInput 통과본만 담는다 */
export interface ReadingPayload {
  me: PersonPayload;
  partner?: PersonPayload;
  relStatus: number;
  relGap: number;
  job: string;
}

export function clampIdx(v: unknown, max: number): number {
  const n = typeof v === "number" ? Math.floor(v) : 0;
  return n >= 0 && n <= max ? n : 0;
}

/** PersonInput → 저장용 최소 페이로드 (검증 통과값만) */
export function toPayload(i: PersonInput): PersonPayload {
  return {
    name: i.name || undefined,
    sex: i.sex,
    year: i.year, month: i.month, day: i.day,
    hourIdx: i.hourIdx,
    calendar: i.calendar ?? "solar",
    leap: !!i.leap,
  };
}
