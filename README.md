# 월하(月下) 사주

맑은 달빛 아래, 인연을 조곤조곤 읽어 드립니다 — 정통사주 · 연애비책 · 사주궁합 · 올해의운세 4가지 모드의 사주 풀이 서비스. (2026년 7월 11일 시작)

- 만세력 계산: [ssaju](https://github.com/golbin/ssaju) (진태양시·절기 기반, 대운·세운·월운·십성·신살)
- 스택: Next.js (App Router) + TypeScript + Tailwind v4 · 배포: Vercel

## 실행

```bash
pnpm install
pnpm dev          # 개발 서버 (localhost:3000)
pnpm test         # 엔진·프롬프트 회귀 테스트 (vitest)
pnpm type-check   # tsc --noEmit
pnpm build        # 프로덕션 빌드
```

AI 심층 풀이(스파이크)를 쓰려면 `.env.local`에 서버 전용 키가 필요합니다:

```bash
NIM_API_KEY=nvapi-...   # build.nvidia.com 무료 개발자 키 (NEXT_PUBLIC_ 금지)
# 선택: AI_BASE_URL(기본 NVIDIA NIM) · AI_MODEL_FREE(기본 openai/gpt-oss-120b)
```

## 구조 (요약)

| 경로 | 역할 |
|---|---|
| `app/` | 화면 — 홈 + 모드 4종 (`/saju` 정통사주 13장 · `/love` 연애비책 7장 · `/gunghap` 사주궁합 8장 · `/yearly` 올해의운세 8장) |
| `components/` | 공용 컴포넌트 (SiteHeader · ModeTabs · ReadingApp) + 모드 메타(`modes.ts`) |
| `lib/engine/` | 사주 엔진 — ssaju 어댑터(`analyze.ts`) · 합충/십성(`relations.ts`) · 모드 렌더러(`modes.ts`) · 공용 렌더 헬퍼(`render.ts`) |
| `lib/ai/` + `app/api/ai-reading/` | AI 심층 풀이 스파이크 — OpenAI 호환 스트리밍 클라이언트(`client.ts`) · 프롬프트 빌더(`prompt.ts`) · 서버 재계산 라우트 |
| `content/` | 풀이 텍스트 라이브러리 (코드와 분리) |
| `legacy/` | 마이그레이션 전 단일 HTML 원본 (참조용 — 수정 금지) |
| `scripts/extract-from-legacy.mjs` | legacy → content/engine 추출 스크립트 (`pnpm extract`) |

## 문서

- [SAJU_STRUCTURE.md](SAJU_STRUCTURE.md) — 구조도 · 기능 분석 · 로드맵 (Phase 0~5)
- [DESIGN.md](DESIGN.md) — 흑단(黑檀) 디자인 시스템 (토큰·조판·금지 목록·검증). 모든 화면 작업의 단일 기준

> 본 풀이는 전통 명리학의 틀을 빌린 재미와 성찰을 위한 콘텐츠입니다.
