import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ModeTabs from "@/components/ModeTabs";
import ReadingApp from "@/components/ReadingApp";

export const metadata: Metadata = {
  title: "정통사주",
  description: "사주팔자·오행·십성·십이운성·신살·귀인·재물·직업·건강·대운·5년 연운과 삼재까지 열세 장의 종합 감정.",
};

export default function Page() {
  return (
    <div className="wrap">
      <SiteHeader />
      <ModeTabs />
      <ReadingApp mode="saju" />
    </div>
  );
}
