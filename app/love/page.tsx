import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ModeTabs from "@/components/ModeTabs";
import ReadingApp from "@/components/ReadingApp";
import PageHead from "@/components/PageHead";
import { MODES } from "@/components/modes";

export const metadata: Metadata = {
  title: "연애비책",
  description: "나의 매력, 연애운의 흐름과 시기, 운명의 짝과 조심할 악연까지 일곱 장의 연애 풀이.",
};

export default function Page() {
  return (
    <div className="wrap">
      <SiteHeader />
      <ModeTabs />
      <PageHead mk={MODES.find(x => x.href === "/love")!.mk} title={MODES.find(x => x.href === "/love")!.mt} desc={MODES.find(x => x.href === "/love")!.desc} />
      <ReadingApp mode="love" />
    </div>
  );
}
