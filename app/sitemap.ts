import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** 공개·색인 대상 라우트만. 개인/공유(/r,/i)·회원(/account,/library)·관리자·API는 제외(robots.ts와 정합). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entry = (
    path: string,
    priority: number,
    changeFrequency: "daily" | "weekly" | "monthly",
  ) => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority });

  return [
    entry("/", 1.0, "weekly"),
    entry("/saju", 0.9, "weekly"),
    entry("/love", 0.9, "weekly"),
    entry("/gunghap", 0.9, "weekly"),
    entry("/yearly", 0.8, "weekly"),
    entry("/manse", 0.7, "monthly"),
    entry("/daily", 0.7, "daily"),
    entry("/calendar", 0.6, "daily"),
  ];
}
