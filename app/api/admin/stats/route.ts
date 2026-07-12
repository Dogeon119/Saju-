/** 어드민 통계 — ADMIN_EMAILS에 등록된 계정만. 토큰은 서버에서 검증, 데이터는 service role RPC로만 조회 */
import { supabaseAdmin } from "@/lib/db/supabase";

export const runtime = "nodejs";

function admins(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET(req: Request) {
  const allow = admins();
  if (allow.length === 0) return err(403, "어드민이 설정되지 않았어요. (ADMIN_EMAILS)");

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) return err(401, "로그인이 필요해요.");

  const db = supabaseAdmin();
  const { data, error } = await db.auth.getUser(bearer);
  const email = data.user?.email?.toLowerCase();
  if (error || !email) return err(401, "로그인이 필요해요.");
  if (!allow.includes(email)) return err(403, "관리자 권한이 없는 계정이에요.");

  const { data: stats, error: rpcErr } = await db.rpc("admin_stats");
  if (rpcErr) return err(500, "통계 조회에 실패했어요.");
  return Response.json(stats);
}

function err(status: number, message: string) {
  return Response.json({ error: message }, { status });
}
