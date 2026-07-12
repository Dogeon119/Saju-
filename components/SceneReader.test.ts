import { describe, expect, it } from "vitest";
import { analyzePerson } from "@/lib/engine/analyze";
import { renderReport, type Mode } from "@/lib/engine/modes";
import { parseScenes } from "./SceneReader";

const A = analyzePerson({ sex: "F", year: 1995, month: 7, day: 15, hourIdx: 7, fallbackName: "당신" });
const B = analyzePerson({ sex: "M", year: 1993, month: 3, day: 2, hourIdx: -1, fallbackName: "상대" });

/** 서장(목차) 1 + 본문 장 수 */
const EXPECTED: Record<Mode, number> = { saju: 14, love: 8, gunghap: 9, yearly: 9, daily: 6, manse: 8 };

describe("SceneReader 파서", () => {
  (Object.keys(EXPECTED) as Mode[]).forEach(mode => {
    it(`${mode}: 장면 수 일치, 번호는 제N장 형식, 잔여 第 없음`, () => {
      const html = renderReport(mode, A, { B, relStatus: 2, relGap: 1, job: "직장인" });
      const scenes = parseScenes(html);
      expect(scenes).toHaveLength(EXPECTED[mode]);
      expect(scenes[0].no).toBe("서장");
      expect(scenes[0].toc).toBe(true);
      expect(scenes[1].no).toBe("제一장");
      expect(scenes[scenes.length - 1].no).toBe("종장");
      for (const s of scenes) {
        expect(s.no).not.toMatch(/第|章/);
        expect(s.body).not.toMatch(/第[一二三四五六七八九十]+章/);
        expect(s.title.length).toBeGreaterThan(0);
      }
    });
  });

  it("본문 섹션은 원본 id를 유지한다 (목차 앵커 호환)", () => {
    const html = renderReport("love", A, { relStatus: 1, relGap: 0 });
    const scenes = parseScenes(html);
    // 렌더러의 섹션 카운터는 호출 간 누적되므로 절대값이 아니라 목차 앵커와의 일치를 검증한다
    for (const s of scenes.slice(1)) expect(s.id).toMatch(/^sec-\d+$/);
    const tocLinks = [...scenes[0].body.matchAll(/href="#(sec-\d+)"/g)].map(m => m[1]);
    expect(tocLinks).toEqual(scenes.slice(1).map(s => s.id));
  });
});
