# 월하(月下) 사주

맑은 달빛 아래, 인연을 조곤조곤 읽어 드립니다 — 연애운 · 궁합 · 인연 예보 · 결혼운 · 오늘의 연애 5가지 모드의 사주 풀이 서비스. (2026년 7월 11일 시작)

- 만세력 계산: [ssaju](https://github.com/golbin/ssaju) (진태양시·절기 기반, 대운·세운·월운·십성·신살)
- 스택: Next.js (App Router) + TypeScript + Tailwind v4 · 배포: Vercel

## 실행

```bash
pnpm install
pnpm dev          # 개발 서버 (localhost:3000)
pnpm test         # 엔진 회귀 테스트 (vitest)
pnpm type-check   # tsc --noEmit
pnpm build        # 프로덕션 빌드
```

## 구조 (요약)

| 경로 | 역할 |
|---|---|
| `app/` | 화면 — 홈 + 모드 5종 (`/love` `/gunghap` `/forecast` `/marriage` `/today`) |
| `components/` | 공용 컴포넌트 (SiteHeader · ModeTabs · ReadingApp) |
| `lib/engine/` | 사주 엔진 — ssaju 어댑터(`analyze.ts`) · 합충/십성(`relations.ts`) · 리포트 렌더러(`render.ts`) |
| `content/` | 풀이 텍스트 라이브러리 (코드와 분리) |
| `legacy/` | 마이그레이션 전 단일 HTML 원본 (참조용 — 수정 금지) |
| `scripts/extract-from-legacy.mjs` | legacy → content/engine 추출 스크립트 (`pnpm extract`) |

## 문서

- [SAJU_STRUCTURE.md](SAJU_STRUCTURE.md) — 구조도 · 기능 분석 · 로드맵 (Phase 0~5)

> 본 풀이는 전통 명리학의 틀을 빌린 재미와 성찰을 위한 콘텐츠입니다.
