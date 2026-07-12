import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ModeTabs from "@/components/ModeTabs";
import ReadingApp from "@/components/ReadingApp";

export const metadata: Metadata = {
  title: "만세력",
  description: "진태양시·절기 기반 만세력 — 원국·지장간·십이운성·신살·대운·세운·월운을 표로 한눈에.",
};

export default function Page() {
  return (
    <div className="wrap">
      <SiteHeader />
      <ModeTabs />
      <ReadingApp mode="manse" />
    </div>
  );
}
