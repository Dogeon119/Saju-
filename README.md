# 월하(月下) 사주

맑은 달빛 아래, 인연을 조곤조곤 읽어 드립니다 — 정통사주 · 연애비책 · 사주궁합 · 올해의운세 · 오늘의운세 · 만세력 6가지 모드의 사주 풀이 서비스. (2026년 7월 11일 시작 · https://wolha-saju.vercel.app)

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

환경변수 (`.env.local` · Vercel 프로젝트 설정에도 동일하게):

```bash
# Supabase (풀이 저장·공유 — 프로젝트 wolha-saju, 서울)
NEXT_PUBLIC_SUPABASE_URL=https://ygxqngctuywtzctlknbk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...     # 서버 전용, 절대 NEXT_PUBLIC_ 금지

# AI 심층 풀이 (Phase 3 스파이크)
NIM_API_KEY=nvapi-...             # build.nvidia.com 무료 개발자 키 (서버 전용)
# 선택: AI_BASE_URL(기본 NVIDIA NIM) · AI_MODEL_FREE(기본 openai/gpt-oss-120b)
```

## 구조 (요약)

| 경로 | 역할 |
|---|---|
| `app/` | 화면 — 홈 + 모드 6종 (`/saju` 정통사주 13장 · `/love` 연애비책 7장 · `/gunghap` 사주궁합 8장 · `/yearly` 올해의운세 8장 · `/daily` 오늘의운세 4장 · `/manse` 만세력 6장) + `/account` 내 서재 · `/admin` 장부 · `/r` 공유 · `/i` 궁합 초대 |
| `components/` | 공용 컴포넌트 (SiteHeader · ModeTabs · ReadingApp) + 모드 메타(`modes.ts`) |
| `lib/engine/` | 사주 엔진 — ssaju 어댑터(`analyze.ts`) · 합충/십성(`relations.ts`) · 모드 렌더러(`modes.ts`) · 공용 렌더 헬퍼(`render.ts`) |
| `lib/ai/` + `app/api/ai-reading/` | AI 심층 풀이 스파이크 — OpenAI 호환 스트리밍 클라이언트(`client.ts`) · 프롬프트 빌더(`prompt.ts`) · 서버 재계산 라우트 |
| `lib/db/` + `app/api/reading/` + `app/r/[shareId]/` | Supabase 저장·공유 — 풀이 저장(share_id 발급) · 공유 감정서 페이지(서버 재계산 재현) |
| `app/account/` + `components/AccountApp.tsx` | 내 서재 — 이메일 가입·로그인, 사주 프로필(전 모드 자동 채움), 감정서 히스토리 (RLS 본인만) |
| `lib/api/` | API 공용 입력 검증 (`person.ts` — 클라이언트 원국 불신, 서버 재계산 원칙) |
| `content/` | 풀이 텍스트 라이브러리 (코드와 분리) |
| `legacy/` | 마이그레이션 전 단일 HTML 원본 (참조용 — 수정 금지) |
| `scripts/extract-from-legacy.mjs` | legacy → content/engine 추출 스크립트 (`pnpm extract`) |

## 문서

- [SAJU_STRUCTURE.md](SAJU_STRUCTURE.md) — 구조도 · 기능 분석 · 로드맵 (Phase 0~5)
- [DESIGN.md](DESIGN.md) — 흑단(黑檀) 디자인 시스템 (토큰·조판·금지 목록·검증). 모든 화면 작업의 단일 기준

> 본 풀이는 전통 명리학의 틀을 빌린 재미와 성찰을 위한 콘텐츠입니다.
