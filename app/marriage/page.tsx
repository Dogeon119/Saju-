import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ModeTabs from "@/components/ModeTabs";
import ReadingApp from "@/components/ReadingApp";

export const metadata: Metadata = {
  title: "결혼운",
  description: "배우자별·배우자궁·혼인 대길년 — 결혼의 때와 결혼 생활의 그림을 감정합니다.",
};

export default function Page() {
  return (
    <div className="wrap">
      <SiteHeader />
      <ModeTabs />
      <ReadingApp mode="marriage" />
    </div>
  );
}
