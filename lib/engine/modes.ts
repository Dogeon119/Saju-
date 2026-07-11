// @ts-nocheck
/** 4모드 리포트 렌더러 — 청월당 실제 목차 기반 (2026-07-12 전면 개편)
 *  모드: saju(정통사주 13장) · love(연애비책 7장) · gunghap(사주궁합 8장) · yearly(올해의운세 8장)
 *  스타일 원칙: ① 결론 먼저 ② 풀이 단위 항목화 ③ 용어·근거는 하단 분리 ④ 좋은 말만 하지 않기 */
import { STEMS, BRANCHES, ELEM, EK, YUKHAP, DOHWA } from "./constants";
import { stemIdxOf, branchIdxOf, gzName, isSamhap, isChung, branchRelation, tenGod } from "./relations";
import type { Person } from "./analyze";
import {
  sec, paras, tocHTML, pillarsHTML, ohaengHTML, baseChartSec, wolunSolarMonth,
  charms, partnerElem, partnerStars, starName,
} from "./render";
import {
  DAY_LOVE, DAY_KEY, STRENGTHS, CAUTIONS, SP_KEY, LOVER_PROFILE, LUCK_TIPS, SAL_DESC,
  TG_GUNGHAP, BR_GUNGHAP, BR_KEY,
  ILGAN_CHAR, ELEM_GEN_EXCESS, ELEM_GEN_LACK, TEN_GOD_PROFILE, UNSEONG, SAL12, GILSIN_DESC,
  WEALTH_TXT, CAREER_GEUKGUK, DAEUN_TG, SEYUN_TG, SAMJAE_STAGE, SAMJAE_NONE, SAMJAE_NOTE, HEALTH_BY_ELEM,
  YEAR_TG, MONEY_TG, WORK_TG, MONTH_TG,
  REL_STATUS, REL_GAP, STATUS_ADVICE, FIRST_IMPRESSION, RECONCILE, VALUES_TG, PAST_LIFE,
  EXPRESS, TALK, SPORT_GOOD, SPORT_BAD, MONEY_STYLE, STRENGTH_TXT, YONGSIN_FRAME, MONTH_CAUTION,
} from "@/content";

export type Mode = "saju" | "love" | "gunghap" | "yearly";
export interface ReportOptions { B?: Person; relStatus?: number; relGap?: number; job?: string; }

/* ═══════════ 공용 헬퍼 ═══════════ */
const kv = rows =>
  `<div class="kvs">${rows.map(([k, v]) => `<div class="kv"><span class="kl">${k}</span><span class="kd">${v}</span></div>`).join("")}</div>`;
const note = t => `<div class="term-note">${t}</div>`;
const grp = t => `<h3 class="grp">${t}</h3>`;
const fl = (n, title, body) =>
  `<div class="fl"><p class="fl-t">풀이 ${n}. ${title}</p><div class="fl-b">${body.startsWith("<") ? body : `<p>${body}</p>`}</div></div>`;
const first = (t, n = 1) => t.split(". ").slice(0, n).join(". ") + ".";

function tallyTenGods(A) {
  const t = {};
  for (const k of ["year", "month", "day", "hour"]) {
    if (k === "hour" && !A.hourKnown) continue;
    const g = A.r.tenGods[k];
    for (const v of [g.stem, g.branch]) {
      if (!v || v === "(일간)") continue;
      t[v] = (t[v] || 0) + 1;
    }
  }
  return Object.entries(t).sort((a, b) => b[1] - a[1]);
}
const dominantTG = A => tallyTenGods(A)[0]?.[0] ?? "비견";
function yongTriple(A) {
  const yi = stemIdxOf(A.r.advanced.yongsin[0]);
  const yongE = yi >= 0 ? STEMS[yi].e : A.elems.indexOf(Math.max(...A.elems));
  return { yongE, heeE: (yongE + 4) % 5, giE: (yongE + 3) % 5 };
}
function moneyStyleIdx(A) {
  const t = Object.fromEntries(tallyTenGods(A));
  const j = t["정재"] || 0, p = t["편재"] || 0;
  if (j === 0 && p === 0) return 2;
  return p > j ? 1 : 0;
}
const SAMJAE_MAP = [
  [[8, 0, 4], [2, 3, 4]], [[2, 6, 10], [8, 9, 10]], [[5, 9, 1], [11, 0, 1]], [[11, 3, 7], [5, 6, 7]],
];
function samjaeBranches(yearBranch) {
  for (const [g, sj] of SAMJAE_MAP) if (g.includes(yearBranch)) return sj;
  return null;
}
const seyunRows = (A, n = 5) => {
  const y0 = A.r.currentYear;
  return A.r.seyun.filter(s => s.year >= y0 && s.year < y0 + n);
};
const monthsWhere = (A, pred) =>
  A.r.wolun.filter(w => pred(branchIdxOf(w.branch), w.branchTenGod, w)).map(w => wolunSolarMonth(w.month));
const COLOR = ["초록·연두", "빨강·주황", "노랑·베이지", "흰색·은색", "검정·네이비"];
const DIR = ["동쪽", "남쪽", "중심가", "서쪽", "북쪽"];
const FOODS = ["신맛과 녹색 채소", "쓴맛과 붉은 과일·차", "단맛과 곡물·뿌리채소", "매운맛과 흰 음식(무·배)", "짠맛과 검은 음식(콩·해조류)"];
const ELEM_PERSON = [
  "곧고 성장 지향적인 목(木)형 — 마른 체형에 계획 이야기를 즐기는 사람",
  "활달하고 표현이 큰 화(火)형 — 리액션과 웃음이 큰 사람",
  "묵직하고 신용 있는 토(土)형 — 말수 적고 꾸준한 사람",
  "단정하고 원칙적인 금(金)형 — 깔끔하고 기준이 분명한 사람",
  "조용하고 지적인 수(水)형 — 속 깊고 통찰 있는 사람",
];
const SEASON_DATE = ["봄 — 벚꽃길·수목원·피크닉", "여름 — 바다·축제·야시장", "간절기 — 한옥거리·미술관·맛집 골목", "가을 — 단풍 드라이브·전시·재즈바", "겨울 — 온천·눈 구경·심야 카페"];
function gunghapScore(A, B) {
  const tg = tenGod(A.ds, B.ds);
  const br = branchRelation(A.db, B.db);
  const zr = branchRelation(A.r.pillarDetails.year.branchIdx, B.r.pillarDetails.year.branchIdx);
  let s = 50;
  s += { 비견: 6, 겁재: 3, 식신: 11, 상관: 7, 편재: 9, 정재: 14, 편관: 7, 정관: 14, 편인: 9, 정인: 12 }[tg];
  s += { yukhap: 16, samhap: 13, same: 7, none: 4, hae: -5, wonjin: -9, chung: -10 }[br.k];
  s += { yukhap: 8, samhap: 6, same: 4, none: 2, hae: -3, wonjin: -5, chung: -5 }[zr.k];
  const lackA = A.elems.indexOf(Math.min(...A.elems)), lackB = B.elems.indexOf(Math.min(...B.elems));
  if (B.elems[lackA] >= 2) s += 5;
  if (A.elems[lackB] >= 2) s += 5;
  return { score: Math.max(8, Math.min(99, s)), tg, br, zr };
}
function marryYearsFor(P, n = 6) {
  const primary = P.sex === "F" ? "정관" : "정재", secondary = P.sex === "F" ? "편관" : "편재";
  return seyunRows(P, n).map(s => {
    const gb = branchIdxOf(s.branch);
    let sc = 0;
    if (s.tenGodStem === primary || s.tenGodBranch === primary) sc += 3;
    else if (s.tenGodStem === secondary || s.tenGodBranch === secondary) sc += 1.6;
    if (YUKHAP[gb] === P.db) sc += 2.4;
    if (isSamhap(gb, P.db)) sc += 1.5;
    return { ...s, sc };
  }).filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc);
}

