/** 통변(通辯) 엔진 — ssaju 원국 위에 "요소를 엮는" 상관분석 계층.
 *
 *  왜 필요한가: ssaju는 만세력·원국·지장간·십신(정기)·대운/세운는 정확하지만,
 *  ① 오행 세력을 지장간 없이 8글자로만 세고 ② 신강신약이 축소 억부(식상·재성 설기 무시)이며
 *  ③ 용신이 조후를 배제한 정적 룩업이라 한난 편중 사주에서 오답이 난다.
 *  이 모듈은 지장간 가중 세력·정밀 억부·조후를 앱에서 직접 계산하고, 그 결과를
 *  신강신약→용신→십신구조→통근→합충→대운으로 "엮어" 통변의 근거를 만든다.
 *
 *  순수 함수(React·DOM 무관). 오행 인덱스: 0목 1화 2토 3금 4수. */
import { STEMS, BRANCHES } from "./constants";
import { branchIdxOf, isChung, isSamhap } from "./relations";
import type { Person } from "./analyze";

/* ── 지장간(支藏干) 표: branchIdx → [{천간 stemIdx, 가중 w}] (정기 1.0 · 중기 0.4 · 여기 0.25~0.3) ──
   정기가 배열 마지막. STEMS: 0갑1을2병3정4무5기6경7신8임9계 */
export const HIDDEN: { s: number; w: number }[][] = [
  [{ s: 8, w: 0.3 }, { s: 9, w: 1.0 }],                 // 子 壬癸
  [{ s: 9, w: 0.25 }, { s: 7, w: 0.4 }, { s: 5, w: 1.0 }], // 丑 癸辛己
  [{ s: 4, w: 0.25 }, { s: 2, w: 0.4 }, { s: 0, w: 1.0 }], // 寅 戊丙甲
  [{ s: 0, w: 0.3 }, { s: 1, w: 1.0 }],                 // 卯 甲乙
  [{ s: 1, w: 0.25 }, { s: 9, w: 0.4 }, { s: 4, w: 1.0 }], // 辰 乙癸戊
  [{ s: 4, w: 0.25 }, { s: 6, w: 0.4 }, { s: 2, w: 1.0 }], // 巳 戊庚丙
  [{ s: 2, w: 0.3 }, { s: 5, w: 0.4 }, { s: 3, w: 1.0 }], // 午 丙己丁
  [{ s: 3, w: 0.25 }, { s: 1, w: 0.4 }, { s: 5, w: 1.0 }], // 未 丁乙己
  [{ s: 4, w: 0.25 }, { s: 8, w: 0.4 }, { s: 6, w: 1.0 }], // 申 戊壬庚
  [{ s: 6, w: 0.3 }, { s: 7, w: 1.0 }],                 // 酉 庚辛
  [{ s: 7, w: 0.25 }, { s: 3, w: 0.4 }, { s: 4, w: 1.0 }], // 戌 辛丁戊
  [{ s: 4, w: 0.25 }, { s: 0, w: 0.4 }, { s: 8, w: 1.0 }], // 亥 戊甲壬
];

/* 오행 상생상극 헬퍼 (e: 0목1화2토3금4수) */
export const ELEM_KO = ["목", "화", "토", "금", "수"];
export const generates = (e: number) => (e + 1) % 5;      // e가 생하는 오행 (목→화)
export const generatedBy = (e: number) => (e + 4) % 5;    // e를 생하는 오행 = 인성
export const controls = (e: number) => (e + 2) % 5;       // e가 극하는 오행 (목→토) = 재성
export const controlledBy = (e: number) => (e + 3) % 5;   // e를 극하는 오행 = 관성

