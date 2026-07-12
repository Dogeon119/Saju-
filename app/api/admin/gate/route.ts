/** 어드민 1차 게이트 — 4자리 번호 확인 (2차는 관리자 계정 로그인 + ADMIN_EMAILS 검증).
 *  TODO: IP 기준 시도 횟수 제한 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { pin?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: "잘못된 요청" }, { status: 400 }); }
  const pin = String(body.pin ?? "");
  const expected = process.env.ADMIN_PIN || "1199";
  if (pin === expected) return Response.json({ ok: true });
  return Response.json({ error: "번호가 맞지 않아요." }, { status: 401 });
}