/* ═══════════ 모드 1 : 정통사주 (13장) ═══════════ */
export function renderSaju(A) {
  const r = A.r, ds = A.ds, db = A.db;
  const e = A.elems, maxE = e.indexOf(Math.max(...e)), minE = e.indexOf(Math.min(...e));
  let html = "";

  html += sec("第一章", "나의 사주팔자", `${A.y}년 ${A.m}월 ${A.d}일생 · ${BRANCHES[r.pillarDetails.year.branchIdx].animal}띠 · ${r.currentAge}세`,
    baseChartSec(A));

  html += sec("第二章", "일주와 오행 분석", `일주 ${gzName(ds, db)}`,
    paras(ILGAN_CHAR[ds]) +
    `<p><strong>오행의 저울</strong> — ${ELEM[maxE]}이 가장 강하고 ${ELEM[minE]}이 가장 약합니다.</p>` +
    paras(ELEM_GEN_EXCESS[maxE]) + paras(ELEM_GEN_LACK[minE]),
    `${STEMS[ds].kr}(${STEMS[ds].hj}) 일간 — ${ILGAN_CHAR[ds].split("—")[1]?.split(".")[0]?.trim() ?? "타고난 기질"}`);

  const tally = tallyTenGods(A);
  const top = tally[0], second = tally[1];
  html += sec("第三章", "십성 분석", "원국에 드러난 재능의 지도",
    `<div class="badges">${tally.map(([n, c]) => `<span class="badge blue">${n} ×${c}</span>`).join("")}</div>` +
    (top ? paras(TEN_GOD_PROFILE[top[0]]) : "<p>원국의 십성이 고르게 분포합니다 — 다재다능형입니다.</p>") +
    (second ? paras(TEN_GOD_PROFILE[second[0]]) : "") +
    note("십성(十星)이란? 일간(나)을 기준으로 다른 글자들이 맺는 10가지 관계입니다. 많이 나타난 십성일수록 인생에서 자주 쓰게 되는 재능이자 과제입니다."),
    top ? `가장 강한 별: ${top[0]}` : "고른 분포 — 다재다능형");

  const bong = r.stages12.bong;
  html += sec("第四章", "십이운성 분석", "내 기운의 계절",
    kv([["일주(나)", bong.day], ["월주(사회)", bong.month], ["년주(초년)", bong.year], ["시주(말년)", A.hourKnown ? bong.hour : "시간 모름"]]) +
    paras(UNSEONG[bong.day] ?? "") +
    note("십이운성이란? 기운의 일생(탄생→왕성→갈무리)을 12단계로 나눈 것입니다. 일주의 운성이 당신의 기본 에너지 리듬입니다."),
    `당신의 기운은 지금 「${bong.day}」의 계절`);

  const salSet = new Set();
  for (const k of ["year", "month", "day", "hour"]) {
    if (k === "hour" && !A.hourKnown) continue;
    if (r.sals[k].twelveSal) salSet.add(r.sals[k].twelveSal);
    (r.sals[k].specialSals || []).forEach(s => salSet.add(s));
  }
  const sals = [...salSet].filter(s => SAL12[s] || SAL_DESC[s]).slice(0, 5);
  html += sec("第五章", "신살 분석", "살(殺)은 경고이자 재능입니다",
    `<div class="badges">${sals.map(s => `<span class="badge">${s}</span>`).join("")}</div>` +
    sals.map(s => paras(SAL12[s] ?? SAL_DESC[s])).join("") +
    note("신살(神殺)이란? 사주의 특수 기호로, 나쁜 뜻의 살(殺)도 현대 명리에서는 '주의하면 재능이 되는 힘'으로 읽습니다."),
    sals.length ? `핵심 신살: ${sals.slice(0, 3).join(" · ")}` : "드러난 신살이 적은 담백한 원국");

  const gilsin = (r.advanced.sinsal.gilsin || []).filter(g => GILSIN_DESC[g]);
  html += sec("第六章", "귀인 분석", "나를 돕는 하늘의 손",
    gilsin.length
      ? `<div class="badges">${gilsin.map(g => `<span class="badge gold">${g}</span>`).join("")}</div>` + gilsin.map(g => paras(GILSIN_DESC[g])).join("")
      : `<p>원국에 드러난 귀인성이 강하지 않습니다. 도움이 없다는 뜻이 아니라, <strong>당신의 귀인은 하늘이 아니라 당신이 쌓은 신뢰에서 나온다</strong>는 뜻입니다.</p>`,
    gilsin.length ? `귀인: ${gilsin.join(" · ")}` : "자수성가형 인복 — 신뢰가 곧 귀인");

  const moneyStars = ["정재", "편재"];
  const moneyCount = tally.filter(([n]) => moneyStars.includes(n)).reduce((a, [, c]) => a + c, 0);
  const wCat = moneyCount === 0 ? 0 : moneyCount <= 2 ? 1 : 2;
  const moneyYears = seyunRows(A).filter(s => moneyStars.includes(s.tenGodStem) || moneyStars.includes(s.tenGodBranch));
  html += sec("第七章", "재물운", `원국의 재성 ${moneyCount}개`,
    paras(WEALTH_TXT[wCat]) +
    (moneyYears.length
      ? `<p><strong>재성이 드는 해</strong></p><ul class="pts gold">${moneyYears.map(s => `<li><strong>${s.year}년 ${s.ganzhi}</strong> — 재물의 문이 열리는 해. 협상·투자·수입원 확장은 이 해에.</li>`).join("")}</ul>`
      : `<p>향후 5년간 재성이 직접 드는 해는 없습니다 — 이 기간은 벌기보다 <strong>몸값을 올리는 구간</strong>으로 쓰는 것이 정답입니다.</p>`),
    ["돈은 때가 만든다 — 재성운의 해를 노릴 것", "꾸준함이 재산 — 적립이 체질", "버는 재능은 충분 — 승부는 지키기"][wCat]);

  const pStars = partnerStars(A);
  const pCount = tally.filter(([n]) => pStars.includes(n)).reduce((a, [, c]) => a + c, 0);
  html += sec("第八章", "연애·결혼운", `배우자별(${starName(A)}) ${pCount}개 · 배우자궁 ${BRANCHES[db].kr}(${BRANCHES[db].hj})`,
    `<p>${first(DAY_LOVE[ds], 2)}</p>` +
    `<p><strong>배우자궁</strong> — ${SP_KEY[db]}.</p>` +
    `<p>${pCount === 0 ? "배우자별이 원국에 숨어 있어, 인연은 운이 실어 오는 때에 움직입니다. 조급함이 가장 큰 적입니다."
      : pCount <= 2 ? "배우자별이 알맞게 자리해 혼인 인연이 안정적으로 예비되어 있습니다. 과제는 찾기가 아니라 알아보기입니다."
      : "배우자별이 여럿이라 인연은 많고 선택이 과제입니다. 비교를 멈추는 순간이 혼인운이 열리는 순간입니다."}</p>` +
    `<p>깊은 풀이는 <em>연애비책</em>·<em>사주궁합</em> 모드에서 다뤄 드립니다.</p>`,
    DAY_KEY[ds]);

  const gk = r.advanced.geukguk;
  html += sec("第九章", "직업운", `격국 「${gk}」`,
    paras(CAREER_GEUKGUK[gk] ?? CAREER_GEUKGUK["기타"]) +
    (top ? `<p><strong>재능의 무기</strong> — ${TEN_GOD_PROFILE[top[0]].split("—")[1] ?? ""}</p>` : "") +
    note("격국(格局)이란? 사주 전체의 구조가 어느 방향으로 짜여 있는지를 나타내는 틀입니다. 직업 적성의 큰 지도로 읽습니다."),
    (CAREER_GEUKGUK[gk] ?? CAREER_GEUKGUK["기타"]).split("—")[1]?.split(".")[0]?.trim() ?? "");

  html += sec("第十章", "건강운", "오행이 가리키는 몸의 주의보",
    paras(HEALTH_BY_ELEM[maxE]) +
    `<p><strong>부족한 ${ELEM[minE]}의 영역도 함께 챙기세요.</strong> ${HEALTH_BY_ELEM[minE].split("—")[1] ?? ""}</p>` +
    note("명리의 건강론은 진단이 아니라 체질 경향입니다. 증상이 있다면 병원이 먼저입니다."),
    `${ELEM[maxE]} 과다 · ${ELEM[minE]} 부족 — 해당 장기 관리가 개운`);

  const du = r.daeun.current;
  const duNext = r.daeun.list.find(d => d.startAge > (du?.endAge ?? 0));
  html += sec("第十一章", "대운 — 10년의 큰 물줄기", du ? `현재 ${du.ganzhi} 대운 (${du.startAge}~${du.endAge}세)` : "",
    (du ? paras(DAEUN_TG[du.stemTenGod] ?? "") +
      kv([["대운 간지", du.ganzhi], ["기간", `${du.startAge}세 ~ ${du.endAge}세`], ["천간 십성", du.stemTenGod], ["지지 십성", du.branchTenGod]]) : "<p>대운 정보를 계산할 수 없습니다.</p>") +
    (duNext ? `<p><strong>다음 대운 미리보기</strong> — ${duNext.startAge}세부터 ${duNext.ganzhi} 대운(${duNext.stemTenGod})으로 바뀝니다. ${(DAEUN_TG[duNext.stemTenGod] ?? "").split("—")[0]}의 흐름이 예약되어 있습니다.</p>` : ""),
    du ? `지금은 ${(DAEUN_TG[du.stemTenGod] ?? "").split("—")[0].trim()} 한가운데` : "");

  const rows5 = seyunRows(A);
  const sj = samjaeBranches(r.pillarDetails.year.branchIdx);
  const sjRows = rows5.map(s => ({ ...s, stage: sj ? sj.indexOf(branchIdxOf(s.branch)) : -1 }));
  const hasSj = sjRows.some(s => s.stage >= 0);
  html += sec("第十二章", "향후 5년 연운과 삼재", `${rows5[0]?.year}년 ~ ${rows5[rows5.length - 1]?.year}년`,
    `<div class="cal">${sjRows.map(s =>
      `<div class="cal-row"><span class="cm">${s.year}년 ${s.ganzhi}</span><span class="ct2">${s.tenGodStem}·${s.tenGodBranch}</span><span class="cd">${SEYUN_TG[s.tenGodStem] ?? ""}${s.stage >= 0 ? ` <em>[${["들", "눌", "날"][s.stage]}삼재]</em>` : ""}</span></div>`).join("")}</div>` +
    (hasSj ? sjRows.filter(s => s.stage >= 0).slice(0, 1).map(s => paras(SAMJAE_STAGE[s.stage])).join("") : paras(SAMJAE_NONE)) +
    note(SAMJAE_NOTE),
    hasSj ? `삼재 구간 포함 — 과속만 피하면 무탈` : `5년 내 삼재 없음 — 파도만 골라 탈 것`);

  const posTG = ["식신", "정재", "정관", "정인", "편재"];
  const bestYear = sjRows.reduce((a, b) => {
    const sc = y => (posTG.includes(y.tenGodStem) ? 2 : 0) + (posTG.includes(y.tenGodBranch) ? 2 : 0) - (y.stage >= 0 ? 1 : 0);
    return sc(b) > sc(a) ? b : a;
  }, sjRows[0]);
  const { yongE } = yongTriple(A);
  html += sec("終章", "월하노인에게 묻다 — 세 가지 문답", "가장 많이 받는 질문 셋을 당신 사주로 답합니다",
    `<div class="qa"><p class="q">Q1. 흐름은 언제 풀립니까?</p><p class="a">${bestYear ? `<strong>${bestYear.year}년 ${bestYear.ganzhi}년</strong>이 5년 중 가장 순한 해입니다. ${SEYUN_TG[bestYear.tenGodStem] ?? ""} — 큰 결정과 시작은 이 해에 실으세요.` : "5년의 흐름이 고릅니다."}</p></div>` +
    `<div class="qa"><p class="q">Q2. 무엇을 가장 조심해야 합니까?</p><p class="a">${CAUTIONS[ds][0]} — 당신 일간의 오래된 버릇입니다. 운이 나쁜 해가 아니라 이 버릇이 나오는 순간이 진짜 위기입니다.</p></div>` +
    `<div class="qa"><p class="q">Q3. 나의 개운법은 무엇입니까?</p><p class="a">당신의 용신은 <strong>${ELEM[yongE]}</strong>입니다. 색은 ${COLOR[yongE]}, 방향은 ${DIR[yongE]}이 길합니다. 중요한 약속·면접·계약은 이 방향과 색을 곁에 두세요.</p></div>`,
    `풀리는 해 ${bestYear?.year ?? "-"}년 · 조심할 것은 운보다 습관 · 용신은 ${ELEM[yongE]}`);
  return html;
}

