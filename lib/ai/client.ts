/** AI 프로바이더 추상화 — OpenAI 호환 chat/completions 스트리밍 래퍼 (서버 전용).
 *  base_url·model·key는 전부 env로 갈아 끼울 수 있다 (프로바이더 교체 = 환경변수 교체). */

/** 무료 기능용 모델 — NVIDIA NIM 무료 티어 (개발·검증용) */
export const AI_MODEL_FREE = process.env.AI_MODEL_FREE || "openai/gpt-oss-120b";
/** 유료 기능용 프론티어 모델 자리 — Phase 4 유료화 때 사용 예정, 현재 미사용 */
export const AI_MODEL_PREMIUM = process.env.AI_MODEL_PREMIUM || "claude-sonnet-5";

const AI_BASE_URL = process.env.AI_BASE_URL || "https://integrate.api.nvidia.com/v1";

export interface ChatStreamOptions {
  model?: string;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

/** SSE 스트림에서 delta.content만 뽑아 plain text ReadableStream으로 릴레이한다.
 *  (gpt-oss 계열의 reasoning_content는 버린다 — 사용자에게 사고 과정을 노출하지 않음) */
export async function streamChat(opts: ChatStreamOptions): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.NIM_API_KEY; // 서버 전용 — NEXT_PUBLIC_ 금지
  if (!apiKey) throw new Error("NIM_API_KEY가 설정되지 않았습니다. .env.local 또는 Vercel 환경변수에 추가해 주세요.");

  const model = opts.model || AI_MODEL_FREE;
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    temperature: opts.temperature ?? 0.8,
    max_tokens: opts.maxTokens ?? 4096,
    stream: true,
  };
  // gpt-oss 계열은 추론 강도 조절 지원 — 장문 생성 속도를 위해 low 고정
  if (model.startsWith("openai/gpt-oss")) body.reasoning_effort = "low";

  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI 응답 실패 (${res.status}): ${detail.slice(0, 300)}`);
  }

  const upstream = res.body;
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buf = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const data = line.trim();
            if (!data.startsWith("data:")) continue;
            const payload = data.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const text: unknown = json?.choices?.[0]?.delta?.content;
              if (typeof text === "string" && text) controller.enqueue(encoder.encode(text));
            } catch { /* 불완전한 SSE 조각은 무시 */ }
          }
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
    cancel() { upstream.cancel().catch(() => {}); },
  });
}
