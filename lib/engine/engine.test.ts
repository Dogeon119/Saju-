import { describe, it, expect } from "vitest";
import { analyzePerson, escapeHtml, type Person } from "./analyze";
import { branchRelation, tenGod, gzName, isChung, isSamhap } from "./relations";
import { STEMS, BRANCHES } from "./constants";
import { renderReading, type Mode } from "./render";

const P = (y: number, m: number, d: number, hourIdx = -1, sex: "F" | "M" = "F", name = "테스트") =>
  analyzePerson({ name, sex, year: y, month: m, day: d, hourIdx });

/* ── 만세력 회귀 (알려진 사주) ── */
describe("만세력 회귀", () => {
  it("2000-01-01 일주는 무오, 년주는 기묘", () => {
    const A = P(2000, 1, 1);
    expect(gzName(A.ds, A.db)).toContain("무오");
    expect(A.r.pillars.year).toBe("己卯");
  });
  it("1995-07-15 08시 → 을해년 계미월 정미일 갑진시", () => {
    const A = P(1995, 7, 15, 4);
    expect(A.r.pillars).toEqual({ year: "乙亥", month: "癸未", day: "丁未", hour: "甲辰" });
  });
  it("입춘 경계: 1990-02-03은 기사년, 02-04는 경오년", () => {
    expect(P(1990, 2, 3).r.pillars.year).toBe("己巳");
    expect(P(1990, 2, 4).r.pillars.year).toBe("庚午");
  });
  it("윤년 2월 29일도 계산된다", () => {
    expect(() => P(2000, 2, 29)).not.toThrow();
    expect(() => P(1988, 2, 29)).not.toThrow();
  });
  it("일주 교차검증: 독립 JDN 공식과 80개 날짜 전부 일치", () => {
    const jdn = (y: number, m: number, d: number) => {
      const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
      return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
    };
    for (let y = 1932; y <= 2012; y += 5) {
      for (const [m, d] of [[1, 1], [2, 4], [6, 15], [12, 31]] as const) {
        const A = P(y, m, d);
        const idx = (((jdn(y, m, d) - 2451545 + 54) % 60) + 60) % 60;
        expect(`${y}-${m}-${d}:` + A.ds + "," + A.db).toBe(`${y}-${m}-${d}:` + (idx % 10) + "," + (idx % 12));
      }
    }
  });
});

/* ── 시간 모름 보정 ── */
describe("시간 모름 보정", () => {
  it("시간 모름이면 오행 합계가 6 (시주 제외)", () => {
    expect(P(1993, 3, 2).elems.reduce((a, b) => a + b, 0)).toBe(6);
  });
  it("시간 알면 오행 합계가 8", () => {
    expect(P(1993, 3, 2, 4).elems.reduce((a, b) => a + b, 0)).toBe(8);
  });
});

/* ── 관계 로직 ── */
describe("십성·합충", () => {
  it("갑(0) 기준 십성", () => {
    expect(tenGod(0, 0)).toBe("비견");
    expect(tenGod(0, 1)).toBe("겁재");
    expect(tenGod(0, 2)).toBe("식신");
    expect(tenGod(0, 3)).toBe("상관");
    expect(tenGod(0, 4)).toBe("편재");
    expect(tenGod(0, 5)).toBe("정재");
    expect(tenGod(0, 6)).toBe("편관");
    expect(tenGod(0, 7)).toBe("정관");
    expect(tenGod(0, 8)).toBe("편인");
    expect(tenGod(0, 9)).toBe("정인");
  });
  it("지지 관계", () => {
    expect(branchRelation(0, 1).k).toBe("yukhap");   // 자축
    expect(branchRelation(0, 6).k).toBe("chung");     // 자오
    expect(branchRelation(0, 8).k).toBe("samhap");    // 자신(申子辰)
    expect(branchRelation(0, 7).k).toBe("wonjin");    // 자미
    expect(branchRelation(2, 5).k).toBe("hae");       // 인사
    expect(branchRelation(3, 3).k).toBe("same");
    expect(isChung(0, 6)).toBe(true);
    expect(isSamhap(2, 6)).toBe(true);                // 인오(寅午戌)
  });
});

