/** 어드민 API 공용 가드 — Bearer 토큰을 서버에서 검증하고 ADMIN_EMAILS와 대조한다 */
import { supabaseAdmin } from "../db/supabase";

export async function requireAdmin(req: Request): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (allow.length === 0) return { ok: false, status: 403, message: "어드민이 설정되지 않았어요. (ADMIN_EMAILS)" };

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!bearer) return { ok: false, status: 401, message: "로그인이 필요해요." };

  const { data, error } = await supabaseAdmin().auth.getUser(bearer);
  const email = data.user?.email?.toLowerCase();
  if (error || !email) return { ok: false, status: 401, message: "로그인이 필요해요." };
  if (!allow.includes(email)) return { ok: false, status: 403, message: "관리자 권한이 없는 계정이에요." };
  return { ok: true };
}
