/** 어드민 회원 목록 — ADMIN_EMAILS 계정만, service role RPC 경유 */
import { supabaseAdmin } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/api/admin-guard";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return Response.json({ error: guard.message }, { status: guard.status });

  const { data, error } = await supabaseAdmin().rpc("admin_users");
  if (error) return Response.json({ error: "회원 목록 조회에 실패했어요." }, { status: 500 });
  return Response.json(data);
}
