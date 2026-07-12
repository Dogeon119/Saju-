import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ModeTabs from "@/components/ModeTabs";
import ReadingApp from "@/components/ReadingApp";
import PageHead from "@/components/PageHead";
import { MODES } from "@/components/modes";

export const metadata: Metadata = {
  title: "올해의 운세",
  description: "올해의 총운·재물·건강·애정·직장·학업과 12개월 월별 운세, 길흉육조.",
};

export default function Page() {
  return (
    <div className="wrap">
      <SiteHeader />
      <ModeTabs />
      <PageHead mk={MODES.find(x => x.href === "/yearly")!.mk} title={MODES.find(x => x.href === "/yearly")!.mt} desc={MODES.find(x => x.href === "/yearly")!.desc} />
      <ReadingApp mode="yearly" />
    </div>
  );
}
