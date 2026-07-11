/** 두 사주 비교용 관계 로직 — ssaju는 단일 사주만 계산하므로 여기서 보완한다. */
import { STEMS, BRANCHES, YUKHAP, SAMHAP, WONJIN, HAE } from "./constants";

export type BranchRelKind = "same" | "yukhap" | "samhap" | "chung" | "wonjin" | "hae" | "none";
export interface BranchRel { k: BranchRelKind; label: string; }
export type TenGodName =
  | "비견" | "겁재" | "식신" | "상관" | "편재"
  | "정재" | "편관" | "정관" | "편인" | "정인";

export const stemIdxOf = (hj: string): number => STEMS.findIndex(s => s.hj === hj);
export const branchIdxOf = (hj: string): number => BRANCHES.findIndex(b => b.hj === hj);
export const gzName = (s: number, b: number): string =>
  STEMS[s].kr + BRANCHES[b].kr + "(" + STEMS[s].hj + BRANCHES[b].hj + ")";

export const isSamhap = (a: number, b: number): boolean =>
  a !== b && SAMHAP.some(g => g.includes(a) && g.includes(b));
export const isChung = (a: number, b: number): boolean => (a + 6) % 12 === b;

export function branchRelation(a: number, b: number): BranchRel {
  if (a === b) return { k: "same", label: "같은 기운" };
  if ((YUKHAP as Record<number, number>)[a] === b) return { k: "yukhap", label: "육합(六合)" };
  if (isSamhap(a, b)) return { k: "samhap", label: "삼합(三合)" };
  if (isChung(a, b)) return { k: "chung", label: "충(沖)" };
  if ((WONJIN as Record<number, number>)[a] === b) return { k: "wonjin", label: "원진(怨嗔)" };
  if ((HAE as Record<number, number>)[a] === b) return { k: "hae", label: "해(害)" };
  return { k: "none", label: "무난한 관계" };
}

/** 일간(me) 기준으로 상대 천간(other)이 갖는 십성 */
export function tenGod(me: number, other: number): TenGodName {
  const a = STEMS[me], b = STEMS[other];
  const samePol = a.yang === b.yang;
  if (a.e === b.e) return samePol ? "비견" : "겁재";
  if ((a.e + 1) % 5 === b.e) return samePol ? "식신" : "상관";
  if ((a.e + 2) % 5 === b.e) return samePol ? "편재" : "정재";
  if ((b.e + 2) % 5 === a.e) return samePol ? "편관" : "정관";
  return samePol ? "편인" : "정인";
}
