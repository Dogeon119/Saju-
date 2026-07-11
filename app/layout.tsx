import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "월하 사주 — 연애·궁합·결혼·인연 예보",
    template: "%s | 월하 사주",
  },
  description:
    "맑은 달빛 아래, 당신의 인연을 조곤조곤 읽어 드립니다. 진태양시·절기 기반 만세력으로 연애운·궁합·인연 예보·결혼운·오늘의 연애를 풀이합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
