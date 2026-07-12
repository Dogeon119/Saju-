import { describe, it, expect } from "vitest";
import { buildMonth, matchDay, dayAdvice, dayTags } from "./calendar";
import { todayGanzhi } from "./today";

describe("buildMonth", () => {
  it("2026년 7월 — 31일, 절입일(소서) 1회, 일진 연속성", () => {
    const days = buildMonth(2026, 7);
    expect(days).toHaveLength(31);
    const jeolgi = days.filter(d => d.jeolgi);
    expect(jeolgi).toHaveLength(1);
    expect(jeolgi[0].jeolgi).toBe("소서");
    // 일진은 60갑자 연속 순환
    for (let i = 1; i < days.length; i++) {
      const prev = days[i - 1].gz, cur = days[i].gz;
      expect((prev.s + 1) % 10).toBe(cur.s);
      expect((prev.b + 1) % 12).toBe(cur.b);
    }
  });

  it("1월 경계 — 전년 12월에서 절기 감지가 이어진다", () => {
    const days = buildMonth(2026, 1);
    expect(days.filter(d => d.jeolgi).map(d => d.jeolgi)).toEqual(["소한"]);
  });

  it("손없는날 = 음력 끝자리 9·0", () => {
    for (const d of buildMonth(2026, 7)) {
      expect(d.son).toBe(d.lunar.d % 10 === 9 || d.lunar.d % 10 === 0);
    }
  });
});

describe("matchDay · dayAdvice", () => {
  const gzOf = (b: number, s = 0) => ({ s, b, hj: "", kr: "", line: "" });

  it("갑자 일주 기준 등급", () => {
    expect(matchDay(0, 0, gzOf(1)).grade).toBe("길");   // 子-丑 육합
    expect(matchDay(0, 0, gzOf(6)).grade).toBe("주의"); // 子-午 충
    expect(matchDay(0, 0, gzOf(2)).grade).toBe("보통"); // 子-寅 무난
  });

  it("조언은 항상 비어 있지 않다", () => {
    for (let s = 0; s < 10; s++) {
      for (let b = 0; b < 12; b++) {
        const line = dayAdvice(matchDay(3, 7, gzOf(b, s)));
        expect(line.length).toBeGreaterThan(10);
      }
    }
  });

  it("오늘 일진과 실제 매칭이 무오류로 계산된다", () => {
    const m = matchDay(2, 5, todayGanzhi(new Date(2026, 6, 12)));
    expect(m.tg).toBeTruthy();
    expect(m.rel.label).toBeTruthy();
  });

  it("실생활 태그 — 손없는날·절기·관계별 문구", () => {
    const base = { d: 1, gz: gzOf(6), lunar: { m: 5, d: 9, leap: false }, son: true, jeolgi: "소서" };
    const tags = dayTags(base, matchDay(0, 0, base.gz)); // 子-午 충
    expect(tags.some(t => t.t.includes("이사"))).toBe(true);
    expect(tags.some(t => t.t.includes("소서"))).toBe(true);
    expect(tags.some(t => !t.good && t.t.includes("큰 결정"))).toBe(true);
    // 게스트(match 없음)도 생활 태그는 나온다
    expect(dayTags(base, null)).toHaveLength(2);
  });
});
