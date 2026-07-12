/** 장식 일러스트 — 수묵 선화 문법 (DESIGN.md 부록 F)
 *  색은 토큰 var()만 · 인라인 SVG만 · 화면당 주 장식 1개 · aria-hidden */

/** 홈 히어로 — 보름달과 운문(雲紋) 구름, 산 능선, 별 */
export function MoonScene() {
  return (
    <svg className="hero-art" viewBox="0 0 380 320" aria-hidden="true" focusable="false">
      {/* 별 — 네 점 반짝이 */}
      <path d="M52 46l2.6 6.4L61 55l-6.4 2.6L52 64l-2.6-6.4L43 55l6.4-2.6Z" fill="var(--gold-dim)" opacity=".55" />
      <path d="M330 34l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="var(--gold-dim)" opacity=".4" />
      <path d="M96 118l1.7 4.2 4.3 1.6-4.3 1.7-1.7 4.2-1.6-4.2-4.3-1.7 4.3-1.6Z" fill="var(--gold-dim)" opacity=".45" />
      <circle cx="288" cy="220" r="1.6" fill="var(--gold-dim)" opacity=".5" />
      <circle cx="120" cy="30" r="1.4" fill="var(--gold-dim)" opacity=".4" />

      {/* 보름달 */}
      <circle cx="232" cy="120" r="76" fill="var(--gold)" opacity=".13" />
      <circle cx="232" cy="120" r="76" fill="none" stroke="var(--gold-dim)" strokeWidth="1.4" opacity=".9" />
      <circle cx="232" cy="120" r="66" fill="none" stroke="var(--gold-dim)" strokeWidth=".6" opacity=".35" />

      {/* 구름 — 달 아랫자락을 가리는 운문 (지면색 채움 + 금선) */}
      <path
        d="M116 158
           q16 -20 44 -14 q10 -14 32 -12 q24 2 30 16 q26 -6 40 8 q18 -4 30 6 q16 -4 26 6
           l0 20 q-18 10 -40 6 q-14 10 -36 6 q-20 12 -44 4 q-26 8 -46 -4 q-22 4 -36 -8 Z"
        fill="var(--ink-0)" stroke="var(--gold-dim)" strokeWidth="1.2" strokeLinecap="round" opacity=".95" />
      {/* 구름 속 소용돌이 획 */}
      <path d="M170 152q10 -8 22 -2" fill="none" stroke="var(--gold-dim)" strokeWidth="1" opacity=".5" strokeLinecap="round" />
      <path d="M226 158q12 -8 24 0" fill="none" stroke="var(--gold-dim)" strokeWidth="1" opacity=".5" strokeLinecap="round" />
      <path d="M270 166q9 -6 18 -1" fill="none" stroke="var(--gold-dim)" strokeWidth="1" opacity=".4" strokeLinecap="round" />

      {/* 잔구름 한 줄 */}
      <path d="M60 210q14 -12 34 -8q9 -9 24 -7q18 2 23 11q16 -3 26 5l-4 9q-16 5 -30 1q-14 7 -30 3q-18 5 -32 -2q-8 1 -13 -3Z"
        fill="var(--ink-0)" stroke="var(--line-strong)" strokeWidth="1" strokeLinecap="round" opacity=".9" />

      {/* 산 능선 — 두 겹 */}
      <path d="M0 292q46 -34 92 -26q38 -26 84 -18q42 -20 88 -8q40 -12 76 2q22 6 40 18"
        fill="none" stroke="var(--line-strong)" strokeWidth="1.3" opacity=".8" />
      <path d="M28 302q40 -22 80 -16q36 -18 78 -10q44 -14 90 -2q36 -8 72 6"
        fill="none" stroke="var(--line-strong)" strokeWidth="1" opacity=".45" />
    </svg>
  );
}

/** 운문 구분 오너먼트 — 괘선 사이 작은 구름 한 점 */
export function CloudOrnament() {
  return (
    <div className="ornament" aria-hidden="true">
      <svg viewBox="0 0 160 22" focusable="false">
        <path d="M2 12h44" stroke="var(--line-strong)" strokeWidth="1" strokeLinecap="round" />
        <path d="M114 12h44" stroke="var(--line-strong)" strokeWidth="1" strokeLinecap="round" />
        <path d="M56 14q6 -8 16 -6q4 -6 13 -5q10 1 12 8q8 -2 13 3q-5 5 -13 4q-6 5 -15 3q-10 3 -18 -2q-6 1 -8 -5Z"
          fill="none" stroke="var(--gold-dim)" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** 빈 상태 — 달빛 아래 펼친 책 (서재·감정서 없음) */
export function EmptyBooksArt() {
  return (
    <svg className="empty-art" viewBox="0 0 200 120" aria-hidden="true" focusable="false">
      <circle cx="150" cy="34" r="22" fill="var(--gold)" opacity=".12" />
      <circle cx="150" cy="34" r="22" fill="none" stroke="var(--gold-dim)" strokeWidth="1.2" />
      <path d="M36 42l1.8 4.4 4.4 1.8-4.4 1.8-1.8 4.4-1.8-4.4-4.4-1.8 4.4-1.8Z" fill="var(--gold-dim)" opacity=".5" />
      {/* 펼친 책 */}
      <path d="M40 92q30 -14 60 0q30 -14 60 0l0 6q-30 -12 -60 0q-30 -12 -60 0Z"
        fill="var(--ink-1)" stroke="var(--line-strong)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M100 92l0 6" stroke="var(--line-strong)" strokeWidth="1" />
      <path d="M52 84q22 -9 42 -1M52 76q22 -9 42 -1" fill="none" stroke="var(--line-strong)" strokeWidth=".9" opacity=".6" strokeLinecap="round" />
      <path d="M106 83q22 -9 42 -1M106 75q22 -9 42 -1" fill="none" stroke="var(--line-strong)" strokeWidth=".9" opacity=".6" strokeLinecap="round" />
    </svg>
  );
}
