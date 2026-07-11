import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ModeTabs from "@/components/ModeTabs";
import ReadingApp from "@/components/ReadingApp";

export const metadata: Metadata = {
  title: "궁합",
  description: "두 사람의 사주를 겹쳐 일간 십성·배우자궁 합충·오행 보완·띠 궁합까지 감정합니다.",
};

export default function Page() {
  return (
    <div className="wrap">
      <SiteHeader />
      <ModeTabs />
      <ReadingApp mode="gunghap" />
    </div>
  );
}
