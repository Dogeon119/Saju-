import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import PageHead from "@/components/PageHead";
import CalendarApp from "@/components/CalendarApp";

export const metadata: Metadata = {
  title: "운세 달력",
  description: "매일의 일진(60갑자)과 절기·손없는날을 달력으로 — 사주 프로필을 등록하면 나에게 좋은 날과 조심할 날이 표시됩니다.",
};

export default function CalendarPage() {
  return (
    <div className="wrap">
      <SiteHeader />
      <PageHead mk="曆" title="운세 달력"
        desc="매일의 일진과 절기, 손없는날을 한 달로 펼쳐요. 프로필을 등록하면 나의 길일과 조심할 날까지 표시돼요." />
      <CalendarApp />
      <p className="disclaimer">
        본 풀이는 전통 명리학의 틀을 빌린 재미와 성찰을 위한 콘텐츠입니다.<br />
        인생의 진짜 주인은 사주가 아니라 오늘의 당신입니다.
      </p>
    </div>
  );
}
