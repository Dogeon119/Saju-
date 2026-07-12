/** 모드 메타데이터 — 서버·클라이언트 공용 (use client 금지) */
export const MODES = [
  { href: "/saju", mk: "命", mt: "정통사주", desc: "사주팔자부터 대운·5년 연운·삼재까지, 열세 장의 종합 감정" },
  { href: "/love", mk: "戀", mt: "연애비책", desc: "나의 매력, 인연의 시기, 운명의 짝과 조심할 악연까지" },
  { href: "/gunghap", mk: "緣", mt: "사주궁합", desc: "성격·감정·체질·재물·혼인까지 여덟 장의 심층 궁합" },
  { href: "/yearly", mk: "歲", mt: "올해의운세", desc: "올해의 총운과 월별 흐름, 길흉육조까지 한 해의 지도" },
  { href: "/manse", mk: "曆", mt: "만세력", desc: "원국·지장간·대운·세운·월운을 표로 한눈에 보는 도구" },
] as const;