/* ── 렌더 스윕 (모든 모드 × 날짜 스펙트럼) ── */
describe("렌더 스윕", () => {
  const modes: Mode[] = ["love", "gunghap", "forecast", "marriage", "today"];
  const partner = P(1990, 5, 20, -1, "M", "상대");
  const expectedSections: Record<Mode, number> = { love: 8, gunghap: 8, forecast: 8, marriage: 7, today: 4 };

  it("1932~2012 × 성별 × 시간유무 × 5모드: 예외·undefined·NaN 없음", () => {
    let runs = 0;
    for (let y = 1932; y <= 2012; y += 8) {
      for (const sex of ["F", "M"] as const) {
        for (const h of [-1, 0, 6]) {
          const A = analyzePerson({ name: "스윕", sex, year: y, month: (y % 12) + 1, day: (y % 27) + 1, hourIdx: h });
          for (const mode of modes) {
            const out = renderReading(mode, A, mode === "gunghap" ? partner : undefined);
            runs++;
            expect(out.length, `${mode} ${y} ${sex} h=${h} 길이`).toBeGreaterThan(1500);
            expect(out, `${mode} ${y} ${sex} h=${h} 누출`).not.toMatch(/undefined|NaN/);
          }
        }
      }
    }
    expect(runs).toBeGreaterThan(300);
  });

  it("모드별 섹션 수 + 목차 링크 일치", () => {
    const A = P(1995, 7, 15, 4);
    for (const mode of modes) {
      const out = renderReading(mode, A, P(1993, 3, 2, -1, "M", "상대"));
      const secs = out.match(/<section class="rp" id="sec-/g)?.length ?? 0;
      // 목차 카드 자체 제외한 본문 섹션 수
      expect(secs, mode).toBe(expectedSections[mode]);
      const tocLinks = out.match(/href="#sec-/g)?.length ?? 0;
      expect(tocLinks, mode + " 목차").toBe(expectedSections[mode]);
    }
  });

  it("궁합 점수는 8~99, 오늘의 연애 점수는 15~98", () => {
    for (let i = 0; i < 40; i++) {
      const A = analyzePerson({ sex: "F", year: 1960 + (i * 3) % 50, month: (i % 12) + 1, day: (i % 27) + 1, hourIdx: -1 });
      const B = analyzePerson({ sex: "M", year: 1965 + (i * 7) % 45, month: ((i * 5) % 12) + 1, day: ((i * 11) % 27) + 1, hourIdx: -1 });
      const g = parseInt(renderReading("gunghap", A, B).match(/score-big">(\d+)/)![1]);
      expect(g).toBeGreaterThanOrEqual(8);
      expect(g).toBeLessThanOrEqual(99);
      const t = parseInt(renderReading("today", A).match(/score-big">(\d+)/)![1]);
      expect(t).toBeGreaterThanOrEqual(15);
      expect(t).toBeLessThanOrEqual(98);
    }
  });
});

/* ── 보안 ── */
describe("입력 안전성", () => {
  it("이름의 HTML은 이스케이프되어 출력된다", () => {
    const A = analyzePerson({ name: "<img src=x onerror=alert(1)>", sex: "F", year: 1995, month: 7, day: 15, hourIdx: -1 });
    const out = renderReading("forecast", A);
    expect(out).not.toContain("<img src=x");
    expect(out).toContain("&lt;img");
  });
  it("escapeHtml 기본 동작", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });
});

/* ── 데이터 무결성 ── */
describe("데이터 무결성", () => {
  it("천간 10개·지지 12개, 한자 중복 없음", () => {
    expect(STEMS).toHaveLength(10);
    expect(BRANCHES).toHaveLength(12);
    expect(new Set(STEMS.map((s: { hj: string }) => s.hj)).size).toBe(10);
    expect(new Set(BRANCHES.map((b: { hj: string }) => b.hj)).size).toBe(12);
  });
});
