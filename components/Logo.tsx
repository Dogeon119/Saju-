/** 월하 로고 — 초승달(먹) 품에 안긴 쌍별(금). "달빛 아래 밤하늘" (DESIGN.md 부록 L)
 *  달=currentColor(.logo가 --primary=대표 먹) · 별=var(--gold). 테마에 자동 적응.
 *  mask는 luminance(white=보임/black=가림)라 색이 아니므로 hex 없이 white/black 키워드 사용. */
export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <mask id="wolha-moon" maskUnits="userSpaceOnUse" x="6" y="9" width="32" height="32">
        <circle cx="22.5" cy="25" r="15" fill="white" />
        <circle cx="28.6" cy="19.8" r="14.2" fill="black" />
      </mask>
      <circle cx="22.5" cy="25" r="15" fill="currentColor" mask="url(#wolha-moon)" />
      {/* 큰 별 — 초승달 열림 위 */}
      <path d="M34.5 5.4 L35.8 9.7 L40.1 11 L35.8 12.3 L34.5 16.6 L33.2 12.3 L28.9 11 L33.2 9.7 Z" fill="var(--gold)" />
      {/* 작은 별 — 초승달 품 안 */}
      <path d="M30.5 17.7 L31.2 19.8 L33.3 20.5 L31.2 21.2 L30.5 23.3 L29.8 21.2 L27.7 20.5 L29.8 19.8 Z" fill="var(--gold)" />
    </svg>
  );
}
