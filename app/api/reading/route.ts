/** 풀이 저장 → 공유 ID 발급. 게스트도 저장 가능(익명), 조회는 /r/[shareId]에서 서버 재계산으로 재현한다. */
import { randomBytes } from "node:crypto";
import { analyzePerson } from "@/lib/engine/analyze";
import type { Mode } from "@/lib/engine/modes";
import { supabaseAdmin } from "@/lib/db/supabase";
import { MODES, toInput, toPayload, clampIdx, type PersonPayload, type ReadingPayload } from "@/lib/api/person";

export const runtime = "nodejs";

function newShareId(): string {
  return randomBytes(8).toString("base64url"); // 11자, URL 안전
}

export async function POST(req: Request) {
  let body: {
    mode?: string; me?: PersonPayload; partner?: PersonPayload;
    relStatus?: number; relGap?: number; job?: string;
  };
  try { body = await req.json(); } catch { return err(400, "잘못된 요청 형식이에요."); }

  const mode = body.mode as Mode;
  if (!MODES.includes(mode)) return err(400, "알 수 없는 모드예요.");

  const meInput = body.me && toInput(body.me, "당신");
  if (!meInput) return err(400, "생년월일 정보가 올바르지 않아요.");

  let partnerInput = null;
  if (mode === "gunghap") {
    partnerInput = body.partner && toInput(body.partner, "상대");
    if (!partnerInput) return err(400, "상대의 생년월일 정보가 올바르지 않아요.");
  }

  // 저장 전에 실제로 풀이가 되는 사주인지 확인 (음력 등 잘못된 날짜는 여기서 걸러짐)
  try {
    analyzePerson(meInput);
    if (partnerInput) analyzePerson(partnerInput);
  } catch {
    return err(400, "만세력에 없는 날짜예요. 생년월일을 확인해 주세요.");
  }

  const payload: ReadingPayload = {
    me: toPayload(meInput),
    partner: partnerInput ? toPayload(partnerInput) : undefined,
    relStatus: clampIdx(body.relStatus, 6),
    relGap: clampIdx(body.relGap, 3),
    job: typeof body.job === "string" ? body.job.slice(0, 30) : "직장인",
  };

  const db = supabaseAdmin();
  // share_id 충돌은 사실상 없지만(64bit) 유니크 제약 위반 시 1회 재시도
  for (let attempt = 0; attempt < 2; attempt++) {
    const shareId = newShareId();
    const { error } = await db.from("readings").insert({ share_id: shareId, mode, payload });
    if (!error) return Response.json({ shareId, path: `/r/${shareId}` });
    if (error.code !== "23505") return err(500, "저장에 실패했어요. 잠시 뒤 다시 시도해 주세요.");
  }
  return err(500, "저장에 실패했어요. 잠시 뒤 다시 시도해 주세요.");
}

function err(status: number, message: string) {
  return Response.json({ error: message }, { status });
}