/* ═══════════ 모드 2 : 연애비책 (7장) ═══════════ */
export function renderLoveSecret(A, relStatus = 0, relGap = 0) {
  const r = A.r, ds = A.ds, db = A.db;
  const pe = partnerElem(A), stars = partnerStars(A), sName = starName(A);
  const prof = LOVER_PROFILE[pe];
  const ch = charms(A).filter(c => SAL_DESC[c]);
  const thisYear = r.currentYear;
  const { yongE, giE } = yongTriple(A);
  let html = "";

  /* 1장 나만의 매력은? */
  html += sec("第一章", "나만의 매력은?", `일주 ${gzName(ds, db)}`,
    baseChartSec(A) +
    fl(1, "내가 타고난 매력",
      (ch.length ? `<div class="badges">${ch.map(c => `<span class="badge">${c}</span>`).join("")}</div><p>매력의 별을 타고났습니다 — ${ch.map(c => SAL_DESC[c].split("—")[0].trim()).join(", ")}. 여기에 일간의 매력이 얹힙니다: ${STRENGTHS[ds][0]}.</p>`
        : `<p>화려한 신살보다 <strong>알수록 빠져드는 유형</strong>의 매력입니다. 당신의 무기는 ${STRENGTHS[ds][0]} — 오래 겪을수록 진가가 드러나니, 노출 시간이 곧 매력 자본입니다.</p>`)) +
    fl(2, "이성이 느끼는 나의 첫인상", FIRST_IMPRESSION[ds]) +
    fl(3, "연애할 때 빛나는 장점과 보완할 점",
      `<p><strong>빛나는 장점</strong></p><ul class="pts blue">${STRENGTHS[ds].map(s => `<li>${s}</li>`).join("")}</ul>` +
      `<p><strong>보완할 점</strong></p><ul class="pts">${CAUTIONS[ds].map(s => `<li>${s}</li>`).join("")}</ul>`),
    DAY_KEY[ds]);

  /* 2장 연애운 흐름과 시기 */
  const years = [];
  for (const s of r.seyun) {
    if (s.year < thisYear || s.year > thisYear + 2) continue;
    const gb = branchIdxOf(s.branch);
    let sc = 1, why = [];
    if (stars.includes(s.tenGodStem)) { sc += 2.4; why.push(`${sName}이 하늘에 뜨는 해`); }
    if (stars.includes(s.tenGodBranch)) { sc += 2.6; why.push(`${sName}이 발밑에 흐르는 해`); }
    if (YUKHAP[gb] === db) { sc += 3; why.push("배우자궁 육합"); }
    if (isSamhap(gb, db)) { sc += 2; why.push("배우자궁 삼합"); }
    if (gb === DOHWA[db]) { sc += 2.4; why.push("도화 발동"); }
    if (isChung(gb, db)) { sc += 1.2; why.push("배우자궁 충 — 변동 속 만남"); }
    if (!why.length) why.push("잔잔한 흐름");
    years.push({ y: s.year, gz: s.ganzhi, gb, sc, why, s });
  }
  const best = years.reduce((a, b) => (b.sc > a.sc ? b : a), years[0]);
  const maxS = Math.max(...years.map(v => v.sc));
  const goodM = monthsWhere(A, (mb, tg) => YUKHAP[mb] === db || mb === DOHWA[db] || stars.includes(tg)).slice(0, 4);
  const badM = monthsWhere(A, mb => isChung(mb, db));
  const giYears = years.filter(v => STEMS[stemIdxOf(v.s.stem)]?.e === giE);
  html += sec("第二章", "연애운 흐름과 시기", "평생의 결부터 앞으로 3년까지",
    fl(1, "평생의 연애운 특징", `<p>${first(DAY_LOVE[ds], 3)}</p><p><strong>배우자궁</strong> — ${SP_KEY[db]}.</p>`) +
    fl(2, "앞으로 3년간 다가올 연애",
      `<div class="years">${years.map(v => `
        <div class="yr${v === best ? " best" : ""}"><span class="yn">${v.y}년 ${v.gz}</span><span class="bar"><i style="width:${(v.sc / maxS) * 100}%"></i></span><span class="pt">${v.sc.toFixed(1)}</span></div>
        <p class="yr-why">└ ${v.why.join(" · ")}</p>`).join("")}</div>`) +
    fl(3, "인연이 찾아오는 때는?",
      `<p>가장 큰 문은 <strong>${best.y}년 ${best.gz}년</strong>입니다.${goodM.length ? ` 달로는 <strong>${goodM.map(m => m + "월").join(" · ")}</strong>이 길합니다 — 이 달의 소개·모임·재회 연락을 흘려보내지 마세요.` : ""}</p>`) +
    fl(4, "연애하면 안 되는 시기",
      `<p>${badM.length ? `<strong>${badM.map(m => m + "월").join(" · ")}</strong>은 배우자궁이 흔들리는 충의 달 — 새 인연의 시작이나 중요한 관계 결정(고백·이별 통보)은 피하는 게 좋습니다.` : "올해는 크게 피할 달이 없습니다."}${giYears.length ? ` 그리고 ${giYears.map(v => v.y + "년").join("·")}은 기신(${ELEM[giE]})이 힘을 얻는 해라, 판단이 흐려진 채 시작하는 연애를 경계하세요.` : ""}</p>`),
    `가장 큰 문: ${best.y}년${goodM.length ? ` · 길한 달 ${goodM.slice(0, 2).map(m => m + "월").join("·")}` : ""}`);

  /* 3장 연애운 상승 방법은? */
  html += sec("第三章", "연애운 상승 방법은?", "경로 · 아이템 · 습관",
    fl(1, "나에게 잘 맞는 인연 진입 경로",
      [3, 6, 9, 0].includes(db)
        ? "당신의 배우자궁은 도화의 자리 — 사람 많은 곳에서 시선이 먼저 도착하는 유형입니다. 모임·행사·동호회처럼 여럿이 모이는 판이 최적의 진입 경로이고, 소개팅은 오히려 매력이 반감됩니다."
        : "당신의 배우자궁은 차분한 자리 — 북적이는 곳보다 신뢰의 다리를 건너오는 인연이 맞습니다. 지인 소개·스터디·업무 접점처럼 서로의 평판이 보이는 경로가 최적입니다.") +
    fl(2, "나만의 연애운 상승 아이템",
      `<p>용신이 ${ELEM[yongE]}이니 <strong>${COLOR[yongE]}</strong> 계열의 소품(옷·폰케이스·액세서리)이 당신의 부적입니다. ${first(LUCK_TIPS[pe], 2)}</p>`) +
    fl(3, "행복한 연애를 막는 무의식적 습관과 개선법",
      `<p><strong>무의식적 습관</strong> — ${CAUTIONS[ds][0]}. 연애가 반복해서 같은 지점에서 어긋난다면 십중팔구 이것입니다.</p><p><strong>개선법</strong> — 당신은 ${RECONCILE[ds]}</p>`),
    `${COLOR[yongE]} 아이템 + 습관 하나 교정 = 연애운 상승의 전부`);

  /* 4장 내 운명의 짝은? */
  html += sec("第四章", "내 운명의 짝은?", `${sName} = ${ELEM[pe]}의 사람`,
    fl(1, "운명의 짝, 신체 특징과 생김새",
      kv([
        ["체형·인상", ["곧고 늘씬한 체형, 갸름한 얼굴", "또렷한 이목구비, 혈색 좋은 얼굴", "부드러운 선, 둥글고 온화한 인상", "흰 피부, 반듯한 골격", "깊은 눈, 부드러운 얼굴선"][pe]],
        ["분위기", ["단정하고 싱그러움", "화사한 존재감", "볼수록 편안함", "차갑고 세련됨", "조용한 신비감"][pe]],
        ["스타일", ["깔끔한 초록·네이비 계열", "포인트 있는 레드·오렌지", "수수한 베이지·브라운", "미니멀한 무채색", "유연한 블랙·네이비"][pe]],
      ]) + paras(prof.look)) +
    fl(2, "만나는 장소", paras(prof.where)) +
    fl(3, "구체적으로 어떤 사람인지",
      kv([
        ["성격", ["어질고 성장 지향적", "밝고 정열적", "신중하고 믿음직", "명확하고 원칙적", "지적이고 유연"][pe]],
        ["직업군", ["교육·기획·출판·의료·스타트업", "예술·방송·마케팅·요식·공연", "부동산·금융·행정·건설", "법률·회계·IT·의료·군경", "연구·데이터·글·무역·상담"][pe]],
        ["길한 계절·방향", `${["봄", "여름", "환절기", "가을", "겨울"][pe]} · ${DIR[pe]}`],
      ]) + paras(prof.mind) +
      note(`왜 ${ELEM[pe]}인가? ${A.sex === "F" ? "여성의 배우자별은 나를 이끄는 관성(官星)" : "남성의 배우자별은 내가 아끼는 재성(財星)"} — 일간 ${STEMS[ds].kr}(${STEMS[ds].hj}) 기준으로 ${ELEM[pe]}이 그 별입니다.`)),
    `${ELEM[pe]}의 인연 — ${["단정한 성장형", "화사한 정열형", "온화한 신뢰형", "절제된 원칙형", "신비로운 지성형"][pe]}`);

  /* 5장 운명일 줄 알았는데, 아닌 사람 */
  const giProf = LOVER_PROFILE[giE];
  html += sec("第五章", "운명일 줄 알았는데, 아닌 사람", `기신(忌神) ${ELEM[giE]}의 악연`,
    fl(1, "인연인 척하는 악연의 모습",
      `<p>${first(giProf.look, 2)} 매력적으로 보이지만, 당신의 균형을 무너뜨리는 <strong>기신(${ELEM[giE]})</strong>의 기운을 강하게 두른 사람입니다.</p><p>주로 ${first(giProf.where, 1)}</p>`) +
    fl(2, "어떤 사람을 조심해야 하는지",
      `<p>${YONGSIN_FRAME.gi}</p><p>구체적으로 — ${ELEM_PERSON[giE]} 중에서, 만나고 오면 이상하게 <strong>지치고 자신이 없어지는 사람</strong>. 그것이 악연의 가장 확실한 신호입니다.</p>`) +
    fl(3, "착각하게 되는 상황",
      `<p>도화가 발동하는 ${monthsWhere(A, mb => mb === DOHWA[db]).map(m => m + "월").join("·") || "시기"}와 외로움이 깊어진 밤 — 이때의 설렘은 인연 감별력이 가장 낮은 상태에서 옵니다. 이 시기의 "운명 같다"는 느낌은 하루 재우고 다시 보세요.</p>`) +
    fl(4, "맞지 않는 사람을 빨리 알아보는 법",
      `<ul class="pts">
        <li>만난 뒤의 내 상태를 보세요 — 충전되면 인연, 방전되면 악연입니다.</li>
        <li>약속의 무게를 보세요 — 말이 크고 실행이 작은 사람은 ${ELEM[giE]} 기신의 전형입니다.</li>
        <li>내 사람들에게 소개할 수 있는지 스스로에게 물어보세요 — 망설여진다면 몸이 먼저 알고 있는 것입니다.</li>
      </ul>`),
    `조심할 상대: ${ELEM[giE]} 기운의 사람 — 만나면 방전되는 관계가 신호`);

  /* 6장 (교체) 지금 나의 상태 맞춤 처방 */
  html += sec("第六章", "지금 나의 연애 상태 처방", `${REL_STATUS[relStatus]}${relStatus > 0 ? ` · ${REL_GAP[relGap]}` : ""}`,
    paras(STATUS_ADVICE[relStatus]) +
    (relStatus > 0 ? `<p><strong>기간의 의미</strong> — ${REL_GAP[relGap]}이라는 시간은 ${["아직 관성이 생기기 전이라 방향을 바꾸기 가장 쉬운 시기", "패턴이 자리 잡는 시기 — 지금의 습관이 관계의 기본값이 됩니다", "안정과 권태가 교차하는 시기 — 새로움을 의식적으로 공급해야 합니다", "생활이 된 시기 — 관계의 온도는 이벤트가 아니라 존중의 습관이 지킵니다"][relGap]}입니다.</p>` : ""),
    STATUS_ADVICE[relStatus].split("—")[1]?.split(".")[0]?.trim() ?? "상태에 맞는 한 수");

  /* 7장 월하의 마지막 편지 */
  html += sec("終章", "월하의 마지막 편지", "오늘부터의 실행 노트와 함께",
    kv([
      ["가장 큰 인연의 문", `${best.y}년`],
      ["길한 달", goodM.length ? goodM.map(m => m + "월").join(" · ") : "내년을 준비"],
      ["나의 부적", `${COLOR[yongE]} 소품`],
      ["피할 것", `${ELEM[giE]} 기운의 방전형 인연`],
      ["고칠 습관 하나", CAUTIONS[ds][0]],
    ]) +
    `<p class="prophecy">"${A.name}아, 매력은 이미 네 안에 다 있다. 남은 것은 시기와 자리뿐 — ${best.y}년의 바람이 불거든, ${EK[pe]}의 기운을 두른 사람 앞에서 세 걸음만 마주 걸어 나오너라."</p>`);
  return html;
}

