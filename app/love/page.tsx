import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ModeTabs from "@/components/ModeTabs";
import ReadingApp from "@/components/ReadingApp";

export const metadata: Metadata = {
  title: "연애운",
  description: "타고난 사랑의 기질과 올해의 연애 흐름 — 일간·배우자궁·오행·신살·세운으로 깊게 풀어 드립니다.",
};

export default function Page() {
  return (
    <div className="wrap">
      <SiteHeader />
      <ModeTabs />
      <ReadingApp mode="love" />
    </div>
  );
}
