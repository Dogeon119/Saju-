import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import AccountApp from "@/components/AccountApp";

export const metadata: Metadata = {
  title: "내 서재",
  description: "사주 프로필을 한 번 등록하면 모든 풀이가 생일 입력 없이 시작되고, 만든 감정서가 서재에 모입니다.",
};

export default function AccountPage() {
  return (
    <div className="wrap">
      <SiteHeader />
      <AccountApp />
      <p className="disclaimer">
        본 풀이는 전통 명리학의 틀을 빌린 재미와 성찰을 위한 콘텐츠입니다.<br />
        인생의 진짜 주인은 사주가 아니라 오늘의 당신입니다.
      </p>
    </div>
  );
}
