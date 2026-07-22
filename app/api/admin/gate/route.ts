/** 어드민 1차 게이트 — 4자리 번호 확인 (2차는 관리자 계정 로그인 + ADMIN_EMAILS 검증).
 *  TODO: IP 기준 시도 횟수 제한 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { pin?: unknown };
  try { body = await req.json(); } catch { return Response.json({ error: "잘못된 요청" }, { status: 400 }); }
  const pin = String(body.pin ?? "");
  const expected = process.env.ADMIN_PIN;
  if (!expected) {
    // 서버에 PIN 미설정 — 하드코딩 폴백 없이 실패(fail-closed). TODO: IP 기준 시도 제한(@upstash/ratelimit)
    return Response.json({ error: "관리자 설정 오류로 접근할 수 없어요." }, { status: 503 });
  }
  if (pin.length >= 4 && pin === expected) return Response.json({ ok: true });
  return Response.json({ error: "번호가 맞지 않아요." }, { status: 401 });
}
