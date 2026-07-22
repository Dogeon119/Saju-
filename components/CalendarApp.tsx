"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/db/browser";
import { analyzePerson } from "@/lib/engine/analyze";
import { buildMonth, matchDay, dayAdvice, dayTags, type CalDay } from "@/lib/engine/calendar";
import type { ProfileRow } from "./person-form";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

interface Me { name: string; ds: number; db: number; }

/** 운세 달력 — 실생활 정보(길일·주의일·이사날·절기) 중심, 간지는 상세의 작은 참고로 */
export default function CalendarApp() {
  const [today, setToday] = useState<{ y: number; m: number; d: number } | null>(null);
  const [ym, setYm] = useState<{ y: number; m: number } | null>(null);
  const [sel, setSel] = useState(0);
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // 달력은 사용자 기기의 오늘 기준 — 서버(UTC) 프리렌더와 어긋나지 않게 마운트 뒤 계산
    const now = new Date();
    const t = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
    setToday(t);
    setYm({ y: t.y, m: t.m });
    setSel(t.d);

    (async () => {
      try {
        const sb = supabaseBrowser();
        const { data: { session } } = await sb.auth.getSession();
        if (session) {
          const { data } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
          const p = data as ProfileRow | null;
          if (p?.year && p.month && p.day) {
            const person = analyzePerson({
              name: p.name ?? undefined, sex: p.sex === "M" ? "M" : "F",
              year: p.year, month: p.month, day: p.day,
              hourIdx: typeof p.hour_idx === "number" ? p.hour_idx : -1,
              calendar: p.calendar === "lunar" ? "lunar" : "solar", leap: !!p.leap,
            });
            setMe({ name: person.name, ds: person.ds, db: person.db });
          }
        }
      } catch { /* 게스트 달력 그대로 */ }
      setChecked(true);
    })();
  }, []);

  const days: CalDay[] = useMemo(() => (ym ? buildMonth(ym.y, ym.m) : []), [ym]);

  if (!ym || !today) return <p className="ai-wait">달력을 펼치는 중이에요.</p>;

  const move = (delta: number) => {
    const m0 = ym.m - 1 + delta;
    const ny = ym.y + Math.floor(m0 / 12), nm = ((m0 % 12) + 12) % 12 + 1;
    setYm({ y: ny, m: nm });
    setSel(ny === today.y && nm === today.m ? today.d : 1);
  };

  const lead = new Date(ym.y, ym.m - 1, 1).getDay();
  const isToday = (d: number) => ym.y === today.y && ym.m === today.m && d === today.d;
  const selDay = days[sel - 1];
  const selMatch = me && selDay ? matchDay(me.ds, me.db, selDay.gz) : null;
  const selTags = selDay ? dayTags(selDay, selMatch) : [];
  const selDow = selDay ? WEEK[(lead + sel - 1) % 7] : "";

  /* 이번 달 한눈에 — 회원은 길일·주의일, 모두에게 이사 좋은 날 */
  const goodDays = me ? days.filter(d => matchDay(me.ds, me.db, d.gz).grade === "길").map(d => d.d) : [];
  const warnDays = me ? days.filter(d => matchDay(me.ds, me.db, d.gz).grade === "주의").map(d => d.d) : [];
  const sonDays = days.filter(d => d.son).map(d => d.d);

  return (
    <>
      <div className="cal2-head">
        <p className="cal2-title">{ym.y}년 {ym.m}월</p>
        <div className="cal2-navs">
          <button type="button" className="cal2-nav" aria-label="이전 달" onClick={() => move(-1)}>‹</button>
          {(ym.y !== today.y || ym.m !== today.m) && (
            <button type="button" className="cal2-nav cal2-today" onClick={() => { setYm({ y: today.y, m: today.m }); setSel(today.d); }}>오늘</button>
          )}
          <button type="button" className="cal2-nav" aria-label="다음 달" onClick={() => move(1)}>›</button>
        </div>
      </div>

      <div className="card cal2-card">
        <div className="cal2-grid cal2-week" aria-hidden="true">
          {WEEK.map((w, i) => <span key={w} className={`cal2-wd${i === 0 ? " sun" : ""}`}>{w}</span>)}
        </div>
        <div className="cal2-grid" role="group" aria-label={`${ym.y}년 ${ym.m}월 운세 달력`}>
          {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} aria-hidden="true" />)}
          {days.map(day => {
            const m = me ? matchDay(me.ds, me.db, day.gz) : null;
            const dow = (lead + day.d - 1) % 7;
            const status = day.jeolgi ? `절기 ${day.jeolgi}`
              : m?.grade === "길" ? "길일"
              : m?.grade === "주의" ? "주의일"
              : day.son ? "손없는날" : "";
            const dayLabel = `${ym.m}월 ${day.d}일 ${WEEK[dow]}요일${status ? `, ${status}` : ""}${isToday(day.d) ? ", 오늘" : ""}`;
            return (
              <button key={day.d} type="button"
                className={`cal2-cell${sel === day.d ? " on" : ""}${isToday(day.d) ? " today" : ""}`}
                aria-pressed={sel === day.d}
                aria-label={dayLabel}
                onClick={() => setSel(day.d)}>
                <span className={`cal2-d${dow === 0 ? " sun" : ""}`}>{day.d}</span>
                {day.jeolgi && <span className="cal2-tag term">{day.jeolgi}</span>}
                {!day.jeolgi && m?.grade === "길" && <span className="cal2-tag good">길일</span>}
                {!day.jeolgi && m?.grade === "주의" && <span className="cal2-tag warn">주의</span>}
                {!day.jeolgi && (!m || m.grade === "보통") && day.son && <span className="cal2-tag son">이사</span>}
                <span className="cal2-marks">
                  {day.jeolgi && m?.grade === "길" && <i className="cal2-dot good" aria-label="길일" />}
                  {day.jeolgi && m?.grade === "주의" && <i className="cal2-dot warn" aria-label="주의일" />}
                  {day.son && (day.jeolgi || (m && m.grade !== "보통")) && <em className="cal2-son">손</em>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {(goodDays.length > 0 || warnDays.length > 0 || sonDays.length > 0) && (
        <div className="cal2-sum">
          {me && goodDays.length > 0 && <p><b className="g">이번 달 좋은 날</b> {goodDays.join(" · ")}일</p>}
          {me && warnDays.length > 0 && <p><b className="w">조심할 날</b> {warnDays.join(" · ")}일</p>}
          {sonDays.length > 0 && <p><b>이사·입주 좋은 날 (손없는날)</b> {sonDays.join(" · ")}일</p>}
        </div>
      )}

      {selDay && (
        <div className="card cal2-detail" key={`${ym.y}-${ym.m}-${sel}`}>
          <p className="cal2-dt">
            {ym.m}월 {sel}일 {selDow}요일
            {selMatch && (
              <span className={`cal2-grade${selMatch.grade === "길" ? " g" : selMatch.grade === "주의" ? " w" : ""}`}>
                {me?.name}님에게 {selMatch.grade === "보통" ? "무난한 날" : selMatch.grade === "길" ? "좋은 날" : "조심할 날"}
              </span>
            )}
          </p>
          <p className="cal2-line">음력 {selDay.lunar.m}월 {selDay.lunar.d}일{selDay.lunar.leap ? " (윤달)" : ""}</p>
          {selTags.length > 0 && (
            <ul className="cal2-tags">
              {selTags.map(t => (
                <li key={t.t} className={t.good ? "good" : "warn"}>{t.t}</li>
              ))}
            </ul>
          )}
          {selMatch && <p className="cal2-advice">{dayAdvice(selMatch)}</p>}
          {!me && checked && (
            <p className="form-hint" style={{ marginTop: 12 }}>
              <Link href="/account" className="adm-link">회원 탭에서 사주 프로필을 등록</Link>하면
              나에게 좋은 날·조심할 날이 달력에 바로 표시돼요.
            </p>
          )}
          <p className="cal2-gzref">일진 {selDay.gz.kr}({selDay.gz.hj}) · {selDay.gz.line}</p>
        </div>
      )}
    </>
  );
}
