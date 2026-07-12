import type { Metadata } from "next";
import AdminApp from "@/components/AdminApp";

export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

/** 관리자 콘솔 — 브랜드 테마와 분리된 모던 화이트 구역 (DESIGN.md 부록 D) */
export default function AdminPage() {
  return (
    <div className="admin-shell">
      <div className="admin-con">
        <AdminApp />
      </div>
    </div>
  );
}
