/** 어드민 회원 삭제 — 관리자 계정 자체는 삭제 차단 */
import { supabaseAdmin } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/api/admin-guard";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return Response.json({ error: guard.message }, { status: guard.status });

  let body: { user_id?: string };
  try { body = await req.json(); } catch { return Response.json({ error: "잘못된 요청" }, { status: 400 }); }
  const userId = String(body.user_id ?? "");
  if (!userId) return Response.json({ error: "user_id가 필요해요." }, { status: 400 });

  const db = supabaseAdmin();

  // 관리자 계정 보호
  const { data: target } = await db.auth.admin.getUserById(userId);
  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (target.user?.email && adminEmails.includes(target.user.email.toLowerCase())) {
    return Response.json({ error: "관리자 계정은 여기서 삭제할 수 없어요." }, { status: 403 });
  }

  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return Response.json({ error: "삭제에 실패했어요." }, { status: 500 });
  return Response.json({ ok: true });
}
