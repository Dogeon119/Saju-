import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import "./globals.css";

/* DESIGN.md §2 — 명조는 Noto Serif KR 셀프호스팅, weight 400·600만 */
const serif = Noto_Serif_KR({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "월하 사주 — 정통사주·연애비책·사주궁합·올해의운세",
    template: "%s | 월하 사주",
  },
  description:
    "어두운 흑단 위에 금박으로 눌러 쓴, 달빛 아래의 감정서. 진태양시·절기 기반 만세력으로 정통사주·연애비책·사주궁합·올해의운세를 풀이합니다.",
};

/* 저장된 테마를 첫 페인트 전에 적용 (FOUC 방지) — 기본은 한지(밝음) */
const themeInit = `try{if(localStorage.getItem("wolha-theme")==="dark")document.documentElement.dataset.theme="dark";}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={serif.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
