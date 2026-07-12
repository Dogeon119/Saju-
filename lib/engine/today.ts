import { STEMS, BRANCHES } from "./constants";

/** 지지 12수 — 일진 위젯 표기용 */
export const BRANCH_ANIMALS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"] as const;

/** 천간 오행 수식어 — "푸른 용의 날" 문법 */
export const STEM_TONE = ["푸른", "푸른", "붉은", "붉은", "누런", "누런", "흰", "흰", "검은", "검은"] as const;

export interface DayGanzhi {
  s: number;          // 천간 index (0~9)
  b: number;          // 지지 index (0~11)
  hj: string;         // 예: 丁亥
  kr: string;         // 예: 정해
  line: string;       // 예: 검은 돼지의 날
}

/**
 * 자정 기준 일진 — JDN 60갑자 순환.
 * 오프셋 49는 ssaju day pillar와의 대조 테스트(today.test.ts)로 검증한다.
 */
export function todayGanzhi(d: Date = new Date()): DayGanzhi {
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  const jdn = day + Math.floor((153 * mm + 2) / 5) + 365 * yy
    + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  const idx = (jdn + 49) % 60;
  const s = idx % 10, b = idx % 12;
  return {
    s, b,
    hj: `${STEMS[s].hj}${BRANCHES[b].hj}`,
    kr: `${STEMS[s].kr}${BRANCHES[b].kr}`,
    line: `${STEM_TONE[s]} ${BRANCH_ANIMALS[b]}의 날`,
  };
}