/* ═══════════ 모드 3 : 사주궁합 (8장) ═══════════ */
export function renderGunghapDeep(A, B, relStatus = 3) {
  const { score, tg, br, zr } = gunghapScore(A, B);
  const tgBA = tenGod(B.ds, A.ds);
  const yA = yongTriple(A), yB = yongTriple(B);
  const maxA = A.elems.indexOf(Math.max(...A.elems)), maxB = B.elems.indexOf(Math.max(...B.elems));
  const minA = A.elems.indexOf(Math.min(...A.elems)), minB = B.elems.indexOf(Math.min(...B.elems));
  const msA = MONEY_STYLE[moneyStyleIdx(A)], msB = MONEY_STYLE[moneyStyleIdx(B)];
  const strongA = A.r.advanced.dayStrength, strongB = B.r.advanced.dayStrength;
  const chA = charms(A).length, chB = charms(B).length;
  const aControls = ["편재", "정재"].includes(tg);
  const bControls = ["편재", "정재"].includes(tgBA);
  let html = "";

  const personBlock = (P, who, yT, ms) => {
    const dom = dominantTG(P);
    const st = STRENGTH_TXT[P.r.advanced.dayStrength.strength];
    const ipe = partnerElem(P);
    return grp(`${who}의 사주팔자 분석`) +
      fl(1, "기본 사주 분석", first(ILGAN_CHAR[P.ds], 3)) +
      fl(2, "나만의 매력은?", `${FIRST_IMPRESSION[P.ds]}. 결정적 한 방은 <strong>${STRENGTHS[P.ds][0]}</strong>입니다.`) +
      fl(3, "내가 꿈꾸는 이상형은?", `${ELEM[ipe]} 기운의 사람 — ${first(LOVER_PROFILE[ipe].look, 1)}`) +
      fl(4, "내가 중시하는 연애 가치관은?", VALUES_TG[dom] ?? "균형 잡힌 관계") +
      fl(5, "연애에서 보이는 나의 단점은?", `${CAUTIONS[P.ds][0]}, 그리고 ${CAUTIONS[P.ds][1]}.`) +
      grp(`${who}의 오행 분석`) +
      ohaengHTML(P.elems) +
      fl(1, "오행 분석", `${ELEM[P.elems.indexOf(Math.max(...P.elems))]}이 가장 강하고 ${ELEM[P.elems.indexOf(Math.min(...P.elems))]}이 가장 약한 구조입니다.`) +
      fl(2, "용신(用神)", `${YONGSIN_FRAME.yong} ${who}의 용신은 <strong>${ELEM[yT.yongE]}</strong> — 색은 ${COLOR[yT.yongE]}, 방향은 ${DIR[yT.yongE]}.`) +
      fl(3, "희신(喜神)", `${YONGSIN_FRAME.hee} ${who}의 희신은 <strong>${ELEM[yT.heeE]}</strong>입니다.`) +
      fl(4, "기신(忌神)", `${YONGSIN_FRAME.gi} ${who}의 기신은 <strong>${ELEM[yT.giE]}</strong>입니다.`) +
      grp(`${who}의 신강신약 분석`) +
      fl(1, "어떤 사주인지", st.what) +
      fl(2, "특징", st.trait) +
      fl(3, "현실에서 부딪히는 문제", st.issue);
  };

  html += sec("第一章", "기본 사주 분석", `${A.name} · ${B.name} 두 사람의 바탕`,
    `<div class="duo"><div>${pillarsHTML(A, `${A.name} · ${gzName(A.ds, A.db).slice(0, 2)}일주`)}</div><div>${pillarsHTML(B, `${B.name} · ${gzName(B.ds, B.db).slice(0, 2)}일주`)}</div></div>` +
    personBlock(A, A.name, yA, msA) + personBlock(B, B.name, yB, msB),
    `${A.name}: ${STEMS[A.ds].kr}일간 ${STRENGTH_TXT[strongA.strength].what.split("—")[0].trim()} · ${B.name}: ${STEMS[B.ds].kr}일간 ${STRENGTH_TXT[strongB.strength].what.split("—")[0].trim()}`);

  /* 2장 인연궁합 */
  const line = score >= 85 ? "하늘이 미리 이어 둔 인연" : score >= 70 ? "노력이 아깝지 않은 좋은 인연" : score >= 55 ? "가꾸는 만큼 자라는 인연" : score >= 40 ? "서로를 배우게 하는 인연" : "다름을 공부해야 하는 인연";
  const firstConfess = aControls ? A.name : bControls ? B.name : (STEMS[A.ds].yang ? A.name : B.name);
  const earlyGiver = A.elems[1] >= B.elems[1] ? A.name : B.name;
  const lateGiver = A.elems[2] >= B.elems[2] ? A.name : B.name;
  html += sec("第二章", "인연궁합", "붉은 실의 정체를 확인합니다",
    grp("1. 인연의 붉은 실") +
    fl(1, "우리는 인연일까, 악연일까?",
      `<div class="score-wrap"><div class="score-big">${score}<small> / 100</small></div><div class="gauge"><i style="width:${score}%"></i></div><div class="score-line">"${line}"</div></div><p>${first(BR_GUNGHAP[br.k].replace(/<[^>]+>/g, ""), 2)}</p>`) +
    fl(2, "전생에서 우리는 어떤 관계였을까?", `${PAST_LIFE[tg]}. 그래서 이생의 ${B.name}님은 ${A.name}님에게 ${tg}의 별로 다시 왔습니다.`) +
    grp("2. 인연과 관계의 열쇠") +
    fl(1, "서로가 느꼈던 첫인상은?", `${A.name}님이 본 ${B.name}님: ${FIRST_IMPRESSION[B.ds]}. 반대로 ${B.name}님이 본 ${A.name}님: ${FIRST_IMPRESSION[A.ds]}.`) +
    fl(2, "고백은 누가 먼저 하는 게 좋을까?", `<strong>${firstConfess}님</strong>이 먼저 움직이는 그림이 자연스럽습니다. ${aControls || bControls ? "상대를 향해 기운이 흐르는 쪽이 다가갈 때 관계가 순리대로 풀립니다." : "양(陽)의 기운이 강한 쪽이 문을 여는 것이 명리의 순서입니다."}`) +
    fl(3, "계절별 추천 데이트 & 여행 코스",
      `<ul class="pts gold"><li><strong>${A.name}님의 용신 계절</strong> — ${SEASON_DATE[yA.yongE]}</li><li><strong>${B.name}님의 용신 계절</strong> — ${SEASON_DATE[yB.yongE]}</li><li>두 계절을 번갈아 채우면 서로의 운을 데워 주는 데이트가 됩니다.</li></ul>`) +
    fl(4, "기념일은 어떻게 챙기는 게 좋을까?", `${A.name}님은 ${msA.event}. ${B.name}님은 ${msB.event}. 서로의 기준이 다르니 "금액"이 아니라 "방식"을 먼저 합의하세요.`) +
    fl(5, "연애 시기별로 마음을 더 주는 쪽은?", `초반의 불은 <strong>${earlyGiver}님</strong>이 크게 지피고, 관계가 익을수록 <strong>${lateGiver}님</strong>의 꾸준함이 저울을 잡습니다.`) +
    fl(6, "서로 어떤 점에서 서운함을 느낄까?", `${A.name}님은 「${CAUTIONS[B.ds][0]}」에서, ${B.name}님은 「${CAUTIONS[A.ds][0]}」에서 서운함이 쌓이기 쉽습니다. 서로의 아킬레스건을 미리 알아 두세요.`) +
    fl(7, "화해는 어떻게 하면 좋을까?", `${A.name}님은 ${RECONCILE[A.ds]}<br>${B.name}님은 ${RECONCILE[B.ds]}`) +
    fl(8, "장기적인 관계 유지를 위한 조언", `${BR_KEY[br.k]}. 그리고 두 사람 공용의 만능 처방 — 갈등이 생긴 날 잠들기 전 "그래도 네 편이야" 한 문장. 어떤 합(合)보다 강합니다.`),
    `${score}점 — ${line} · 전생은 ${PAST_LIFE[tg].split("—")[0].trim()}`);

  /* 3장 성격궁합 */
  const leader = aControls ? A.name : bControls ? B.name : (strongA.score >= strongB.score ? A.name : B.name);
  const yielder = strongA.score >= strongB.score ? A.name : B.name;
  html += sec("第三章", "성격궁합", "결이 맞는가, 맞춰 갈 수 있는가",
    grp("1. 우리의 성격, 잘 맞을까?") +
    fl(1, "일간으로 보는 성격의 조화", `<p>${TG_GUNGHAP[tg][0]}</p><p>${first(TG_GUNGHAP[tg][1].replace(/<[^>]+>/g, ""), 3)}</p>`) +
    fl(2, "연애할 때 달라지는 모습은?", `${A.name}님은 「${DAY_KEY[A.ds].split("—")[0].trim()}」의 연애를, ${B.name}님은 「${DAY_KEY[B.ds].split("—")[0].trim()}」의 연애를 합니다.`) +
    fl(3, "자연스럽게 나눠지는 역할은?", `끌고 가는 쪽은 <strong>${leader}님</strong>, 살림과 안정을 챙기는 쪽은 <strong>${lateGiver}님</strong>의 그림이 자연스럽습니다. 역할이 겹치는 날 다툼이 나니, 각자의 영역을 인정해 주세요.`) +
    fl(4, "주변이 부러워할 우리 커플만의 장점", `${BR_KEY[br.k].split("—")[1]?.trim() ?? "서로를 있는 그대로 보는 맑음"} — 그리고 ${STRENGTHS[A.ds][0]}(${A.name})과 ${STRENGTHS[B.ds][0]}(${B.name})의 합작입니다.`) +
    grp("2. 우리의 끌림 포인트는?") +
    fl(1, "누가 이성에게 더 인기가 많을까?", chA === chB ? "매력의 별 개수가 같습니다 — 인기 유형이 다를 뿐 총량은 비등합니다." : `${chA > chB ? A.name : B.name}님 쪽이 도화·홍염 등 매력의 별이 더 많아 시선을 끄는 힘이 셉니다. 질투가 아니라 관리의 문제로 다뤄 주세요.`) +
    fl(2, `${B.name}님이 ${A.name}님에게 느끼는 매력`, `${STRENGTHS[A.ds][0]}, 그리고 ${STRENGTHS[A.ds][1]}.`) +
    fl(3, `${A.name}님이 ${B.name}님에게 느끼는 매력`, `${STRENGTHS[B.ds][0]}, 그리고 ${STRENGTHS[B.ds][1]}.`) +
    grp("3. 이 커플, 오래 갈 수 있을까?") +
    fl(1, "오래 만날 수 있는 성격일까?", score >= 70 ? "배합상 지구력이 좋은 조합입니다. 큰 이변이 없는 한 시간이 두 사람의 편입니다." : score >= 50 ? "기본 배합은 무난하나, 자동으로 오래가는 조합은 아닙니다. 아래 보완법이 실질적인 수명 연장 장치입니다." : "솔직하게 — 배합의 자력은 약한 편입니다. 그러나 명리는 노력한 커플이 배합 좋은 커플을 이기는 경우를 수없이 봅니다.") +
    fl(2, "더 많이 양보해야 할 사람은?", `<strong>${yielder}님</strong>입니다. 기운이 더 넉넉한 쪽(신강)이 반 발 물러설 때 관계 전체의 균형이 잡히기 때문입니다.`) +
    fl(3, "연애 주도권은 누구에게?", `${leader}님 쪽으로 자연스럽게 기웁니다. 다만 주도권은 "결정권"이 아니라 "먼저 챙길 책임"으로 쓸 때만 복이 됩니다.`) +
    fl(4, "미래를 그릴 때 두 사람이 상상하는 그림은?", `${A.name}님의 그림: ${VALUES_TG[dominantTG(A)]}. ${B.name}님의 그림: ${VALUES_TG[dominantTG(B)]}. 두 그림이 다르다면, 다른 것이 아니라 서로의 퍼즐 조각입니다.`) +
    grp("4. 성격 궁합을 보완하는 방법") +
    fl(1, "성격 궁합 보완법", br.k === "chung" || br.k === "wonjin" ? "부딪히는 배합이니 '고치기'를 포기하고 '규칙'으로 합의하세요. 연락 빈도·데이트 방식·돈 문제, 세 가지만 문서화해도 갈등의 8할이 사라집니다." : "무난한 배합이니 최대의 적은 방심입니다. 한 달에 한 번, 서로에게 바라는 점 하나씩만 교환하세요.") +
    fl(2, "상대방이 나를 더 좋아하게 만들려면?", `${B.name}님의 용신은 ${ELEM[yB.yongE]} — ${COLOR[yB.yongE]} 계열을 입고 만나고, ${DIR[yB.yongE]} 방향의 장소를 고르면 이유 모를 호감이 붙습니다.`) +
    fl(3, "어떤 커플 아이템이 좋을까?", `두 사람의 용신을 하나씩 담아 — ${COLOR[yA.yongE]} × ${COLOR[yB.yongE]} 조합의 소품(팔찌·폰스트랩·키링)이 두 사람 모두의 기운을 살립니다.`) +
    fl(4, "같이 즐기면 좋은 취미", `${SPORT_GOOD[yA.yongE]} 계열(${A.name}님 용신)과 ${SPORT_GOOD[yB.yongE]} 계열(${B.name}님 용신)을 번갈아 — 몸을 함께 쓰는 취미가 이 배합의 정체기를 막아 줍니다.`) +
    fl(5, "상대를 더 이해하기 위한 대화 질문", `<ul class="pts blue"><li>"요즘 네 에너지를 제일 많이 뺏는 게 뭐야?"</li><li>"내가 뭘 할 때 제일 사랑받는다고 느껴?"</li><li>"우리가 1년 뒤에 꼭 같이 하고 싶은 것 하나만 꼽으면?"</li></ul>`),
    `주도권 ${leader} · 양보는 ${yielder} · 보완법은 규칙과 질문`);

  /* 4장 감정궁합 */
  const wetA = A.elems[4] + A.elems[2], wetB = B.elems[4] + B.elems[2];
  const clingy = strongA.score <= strongB.score ? A.name : B.name;
  html += sec("第四章", "감정궁합", "마음의 온도와 습도",
    grp("1. 우리의 감정궁합, 얼마나 잘 맞을까?") +
    fl(1, "감정 표현 방식", `${A.name}님: ${EXPRESS[maxA]}. ${B.name}님: ${EXPRESS[maxB]}.`) +
    fl(2, "대화 스타일", `${A.name}님은 ${TALK[maxA]} ${B.name}님은 ${TALK[maxB]}`) +
    fl(3, "공감 방식", wetA >= wetB ? `${A.name}님이 감정을 받아 주는 그릇이 크고, ${B.name}님은 해결책으로 공감하는 유형입니다. "해결 말고 그냥 들어 줘"라는 신호를 정해 두면 어긋남이 사라집니다.` : `${B.name}님이 감정을 받아 주는 그릇이 크고, ${A.name}님은 해결책으로 공감하는 유형입니다. "해결 말고 그냥 들어 줘"라는 신호를 정해 두면 어긋남이 사라집니다.`) +
    fl(4, "의존 경향", `기운이 여린 쪽(신약)인 <strong>${clingy}님</strong>이 정서적으로 더 기대는 구도입니다. 기댐은 약점이 아니라 이 관계의 접착제이니, 기대는 쪽은 표현으로 갚으세요.`) +
    fl(5, "내 본능이 상대에게 느낀 '이것'", br.k === "yukhap" ? "살결의 편안함 — 육합의 배합은 곁에 있는 것만으로 안정 호르몬이 도는 사이입니다." : br.k === "chung" || br.k === "wonjin" ? "설명 안 되는 강렬함 — 부딪히는 배합일수록 자력은 셉니다. 본능은 이미 알고 시작했습니다." : "익숙한 안정감 — 처음부터 오래 안 사이 같았던 그 느낌이 이 배합의 정체입니다.") +
    fl(6, "서로에게 안정감을 주는 포인트", `${A.name}님에게는 ${B.name}님의 「${STRENGTHS[B.ds][2]}」이, ${B.name}님에게는 ${A.name}님의 「${STRENGTHS[A.ds][2]}」이 안전지대입니다.`) +
    fl(7, "감정적인 순간, 어떻게 행동해야 할까?", `${A.name}님이 격해졌을 때: ${first(RECONCILE[A.ds])} ${B.name}님이 격해졌을 때: ${first(RECONCILE[B.ds])}`) +
    grp("2. 감정 문제의 해결") +
    fl(1, "연락 패턴과 빈도는?", (A.elems[1] + B.elems[1]) >= (A.elems[4] + B.elems[4]) ? "화(火)가 강한 커플 — 짧아도 자주가 정답입니다. 아침·저녁 두 번의 가벼운 신호가 장문 하나보다 낫습니다." : "수(水)가 흐르는 커플 — 빈도보다 깊이입니다. 하루 한 번이라도 '오늘의 진짜 기분'을 나누는 대화가 관계를 지킵니다.") +
    fl(2, "권태기를 슬기롭게 넘기는 방법", `권태는 감정의 고장이 아니라 <strong>새로움의 결핍</strong>입니다. 두 사람의 용신 계절(${SEASON_DATE[yA.yongE].split("—")[0].trim()}·${SEASON_DATE[yB.yongE].split("—")[0].trim()})마다 처음 가는 장소 하나 — 이 규칙 하나면 충분합니다.`) +
    fl(3, "서로 상처받지 않고 대화하는 방법", `${maxA === 3 || maxB === 3 ? "금(金) 기운이 강해 옳은 말이 아픈 말이 되기 쉬운 조합입니다. " : ""}공식은 하나 — <strong>사실 → 감정 → 부탁</strong>의 순서. "늦었네(사실), 걱정했어(감정), 다음엔 미리 알려 줘(부탁)."`) +
    fl(4, "헤어질 위기엔 누가 더 매달릴까?", `<strong>${clingy}님</strong>일 가능성이 높습니다. 그러니 상대는 그 마음을 이기는 카드가 아니라 지켜야 할 신뢰로 다뤄 주세요.`) +
    fl(5, "재회를 위해서는 어떤 노력이?", "이 배합이 헤어진다면 원인은 대개 위 '서운함 포인트'의 방치입니다. 재회의 조건은 단 하나 — 같은 문제의 재발 방지책을 먼저 내미는 것입니다."),
    `표현·대화·공감의 결이 다른 만큼 — 신호와 공식으로 잇는다`);

  /* 5장 체질궁합 */
  html += sec("第五章", "체질궁합", "같이 건강해지는 배합인가",
    grp("1. 우리는 잘 맞는 체질일까?") +
    fl(1, "두 사람의 체질 성향과 주의사항", `${A.name}님: ${first(HEALTH_BY_ELEM[maxA], 2)} ${B.name}님: ${first(HEALTH_BY_ELEM[maxB], 2)}`) +
    fl(2, "상대가 보완해 주는 건강 요소", B.elems[minA] >= 2 ? `${B.name}님의 사주에 ${A.name}님의 부족한 ${ELEM[minA]} 기운이 넉넉합니다 — 함께 있는 것만으로 생활 리듬이 보완되는 배합입니다.` : `두 사람 모두에게 부족한 기운이 있으니, 보완은 사람이 아니라 습관(${FOODS[minA]}, ${SPORT_GOOD[minA].split("·")[0]})으로 채우세요.`) +
    fl(3, "함께하면 좋은 운동", `${SPORT_GOOD[yA.yongE]} (${A.name}님 용신 기준) / ${SPORT_GOOD[yB.yongE]} (${B.name}님 용신 기준) — 겹치는 것부터 시작하세요.`) +
    fl(4, "주의해야 할 운동", `${SPORT_BAD[yA.giE]} (${A.name}님) / ${SPORT_BAD[yB.giE]} (${B.name}님)`),
    `체질은 다를수록 보완 — 함께 몸을 쓰는 커플이 오래간다`);

  /* 6장 재물궁합 */
  const mCntA = moneyStyleIdx(A), mCntB = moneyStyleIdx(B);
  const managerName = mCntA === 0 ? A.name : mCntB === 0 ? B.name : (wetA >= wetB ? A.name : B.name);
  const bothWork = ["관격", "재격"].includes(A.r.advanced.geukguk) || ["관격", "재격"].includes(B.r.advanced.geukguk);
  const hasGeopjae = [dominantTG(A), dominantTG(B)].includes("겁재");
  html += sec("第六章", "재물궁합", "사랑은 마음으로, 살림은 구조로",
    grp("1. 두 사람의 재물운, 어떻게 바뀔까?") +
    fl(1, `${A.name}님의 재물운`, first(WEALTH_TXT[mCntA === 2 ? 0 : mCntA === 1 ? 2 : 1].replace("결론 — ", ""), 2)) +
    fl(2, `${B.name}님의 재물운`, first(WEALTH_TXT[mCntB === 2 ? 0 : mCntB === 1 ? 2 : 1].replace("결론 — ", ""), 2)) +
    fl(3, "함께했을 때의 재물운", mCntA !== mCntB ? "버는 유형과 지키는 유형이 섞인 조합 — 명리학이 가장 반기는 재물 배합입니다. 역할만 제대로 나누면 1+1이 3이 됩니다." : "돈에 대한 감각이 닮은 조합 — 편하지만 같은 구멍(둘 다 쓰거나 둘 다 묶어두거나)이 생깁니다. 외부 규칙(자동이체·상한선)으로 보완하세요.") +
    fl(4, "우리는 재물 걱정 없이 살 수 있을까?", score >= 65 ? "배합상 재물의 그릇이 안정적인 커플입니다. 큰 부는 시기의 문제이고, 궁핍의 그림은 보이지 않습니다." : "재물의 안정은 배합보다 규칙에 달린 커플입니다. 아래 상세 풀이의 규칙 세 가지만 지키면 걱정의 8할이 사라집니다.") +
    grp("2. 재물궁합 상세 풀이") +
    fl(1, "데이트 비용, 각자 어떻게 생각할까?", `${A.name}님(${msA.type}): ${msA.date}. ${B.name}님(${msB.type}): ${msB.date}.`) +
    fl(2, "기념일 이벤트 비용에 대한 생각", `${A.name}님은 ${msA.event}. ${B.name}님은 ${msB.event}.`) +
    fl(3, "데이트 비용은 어떻게 분담하면 좋을까?", mCntA === mCntB ? "성향이 같으니 정률제(예: 공동 지갑에 같은 비율)가 잡음이 없습니다." : "성향이 다르니 항목제가 낫습니다 — 계획 지출(식사·여행)은 꼼꼼한 쪽이, 즉흥 지출(선물·이벤트)은 화끈한 쪽이 맡는 식으로.") +
    fl(4, "비용 갈등을 줄이려면?", "금액을 다투지 말고 '한도'를 합의하세요. 월 데이트 예산 상한 하나만 정해도 돈 얘기가 감정 얘기로 번지지 않습니다.") +
    fl(5, "결혼하면 맞벌이? 외벌이?", bothWork ? "두 사람 다 사회 활동의 별이 살아 있는 사주 — 맞벌이가 재물뿐 아니라 관계의 균형에도 좋습니다." : "한쪽이 기반을 다지고 한쪽이 살림의 축을 잡는 그림도 어울리는 배합입니다. 다만 '누가 벌든 돈은 공동'의 원칙은 문서로.") +
    fl(6, "사업을 같이 해도 괜찮을까?", hasGeopjae ? "솔직하게 — 겁재의 기운이 있어 동업은 신중해야 합니다. 하더라도 지분·정산·철수 조건을 계약서로 만든 뒤에만." : (br.k === "samhap" || br.k === "yukhap" ? "합(合)의 배합이라 공동 프로젝트에 강한 커플입니다. 작은 것(사이드 프로젝트)부터 검증하며 키우세요." : "가능은 하나 권장 순서가 있습니다 — 여행 예산 운영 → 공동 저축 → 그다음이 사업입니다.")) +
    fl(7, "돈 관리는 누가 하는 게 좋을까?", `<strong>${managerName}님</strong>입니다. ${managerName === A.name ? msA.manage : msB.manage}`) +
    grp("3. 돈에 대한 생각") +
    fl(1, "돈에 대한 우리의 가치관", `${A.name}님에게 돈은 「${VALUES_TG[dominantTG(A)].split("—")[0].trim()}」을 지키는 도구, ${B.name}님에게는 「${VALUES_TG[dominantTG(B)].split("—")[0].trim()}」을 이루는 수단입니다.`) +
    fl(2, "각자 우선하는 소비 항목", `${A.name}님은 ${["자기계발·계획된 큰 지출", "경험·모임·보이는 것", "생활·저축·실용", "품질·브랜드·자기관리", "취미·지식·조용한 사치"][maxA]}, ${B.name}님은 ${["자기계발·계획된 큰 지출", "경험·모임·보이는 것", "생활·저축·실용", "품질·브랜드·자기관리", "취미·지식·조용한 사치"][maxB]} 쪽으로 지갑이 열립니다.`) +
    fl(3, "우리에게 맞는 재테크", `${A.name}님: ${msA.invest} ${B.name}님: ${msB.invest}`) +
    fl(4, "돈 문제가 생겼을 때 대화법", "숫자 얘기는 감정이 낮은 시간(식후·주말 오전)에, '누가 잘못했나'가 아니라 '다음 달 규칙'으로 끝내세요. 규칙 없는 반성은 반복됩니다."),
    `역할 분담: 돈 관리 ${managerName} · 갈등 방지는 금액이 아니라 한도 합의`);

  /* 7장 혼인궁합 */
  const myA = marryYearsFor(A), myB = marryYearsFor(B);
  const common = myA.filter(a => myB.some(b => b.year === a.year));
  const marryPick = (common.length ? common : myA.length ? myA : myB).slice(0, 2);
  const crisisYears = seyunRows(A, 6).filter(s => isChung(branchIdxOf(s.branch), A.db) || isChung(branchIdxOf(s.branch), B.db)).map(s => s.year);
  const kidsStar = (P) => {
    const t = Object.fromEntries(tallyTenGods(P));
    return P.sex === "F" ? (t["식신"] || 0) + (t["상관"] || 0) : (t["편관"] || 0) + (t["정관"] || 0);
  };
  const kids = kidsStar(A) + kidsStar(B);
  html += sec("第七章", "혼인궁합", "결혼까지 내다본 두 사람",
    grp("1. 우리, 결혼할 사주인가요?") +
    fl(1, "사주에서 보이는 결혼 시기", marryPick.length ? `두 사람의 혼인 별이 겹치는 해는 <strong>${marryPick.map(y => y.year + "년").join(" · ")}</strong>입니다. 이 해의 혼담·상견례·결정은 하늘의 협조가 붙습니다.` : "앞으로 6년 안에 강한 혼인운의 해가 뚜렷하진 않습니다 — 늦는 게 아니라 서두를 이유가 없다는 뜻입니다.") +
    fl(2, "결혼의 장애물", (br.k === "chung" || br.k === "wonjin" ? `배우자궁의 ${br.label} — 생활 방식의 정면충돌이 최대 관문입니다. 결혼 전 동거 수준의 생활 리허설(여행·살림 분담)을 강력 추천합니다.` : zr.k === "chung" || zr.k === "wonjin" ? "두 집안의 문화 차이가 관문입니다. 두 사람 문제가 아니니 '부부는 한 팀' 원칙만 세우면 넘습니다." : "큰 장애물은 보이지 않습니다 — 오히려 '완벽한 때'를 기다리는 마음이 유일한 장애물입니다.")) +
    fl(3, "신혼생활은 어디서 시작하는 게 좋을까?", `${A.name}님의 길방(${DIR[yA.yongE]})과 ${B.name}님의 길방(${DIR[yB.yongE]})을 절충해 — ${yA.yongE === yB.yongE ? `두 사람 모두 ${DIR[yA.yongE]}이 길하니 그 방향이 정답입니다.` : `직장 기준 ${DIR[yA.yongE]}과 ${DIR[yB.yongE]} 사이에서 고르되, 창이 그 방향으로 난 집이면 충분합니다.`}`) +
    fl(4, "가사분담은 어떻게?", `살림의 감각(식신·정인)이 강한 <strong>${lateGiver}님</strong>이 주방·일상을, 추진력이 강한 <strong>${leader}님</strong>이 행정·큰일(이사·계약·수리)을 맡는 그림이 자연스럽습니다.`) +
    grp("2. 이혼 위기 극복 방법") +
    fl(1, "우리에게 이혼 위기가 있을까?", br.k === "chung" || br.k === "wonjin" ? "솔직하게 — 흔들리는 시기가 옵니다. 다만 이 배합의 위기는 애정의 소멸이 아니라 생활 충돌의 누적이라, 예방이 가능합니다." : "배합상 큰 위기의 그림은 없습니다. 이 커플의 적은 위기가 아니라 무심의 축적입니다.") +
    fl(2, "위기가 찾아올 시점", crisisYears.length ? `배우자궁이 흔들리는 <strong>${crisisYears.slice(0, 2).join("년, ")}년</strong> 언저리 — 이사·이직 같은 환경 변화와 겹치면 체감이 커집니다.` : "특정 연도보다, 큰 환경 변화(출산·이직·이사) 직후 6개월이 통계적 위험 구간입니다.") +
    fl(3, "위기가 오는 이유", `위 감정궁합에서 짚은 서운함 포인트(${CAUTIONS[A.ds][0].split("—")[0]} / ${CAUTIONS[B.ds][0].split("—")[0]})가 말해지지 않고 쌓이는 것 — 그것이 이 커플 위기의 8할입니다.`) +
    fl(4, "슬기롭게 극복하려면", "위기의 해에는 큰 결정을 미루고, 부부 회의를 주 1회 고정하세요. 그리고 기억하세요 — 충(沖)의 해는 헤어지는 해가 아니라 '재계약 조건을 갱신하는 해'입니다.") +
    grp("3. 우리 둘의 자녀운") +
    fl(1, "자녀 계획", kids >= 3 ? "두 사람의 자녀별이 넉넉합니다 — 아이와의 연이 자연스럽게 이어지는 배합입니다." : kids >= 1 ? "자녀별이 은은하게 자리합니다 — 계획을 세우면 순리대로 풀리는 그림입니다." : "자녀별이 겉으로 드러나지 않은 배합입니다 — 연이 없다는 뜻이 아니라 시기와 준비가 중요하다는 뜻이니, 서두르기보다 몸과 기반을 먼저 만드세요.") +
    fl(2, "자녀운이 약할 때 보완법", `두 사람의 용신(${ELEM[yA.yongE]}·${ELEM[yB.yongE]})을 침실에 — 색과 소품으로 채우고, 몸을 데우는 음식(${FOODS[yA.yongE]})을 함께 챙기세요.`) +
    fl(3, "우리에게 맞는 자녀 교육", (dominantTG(A) === "정인" || dominantTG(B) === "정인" ? "인성의 부모 — 차분히 가르치는 학습형 교육이 강점입니다. 다만 아이의 실수를 기다려 주는 연습을." : "식상의 감각이 있는 부모 — 몸으로 겪게 하는 체험형 교육이 맞습니다. 학원보다 여행과 프로젝트를.")) +
    fl(4, "양가 가족과의 궁합", `${zr.k === "yukhap" || zr.k === "samhap" ? "띠의 합이 좋아 양가 어른들과의 관계가 순탄한 편입니다." : zr.k === "chung" || zr.k === "wonjin" ? "띠가 부딪혀 명절·가족 행사에서 잔가시가 돋기 쉽습니다. 서로의 원가족 이야기는 농담으로도 조심하세요." : "양가와의 관계는 무난한 흐름 — 예의만 지키면 탈이 없습니다."}`) +
    fl(5, "명절·가족 행사 갈등 줄이는 법", `<ul class="pts"><li>배우자를 내 가족 앞에서 무조건 편들 것 — 중재는 집에 와서.</li><li>양가 방문·용돈은 '동일 규칙'으로 — 형평이 곧 평화입니다.</li><li>가족 모임 전 10분, 오늘의 지뢰(피할 화제)를 서로 브리핑할 것.</li></ul>`),
    marryPick.length ? `혼인 적기 ${marryPick.map(y => y.year + "년").join("·")} · 위기는 예방 가능한 유형` : "혼인은 때보다 준비 — 위기는 예방 가능한 유형");

  /* 8장 마치며 */
  html += sec("終章", "궁합풀이를 마치며", "월하의 마지막 편지",
    kv([
      ["인연 점수", `${score}점 — ${line}`],
      ["전생의 연", PAST_LIFE[tg].split("—")[0].trim()],
      ["먼저 다가갈 사람", firstConfess],
      ["돈 관리 담당", managerName],
      ["혼인 적기", marryPick.length ? marryPick.map(y => y.year + "년").join(" · ") : "준비되는 해"],
      ["우리의 한 문장", "“그래도 네 편이야”"],
    ]) +
    `<p class="prophecy">"점수는 하늘이 매기나 인연은 사람이 완성하느니라. ${A.name}과 ${B.name}, 너희가 오늘 서로의 사주를 나란히 펼쳐 본 것 — 그 마음이 이미 이 궁합의 절반이니라."</p>` +
    `<p>좋은 배합은 자랑거리가 아니라 출발선이고, 아쉬운 배합은 사형선고가 아니라 지도입니다. 위에서 짚은 규칙 두엇만 생활에 심어 두세요. 다음 갈등이 왔을 때, 두 사람은 이미 준비된 커플일 것입니다.</p>`);
  return html;
}

