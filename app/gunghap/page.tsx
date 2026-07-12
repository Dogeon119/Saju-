import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ModeTabs from "@/components/ModeTabs";
import ReadingApp from "@/components/ReadingApp";
import PageHead from "@/components/PageHead";
import { MODES } from "@/components/modes";

export const metadata: Metadata = {
  title: "사주궁합",
  description: "기본 분석부터 인연·성격·감정·체질·재물·혼인궁합까지 여덟 장의 심층 궁합.",
};

export default function Page() {
  return (
    <div className="wrap">
      <SiteHeader />
      <ModeTabs />
      <PageHead mk={MODES.find(x => x.href === "/gunghap")!.mk} title={MODES.find(x => x.href === "/gunghap")!.mt} desc={MODES.find(x => x.href === "/gunghap")!.desc} />
      <ReadingApp mode="gunghap" />
    </div>
  );
}
