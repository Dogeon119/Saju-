import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import AccountApp from "@/components/AccountApp";
import PageHead from "@/components/PageHead";

export const metadata: Metadata = {
  title: "회원",
  description: "사주 프로필·비밀번호·화면 설정까지 — 월하 회원의 모든 것을 관리합니다.",
};

export default function AccountPage() {
  return (
    <div className="wrap">
      <SiteHeader />
      <PageHead mk="人" title="회원" desc="사주 프로필을 한 번 등록하면 모든 풀이가 자동으로 시작돼요. 계정과 화면 설정도 여기서 관리해요." />
      <AccountApp />
      <p className="disclaimer">
        본 풀이는 전통 명리학의 틀을 빌린 재미와 성찰을 위한 콘텐츠입니다.<br />
        인생의 진짜 주인은 사주가 아니라 오늘의 당신입니다.
      </p>
    </div>
  );
}