/* ═══════════ 모드 4 : 올해의운세 (8장) ═══════════ */
export function renderYearly(A, job = "직장인") {
  const r = A.r, ds = A.ds, db = A.db;
  const e = A.elems, maxE = e.indexOf(Math.max(...e)), minE = e.indexOf(Math.min(...e));
  const thisYear = r.currentYear;
  const sy = r.seyun.find(s => s.year === thisYear);
  if (!sy) return sec("一", "올해의 운세", "", "<p>올해 세운 정보를 계산할 수 없습니다.</p>");
  const yb = branchIdxOf(sy.branch);
  const rel = branchRelation(yb, db);
  const mainTG = sy.tenGodStem, subTG = sy.tenGodBranch;
  const { yongE, heeE, giE } = yongTriple(A);
  const sj = samjaeBranches(r.pillarDetails.year.branchIdx);
  const sjStage = sj ? sj.indexOf(yb) : -1;
  const keyword = (YEAR_TG[mainTG] ?? "").match(/"([^"]+)"/)?.[1] ?? `${mainTG}의 해`;
  const isStudent = ["학생", "대학생", "취업준비", "고시·시험준비"].includes(job);
  const goodMoneyM = monthsWhere(A, (mb, tg) => ["정재", "편재", "식신"].includes(tg));
  const badMoneyM = monthsWhere(A, (mb, tg) => ["겁재", "비견"].includes(tg));
  const chungM = monthsWhere(A, mb => isChung(mb, db));
  const yukhapM = monthsWhere(A, mb => YUKHAP[mb] === db);
  const docGoodM = monthsWhere(A, (mb, tg) => ["정인", "정관"].includes(tg));
  const docBadM = monthsWhere(A, (mb, tg) => tg === "상관");
  const pStars = partnerStars(A);
  const loveM = monthsWhere(A, (mb, tg) => YUKHAP[mb] === db || mb === DOHWA[db] || pStars.includes(tg)).slice(0, 3);
  let html = "";

  /* 1장 총운 */
  html += sec("第一章", "올해의 총운", `${thisYear}년 ${sy.ganzhi}년 · 세운 ${mainTG}(천간)·${subTG}(지지)${sjStage >= 0 ? " · " + ["들", "눌", "날"][sjStage] + "삼재" : ""}`,
    baseChartSec(A) +
    fl(1, `${thisYear}년 주요 특징과 변화`, `<p>${first(YEAR_TG[mainTG] ?? "", 2)}</p><p>발밑으로는 ${subTG}의 저류가 함께 흐릅니다 — ${SEYUN_TG[subTG] ?? ""}.</p>`) +
    fl(2, "올해 전반적인 흐름", yukhapM.concat(goodMoneyM).filter(m => m <= 6).length >= yukhapM.concat(goodMoneyM).filter(m => m > 6).length
      ? "상반기에 순풍이 몰려 있습니다 — 중요한 시작과 결정은 상반기에 싣고, 하반기는 수확과 정리에 쓰세요."
      : "하반기로 갈수록 힘이 붙는 흐름입니다 — 상반기는 준비와 축적, 승부는 하반기에 거세요.") +
    fl(3, "나의 올해 키워드는?", `<strong>"${keyword}"</strong> — 이 문장을 거스르는 계획일수록 올해는 마찰이 커집니다.`) +
    fl(4, "찾아올 수 있는 위기는?", `${chungM.length ? `<strong>${chungM.map(m => m + "월").join("·")}</strong> — 배우자궁이 흔들리는 달로, 관계·계약의 변동수가 있습니다. ` : ""}${MONTH_CAUTION[mainTG]} — 올해 유형의 위기입니다.${sjStage >= 0 ? ` 그리고 ${["들", "눌", "날"][sjStage]}삼재 구간이니 ${SAMJAE_STAGE[sjStage].split("—")[1]?.trim()}` : ""}`) +
    fl(5, "얻을 수 있는 기회는?", `${yukhapM.length ? `<strong>${yukhapM.map(m => m + "월").join("·")}</strong>은 인연과 계약이 몸에 붙는 육합의 달. ` : ""}희신(${ELEM[heeE]})의 기운이 도는 자리 — ${ELEM_PERSON[heeE].split("—")[0].trim()}과의 협업이 올해 최고의 기회 루트입니다.`),
    `키워드 "${keyword}" · 기회의 달 ${yukhapM.slice(0, 2).map(m => m + "월").join("·") || "하반기"} · 위기는 ${chungM.slice(0, 2).map(m => m + "월").join("·") || "습관"}`);

  /* 2장 재물운 */
  html += sec("第二章", "재물운", "",
    grp("1. 재물운 총운") +
    fl(1, "올해 나의 재물운 흐름은?", MONEY_TG[mainTG] ?? "") +
    fl(2, "실제 일어날 수 있는 사건", `${MONTH_CAUTION[mainTG]}. 이런 종류의 일이 올해 돈 문제의 전형적인 얼굴입니다.`) +
    fl(3, "내게 필요한 조언은?", MONEY_TG[subTG] ? `지지의 보조 흐름도 참고하세요 — ${MONEY_TG[subTG]}` : "수입보다 지출 구조를 먼저 점검하세요.") +
    grp("2. 월별 재물운과 사람") +
    fl(1, "금전운 상승기", goodMoneyM.length ? `<strong>${goodMoneyM.map(m => m + "월").join(" · ")}</strong> — 재성·식신이 흐르는 달입니다. 협상·이직·부수입 시도는 이 달에.` : "특정 상승월보다 꾸준함이 유리한 해입니다.") +
    fl(2, "조심해야 할 시기", badMoneyM.length ? `<strong>${badMoneyM.map(m => m + "월").join(" · ")}</strong> — 비견·겁재의 달로 지출과 분배 손실이 커지기 쉽습니다. 빌려주는 돈·동업 제안은 이 달만은 보류.` : "크게 조심할 달은 없으나 충동 지출은 상시 경계.") +
    fl(3, "올해 이익을 가져다줄 사람", `희신 ${ELEM[heeE]}의 사람 — ${ELEM_PERSON[heeE]}.`) +
    fl(4, "올해 손해를 가져다줄 사람", `기신 ${ELEM[giE]}의 사람 — ${ELEM_PERSON[giE]}. 특히 돈과 문서가 얽힌 부탁은 정중히 거절하세요.`) +
    fl(5, "조언", "올해 재물의 핵심은 '누구와'입니다. 금액이 큰 결정일수록 위의 두 사람 유형을 대입해 보세요."),
    (MONEY_TG[mainTG] ?? "").split("—")[0].replace("재물은", "").trim());

  /* 3장 건강운 */
  html += sec("第三章", "건강운", "",
    grp("1. 건강운 총운") +
    fl(1, "나의 체질과 건강은?", first(HEALTH_BY_ELEM[maxE], 2)) +
    fl(2, "조심해야 할 부상·질병", `부족한 ${ELEM[minE]}의 영역 — ${HEALTH_BY_ELEM[minE].split("—")[1]?.split(".")[0]?.trim()}. ${chungM.length ? `변동의 달(${chungM.map(m => m + "월").join("·")})에는 과로와 사고수도 함께 오니 무리한 일정은 금물.` : ""}`) +
    fl(3, "생활습관과 활동", `용신 ${ELEM[yongE]}을 채우는 생활 — ${["아침 산책과 스트레칭", "낮의 야외 활동과 웃는 자리", "규칙적 식사와 정돈된 공간", "근력 운동과 호흡 운동", "충분한 수분과 밤의 숙면"][yongE]}이 올해의 보약입니다.`) +
    fl(4, "식습관 추천", `${FOODS[yongE]}을 가까이, ${FOODS[giE]}은 과하지 않게.`) +
    grp("2. 올해의 추천 운동") +
    fl(1, "나에게 맞는 운동", SPORT_GOOD[yongE]) +
    fl(2, "피해야 할 운동", SPORT_BAD[giE]),
    `용신 ${ELEM[yongE]} 채우기 — ${FOODS[yongE].split("과")[0]} · ${SPORT_GOOD[yongE].split("·")[0]}`);

  /* 4장 애정운 */
  const loveHit = pStars.includes(mainTG) || pStars.includes(subTG);
  html += sec("第四章", "애정운", "",
    grp("1. 애정운 총운") +
    fl(1, "올해 나의 애정운은?",
      `<p><strong>연애 중·기혼이라면</strong> — ${rel.k === "chung" ? "배우자궁이 충으로 흔들리는 해입니다. 관계의 문제가 커지는 게 아니라 '드러나는' 해이니, 올해 나온 갈등은 오히려 수리의 기회로 쓰세요." : rel.k === "yukhap" ? "배우자궁에 합이 드는 해 — 관계가 깊어지고 결실(동거·약혼·2세) 이야기가 자연스러워집니다." : "관계의 큰 파도는 없는 해 — 안정 속에서 서로의 일상을 지켜 주는 것이 최고의 애정 표현입니다."}</p>` +
      `<p><strong>솔로·미혼이라면</strong> — ${loveHit ? `배우자별(${starName(A)})이 드는 해입니다. 올해의 소개와 만남은 평년보다 무게가 다르니 가볍게 넘기지 마세요.` : "배우자별이 직접 드는 해는 아니라, 인연은 사건보다 일상으로 스며듭니다. 아래 길한 달에 집중하세요."}</p>`) +
    fl(2, "애정운 상승 시기와 장소",
      `<p><strong>시기</strong> — ${loveM.length ? loveM.map(m => m + "월").join(" · ") : "연말로 갈수록"}.</p><p><strong>장소</strong> — ${first(LOVER_PROFILE[partnerElem(A)].where, 1)}</p>`) +
    grp("2. 애정운 개선 방법") +
    fl(1, "올해 나의 매력은?", monthsWhere(A, mb => mb === DOHWA[db]).length ? `도화가 발동하는 ${monthsWhere(A, mb => mb === DOHWA[db]).map(m => m + "월").join("·")}에 매력이 정점을 찍습니다 — 프로필 사진·소개팅·발표는 이때.` : `${FIRST_IMPRESSION[ds]} — 이 첫인상이 올해의 무기입니다.`) +
    fl(2, "애정운 상승을 위한 조언", `${CAUTIONS[ds][0]} — 올해만큼은 이 습관을 의식적으로 접어 두세요. 애정운의 절반이 여기서 갈립니다.`) +
    fl(3, "내게 맞는 행운의 아이템", `${COLOR[yongE]} 계열의 소품. 데이트나 소개 자리에는 ${DIR[yongE]} 방향의 장소가 길합니다.`),
    loveHit ? `배우자별이 드는 해 — 올해의 만남은 무게가 다르다` : `길한 달 ${loveM.slice(0, 2).map(m => m + "월").join("·") || "연말"} — 일상 속 스며드는 인연`);

  /* 5장 직장/명예운 */
  html += sec("第五章", "직장·명예운", job ? `현재 상태: ${job}` : "",
    grp("1. 직장·명예운 총운") +
    fl(1, "올해 나의 사회적 위치와 평판은?", `${WORK_TG[mainTG] ?? ""} ${["정관", "편관"].includes(mainTG) || ["정관", "편관"].includes(subTG) ? "관성이 드는 해라 직함·평판·책임이 함께 커집니다." : ""}`) +
    fl(2, "현명한 사회생활을 위한 조언", `${WORK_TG[subTG] ?? ""} ${isStudent ? `${job}인 지금은 이 흐름을 '시험과 준비의 운'으로 읽으세요 — 제6장 학업운이 올해 당신의 본진입니다.` : job === "사업·자영업" || job === "프리랜서" ? "조직이 아닌 내 판을 가진 당신에게 명예운은 곧 평판 마케팅입니다 — 후기를 쌓는 해로 쓰세요." : ""}`) +
    fl(3, "내게 도움이 될 사람", `${ELEM_PERSON[heeE]} — 희신의 사람입니다. 올해 상사·동료·파트너 중 이 유형을 가까이.`) +
    fl(4, "반드시 피해야 할 사람", `${ELEM_PERSON[giE]} — 기신의 사람입니다. 험담의 자리와 보증·연대 책임은 이 유형과 얽히지 마세요.`) +
    grp("2. 월별 커리어 흐름") +
    fl(1, "중요한 결정, 언제가 좋을까?", docGoodM.length ? `<strong>${docGoodM.map(m => m + "월").join(" · ")}</strong> — 정관·정인이 흐르는 달로 이직·계약·시험·발표에 길합니다.` : "올해는 결정보다 실력을 쌓는 해로 쓰는 것이 유리합니다.") +
    fl(2, "주의해야 하는 시기", docBadM.length ? `<strong>${docBadM.map(m => m + "월").join(" · ")}</strong> — 상관의 달로 윗사람과의 마찰·구설 주의. 사표와 항의 메일은 이 달만은 보류.` : "특별히 주의할 달은 없습니다.") +
    fl(3, "커리어 향상을 위한 조언", `${(DAEUN_TG[r.daeun.current?.stemTenGod] ?? "").split("—")[0].trim()} 대운 위에 올해가 얹혀 있습니다 — 올해의 선택은 이 10년 흐름과 같은 방향일 때 두 배로 커집니다.`),
    `결정의 달 ${docGoodM.slice(0, 2).map(m => m + "월").join("·") || "-"} · 조심의 달 ${docBadM.slice(0, 2).map(m => m + "월").join("·") || "-"}`);

  /* 6장 학업/계약운 */
  const insung = tallyTenGods(A).filter(([n]) => ["정인", "편인"].includes(n)).reduce((a, [, c]) => a + c, 0);
  html += sec("第六章", "학업·계약운", isStudent ? "올해 당신의 본진입니다" : "",
    grp("1. 합격운 총운") +
    fl(1, "올해의 합격운은?", `${insung >= 2 ? "원국에 인성(학문의 별)이 든든해 시험·평가에 강한 체질입니다." : "인성이 강한 사주는 아니지만, 합격은 체질보다 시기 선택이 좌우합니다."} 올해 ${["정인", "정관"].includes(mainTG) || ["정인", "정관"].includes(subTG) ? "문서·명예의 별이 드는 해라 합격운이 밝은 편입니다." : "합격의 별이 강하게 드는 해는 아니니, 아래 길한 달에 시험 일정을 맞추는 전략이 필요합니다."}`) +
    fl(2, "합격운이 좋은 달은?", docGoodM.length ? `<strong>${docGoodM.map(m => m + "월").join(" · ")}</strong> — 시험·면접·지원서 제출을 이 달에 맞추세요.` : "특정 길월보다 꾸준한 축적이 답인 해입니다.") +
    fl(3, "주의가 필요한 달은?", `${docBadM.length ? `<strong>${docBadM.map(m => m + "월").join(" · ")}</strong> — 실수·구설의 달. 시험이 이 달이라면 검토 시간을 평소의 두 배로.` : "없습니다."}`) +
    fl(4, "어떤 것들을 점검해야 할까?", `<ul class="pts"><li>서류·자격 요건의 사소한 누락 (${MONTH_CAUTION["정관"]})</li><li>컨디션 관리 — ${ELEM[minE]} 영역(${HEALTH_BY_ELEM[minE].split("—")[0].trim()})이 시험기에 흔들리기 쉬움</li><li>마감 하루 전 제출 원칙 — 편인의 미루기가 최대의 적</li></ul>`) +
    fl(5, "합격운 상승 행운의 아이템", `${COLOR[yongE]} 계열의 필기구나 소품 — 시험장·면접장의 책상 위 부적입니다.`) +
    grp("2. 계약운 총운") +
    fl(1, "올해의 계약운은?", `${["정인", "정재"].includes(mainTG) ? "문서와 실속의 별이 함께 드는 해 — 계약운이 밝습니다." : "계약 자체보다 계약 조건이 중요한 해입니다."} 부동산·이직·투자 문서 모두 아래 달을 참고하세요.`) +
    fl(2, "계약운이 좋은 달·주의할 달", `길한 달: <strong>${docGoodM.map(m => m + "월").join(" · ") || "-"}</strong> / 주의: <strong>${docBadM.concat(badMoneyM).slice(0, 3).map(m => m + "월").join(" · ") || "-"}</strong>`) +
    fl(3, "계약 전 점검과 개운법", `도장 찍기 전 세 번 확인(${MONTH_CAUTION["정인"]}) — 그리고 계약 자리는 ${DIR[yongE]} 방향, ${COLOR[yongE]} 소지품이 길합니다.`),
    `합격·계약의 달 ${docGoodM.slice(0, 2).map(m => m + "월").join("·") || "-"} — 시기를 고르는 것이 절반`);

  /* 7장 12개월 월별 운세 */
  html += sec("第七章", "12개월 월별 운세", "달마다 기회·주의·한 문장",
    r.wolun.map(w => {
      const mm = wolunSolarMonth(w.month);
      const mb = branchIdxOf(w.branch);
      const mr = branchRelation(mb, db);
      const mark = mr.k === "yukhap" ? " · <em>육합의 달(관계·계약 길)</em>" : mr.k === "chung" ? " · <em>충의 달(변동 주의)</em>" : mb === DOHWA[db] ? " · <em>도화의 달(매력 상승)</em>" : "";
      return `<div class="fl"><p class="fl-t">${mm}월 <small>(${w.monthName.slice(0, 2)} · ${w.branchTenGod})</small></p><div class="fl-b">
        <p><strong>기회와 흐름</strong> — ${MONTH_TG[w.branchTenGod] ?? ""}${mark}</p>
        <p><strong>조심할 사건·사람</strong> — ${MONTH_CAUTION[w.branchTenGod] ?? ""}</p>
        <p><strong>이달의 한 문장</strong> — "${(MONTH_TG[w.branchTenGod] ?? "").split("—")[1]?.trim() ?? "평상심이 길이다"}"</p>
      </div></div>`;
    }).join(""),
    `가장 밝은 달 ${yukhapM.concat(docGoodM)[0] ?? goodMoneyM[0] ?? "-"}월 · 가장 조심할 달 ${chungM[0] ?? docBadM[0] ?? "-"}월`);

  /* 8장 길흉육조 */
  html += sec("終章", "길흉육조(吉凶六條)", `${thisYear}년을 여섯 문장으로`,
    `<p><strong>길(吉) 세 가지</strong></p><ul class="pts gold">
      <li>${yukhapM.length ? `${yukhapM.map(m => m + "월").join("·")}의 육합 — 관계와 계약이 몸에 붙는 시기` : `희신 ${ELEM[heeE]}의 사람 — 올해의 귀인 루트`}</li>
      <li>${keyword} — 이 흐름에 올라탄 계획은 순풍을 받는다</li>
      <li>용신 ${ELEM[yongE]} — ${COLOR[yongE]}과 ${DIR[yongE]}이 일 년 내내 나의 부적</li>
    </ul>
    <p><strong>흉(凶) 세 가지</strong></p><ul class="pts">
      <li>${chungM.length ? `${chungM.map(m => m + "월").join("·")}의 충 — 이 달의 변동과 감정 결정은 하루 재울 것` : `기신 ${ELEM[giE]}의 사람 — 만나면 방전되는 관계를 경계`}</li>
      <li>${MONTH_CAUTION[mainTG]}</li>
      <li>${sjStage >= 0 ? `${["들", "눌", "날"][sjStage]}삼재 — 과속 카메라 구간, 속도만 줄이면 무탈` : `방심 — 순한 해일수록 마무리를 흘리는 것이 유일한 흉`}</li>
    </ul>` +
    `<p class="prophecy">"${A.name}아, ${thisYear}년의 하늘은 이미 정해져 있으나 그 아래를 걷는 속도와 방향은 네 것이다. 길한 달에 움직이고 흉한 달에 쉬어 가거라 — 그것이 운을 부리는 자의 걸음이니라."</p>`,
    `길: ${keyword} / 흉: ${chungM.length ? chungM[0] + "월의 변동" : "방심"} — 여섯 문장이 올해의 전부`);
  return html;
}

