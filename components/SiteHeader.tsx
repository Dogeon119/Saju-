import Link from "next/link";
import Logo from "./Logo";

export default function SiteHeader() {
  return (
    <header>
      <Link href="/" aria-label="월하 사주 홈" className="brand">
        <Logo />
        <span className="brand-name">
          <span className="hanja">月 下</span>월하 사주
        </span>
      </Link>
      <Link href="/account" className="head-link">내 서재</Link>
    </header>
  );
}
