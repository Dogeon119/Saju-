/** 회원 탈퇴 — 본인 토큰 검증 후 계정 삭제 (profiles는 cascade, readings.user_id는 null로 남아 공유 링크는 유지) */
import { supabaseAdmin } from "@/lib/db/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db.auth.getUser(bearer);
  if (error || !data.user) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });

  const { error: delErr } = await db.auth.admin.deleteUser(data.user.id);
  if (delErr) return Response.json({ error: "탈퇴 처리에 실패했어요. 잠시 뒤 다시 시도해 주세요." }, { status: 500 });
  return Response.json({ ok: true });
}