/* 십신 이름: 일간 오행/음양 기준 상대 천간(stemIdx)의 십신 */
export function tenGodOf(dayStemIdx: number, otherStemIdx: number): string {
  const a = STEMS[dayStemIdx], b = STEMS[otherStemIdx];
  const same = a.yang === b.yang;
  if (a.e === b.e) return same ? "비견" : "겁재";
  if (generates(a.e) === b.e) return same ? "식신" : "상관";
  if (controls(a.e) === b.e) return same ? "편재" : "정재";
  if (controlledBy(a.e) === b.e) return same ? "편관" : "정관";
  return same ? "편인" : "정인";
}

/* 형(刑)·파(破) 표 — constants엔 합/충/원진/해만 있어 여기서 보완 */
const HYUNG: Record<number, number[]> = {
  2: [5, 8], 5: [8, 2], 8: [2, 5],   // 寅巳申 삼형
  1: [10, 7], 10: [7, 1], 7: [1, 10], // 丑戌未 삼형
  0: [3], 3: [0],                     // 子卯 상형
  4: [4], 6: [6], 9: [9], 11: [11],   // 진오유해 자형
};
const PA: Record<number, number> = { 0: 9, 9: 0, 1: 4, 4: 1, 2: 11, 11: 2, 3: 6, 6: 3, 5: 8, 8: 5, 7: 10, 10: 7 };
const isHyung = (a: number, b: number) => (HYUNG[a] ?? []).includes(b) || (a === b && [4, 6, 9, 11].includes(a));
const isPa = (a: number, b: number) => PA[a] === b;

export interface StrengthInfo {
  cls: "strong" | "weak" | "neutral";
  score: number;          // 0~100 (게이지용)
  deukryeong: boolean;    // 득령(월령이 나를 돕나)
  deukji: boolean;        // 득지(일지에 뿌리)
  deukse: boolean;        // 득세(아군 세력 > 적군)
  myPower: number;        // 비겁+인성 세력
  oppPower: number;       // 식상+재성+관성 세력
  monthStage: string;     // 월지 12운성(봉법)
}
export interface Roles { bigyeop: number; inseong: number; siksang: number; jaeseong: number; gwanseong: number; }
export interface Climate {
  season: "봄" | "여름" | "가을" | "겨울" | "환절기";
  warmth: "한(寒)" | "난(暖)" | "평(平)";
  needElem: number | null;  // 조후상 급히 필요한 오행
  critical: boolean;        // 한난 편중이 심해 조후가 최우선인가
}
export interface WongukPair { a: string; b: string; kind: string; hj: string; }
export interface DaeunInteraction {
  ganzhi: string; startAge: number; endAge: number;
  stemElem: number; branchElem: number;
  favor: "길" | "흉" | "평";   // 대운이 용신을 싣는가 기신을 싣는가
  clash: string | null;        // 대운 지지와 원국의 합/충
  note: string;
}

export interface Tongbyeon {
  power: number[];              // 지장간 가중 오행 세력 [목화토금수]
  powerPct: number[];          // 백분율(정수)
  roles: Roles;                 // 십신 5역할 세력
  dominantElem: number;         // 최강 오행
  weakestElem: number;          // 최약 오행
  strength: StrengthInfo;
  climate: Climate;
  yongElem: number; heeElem: number; giElem: number; hanElem: number;
  yongMethod: "억부(抑扶)" | "조후(調候)" | "통관(通關)" | "전왕(專旺)";
  yongReason: string;           // 왜 이 용신인가(통변 근거 한 줄)
  dominantTenGod: string;
  tenGodCounts: Record<string, number>;
  combos: { key: string; label: string; desc: string }[];  // 십신 구조(관인상생 등)
  dayRooted: boolean;           // 일간이 지지에 통근했나
  rootNote: string;
  wonguk: WongukPair[];         // 원국 내부 합충형파
  daeun: DaeunInteraction | null;
  yukchin: Record<string, string>;  // 십신→육친 라벨(성별 반영)
}

