/** 어드민 통계 — ADMIN_EMAILS에 등록된 계정만. 토큰은 서버에서 검증, 데이터는 service role RPC로만 조회 */
import { supabaseAdmin } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/api/admin-guard";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return Response.json({ error: guard.message }, { status: guard.status });

  const { data: stats, error } = await supabaseAdmin().rpc("admin_stats");
  if (error) return Response.json({ error: "통계 조회에 실패했어요." }, { status: 500 });
  return Response.json(stats);
}
