import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { MODES } from "@/components/modes";

export default function HomePage() {
  return (
    <div className="wrap">
      <SiteHeader />
      <nav className="modes" aria-label="풀이 모드" style={{ gridTemplateColumns: "repeat(1, 1fr)", gap: 12 }}>
        {MODES.map(m => (
          <Link key={m.href} href={m.href} className="mode-btn mode-card" style={{ textAlign: "left", padding: "18px 20px" }}>
            <span className="mk" style={{ float: "left", marginRight: 14, fontSize: 26 }}>{m.mk}</span>
            <span className="mt" style={{ fontSize: 16 }}>{m.mt}</span>
            <span style={{ display: "block", color: "var(--mut)", fontSize: 13.5, marginTop: 2 }}>{m.desc}</span>
          </Link>
        ))}
      </nav>
      <p className="disclaimer">
        본 풀이는 전통 명리학의 틀을 빌린 재미와 성찰을 위한 콘텐츠입니다.<br />
        인생의 진짜 주인은 사주가 아니라 오늘의 당신입니다. 🌙
      </p>
    </div>
  );
}