/* 지장간 가중 오행 세력 (시주 모름이면 시주 제외) */
function elementPower(A: Person): number[] {
  const p = [0, 0, 0, 0, 0];
  const pd = A.r.pillarDetails;
  const keys: ("year" | "month" | "day" | "hour")[] = ["year", "month", "day", "hour"];
  for (const k of keys) {
    if (k === "hour" && !A.hourKnown) continue;
    const si = pd[k].stemIdx, bi = pd[k].branchIdx;
    if (si >= 0) p[STEMS[si].e] += 1.0;                 // 천간
    for (const h of HIDDEN[bi] ?? []) p[STEMS[h.s].e] += h.w; // 지지 지장간
  }
  return p;
}

function analyzeClimate(monthBranch: number, power: number[]): Climate {
  // 월지 → 계절
  const season: Climate["season"] =
    [2, 3, 4].includes(monthBranch) ? "봄" :
    [5, 6, 7].includes(monthBranch) ? "여름" :
    [8, 9, 10].includes(monthBranch) ? "가을" :
    [11, 0, 1].includes(monthBranch) ? "겨울" : "환절기";
  const winter = [11, 0, 1].includes(monthBranch), summer = [5, 6, 7].includes(monthBranch);
  const fire = power[1], water = power[4];
  let warmth: Climate["warmth"] = "평(平)", needElem: number | null = null, critical = false;
  if (winter) {
    warmth = "한(寒)";
    if (fire < 1.0) { needElem = 1; critical = fire < 0.4; }  // 겨울엔 火로 데움
  } else if (summer) {
    warmth = "난(暖)";
    if (water < 1.0) { needElem = 4; critical = water < 0.4; } // 여름엔 水로 식힘
  } else if ([8, 9, 10].includes(monthBranch) && fire < 0.6) {
    needElem = 1; // 가을 金旺엔 火로 제련
  }
  return { season, warmth, needElem, critical };
}

