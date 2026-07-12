"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/db/browser";

/** 홈 개인화 — 프로필 등록 회원에게 오늘의 운세 바로가기를 맨 위에 띄운다 */
export default function HomeGreeting() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const sb = supabaseBrowser();
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return;
        const { data } = await sb.from("profiles").select("name,year").eq("id", session.user.id).maybeSingle();
        if (data?.year) setName((data.name as string | null)?.trim() || "회원");
      } catch { /* 게스트 홈 그대로 */ }
    })();
  }, []);

  if (!name) return null;

  return (
    <nav className="mode-list" aria-label="오늘의 운세 바로가기" style={{ marginBottom: 12 }}>
      <Link href="/daily" className="mode-row">
        <span className="mk">日</span>
        <span>
          <span className="mt">{name}님의 오늘</span>
          <span className="md">오늘 일진이 이미 준비돼 있어요 — 바로 펼쳐 보기</span>
        </span>
        <span className="chev" aria-hidden="true">›</span>
      </Link>
    </nav>
  );
}
