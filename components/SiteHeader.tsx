import Link from "next/link";
import Logo from "./Logo";

export default function SiteHeader() {
  return (
    <header>
      <Link href="/" aria-label="월하 사주 홈">
        <Logo />
        <span className="brand-name">
          <span className="hanja">月 下</span>월하 사주
        </span>
      </Link>
    </header>
  );
}
