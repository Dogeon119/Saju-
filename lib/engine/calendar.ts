import { calculateSaju, solarToLunar } from "ssaju";
import { todayGanzhi, type DayGanzhi } from "./today";
import { branchRelation, tenGod, type BranchRel, type TenGodName } from "./relations";

/** 절입일 → 절기 이름 (그 달의 지지가 바뀌는 날) */
const JEOLGI_BY_BRANCH: Record<number, string> = {
  2: "입춘", 3: "경칩", 4: "청명", 5: "입하", 6: "망종", 7: "소서",
  8: "입추", 9: "백로", 10: "한로", 11: "입동", 0: "대설", 1: "소한",
};

export type DayGrade = "길" | "주의" | "보통";

export interface CalDay {
  d: number;                 // 양력 일
  gz: DayGanzhi;             // 일진
  lunar: { m: number; d: number; leap: boolean };
  son: boolean;              // 손없는날 (음력 끝자리 9·0)
  jeolgi: string | null;     // 절입일이면 절기 이름
}

export interface DayMatch {
  tg: TenGodName;            // 내 일간 기준 그날 천간의 십성
  rel: BranchRel;            // 내 일지와 그날 지지의 관계
  grade: DayGrade;
}

const monthBranchOf = (y: number, m: number, d: number): number =>
  calculateSaju({ year: y, month: m, day: d, hour: 12, minute: 0 }).pillarDetails.month.branchIdx;

/** 한 달치 달력 데이터 — 일진·음력·손없는날·절입일 */
export function buildMonth(y: number, m: number): CalDay[] {
  const last = new Date(y, m, 0).getDate();
  const days: CalDay[] = [];
  let prevBranch = monthBranchOf(...(m === 1 ? [y - 1, 12, 31] : [y, m - 1, new Date(y, m - 1, 0).getDate()]) as [number, number, number]);
  for (let d = 1; d <= last; d++) {
    const lun = solarToLunar(y, m, d);
    const mb = monthBranchOf(y, m, d);
    days.push({
      d,
      gz: todayGanzhi(new Date(y, m - 1, d)),
      lunar: { m: lun.month, d: lun.day, leap: lun.isLeapMonth },
      son: lun.day % 10 === 9 || lun.day % 10 === 0,
      jeolgi: mb !== prevBranch ? (JEOLGI_BY_BRANCH[mb] ?? null) : null,
    });
    prevBranch = mb;
  }
  return days;
}

/** 내 일주(ds·db)와 그날 일진의 관계 — 달력 마킹용 */
export function matchDay(myDs: number, myDb: number, gz: DayGanzhi): DayMatch {
  const tg = tenGod(myDs, gz.s);
  const rel = branchRelation(myDb, gz.b);
  const grade: DayGrade =
    rel.k === "samhap" || rel.k === "yukhap" ? "길" :
    rel.k === "chung" || rel.k === "wonjin" || rel.k === "hae" ? "주의" : "보통";
  return { tg, rel, grade };
}

/** 하루 한 줄 조언 — 지지 관계 우선, 무난하면 십성으로 */
const REL_LINE: Record<Exclude<BranchRel["k"], "none">, string> = {
  samhap: "기운이 한데 모이는 삼합의 날이에요. 미뤄 둔 큰일을 꺼내기 좋아요.",
  yukhap: "부드럽게 맺어지는 육합의 날이에요. 만남·화해·계약에 순풍이 불어요.",
  chung: "부딪히는 충의 날이에요. 큰 결정과 이동은 한 템포 늦추면 탈이 없어요.",
  wonjin: "괜히 서운해지기 쉬운 원진의 날이에요. 말은 아끼고 마음은 넉넉하게요.",
  hae: "어긋나기 쉬운 해의 날이에요. 약속 시간과 서류는 한 번 더 확인해요.",
  same: "내 일주와 같은 기운이 도는 날이에요. 눈치 보지 말고 나답게 가면 돼요.",
};
const TG_LINE: Record<TenGodName, string> = {
  비견: "내 편이 늘어나는 날이에요. 함께 도모하는 일에 힘이 붙어요.",
  겁재: "지갑이 헐거워지기 쉬운 날이에요. 큰 지출과 보증은 미뤄요.",
  식신: "먹고, 만들고, 즐기기 좋은 날이에요. 몸을 움직이면 복이 돼요.",
  상관: "말이 앞서기 쉬운 날이에요. 재치는 살리되 윗사람 앞에선 반 박자 쉬어요.",
  편재: "기회가 스치듯 지나가는 날이에요. 눈은 크게, 베팅은 작게요.",
  정재: "차곡차곡 쌓기 좋은 날이에요. 저축·정리·꼼꼼한 일이 잘 풀려요.",
  편관: "압박이 느껴질 수 있는 날이에요. 정면 돌파보다 체력 관리가 먼저예요.",
  정관: "격식과 서류의 날이에요. 계약·면접·공적인 자리에서 점수를 얻어요.",
  편인: "혼자 궁리하기 좋은 날이에요. 영감은 받되 결론은 내일 내려요.",
  정인: "배움과 문서에 복이 붙는 날이에요. 공부·결재·어른의 조언이 이로워요.",
};

export function dayAdvice(match: DayMatch): string {
  return match.rel.k === "none" ? TG_LINE[match.tg] : REL_LINE[match.rel.k];
}

/** 실생활 태그 — "이 날 뭐 하면 좋은가"를 생활 언어로 */
export interface DayTag { t: string; good: boolean; }

export function dayTags(day: CalDay, match: DayMatch | null): DayTag[] {
  const tags: DayTag[] = [];
  if (day.son) tags.push({ t: "이사·입주·못질 좋은 날", good: true });
  if (day.jeolgi) tags.push({ t: `절기 ${day.jeolgi} — 계절이 바뀌는 날`, good: true });
  if (!match) return tags;
  switch (match.rel.k) {
    case "samhap": tags.push({ t: "시작·계약·부탁 잘 통해요", good: true }); break;
    case "yukhap": tags.push({ t: "만남·화해·고백에 순풍", good: true }); break;
    case "chung": tags.push({ t: "큰 결정·이동은 내일로", good: false }); break;
    case "wonjin": tags.push({ t: "예민한 대화 피하기", good: false }); break;
    case "hae": tags.push({ t: "약속·서류 한 번 더 확인", good: false }); break;
    case "same": tags.push({ t: "내 페이스대로 가는 날", good: true }); break;
    case "none":
      switch (match.tg) {
        case "정관": case "정인": tags.push({ t: "서류·결재·공부 잘 풀려요", good: true }); break;
        case "식신": tags.push({ t: "모임·데이트·맛집 좋아요", good: true }); break;
        case "정재": tags.push({ t: "저축·정리·알뜰한 하루", good: true }); break;
        case "겁재": case "편재": tags.push({ t: "지갑 단속 — 충동구매 주의", good: false }); break;
        case "상관": tags.push({ t: "말조심 — 윗사람 앞 반 박자", good: false }); break;
        case "편관": tags.push({ t: "무리 금지 — 컨디션 관리", good: false }); break;
        default: break; // 비견·편인 등은 태그 없이 조언 문장만
      }
      break;
  }
  return tags;
}
