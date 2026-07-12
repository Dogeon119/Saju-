import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import LibraryApp from "@/components/LibraryApp";

export const metadata: Metadata = {
  title: "서재",
  description: "내가 만든 감정서 보관함 — 공유했던 풀이를 언제든 다시 펼쳐 봅니다.",
};

export default function LibraryPage() {
  return (
    <div className="wrap">
      <SiteHeader />
      <h1 className="acct-h" style={{ marginTop: 0 }}>나의 서재</h1>
      <LibraryApp />
      <p className="disclaimer">
        본 풀이는 전통 명리학의 틀을 빌린 재미와 성찰을 위한 콘텐츠입니다.<br />
        인생의 진짜 주인은 사주가 아니라 오늘의 당신입니다.
      </p>
    </div>
  );
}
