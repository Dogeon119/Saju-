"use client";
import { useEffect, useState } from "react";

/** 한지(기본) ↔ 흑단 전환 — localStorage 저장, 첫 페인트는 layout의 인라인 스크립트가 처리 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem("wolha-theme", next ? "dark" : "light"); } catch { /* 사생활 모드 등 */ }
  };

  return (
    <button type="button" className="head-link" onClick={toggle}
      aria-pressed={dark} title="화면 밝기 전환">
      {dark ? "밝은 화면" : "어두운 화면"}
    </button>
  );
}