/* ═══════════ 리포트 조립 ═══════════ */
const GREET = {
  saju: A => `어서 오셔요, ${A.name}님. 오늘은 태어난 날의 하늘부터 앞으로 5년의 바람까지, ${A.name}님의 사주 전체를 열세 장에 걸쳐 찬찬히 펼쳐 보겠습니다. 어려운 말은 장마다 아래에 따로 풀어 두었으니, 편한 마음으로 따라오셔요.`,
  love: A => `어서 오셔요, ${A.name}님. 곧 만나게 될 인연이 궁금하시지요. 나의 매력부터 운명의 짝, 그리고 조심해야 할 악연까지 — 붉은 실을 따라 일곱 장으로 읽어 드리겠습니다.`,
  gunghap: (A, B) => `어서 오셔요, ${A.name}님, 그리고 ${B?.name ?? "상대"}님. 두 분의 사주를 나란히 펼쳐 놓고 — 성격·감정·체질·재물·혼인까지 여덟 장에 걸쳐 겹쳐 보겠습니다. 좋은 것만 말하지 않을 테니, 그만큼 믿고 읽어 주셔요.`,
  yearly: A => `어서 오셔요, ${A.name}님. 올 한 해의 지도를 펼쳐 보는 자리입니다. 총운부터 달별 흐름, 길흉육조까지 — 위기는 미리 알면 절반이 되고, 기회는 미리 알면 두 배가 됩니다.`,
};

export function renderReport(mode: Mode, A: Person, opts: ReportOptions = {}): string {
  const { B, relStatus = 0, relGap = 0, job = "직장인" } = opts;
  let html = "";
  if (mode === "saju") html = renderSaju(A);
  else if (mode === "love") html = renderLoveSecret(A, relStatus, relGap);
  else if (mode === "gunghap") {
    if (!B) throw new Error("궁합 모드에는 상대(B)가 필요합니다");
    html = renderGunghapDeep(A, B, relStatus);
  } else html = renderYearly(A, job);
  return `<hr class="thread">` + tocHTML(html, GREET[mode](A, B)) + html;
}
