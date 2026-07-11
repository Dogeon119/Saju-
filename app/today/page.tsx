import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ModeTabs from "@/components/ModeTabs";
import ReadingApp from "@/components/ReadingApp";

export const metadata: Metadata = {
  title: "오늘의 연애",
  description: "오늘의 일진과 내 사주를 대조한 하루 애정 날씨와 행운 포인트.",
};

export default function Page() {
  return (
    <div className="wrap">
      <SiteHeader />
      <ModeTabs />
      <ReadingApp mode="today" />
    </div>
  );
}
