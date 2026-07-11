# 월하(月下) 프로젝트 구조도 & 기능 분석

> Next.js + TailwindCSS + Supabase 기반 사주 풀이 서비스 (연애운·궁합·인연예보·결혼운·오늘의연애)
> (마지막 갱신: 2026-07-12 — **문서 초판**: 현재 모놀리스 구조 기록 + v1 목표 구조·로드맵 확정)
>
> 이 문서는 두 부분으로 구성된다:
> 1. **현재 구조** (아래) — 지금 코드가 실제로 이렇게 생겼다
> 2. **[v1 목표 구조 & 로드맵](#-v1-목표-구조--마이그레이션-로드맵)** (문서 하단) — 앞으로 이렇게 바꾼다

---

## 📁 현재 구조 (모놀리스)

```
📦 Saju-/
│
├── 월하사주.html                          ⭐ 단일 파일 앱 (170KB) — 현재의 전부
│   │
│   ├── 🎨 스타일 (<style>)
│   │     └─ 청월당풍 라이트 테마: 한지 미색 종이 + 청빛 먹 + 붉은 낙관 포인트
│   │        CSS 변수 팔레트 · 명조(제목)/고딕(본문) · 오행 5색 칩 (e0~e4)
│   │
│   ├── 🧮 만세력 엔진 (<script> 1번째 블록)
│   │     └─ ssaju v0.2.0 IIFE 번들 인라인 (51KB, 전역 Ssaju)
│   │        진태양시·절기 기반 사주 계산 / 대운·세운·월운 / 십성 / 신살 / 공망 / 용신·격국
│   │
│   └── 📜 앱 코드 (<script> 2번째 블록)
│       ├─ 기초 상수: STEMS(10천간) · BRANCHES(12지지) · 합충형해원진 테이블 · 도화 테이블
│       ├─ 보조 로직: branchRelation() · tenGod() — 두 사주 비교용 (ssaju는 단일 사주만 계산)
│       ├─ 어댑터: analyze() ⭐ 입력폼 → Ssaju.calculateSaju() → 앱 공용 형태
│       │     └─ 시간 모름 처리: ssaju 기본값(오시) 시주 기여분을 오행 분포에서 차감
│       ├─ 콘텐츠 라이브러리 (풀이 텍스트 — 코드의 절반 이상)
│       │     ├─ DAY_LOVE[10]        → 일간별 연애 본능 (장문)
│       │     ├─ SPOUSE_PALACE[12]   → 일지(배우자궁)별 풀이
│       │     ├─ ELEM_EXCESS/LACK[5] → 오행 과다/부족
│       │     ├─ TG_GUNGHAP{10}      → 십성별 궁합 풀이
│       │     ├─ BR_GUNGHAP{7}       → 일지 관계별(합충원진해) 궁합 풀이
│       │     ├─ LOVER_PROFILE[5]    → 오행별 미래 연인 프로필 (외모·성격·장소)
│       │     ├─ MARRY_*             → 결혼운 (배우자별 강약 3종 · 배우자궁 상태 · 결혼생활 5종)
│       │     ├─ TG_TODAY{10}/BR_TODAY{7} → 오늘의 일진 풀이
│       │     └─ *_KEY               → 각 장 상단 "핵심 한 줄" 요약
│       ├─ 렌더러 5종: renderLove · renderGunghap · renderForecast · renderMarriage · renderToday
│       │     └─ 공용: sec()(장 카드) · paras()(2문장 문단 분리) · tocHTML()(목차+인사말) ·
│       │        pillarsHTML()(사주판) · ohaengHTML()(오행 바) · baseChartSec()(원국+격국 칩)
│       └─ UI 배선: 모드 탭 5개 · 입력폼(본인/상대) · 제출 핸들러
│
└── README.md                              → (저장소 초기 생성분)
```

### 현재 배포 상태

| 채널 | 상태 |
|---|---|
| Claude Artifact | https://claude.ai/code/artifact/95762db9-8b1b-4037-976d-8bd4facbccb3 (비공개, 수동 재배포) |
| GitHub | Dogeon119/Saju- `main` (수동 push) |
| Vercel | ❌ 미연결 — Phase 0에서 연결 |

### 현재 구조의 한계 (마이그레이션 이유)

- **공유 불가에 가깝다**: CSR 단일 파일이라 풀이 결과를 남에게 보여 줄 URL이 없고, 카톡 미리보기 카드도 안 뜬다 → 사주 서비스의 성장 엔진(공유·바이럴)이 막혀 있다
- **저장 불가**: 회원·히스토리 없음. 매번 생일 재입력
- **콘텐츠와 코드가 한 파일**: 풀이 텍스트 수정에 코드 배포가 필요
- **검색 유입 0**: SSR이 없어 "정미일주 연애" 같은 검색에 안 잡힌다

---

# 🎯 v1 목표 구조 & 마이그레이션 로드맵

> 스택 확정 (2026-07-12): **Next.js(App Router) + TypeScript + Tailwind v4 + Supabase(Auth·Postgres) + Vercel**
> 선택 이유: ① 공유 링크의 카톡 미리보기(SSR+OG 이미지) ② 검색 유입(SEO) ③ AI·결제·공유를 Next API 라우트 하나의 런타임으로 통합 — SION의 Vite+Edge Function 이원 구조 대비 단순

## 📁 목표 구조도

```
📦 Saju-/ (서비스명: 월하 月下)
│
├── 🎨 앱 (Next.js App Router + TS + Tailwind v4)
│   │
│   ├── 🚪 진입/레이아웃
│   │   ├── app/layout.tsx                  → 루트 레이아웃 (청월당 테마 · 폰트 · 메타)
│   │   ├── app/page.tsx                    → 홈: 모드 선택 + 생일 입력 (게스트 기본)
│   │   └── middleware.ts                   → 세션 갱신 (Supabase SSR 헬퍼)
│   │
│   ├── 🔮 풀이 화면 (모드 5종 — 라우트가 곧 모드)
│   │   ├── app/love/page.tsx               → 연애운 (8장 구성)
│   │   ├── app/gunghap/page.tsx            → 궁합 (2인 입력 · 8장)
│   │   ├── app/forecast/page.tsx           → 인연 예보 (대운·세운 타임라인 · 8장)
│   │   ├── app/marriage/page.tsx           → 결혼운 (배우자별·혼인 대길년 · 7장)
│   │   └── app/today/page.tsx              → 오늘의 연애 일진 (경량 4장)
│   │
│   ├── 🔗 공유 (Phase 1 — 바이럴 핵심)
│   │   ├── app/share/[id]/page.tsx         ⭐ 풀이 결과 읽기전용 SSR 페이지
│   │   ├── app/share/[id]/opengraph-image.tsx ⭐ OG 카드 동적 생성 (점수·일주·한줄평)
│   │   └── app/invite/[id]/page.tsx        → 궁합 초대: 상대가 자기 생일만 입력하면 궁합 완성
│   │
│   ├── 👤 마이페이지 (Phase 2)
│   │   ├── app/me/page.tsx                 → 내 사주 프로필 (생일 저장 → 재입력 불필요)
│   │   ├── app/me/readings/page.tsx        → 저장된 풀이 히스토리
│   │   └── app/me/partners/page.tsx        → 궁합 상대 목록 (이름+생일 카드)
│   │
│   ├── 📈 SEO 콘텐츠 (Phase 5 — 검색 유입)
│   │   ├── app/iljus/[ilju]/page.tsx       → 일주 60종 정적 페이지 ("정미일주 연애 특징")
│   │   └── app/daily/[date]/page.tsx       → 오늘의 연애운 데일리 (ISR, Cron이 미리 생성)
│   │
│   ├── 🔌 API 라우트 (app/api/)
│   │   ├── reading/route.ts                → 풀이 생성·저장 (게스트는 익명 저장)
│   │   ├── share/route.ts                  → 공유 ID 발급
│   │   ├── ai-reading/route.ts             ⭐ Claude API 프록시 (스트리밍, Phase 3)
│   │   ├── pay/webhook/route.ts            → 토스페이먼츠 웹훅 (Phase 4)
│   │   └── cron/daily/route.ts             → 데일리 운세 사전 생성 (Vercel Cron)
│   │
│   └── 🧩 공용 컴포넌트 (components/)
│       ├── PillarBoard.tsx                 ⭐ 사주판 (4기둥 한자 카드 + 오행 색)
│       ├── OhaengBar.tsx / ScoreGauge.tsx  → 오행 분포 바 · 점수 게이지
│       ├── SectionCard.tsx / KeyBox.tsx    → 장(章) 카드 · "핵심 한 줄" 박스
│       ├── TocCard.tsx                     → 목차 + 청월당식 인사말
│       ├── ThreadDivider.tsx               → 홍실 구분선
│       ├── BirthForm.tsx                   → 생일·시간(12지시)·성별 입력 (본인/상대 재사용)
│       ├── ModeTabs.tsx                    → 5모드 탭
│       └── ShareButton.tsx                 → 공유 링크 복사 + 카드 미리보기
│
├── 🧮 사주 엔진 (lib/engine/)              ⭐ 프론트·서버 공용 순수 함수 — React 의존 금지
│   ├── ssaju.ts                            → ssaju(npm) 래퍼: calculateSaju + 시간모름 보정
│   ├── relations.ts                        → 합충형해원진 · 십성(tenGod) · 도화 (2인 비교용)
│   ├── scoring.ts                          → 궁합 점수 · 연도/월 타이밍 점수 · 일진 점수
│   ├── types.ts                            → Person · Reading · Mode 공유 타입
│   └── engine.test.ts                      ✅ 알려진 사주 회귀 테스트 (2000-01-01=무오일 등)
│
├── 📚 콘텐츠 (content/)                    ⭐ 풀이 텍스트 전부 — 코드와 분리, 텍스트만 고쳐도 배포 가능
│   ├── day-love.ts (일간 10) · spouse-palace.ts (일지 12)
│   ├── ten-gods.ts (궁합 10) · branch-relations.ts (합충 7) · elements.ts (과다/부족 10)
│   ├── lover-profile.ts (오행 5) · marriage.ts · today.ts · keys.ts (핵심 한줄 모음)
│   └── greetings.ts                        → 청월당식 인사말·월하노인 예언 템플릿
│
├── 🤖 AI 심층 풀이 (lib/ai/ — Phase 3)
│   ├── prompt.ts                           → ssaju 결과(toMarkdown) + 모드별 시스템 프롬프트
│   ├── client.ts                           → Claude API (claude-sonnet-5) 스트리밍 호출
│   └── cache.ts                            → 동일 (사주+모드) 결과 재사용 — API 비용 방어 1선
│
├── 🗄 DB (Supabase Postgres + Auth)
│   ├── profiles                            → 유저 프로필 (닉네임 · 생일 · 시간 · 성별)
│   ├── partners                            → 궁합 상대 (user_id · 이름 · 생일)
│   ├── readings                            → 저장된 풀이 (mode · input · result_json · is_ai)
│   ├── shares                              → 공유 링크 (short_id → reading_id, 만료 옵션)
│   ├── purchases                           → 결제 기록 (Phase 4)
│   ├── daily_cache                         → 데일리 운세 사전 생성분
│   └── RLS                                 ⛔ 전 테이블 Row Level Security 필수 (본인 데이터만)
│
├── 💳 수익 모델 (Phase 4)
│   ├── 무료: 5모드 기본 풀이 (현재 콘텐츠) + AI 풀이 1일 1회
│   ├── 프리미엄: AI 심층 풀이 무제한 · PDF 리포트 · 궁합 상세 비교
│   └── 결제: 토스페이먼츠 (단건 → 추후 구독)
│
├── 🚀 인프라
│   ├── GitHub (Dogeon119/Saju-)
│   │   └── push 시 자동 트리거: Vercel 배포 (icn1 리전)
│   ├── Vercel
│   │   ├── Next.js 호스팅 + API 라우트 + OG 이미지 생성
│   │   └── Cron: daily-fortune (매일 00:05 KST) → /api/cron/daily
│   ├── Supabase (신규 프로젝트)
│   │   ├── Auth: 카카오 로그인 ⭐ (타깃 유저 = 카톡 공유 유저) + 이메일
│   │   └── Postgres (위 스키마)
│   └── Secrets (Vercel 환경변수)
│       ├── NEXT_PUBLIC_SUPABASE_URL / ANON_KEY · SUPABASE_SERVICE_ROLE_KEY
│       ├── ANTHROPIC_API_KEY (Phase 3)
│       └── TOSS_SECRET_KEY (Phase 4)
│
└── 📄 문서·설정
    ├── README.md                           → 개요·실행·문서 인덱스 (진입점)
    ├── SAJU_STRUCTURE.md                   → (이 파일) 구조도·기능·로드맵
    ├── SAJU_DESIGN.md                      → 청월당 디자인 시스템 (팔레트·타이포·말투 가이드) — Phase 0에서 작성
    ├── SAJU_CONTENT.md                     → 풀이 텍스트 집필 가이드 (톤: 다정한 존댓말·핵심 한 줄·2문장 문단)
    ├── legacy/월하사주.html                → 현재 모놀리스 보존 (참조용, 수정 금지)
    ├── package.json                        → pnpm 사용
    └── .github/workflows/ci.yml            → CI (typecheck · engine 테스트 · build)
```

---

## 🗺 마이그레이션 로드맵

> 각 Phase는 **배포 가능한 상태로 끝난다** (SION 방식). 완료 시 이 문서의 갱신 주석을 업데이트한다.

### Phase 0 — 리포 부트스트랩 (기반 공사)
- [ ] Next.js + TS + Tailwind v4 스캐폴드, pnpm 전환
- [ ] `월하사주.html` → `legacy/`로 이동 (보존)
- [ ] 모놀리스 해체 이식: 엔진 → `lib/engine/` · 텍스트 → `content/` · 렌더러 → 모드 페이지 + 컴포넌트
- [ ] ssaju를 IIFE 인라인 대신 **npm 의존성**으로 전환
- [ ] 엔진 회귀 테스트 (`engine.test.ts`) + CI
- [ ] Vercel 연결 (push 자동 배포)
- **완료 기준(DoD)**: 배포된 사이트에서 5개 모드가 현재 HTML과 동일하게 동작

### Phase 1 — 공유 (성장 엔진 먼저)
- [ ] 풀이 결과 저장(익명) + `share/[id]` 읽기전용 페이지
- [ ] OG 이미지 동적 생성 (점수·일주·한줄평 카드)
- [ ] 궁합 초대 링크: 내 생일 채운 링크 전송 → 상대가 자기 생일 입력 → 양쪽 모두 결과 열람
- **DoD**: 카톡에 링크를 보내면 미리보기 카드가 뜨고, 받은 사람이 앱 설치·가입 없이 풀이를 본다

### Phase 2 — 회원 & 저장
- [ ] Supabase Auth (카카오 우선) + RLS
- [ ] 내 사주 프로필 (생일 1회 등록 → 전 모드 자동 입력)
- [ ] 풀이 히스토리 · 궁합 상대 목록
- **DoD**: 재방문 유저가 생일 입력 없이 3탭 안에 새 풀이를 받는다

### Phase 3 — AI 심층 풀이
- [ ] `/api/ai-reading` Claude API 스트리밍 (기본 풀이 하단 "AI 심층 풀이 받기" 버튼)
- [ ] 프롬프트: ssaju `toMarkdown()` 원국 + 모드별 지침 + SAJU_CONTENT.md 말투 가이드
- [ ] 캐싱(동일 사주+모드) + 무료 1일 1회 제한 (비용 방어)
- **DoD**: 기본 풀이와 겹치지 않는 개인 맞춤 장문 풀이가 스트리밍으로 출력

### Phase 4 — 유료화
- [ ] 토스페이먼츠 단건 결제 + `purchases` 기록
- [ ] 프리미엄 게이트: AI 무제한 · PDF 리포트 · 궁합 상세
- **DoD**: 결제 → 즉시 프리미엄 기능 해금, 웹훅 검증 통과

### Phase 5 — SEO 콘텐츠 (지속 유입)
- [ ] 일주 60종 정적 페이지 (`generateStaticParams`)
- [ ] 데일리 운세 페이지 (Vercel Cron 사전 생성 + ISR)
- [ ] sitemap · 구조화 데이터
- **DoD**: 검색 콘솔에 일주 페이지 인덱싱 확인

---

## 📐 설계 원칙

1. **엔진은 순수 함수** — `lib/engine/`은 React·DB를 모른다. 프론트 미리보기와 서버 저장이 같은 코드를 쓴다
2. **콘텐츠와 코드 분리** — 풀이 텍스트 수정은 `content/`만 건드린다. 말투는 SAJU_CONTENT.md 가이드(다정한 존댓말 · 장마다 핵심 한 줄 · 2문장 문단)를 따른다
3. **계산은 ssaju에 위임** — 만세력·대운·십성·신살을 직접 구현하지 않는다. 2인 비교(궁합)처럼 ssaju가 없는 것만 `relations.ts`에 얹는다
4. **게스트 우선** — 로그인 없이 모든 기본 풀이 가능. 회원 가입은 "저장하고 싶을 때" 유도 (SION의 게스트 모드와 동일 철학)
5. **공유가 곧 마케팅** — 새 기능마다 "이걸 카톡으로 보내면 어떻게 보이나"를 먼저 설계한다
