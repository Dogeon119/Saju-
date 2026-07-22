"use client";
import { useEffect, useState } from "react";

/** 화이트(기본·밝음) ↔ 다크 인디고 전환 — localStorage 저장, 첫 페인트는 layout 인라인 스크립트가 처리.
 *  기본이 화이트이므로 다크만 data-theme="dark"로 명시하고, 밝음은 속성 없음(:root). */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const toggle = () => {
    const next = !dark; // next = 다크로?
    setDark(next);
    if (next) document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme; // 밝음 = 기본(속성 제거)
    try { localStorage.setItem("wolha-theme", next ? "dark" : "light"); } catch { /* 사생활 모드 등 */ }
  };

  return (
    <button type="button" className="head-link" onClick={toggle}
      aria-pressed={dark} title="화면 밝기 전환">
      {dark ? "밝은 화면" : "어두운 화면"}
    </button>
  );
}
