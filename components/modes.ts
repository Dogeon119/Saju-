/** 모드 메타데이터 — 서버·클라이언트 공용 (use client 금지) */
export const MODES = [
  { href: "/love", mk: "戀", mt: "연애운", desc: "타고난 사랑의 기질과 올해의 연애 흐름을 깊게 풀어 드립니다" },
  { href: "/gunghap", mk: "緣", mt: "궁합", desc: "두 사람의 사주를 겹쳐 인연의 깊이를 감정해 드립니다" },
  { href: "/forecast", mk: "豫", mt: "인연 예보", desc: "가장 빨리 올 연인의 얼굴·성격·시기를 미리 읽어 드립니다" },
  { href: "/marriage", mk: "婚", mt: "결혼운", desc: "배우자복과 혼인의 때, 결혼 생활의 그림을 감정해 드립니다" },
  { href: "/today", mk: "日", mt: "오늘의 연애", desc: "오늘 하루의 애정 날씨를 일진으로 짚어 드립니다" },
] as const;
