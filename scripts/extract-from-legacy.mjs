/**
 * legacy/월하사주.html → content/ + lib/engine/ + app/globals.css 자동 추출
 *
 * 원리: 모놀리스의 앱 스크립트를 vm 샌드박스에서 실행한 뒤,
 *  - 상수(풀이 텍스트·테이블)는 JSON 직렬화로,
 *  - 렌더러/유틸 함수는 Function.prototype.toString()으로
 * 그대로 꺼내 모듈 파일을 생성한다. → 텍스트·로직 100% 동일 보장.
 *
 * 실행: pnpm extract  (생성 파일은 커밋 대상 — 빌드 시 자동 실행되지 않음)
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const legacy = fs.readFileSync(path.join(root, "legacy", "월하사주.html"), "utf8");

/* ── 1. 샌드박스 실행 ── */
const scripts = [...legacy.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length !== 2) throw new Error("expected 2 script blocks, got " + scripts.length);
const stub = () => ({ appendChild(){}, addEventListener(){}, style:{}, value:"", textContent:"", getContext:()=>({clearRect(){},beginPath(){},arc(){},fill(){}}) });
const sandbox = {
  console, window:{}, matchMedia:()=>({matches:true}), addEventListener(){}, scrollTo(){},
  requestAnimationFrame(){}, innerWidth:800, innerHeight:600,
  document:{ getElementById:stub, querySelector:stub, querySelectorAll:()=>[], createElement:()=>({}) },
};
vm.createContext(sandbox);
for (const s of scripts) new vm.Script(s).runInContext(sandbox);
// 상수·함수를 샌드박스 전역에서 인출 (const/let은 컨텍스트 전역 lexical scope라 두 번째 스크립트로 접근)
const NAMES = [
  // constants
  "STEMS","BRANCHES","ELEM","EK","YUKHAP","SAMHAP","WONJIN","HAE","DOHWA","HOURS",
  // content
  "DAY_LOVE","DAY_KEY","YINYANG_NOTE","STRENGTHS","CAUTIONS",
  "SPOUSE_PALACE","SP_KEY",
  "TG_GUNGHAP","TG_KEY","TG_TODAY","TG_TODAY_SCORE",
  "BR_GUNGHAP","BR_KEY","REL_KEY","BR_TODAY",
  "ELEM_EXCESS","ELEM_LACK","ELEM_COLOR_WORD","LUCK_TIPS","SAL_DESC",
  "LOVER_PROFILE",
  "MARRY_STAR_TXT","MARRY_PALACE_GOOD","MARRY_PALACE_CHUNG","MARRY_PALACE_WONJIN","MARRY_PALACE_GONGMANG","MARRIED_LIFE",
  // functions
  "sec","paras","tocHTML","pillarsHTML","ohaengHTML","baseChartSec","wolunSolarMonth",
  "charms","partnerElem","partnerStars","starName",
  "renderLove","renderGunghap","renderForecast","renderMarriage","renderToday",
];
const bag = {};
new vm.Script(`__out({${NAMES.join(",")}})`).runInContext(
  Object.assign(sandbox, { __out: v => Object.assign(bag, v) })
);
for (const n of NAMES) if (bag[n] === undefined) throw new Error("추출 실패: " + n);

/* ── 2. 파일 생성 헬퍼 ── */
const BANNER = `/* AUTO-GENERATED from legacy/월하사주.html by scripts/extract-from-legacy.mjs — 직접 수정 금지.\n   텍스트를 고치려면 legacy HTML을 고치고 \`pnpm extract\`를 다시 실행하거나, 이 파일을 소스로 승격한 뒤 배너를 제거할 것. */\n`;
const J = v => JSON.stringify(v, null, 2);
const constExport = (name, v) => `export const ${name} = ${J(v)};\n`;
const write = (rel, content) => {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log("wrote", rel, `(${content.length}b)`);
};

/* ── 3. content/ ── */
const CONTENT_MAP = {
  "day-love.ts": ["DAY_LOVE","DAY_KEY","YINYANG_NOTE","STRENGTHS","CAUTIONS"],
  "spouse-palace.ts": ["SPOUSE_PALACE","SP_KEY"],
  "ten-gods.ts": ["TG_GUNGHAP","TG_KEY","TG_TODAY","TG_TODAY_SCORE"],
  "branch-relations.ts": ["BR_GUNGHAP","BR_KEY","REL_KEY","BR_TODAY"],
  "elements.ts": ["ELEM_EXCESS","ELEM_LACK","ELEM_COLOR_WORD","LUCK_TIPS","SAL_DESC"],
  "lover-profile.ts": ["LOVER_PROFILE"],
  "marriage.ts": ["MARRY_STAR_TXT","MARRY_PALACE_GOOD","MARRY_PALACE_CHUNG","MARRY_PALACE_WONJIN","MARRY_PALACE_GONGMANG","MARRIED_LIFE"],
};
for (const [file, names] of Object.entries(CONTENT_MAP)) {
  write(`content/${file}`, BANNER + names.map(n => constExport(n, bag[n])).join("\n"));
}
write("content/index.ts", BANNER + Object.keys(CONTENT_MAP).map(f => `export * from "./${f.replace(/\.ts$/, "")}";`).join("\n") + "\n");

