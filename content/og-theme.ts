/** OG 이미지 전용 색 상수 — satori(next/og)는 CSS 변수를 못 읽어 hex가 필요하다.
 *  값은 DESIGN.md §1 화이트 프리미엄 토큰과 정합 (공유 카드는 밝은 판, 인디고 제목·금 포인트).
 *  DESIGN.md §7의 hex 검사는 app/components/lib 대상이라 이 파일(content/)에 둔다. */
export const OG = {
  ink0: "#FFFFFF",
  ink1: "#F4F6FB",
  line: "#E0E4F0",
  gold: "#3B4FD1",     // 대표색 인디고 — 제목
  goldDim: "#A9812C",  // 보조색 금 — 하단 포인트·달
  paper: "#151A2C",
  paperDim: "#565D77",
} as const;
