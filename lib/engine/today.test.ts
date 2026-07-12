import { describe, it, expect } from "vitest";
import { calculateSaju } from "ssaju";
import { todayGanzhi } from "./today";

/** JDN 일진 공식이 ssaju day pillar와 일치하는지 넓은 범위로 대조 */
describe("todayGanzhi", () => {
  it("ssaju 일주와 90일 연속 일치 (2025-12-01부터)", () => {
    const start = new Date(2025, 11, 1);
    for (let i = 0; i < 90; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const r = calculateSaju({
        year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
        hour: 12, minute: 0,
      }) as unknown as { pillars: { day: string } };
      expect(todayGanzhi(d).hj, d.toDateString()).toBe(r.pillars.day);
    }
  });

  it("과거·미래 경계 날짜 일치", () => {
    for (const [y, m, day] of [[1984, 2, 2], [2000, 1, 1], [2024, 2, 29], [2030, 12, 31]] as const) {
      const r = calculateSaju({ year: y, month: m, day, hour: 12, minute: 0 }) as unknown as { pillars: { day: string } };
      expect(todayGanzhi(new Date(y, m - 1, day)).hj).toBe(r.pillars.day);
    }
  });

  it("표기 라인 형태", () => {
    const g = todayGanzhi(new Date(2026, 6, 12)); // 丁亥
    expect(g.hj).toBe("丁亥");
    expect(g.line).toBe("붉은 돼지의 날");
  });
});