/** 통변 상관분석 — Person 하나로 모든 근거를 뽑는다. */
export function analyzeTongbyeon(A: Person): Tongbyeon {
  const ds = A.ds, dayElem = STEMS[ds].e;
  const pd = A.r.pillarDetails;
  const monthBranch = pd.month.branchIdx;
  const power = elementPower(A);
  const total = power.reduce((a, b) => a + b, 0) || 1;
  const powerPct = power.map(v => Math.round((v / total) * 100));

  const myElem = dayElem, inElem = generatedBy(dayElem), foodElem = generates(dayElem);
  const wealthElem = controls(dayElem), offElem = controlledBy(dayElem);
  const roles: Roles = {
    bigyeop: power[myElem], inseong: power[inElem], siksang: power[foodElem],
    jaeseong: power[wealthElem], gwanseong: power[offElem],
  };

  /* ── 신강신약: 득령·득지·득세 + 월지 12운성 ── */
  const monthMainElem = STEMS[HIDDEN[monthBranch][HIDDEN[monthBranch].length - 1].s].e; // 월지 정기 오행
  const deukryeong = monthMainElem === myElem || monthMainElem === inElem;
  const dayHidden = HIDDEN[pd.day.branchIdx].map(h => STEMS[h.s].e);
  const deukji = dayHidden.includes(myElem) || dayHidden.includes(inElem);
  const myPower = roles.bigyeop + roles.inseong;
  const oppPower = roles.siksang + roles.jaeseong + roles.gwanseong;
  const deukse = myPower >= oppPower;
  const monthStage = A.r.stages12?.bong?.month ?? "";
  const stageBonus = ["건록", "제왕", "장생", "관대"].includes(monthStage) ? 1
    : ["사", "묘", "절", "병"].includes(monthStage) ? -1 : 0;
  const pillars = deukryeong ? 1 : 0;
  const supports = pillars * 2 + (deukji ? 1 : 0) + (deukse ? 1 : 0) + stageBonus;
  const ratio = myPower / (myPower + oppPower || 1);
  let score = Math.round(38 + (ratio - 0.5) * 90 + (deukryeong ? 12 : 0) + (deukji ? 6 : 0) + stageBonus * 5);
  score = Math.max(4, Math.min(96, score));
  const cls: StrengthInfo["cls"] = supports >= 3 || score >= 62 ? "strong" : supports <= 0 || score <= 40 ? "weak" : "neutral";
  const strength: StrengthInfo = { cls, score, deukryeong, deukji, deukse, myPower, oppPower, monthStage };

  const climate = analyzeClimate(monthBranch, power);

  /* ── 용신: 억부 우선, 한난 편중이면 조후 우선 ── */
  let yongElem: number, yongMethod: Tongbyeon["yongMethod"] = "억부(抑扶)", yongReason = "";
  const strong = cls === "strong", weak = cls === "weak";
  // 전왕(한 기운 압도) 판별
  const dominantElem = power.indexOf(Math.max(...power));
  const jongwang = power[dominantElem] / total > 0.6 && (dominantElem === myElem || dominantElem === inElem) && !deukse === false && score >= 80;

  if (jongwang) {
    yongElem = dominantElem; yongMethod = "전왕(專旺)";
    yongReason = `한 기운(${ELEM_KO[dominantElem]})이 원국을 압도해, 거스르기보다 그 세력을 따르는 전왕의 구조예요`;
  } else if (strong) {
    if (roles.inseong >= roles.bigyeop) {
      yongElem = wealthElem; yongReason = `인성이 두터워 강해진 사주라, 그 인성을 덜어 주는 재성(${ELEM_KO[wealthElem]})이 용신이에요`;
    } else if (roles.gwanseong >= 0.6) {
      yongElem = offElem; yongReason = `비겁이 왕성해 강해진 사주라, 그 힘을 눌러 주는 관성(${ELEM_KO[offElem]})이 용신이에요`;
    } else {
      yongElem = foodElem; yongReason = `기운이 넘치는데 눌러 줄 관성이 약해, 힘을 흘려보내는 식상(${ELEM_KO[foodElem]})이 용신이에요`;
    }
  } else if (weak) {
    if (roles.gwanseong >= roles.jaeseong && roles.gwanseong >= roles.siksang && roles.gwanseong >= 0.8) {
      yongElem = inElem; yongMethod = "통관(通關)"; yongReason = `관성의 압박이 커 약해진 사주라, 관을 살로 돌려 나를 살리는 인성(${ELEM_KO[inElem]})이 용신이에요(관인상생)`;
    } else if (roles.jaeseong >= roles.inseong && roles.jaeseong >= 1.2) {
      yongElem = myElem; yongReason = `재성이 많아 약해진(재다신약) 사주라, 재물을 감당할 힘을 주는 비겁(${ELEM_KO[myElem]})이 용신이에요`;
    } else {
      yongElem = inElem; yongReason = `일간을 돕는 기운이 부족한 사주라, 나를 낳아 주는 인성(${ELEM_KO[inElem]})이 용신이에요`;
    }
  } else {
    // 중화 — 조후 need 있으면 그걸, 없으면 가장 약한 생조 기운
    yongElem = climate.needElem ?? inElem;
    yongReason = climate.needElem != null
      ? `기운은 균형에 가까워, 계절이 필요로 하는 ${ELEM_KO[climate.needElem]}(조후)을 용신으로 삼아요`
      : `기운이 두루 균형 잡힌 중화라, 흐름을 부드럽게 잇는 ${ELEM_KO[yongElem]}이 용신이에요`;
  }

  // 조후 최우선 override (한난 극단 + 해당 오행 결핍)
  if (climate.critical && climate.needElem != null && yongElem !== climate.needElem && yongMethod !== "전왕(專旺)") {
    yongElem = climate.needElem; yongMethod = "조후(調候)";
    yongReason = `${climate.season}에 태어나 ${climate.warmth} 기운이 극단이라, 억부보다 계절을 데우고 식히는 조후 ${ELEM_KO[climate.needElem]}이 급선무예요`;
  }

  const heeElem = generatedBy(yongElem);  // 용신을 생하는 오행
  const giElem = controlledBy(yongElem);  // 용신을 극하는 오행
  const hanElem = controls(yongElem);     // 용신이 극하는(한신)

  /* ── 십신 집계(정기 기준, ssaju tenGods) + 조합 구조 ── */
  const tenGodCounts: Record<string, number> = {};
  const keys: ("year" | "month" | "day" | "hour")[] = ["year", "month", "day", "hour"];
  for (const k of keys) {
    if (k === "hour" && !A.hourKnown) continue;
    const g = A.r.tenGods[k];
    for (const v of [g.stem, g.branch]) {
      if (!v || v === "(일간)") continue;
      tenGodCounts[v] = (tenGodCounts[v] || 0) + 1;
    }
  }
  const dominantTenGod = Object.entries(tenGodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "비견";

  const has = (r: number, t = 0.8) => r >= t;
  const combos: Tongbyeon["combos"] = [];
  if (has(roles.gwanseong) && has(roles.inseong)) combos.push({ key: "관인상생", label: "관인상생(官印相生)", desc: "책임(관)이 배움·인정(인)으로 이어지는 구조 — 조직·자격의 세계에서 신뢰를 쌓아 오르는 힘이에요" });
  if (has(roles.siksang) && has(roles.jaeseong)) combos.push({ key: "식상생재", label: "식상생재(食傷生財)", desc: "재능(식상)이 돈(재)으로 바뀌는 구조 — 만들고 파는 일, 내 콘텐츠로 버는 재능이 있어요" });
  if (has(roles.jaeseong) && has(roles.gwanseong)) combos.push({ key: "재생관", label: "재생관(財生官)", desc: "재물이 지위를 낳는 구조 — 실력과 재력으로 자리와 명예를 얻는 흐름이에요" });
  if (weak && has(roles.jaeseong, 1.2)) combos.push({ key: "재다신약", label: "재다신약(財多身弱)", desc: "돈 욕심·기회는 많은데 그걸 담을 그릇(일간)이 아직 여문 구조라, 벌이기보다 내 힘을 먼저 키우는 게 순서예요" });
  if (has(roles.siksang, 1.0) && has(roles.gwanseong, 1.0) && (tenGodCounts["상관"] ?? 0) > 0 && (tenGodCounts["정관"] ?? 0) > 0)
    combos.push({ key: "상관견관", label: "상관견관(傷官見官)", desc: "표현·반항의 별(상관)과 규범의 별(정관)이 부딪히는 구조 — 조직 안에서 '옳은 말'이 마찰을 부르기 쉬우니 말의 온도를 조절하는 게 평생의 기술이에요" });
  if (strong && has(roles.bigyeop, 1.6) && roles.gwanseong < 0.6) combos.push({ key: "비겁태왕", label: "비겁태왕(比劫太旺)", desc: "자기 기운이 매우 강한 구조 — 남 밑보다 내 판을 가질 때, 그리고 벌이보다 지키기에 집중할 때 커지는 사주예요" });

  /* ── 통근(뿌리) ── */
  let dayRooted = false;
  for (const k of keys) {
    if (k === "hour" && !A.hourKnown) continue;
    for (const h of HIDDEN[pd[k].branchIdx] ?? []) if (STEMS[h.s].e === dayElem) dayRooted = true;
  }
  const rootNote = dayRooted
    ? "일간이 지지에 뿌리를 내려(통근) 심지가 단단해요 — 기운이 흔들려도 중심을 지키는 힘이 있어요"
    : "일간이 지지에 뿌리가 약해(무근에 가까움), 환경과 사람의 영향을 크게 받는 섬세한 구조예요";

  /* ── 원국 내부 합충형파 ── */
  const wonguk: WongukPair[] = [];
  const pk: [string, number][] = [["년지", pd.year.branchIdx], ["월지", pd.month.branchIdx], ["일지", pd.day.branchIdx]];
  if (A.hourKnown) pk.push(["시지", pd.hour.branchIdx]);
  const label: Record<string, string> = { chung: "충(沖)", yukhap: "육합(六合)", samhap: "삼합(三合)", hyung: "형(刑)", pa: "파(破)" };
  const hjMap: Record<string, string> = { chung: "沖", yukhap: "合", samhap: "合", hyung: "刑", pa: "破" };
  for (let i = 0; i < pk.length; i++) for (let j = i + 1; j < pk.length; j++) {
    const bi = pk[i][1], bj = pk[j][1];
    let kind: string | null = null;
    if (isChung(bi, bj)) kind = "chung";
    else if ((({ 0: 1, 1: 0, 2: 11, 3: 10, 4: 9, 5: 8, 6: 7, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2 } as Record<number, number>)[bi]) === bj) kind = "yukhap";
    else if (isSamhap(bi, bj)) kind = "samhap";
    else if (isHyung(bi, bj)) kind = "hyung";
    else if (isPa(bi, bj)) kind = "pa";
    if (kind) wonguk.push({ a: pk[i][0], b: pk[j][0], kind: label[kind], hj: hjMap[kind] });
  }

  /* ── 대운-원국 상호작용 ── */
  let daeun: DaeunInteraction | null = null;
  const du = A.r.daeun?.current;
  if (du) {
    const dus = branchIdxOf(du.branch);
    const stemElem = STEMS[Math.max(0, du.stemIdx)]?.e ?? -1;
    const branchElem = STEMS[HIDDEN[dus]?.[HIDDEN[dus].length - 1]?.s ?? 0].e;
    const favorsYong = stemElem === yongElem || stemElem === heeElem || branchElem === yongElem || branchElem === heeElem;
    const favorsGi = stemElem === giElem || branchElem === giElem;
    const favor: DaeunInteraction["favor"] = favorsYong ? "길" : favorsGi ? "흉" : "평";
    let clash: string | null = null;
    for (const [pl, bi] of pk) {
      if (isChung(dus, bi)) { clash = `${pl}를 충(沖)`; break; }
      if (isSamhap(dus, bi)) { clash = `${pl}와 삼합(合)`; break; }
    }
    const note = favor === "길"
      ? `지금 대운이 용신·희신의 기운을 실어 와, 10년의 큰 바람이 당신 편으로 부는 시기예요`
      : favor === "흉"
        ? `지금 대운은 기신의 기운이 얹혀, 벌이기보다 지키고 다지는 데 무게를 두어야 할 10년이에요`
        : `지금 대운은 크게 돕지도 해치지도 않는 흐름이라, 성패가 대운보다 당신의 선택에 달린 시기예요`;
    daeun = { ganzhi: du.ganzhi, startAge: du.startAge, endAge: du.endAge, stemElem, branchElem, favor, clash, note };
  }

  /* ── 육친(십신→관계) ── */
  const F = A.sex === "F";
  const yukchin: Record<string, string> = {
    비견: "형제·친구·동료", 겁재: "형제·경쟁자",
    식신: F ? "자녀·표현" : "장모·부하", 상관: F ? "자녀·조모" : "조모·부하",
    편재: F ? "아버지·시모" : "아버지·애인", 정재: F ? "아버지·시모" : "아내·재물",
    편관: F ? "애인·남편(편)" : "자녀·상사", 정관: F ? "남편·직장" : "자녀·직장",
    편인: "계모·이모·문서", 정인: "어머니·스승·문서",
  };

  return {
    power, powerPct, roles, dominantElem, weakestElem: power.indexOf(Math.min(...power)),
    strength, climate, yongElem, heeElem, giElem, hanElem, yongMethod, yongReason,
    dominantTenGod, tenGodCounts, combos, dayRooted, rootNote, wonguk, daeun, yukchin,
  };
}
