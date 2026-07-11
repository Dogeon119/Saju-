"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODES } from "./modes";

export default function ModeTabs() {
  const pathname = usePathname();
  const current = MODES.find(m => m.href === pathname);
  return (
    <>
      <nav className="modes" aria-label="풀이 모드">
        {MODES.map(m => (
          <Link key={m.href} href={m.href} className={`mode-btn${pathname === m.href ? " on" : ""}`}
            aria-current={pathname === m.href ? "page" : undefined}>
            <span className="mk">{m.mk}</span>
            <span className="mt">{m.mt}</span>
          </Link>
        ))}
      </nav>
      {current && <p className="mode-desc">{current.desc}</p>}
    </>
  );
}
