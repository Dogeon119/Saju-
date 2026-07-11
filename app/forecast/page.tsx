import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ModeTabs from "@/components/ModeTabs";
import ReadingApp from "@/components/ReadingApp";

export const metadata: Metadata = {
  title: "인연 예보",
  description: "가장 빨리 올 연인의 얼굴·성격·만남 장소·시기를 대운·세운으로 예보합니다.",
};

export default function Page() {
  return (
    <div className="wrap">
      <SiteHeader />
      <ModeTabs />
      <ReadingApp mode="forecast" />
    </div>
  );
}
