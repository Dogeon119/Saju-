import Link from "next/link";

export default function SiteHeader() {
  return (
    <header>
      <Link href="/" aria-label="월하 사주 홈" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="seal" aria-hidden="true">月下</div>
        <h1>
          <span className="hanja">靑月堂 月下</span>월하 사주
        </h1>
      </Link>
      <p className="tagline">맑은 달빛 아래, 당신의 인연을 조곤조곤 읽어 드립니다</p>
    </header>
  );
}
