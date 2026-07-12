/** 월하 로고 — 금박 초승달. 색은 currentColor(CSS 토큰)만 사용 (DESIGN.md §1) */
export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M30 6a19 19 0 1 0 0 36 21 21 0 0 1 0-36Z" fill="currentColor" />
      <circle cx="24" cy="24" r="22.5" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}
