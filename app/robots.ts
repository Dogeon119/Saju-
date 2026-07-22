import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** 개인·관리·API 경로는 크롤 제외. 공개 감정 모드만 색인. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/r/", "/i/", "/account", "/library"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
