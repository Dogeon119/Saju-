/** 궁합 초대 — 내 정보만 담은 초대 링크 발급. 상대는 /i/[inviteId]에서 자기 생일만 입력하면 된다. */
import { randomBytes } from "node:crypto";
import { analyzePerson } from "@/lib/engine/analyze";
import { supabaseAdmin } from "@/lib/db/supabase";
import { toInput, toPayload, clampIdx, type PersonPayload } from "@/lib/api/person";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { me?: PersonPayload; relStatus?: number; relGap?: number };
  try { body = await req.json(); } catch { return err(400, "잘못된 요청 형식이에요."); }

  const meInput = body.me && toInput(body.me, "상대방");
  if (!meInput) return err(400, "내 생년월일 정보가 올바르지 않아요.");
  try { analyzePerson(meInput); } catch { return err(400, "만세력에 없는 날짜예요. 생년월일을 확인해 주세요."); }

  const payload = {
    me: toPayload(meInput),
    relStatus: clampIdx(body.relStatus, 6),
    relGap: clampIdx(body.relGap, 3),
  };

  const db = supabaseAdmin();
  for (let attempt = 0; attempt < 2; attempt++) {
    const inviteId = randomBytes(8).toString("base64url");
    const { error } = await db.from("invites").insert({ invite_id: inviteId, payload });
    if (!error) return Response.json({ inviteId, path: `/i/${inviteId}` });
    if (error.code !== "23505") return err(500, "초대장 만들기에 실패했어요. 잠시 뒤 다시 시도해 주세요.");
  }
  return err(500, "초대장 만들기에 실패했어요. 잠시 뒤 다시 시도해 주세요.");
}

function err(status: number, message: string) {
  return Response.json({ error: message }, { status });
}
