/** 어드민 시스템 점검 — DB 응답속도, 테이블 행 수, 환경변수 유무, 배포 정보 */
import { supabaseAdmin } from "@/lib/db/supabase";
import { requireAdmin } from "@/lib/api/admin-guard";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return Response.json({ error: guard.message }, { status: guard.status });

  const db = supabaseAdmin();

  const t0 = Date.now();
  const [readings, profiles, invites] = await Promise.all([
    db.from("readings").select("id", { head: true, count: "exact" }),
    db.from("profiles").select("id", { head: true, count: "exact" }),
    db.from("invites").select("id", { head: true, count: "exact" }),
  ]);
  const dbMs = Date.now() - t0;

  return Response.json({
    db: {
      ok: !readings.error && !profiles.error && !invites.error,
      latency_ms: dbMs,
      counts: {
        readings: readings.count ?? 0,
        profiles: profiles.count ?? 0,
        invites: invites.count ?? 0,
      },
    },
    env: {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      admin_emails: !!process.env.ADMIN_EMAILS,
      admin_pin_env: !!process.env.ADMIN_PIN, // 미설정이면 코드 기본값 사용
      nim_api_key: !!process.env.NIM_API_KEY,
      anthropic_api_key: !!process.env.ANTHROPIC_API_KEY,
    },
    deploy: {
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      region: process.env.VERCEL_REGION ?? "local",
      node: process.version,
      server_time: new Date().toISOString(),
    },
  });
}
