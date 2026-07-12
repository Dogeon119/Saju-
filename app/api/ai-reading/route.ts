/** AI 심층 풀이 — 서버에서 ssaju 재계산 후 LLM 스트리밍 릴레이 (Phase 3 스파이크).
 *  TODO(Phase 3 본구현): 동일 (사주+모드) 캐싱 — 크레딧·비용 방어 1선
 *  TODO(Phase 3 본구현): 무료 1일 1회 제한 (IP 또는 회원 기준) */
import { analyzePerson } from "@/lib/engine/analyze";
import type { Mode } from "@/lib/engine/modes";
import { buildAiPrompt } from "@/lib/ai/prompt";
import { streamChat } from "@/lib/ai/client";
import { MODES, toInput, clampIdx, type PersonPayload } from "@/lib/api/person";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const A = analyzePerson(meInput);

  let B;
  if (mode === "gunghap") {
    const partnerInput = body.partner && toInput(body.partner, "상대");
    if (!partnerInput) return err(400, "상대의 생년월일 정보가 올바르지 않아요.");
    B = analyzePerson(partnerInput);
  }

  const { system, user } = buildAiPrompt(mode, A, B, {
    relStatus: clampIdx(body.relStatus, 6),
    relGap: clampIdx(body.relGap, 3),
    job: typeof body.job === "string" ? body.job.slice(0, 30) : undefined,
  });

  try {
    const stream = await streamChat({ system, user });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (ex) {
    return err(502, ex instanceof Error ? ex.message : "AI 풀이 생성에 실패했어요.");
  }
}

function err(status: number, message: string) {
  return Response.json({ error: message }, { status });
}
