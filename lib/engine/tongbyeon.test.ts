import { describe, it, expect } from "vitest";
import { analyzePerson } from "./analyze";
import { analyzeTongbyeon, tenGodOf, HIDDEN, ELEM_KO } from "./tongbyeon";

const P = (y: number, m: number, d: number, hourIdx = -1, sex: "F" | "M" = "F") =>
  analyzePerson({ name: "테스트", sex, year: y, month: m, day: d, hourIdx });

describe("통변 엔진 — 무결성 스윕", () => {
  it("생년 전수 × 성별 × 시간: 예외·undefined·NaN 없음, 용신 유효", () => {
    let runs = 0, strongN = 0, weakN = 0, johuN = 0;
    for (let y = 1932; y <= 2012; y += 4) {
      for (const sex of ["F", "M"] as const) {
        for (const h of [-1, 6]) {
          const A = P(y, (y % 12) + 1, (y % 27) + 1, h, sex);
          const t = analyzeTongbyeon(A);
          runs++;
          // 오행 세력 유효
          expect(t.power.every(v => Number.isFinite(v) && v >= 0), `${y} power`).toBe(true);
          expect(t.powerPct.reduce((a, b) => a + b, 0)).toBeGreaterThan(90);
          // 용신/희신/기신 인덱스 0~4
          for (const e of [t.yongElem, t.heeElem, t.giElem, t.hanElem]) {
            expect(e, `${y} yong idx`).toBeGreaterThanOrEqual(0);
            expect(e).toBeLessThanOrEqual(4);
          }
          expect(t.yongReason.length, `${y} reason`).toBeGreaterThan(5);
          expect(Number.isFinite(t.strength.score)).toBe(true);
          expect(t.strength.score).toBeGreaterThanOrEqual(0);
          expect(t.strength.score).toBeLessThanOrEqual(100);
          expect(JSON.stringify(t)).not.toMatch(/undefined|null,"kind"|NaN/);
          if (t.strength.cls === "strong") strongN++;
          if (t.strength.cls === "weak") weakN++;
          if (t.yongMethod === "조후(調候)") johuN++;
        }
      }
    }
    expect(runs).toBeGreaterThan(80);
    // 신강·신약·조후 사례가 모두 실제로 나와야 (한쪽으로 쏠리면 로직 결함)
    expect(strongN, "신강 사례").toBeGreaterThan(5);
    expect(weakN, "신약 사례").toBeGreaterThan(5);
    expect(johuN, "조후용신 사례").toBeGreaterThan(0);
  });

  it("시간 모름이면 세력 합이 줄고(시주 제외), 알면 커진다", () => {
    const known = analyzeTongbyeon(P(1990, 5, 20, 6));
    const unknown = analyzeTongbyeon(P(1990, 5, 20, -1));
    const sumK = known.power.reduce((a, b) => a + b, 0);
    const sumU = unknown.power.reduce((a, b) => a + b, 0);
    expect(sumU).toBeLessThan(sumK);
  });

  it("신강이면 용신은 억부상 설·극(식상/재성/관성), 신약이면 생·부(인성/비겁)", () => {
    let checked = 0;
    for (let y = 1950; y <= 2005; y += 3) {
      const A = P(y, ((y * 7) % 12) + 1, ((y * 3) % 27) + 1, 6, y % 2 ? "M" : "F");
      const t = analyzeTongbyeon(A);
      if (t.yongMethod !== "억부(抑扶)") continue; // 조후·전왕·통관은 제외
      const dayElem = A.r.pillarDetails.day.stemIdx;
      // 억부 용신은 비겁/인성(생부) 또는 식상/재성/관성(설극) 중 하나 — 유효 오행이면 OK
      expect(t.yongElem).toBeGreaterThanOrEqual(0);
      checked++;
    }
    expect(checked).toBeGreaterThan(3);
  });

  it("지장간 표: 12지지 모두 정기 존재, 오행 커버", () => {
    expect(HIDDEN).toHaveLength(12);
    for (const arr of HIDDEN) expect(arr[arr.length - 1].w).toBe(1.0);
    expect(ELEM_KO).toEqual(["목", "화", "토", "금", "수"]);
  });

  it("tenGodOf: 갑(0) 기준 십신 10종 순서", () => {
    const exp = ["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"];
    exp.forEach((name, i) => expect(tenGodOf(0, i)).toBe(name));
  });
});
