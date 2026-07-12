import { describe, it, expect } from "vitest";
import { analyzePerson, escapeHtml } from "./analyze";
import { branchRelation, tenGod, gzName, isChung, isSamhap } from "./relations";
import { STEMS, BRANCHES } from "./constants";
import { renderReport, type Mode } from "./modes";

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
  it("음력 입력: 음력 1995-06-18 = 양력 1995-07-15와 동일 사주", () => {
    const lunar = analyzePerson({ sex: "F", year: 1995, month: 6, day: 18, hourIdx: 4, calendar: "lunar" });
    const solar = analyzePerson({ sex: "F", year: 1995, month: 7, day: 15, hourIdx: 4 });
    expect(lunar.r.pillars).toEqual(solar.r.pillars);
  });
  it("윤년 2월 29일도 계산된다", () => {
    expect(() => P(2000, 2, 29)).not.toThrow();
    expect(() => P(1988, 2, 29)).not.toThrow();
  });
  it("일주 교차검증: 독립 JDN 공식과 전부 일치", () => {
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
  it("시간 모름이면 오행 합계 6, 알면 8", () => {
    expect(P(1993, 3, 2).elems.reduce((a, b) => a + b, 0)).toBe(6);
    expect(P(1993, 3, 2, 4).elems.reduce((a, b) => a + b, 0)).toBe(8);
  });
});

/* ── 관계 로직 ── */
describe("십성·합충", () => {
  it("갑(0) 기준 십성 10종", () => {
    const exp = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
    exp.forEach((name, i) => expect(tenGod(0, i)).toBe(name));
  });
  it("지지 관계", () => {
    expect(branchRelation(0, 1).k).toBe("yukhap");
    expect(branchRelation(0, 6).k).toBe("chung");
    expect(branchRelation(0, 8).k).toBe("samhap");
    expect(branchRelation(0, 7).k).toBe("wonjin");
    expect(branchRelation(2, 5).k).toBe("hae");
    expect(branchRelation(3, 3).k).toBe("same");
    expect(isChung(0, 6)).toBe(true);
    expect(isSamhap(2, 6)).toBe(true);
  });
});

/* ── 전 모드 렌더 스윕 ── */
describe("전 모드 렌더 스윕", () => {
  const modes: Mode[] = ["saju", "love", "gunghap", "yearly", "daily", "manse"];
  const expectedSections: Record<Mode, number> = { saju: 13, love: 7, gunghap: 8, yearly: 8, daily: 5, manse: 7 };
  /** 모드별 최소 길이 — 도구·일운 모드는 본문이 짧다 */
  const minLen: Record<Mode, number> = { saju: 3000, love: 3000, gunghap: 3000, yearly: 3000, daily: 2000, manse: 2500 };
  const partner = P(1990, 5, 20, -1, "M", "상대");

  it("생년 스펙트럼 × 성별 × 시간 × 상태 옵션: 예외·undefined·NaN 없음", () => {
    let runs = 0;
    for (let y = 1932; y <= 2012; y += 8) {
      for (const sex of ["F", "M"] as const) {
        for (const h of [-1, 6]) {
          const A = analyzePerson({ name: "스윕", sex, year: y, month: (y % 12) + 1, day: (y % 27) + 1, hourIdx: h });
          for (const mode of modes) {
            const out = renderReport(mode, A, {
              B: mode === "gunghap" ? partner : undefined,
              relStatus: y % 7, relGap: y % 4, job: ["직장인", "대학생", "사업·자영업"][y % 3],
            });
            runs++;
            expect(out.length, `${mode} ${y} ${sex} h=${h} 길이`).toBeGreaterThan(minLen[mode]);
            expect(out, `${mode} ${y} ${sex} h=${h} 누출`).not.toMatch(/undefined|NaN/);
          }
        }
      }
    }
    expect(runs).toBeGreaterThan(150);
  });

  it("모드별 장(章) 수와 목차 링크 일치", () => {
    const A = P(1995, 7, 15, 4);
    for (const mode of modes) {
      const out = renderReport(mode, A, { B: P(1993, 3, 2, -1, "M", "상대") });
      const secs = out.match(/<section class="rp" id="sec-/g)?.length ?? 0;
      expect(secs, mode).toBe(expectedSections[mode]);
      const tocLinks = out.match(/href="#sec-/g)?.length ?? 0;
      expect(tocLinks, mode + " 목차").toBe(expectedSections[mode]);
    }
  });

  it("관계 상태 7종 × 기간 4종 전수: 연애비책·궁합 정상 렌더", () => {
    const A = P(1995, 7, 15, 4);
    const B = P(1993, 3, 2, -1, "M", "상대");
    for (let s = 0; s < 7; s++) {
      for (let g = 0; g < 4; g++) {
        expect(renderReport("love", A, { relStatus: s, relGap: g })).not.toMatch(/undefined|NaN/);
        expect(renderReport("gunghap", A, { B, relStatus: s, relGap: g })).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it("직업 상태 10종 전수: 올해의운세 정상 렌더", () => {
    const A = P(1988, 11, 8, 2, "M");
    for (const job of ["직장인", "학생", "대학생", "취업준비", "고시·시험준비", "공무원", "주부", "사업·자영업", "프리랜서", "전문직"]) {
      const out = renderReport("yearly", A, { job });
      expect(out).not.toMatch(/undefined|NaN/);
      expect(out).toContain("12개월 월별 운세");
    }
  });

  it("궁합 점수는 8~99 범위", () => {
    for (let i = 0; i < 40; i++) {
      const A = analyzePerson({ sex: "F", year: 1960 + (i * 3) % 50, month: (i % 12) + 1, day: (i % 27) + 1, hourIdx: -1 });
      const B = analyzePerson({ sex: "M", year: 1965 + (i * 7) % 45, month: ((i * 5) % 12) + 1, day: ((i * 11) % 27) + 1, hourIdx: -1 });
      const g = parseInt(renderReport("gunghap", A, { B }).match(/score-big">(\d+)/)![1]);
      expect(g).toBeGreaterThanOrEqual(8);
      expect(g).toBeLessThanOrEqual(99);
    }
  });

  it("정통사주에 13장 필수 요소 포함", () => {
    const out = renderReport("saju", P(1995, 7, 15, 4));
    for (const kw of ["사주팔자", "십성 분석", "십이운성", "신살", "귀인", "재물운", "직업운", "건강운", "대운", "삼재", "월하노인에게 묻다"]) {
      expect(out).toContain(kw);
    }
  });
});

/* ── 보안 ── */
describe("입력 안전성", () => {
  it("이름의 HTML은 이스케이프되어 출력된다", () => {
    const A = analyzePerson({ name: "<img src=x onerror=alert(1)>", sex: "F", year: 1995, month: 7, day: 15, hourIdx: -1 });
    const out = renderReport("love", A, {});
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
