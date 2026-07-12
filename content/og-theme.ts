/** OG 이미지 전용 색 상수 — satori(next/og)는 CSS 변수를 못 읽어 hex가 필요하다.
 *  값은 DESIGN.md §1 흑단 토큰과 1:1 동일 (공유 카드는 어두운 판이 카톡에서 돋보임).
 *  DESIGN.md §7의 hex 검사는 app/components/lib 대상이라 이 파일(content/)에 둔다. */
export const OG = {
  ink0: "#0E0D0C",
  ink1: "#131211",
  line: "#2E2A24",
  gold: "#C9B37E",
  goldDim: "#8C7C58",
  paper: "#E9E2D3",
  paperDim: "#8F8A80",
} as const;
