import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import HomeGreeting from "@/components/HomeGreeting";
import { MoonScene, CloudOrnament } from "@/components/art";
import { MODES } from "@/components/modes";

export default function HomePage() {
  return (
    <div className="wrap">
      <SiteHeader />
      <section className="home-hero">
        <MoonScene />
        <h1>
          달빛 아래,
          <br />
          당신의 <b>인연</b>을 읽습니다
        </h1>
        <p>진태양시·절기 기반 만세력으로, 오늘 하루의 운부터 평생의 사주까지 감정서로 펼쳐 드려요.</p>
      </section>
      <HomeGreeting />
      <nav className="mode-list mode-grid stagger" aria-label="풀이 모드">
        {MODES.map(m => (
          <Link key={m.href} href={m.href} className="mode-row">
            <span className="mk">{m.mk}</span>
            <span>
              <span className="mt">{m.mt}</span>
              <span className="md">{m.desc}</span>
            </span>
            <span className="chev" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </nav>
      <CloudOrnament />
      <p className="disclaimer">
        본 풀이는 전통 명리학의 틀을 빌린 재미와 성찰을 위한 콘텐츠입니다.<br />
        인생의 진짜 주인은 사주가 아니라 오늘의 당신입니다.
      </p>
    </div>
  );
}
