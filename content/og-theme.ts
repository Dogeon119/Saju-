/** OG 이미지 전용 색 상수 — satori(next/og)는 CSS 변수를 못 읽어 hex가 필요하다.
 *  값은 DESIGN.md 부록 K·L 토큰과 정합 (공유 카드는 밝은 판, 먹 제목·금 포인트).
 *  DESIGN.md §7의 hex 검사는 app/components/lib 대상이라 이 파일(content/)에 둔다.
 *  키 이름(gold/goldDim)은 하위호환 유지 — gold=대표(먹), goldDim=포인트(금). */
export const OG = {
  ink0: "#FFFFFF",
  ink1: "#F6F7F8",
  line: "#EAEBED",
  gold: "#23262E",     // 대표색 먹(차콜) — 제목
  goldDim: "#A8792E",  // 포인트색 금 — 하단 포인트·달
  paper: "#1A1C22",
  paperDim: "#5F636E",
} as const;