/* ── 4. lib/engine/constants.ts ── */
const CONST_NAMES = ["STEMS","BRANCHES","ELEM","EK","YUKHAP","SAMHAP","WONJIN","HAE","DOHWA","HOURS"];
write("lib/engine/constants.ts", BANNER + CONST_NAMES.map(n => constExport(n, bag[n])).join("\n"));

/* ── 5. lib/engine/render.ts (렌더러 — 함수 소스 그대로) ── */
const CONTENT_NAMES = Object.values(CONTENT_MAP).flat();
const fnSrc = n => {
  const src = bag[n].toString();
  return src.startsWith("function") ? src : `const ${n} = ${src};`; // 화살표 함수 대응
};
const RENDER_FNS = ["sec","paras","tocHTML","pillarsHTML","ohaengHTML","baseChartSec","wolunSolarMonth",
  "charms","partnerElem","partnerStars","starName",
  "renderLove","renderGunghap","renderForecast","renderMarriage","renderToday"];
const renderTs = `// @ts-nocheck
${BANNER}
import { STEMS, BRANCHES, ELEM, EK, YUKHAP, SAMHAP, WONJIN, HAE, DOHWA } from "./constants";
import { stemIdxOf, branchIdxOf, gzName, isSamhap, isChung, branchRelation, tenGod } from "./relations";
import type { Person } from "./analyze";
import {
  ${CONTENT_NAMES.join(",\n  ")}
} from "@/content";

let SECN = 0;

${RENDER_FNS.map(fnSrc).join("\n\n")}

export { sec, paras, tocHTML, pillarsHTML, ohaengHTML, charms, partnerElem, partnerStars, starName };

export type Mode = "love" | "gunghap" | "forecast" | "marriage" | "today";

const GREET = {
  love: (A) => \`어서 오셔요, \${A.name}님. 오늘은 \${A.name}님의 사랑 이야기를 풀어 보는 날입니다. 사주는 정답이 아니라 지도예요. 어디에 꽃길이 있고 어디에 돌부리가 있는지, 제가 등불을 들고 앞서 걸을 테니 편한 마음으로 따라오셔요.\`,
  gunghap: (A, B) => \`어서 오셔요, \${A.name}님. 그리고 \${B.name}님. 두 분의 사주를 나란히 펼쳐 놓고 보니, 벌써부터 재미있는 그림이 보입니다. 급할 것 없으니, 차 한 잔 두고 처음부터 끝까지 천천히 함께 읽어 보셔요.\`,
  forecast: (A) => \`어서 오셔요, \${A.name}님. 궁금하시지요 — 나의 인연은 어떤 얼굴로, 어디에서, 언제쯤 오려나. 오늘은 그 붉은 실의 끝을 함께 따라가 보겠습니다. 조급해하지 않으셔도 됩니다. 실은 이미 매여 있으니까요.\`,
  marriage: (A) => \`어서 오셔요, \${A.name}님. 혼인이란 인생에서 가장 큰 매듭이지요. 오늘은 \${A.name}님의 사주에 예비된 배필의 그릇과 혼인의 때를, 과장도 겁주기도 없이 있는 그대로 감정해 드리겠습니다.\`,
  today: (A) => \`어서 오셔요, \${A.name}님. 오늘 하루의 애정 날씨를 짚어 보는 자리입니다. 일진은 하루살이 운 — 가볍게 읽고, 좋은 것만 챙겨 가셔요.\`,
};

/** 모드별 전체 리포트 HTML (홍실 구분선 + 목차 + 본문) */
export function renderReading(mode: Mode, A: Person, B?: Person): string {
  SECN = 0;
  let html = "";
  if (mode === "gunghap") {
    if (!B) throw new Error("궁합 모드에는 상대(B)가 필요합니다");
    html = renderGunghap(A, B);
  } else if (mode === "love") html = renderLove(A);
  else if (mode === "forecast") html = renderForecast(A);
  else if (mode === "marriage") html = renderMarriage(A);
  else html = renderToday(A);
  const greet = GREET[mode](A, B);
  return \`<hr class="thread">\` + tocHTML(html, greet) + html;
}
`;
write("lib/engine/render.ts", renderTs);

/* ── 6. app/globals.css (청월당 테마 그대로 + Next 보정) ── */
const css = legacy.match(/<style>([\s\S]*?)<\/style>/)[1];
write("app/globals.css", `@import "tailwindcss";\n\n/* ↓ legacy/월하사주.html의 청월당 테마 (추출본) */\n${css}\n/* ── Next.js 보정 ── */\na.mode-btn{text-decoration:none;}\n.mode-card{display:block;}\n`);

console.log("\n추출 완료 ✅");
