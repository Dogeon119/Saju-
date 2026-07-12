"use client";
import { useMemo } from "react";

/** 렌더러(modes.ts)가 뿜는 <section class="rp"> HTML을 흑단 장면 조판으로 재배치한다.
 *  DESIGN.md §3 — 좌측 세로 챕터 기둥(제N장) + 본문 2단 비대칭, fade-up 순차 60ms.
 *  엔진 마크업은 건드리지 않고 표시 계층에서만 변환한다. */

interface Scene {
  id?: string;
  toc: boolean;  // 서장(목차) 여부 — .toc 스타일 유지용
  no: string;    // 서장 · 제一장 … 종장
  title: string; // 장면 제목 (렌더러 산출 HTML)
  body: string;  // h2 제외한 섹션 내부 HTML
}

const SEC_RE = /<section class="rp( toc)?"(?: id="(sec-\d+)")?>([\s\S]*?)<\/section>/g;
const H2_RE = /^\s*<h2><span class="no">([\s\S]*?)<\/span>([\s\S]*?)<\/h2>/;

/** 第一章 → 제一장 · 終章 → 종장 · 目次 → 서장 (DESIGN.md §3.1 표기 규칙) */
function toKoreanNo(no: string): string {
  if (no === "目次") return "서장";
  if (no === "終章") return "종장";
  return no.replace(/第([一二三四五六七八九十]+)章/g, "제$1장");
}

export function parseScenes(html: string): Scene[] {
  const scenes: Scene[] = [];
  let m: RegExpExecArray | null;
  SEC_RE.lastIndex = 0;
  while ((m = SEC_RE.exec(html))) {
    const inner = m[3];
    const h2 = inner.match(H2_RE);
    const rawBody = h2 ? inner.slice(h2[0].length) : inner;
    scenes.push({
      id: m[2],
      toc: !!m[1],
      no: toKoreanNo(h2 ? h2[1] : ""),
      title: h2 ? h2[2] : "",
      // 목차 항목 등 본문 속 장 번호 표기도 같은 규칙으로 통일
      body: rawBody.replace(/第([一二三四五六七八九十]+)章/g, "제$1장").replace(/終章/g, "종장"),
    });
  }
  return scenes;
}

export default function SceneReader({ html }: { html: string }) {
  const scenes = useMemo(() => parseScenes(html), [html]);
  return (
    <div>
      {scenes.map((s, i) => (
        <section className="scene" id={s.id} key={s.id ?? `scene-${i}`}
          style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
          <div className="chapter-rail" aria-hidden="true">
            <span>{s.no}</span>
            <div className="rail-line" />
          </div>
          <div className={s.toc ? "scene-body toc" : "scene-body"}>
            <h2 className="scene-title" dangerouslySetInnerHTML={{ __html: s.title }} />
            <div dangerouslySetInnerHTML={{ __html: s.body }} />
          </div>
        </section>
      ))}
    </div>
  );
}
