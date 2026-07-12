"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** 앱 전역 하단 탭 — 홈(운세) · 오늘 · 달력 · 서재 · 회원 */
const TABS = [
  { href: "/", mk: "月", label: "홈", match: (p: string) => p === "/" || ["/saju", "/love", "/gunghap", "/yearly", "/manse"].includes(p) || p.startsWith("/r/") || p.startsWith("/i/") },
  { href: "/daily", mk: "日", label: "오늘", match: (p: string) => p === "/daily" },
  { href: "/calendar", mk: "曆", label: "달력", match: (p: string) => p === "/calendar" },
  { href: "/library", mk: "冊", label: "서재", match: (p: string) => p === "/library" },
  { href: "/account", mk: "人", label: "회원", match: (p: string) => p === "/account" || p === "/admin" },
] as const;

export default function GlobalTabs() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="gtabs" aria-label="주요 화면">
      {TABS.map(t => {
        const on = t.match(pathname);
        return (
          <Link key={t.href} href={t.href} className={`gtab${on ? " on" : ""}`}
            aria-current={on ? "page" : undefined}>
            <span className="gtab-mk" aria-hidden="true">{t.mk}</span>
            <span className="gtab-label">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
