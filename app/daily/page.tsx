import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ReadingApp from "@/components/ReadingApp";
import PageHead from "@/components/PageHead";

export const metadata: Metadata = {
  title: "오늘의운세",
  description: "오늘의 일진이 내 사주에 닿는 자리 — 총운·사랑·일과 돈·오늘의 처방까지, 매일 새로 뜨는 하루 운세.",
};

export default function Page() {
  return (
    <div className="wrap">
      <SiteHeader />
      <PageHead mk="日" title="오늘의운세" desc="오늘의 일진이 내 사주에 닿는 자리 — 매일 새로 뜨는 하루 운이에요. 프로필을 등록해 두면 열자마자 펼쳐져요." />
      <ReadingApp mode="daily" />
    </div>
  );
}
