/** 어드민 감정서 삭제 — 스팸·테스트 데이터 정리용 */
import { supabaseAdmin } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/api/admin-guard";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return Response.json({ error: guard.message }, { status: guard.status });

  let body: { share_id?: string };
  try { body = await req.json(); } catch { return Response.json({ error: "잘못된 요청" }, { status: 400 }); }
  const shareId = String(body.share_id ?? "");
  if (!/^[A-Za-z0-9_-]{8,16}$/.test(shareId)) return Response.json({ error: "share_id가 올바르지 않아요." }, { status: 400 });

  const { error } = await supabaseAdmin().from("readings").delete().eq("share_id", shareId);
  if (error) return Response.json({ error: "삭제에 실패했어요." }, { status: 500 });
  return Response.json({ ok: true });
}
