import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import AdminApp from "@/components/AdminApp";

export const metadata: Metadata = {
  title: "장부",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="wrap">
      <SiteHeader />
      <h1 className="acct-h" style={{ marginTop: 0 }}>월하의 장부</h1>
      <AdminApp />
    </div>
  );
}
