import type { Metadata } from "next";
import localFont from "next/font/local";
import GlobalTabs from "@/components/GlobalTabs";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import "./globals.css";

/* Pretendard 셀프호스팅 (next/font/local) — CDN 미로딩 시 시스템 폰트 폴백되던 문제 제거.
 *  가변폰트 하나로 전 화면(--serif·--sans 모두 Pretendard). variable로 --font-pretendard 주입. */
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "월하 사주 — 정통사주·연애비책·사주궁합·올해의운세",
    template: "%s | 월하 사주",
  },
  description:
    "진태양시·절기 기반 만세력으로 보는 무료 사주. 정통사주·연애비책·사주궁합·올해의운세를 달빛 아래 감정서로 풀이합니다.",
  applicationName: SITE_NAME,
  keywords: [
    "사주", "무료 사주", "만세력", "사주팔자", "연애운",
    "사주궁합", "궁합", "오늘의 운세", "올해의 운세", "일주", "월하",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ko_KR",
    url: SITE_URL,
    title: "월하 사주 — 정통사주·연애비책·사주궁합·올해의운세",
    description:
      "진태양시·절기 기반 만세력으로 보는 무료 사주. 달빛 아래 감정서로 풀이합니다.",
  },
  twitter: {
    card: "summary_large_image",
    title: "월하 사주",
    description: "달빛 아래, 진태양시·절기 기반 만세력으로 보는 무료 사주 감정서.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

/* 저장된 테마를 첫 페인트 전에 적용 (FOUC 방지) — 기본은 화이트(밝음). 명시적 dark만 속성 부여 */
const themeInit = `try{if(localStorage.getItem("wolha-theme")==="dark")document.documentElement.dataset.theme="dark";}catch(e){}`;

/* 구조화 데이터 (JSON-LD) — 검색 리치결과·지식패널용. 정적이므로 안전. */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "월하 사주",
      alternateName: SITE_NAME,
      url: SITE_URL,
      inLanguage: "ko-KR",
      description:
        "진태양시·절기 기반 만세력으로 보는 무료 사주. 정통사주·연애비책·사주궁합·올해의운세 감정서.",
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a href="#main" className="skip-link">본문으로 건너뛰기</a>
        <main id="main">{children}</main>
        <GlobalTabs />
      </body>
    </html>
  );
}
