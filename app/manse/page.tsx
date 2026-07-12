import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ModeTabs from "@/components/ModeTabs";
import ReadingApp from "@/components/ReadingApp";
import PageHead from "@/components/PageHead";
import { MODES } from "@/components/modes";

export const metadata: Metadata = {
  title: "만세력",
  description: "진태양시·절기 기반 만세력 — 원국·지장간·십이운성·신살·대운·세운·월운을 표로 한눈에.",
};

export default function Page() {
  return (
    <div className="wrap">
      <SiteHeader />
      <ModeTabs />
      <PageHead mk={MODES.find(x => x.href === "/manse")!.mk} title={MODES.find(x => x.href === "/manse")!.mt} desc={MODES.find(x => x.href === "/manse")!.desc} />
      <ReadingApp mode="manse" />
    </div>
  );
}
