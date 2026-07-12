"use client";
import { useRef, useState } from "react";
import { analyzePerson } from "@/lib/engine/analyze";
import { renderReport } from "@/lib/engine/modes";
import type { PersonPayload } from "@/lib/api/person";
import { PersonFields, emptyForm, validDate, personPayload, type FormState } from "./person-form";
import SceneReader from "./SceneReader";

interface Props {
  inviterName: string;
  me: PersonPayload; // 초대한 사람 (서버 검증 완료본)
  relStatus: number;
  relGap: number;
}

/** 초대받은 상대가 자기 생일만 입력하면 두 사람의 궁합 감정서가 바로 펼쳐진다 */
export default function InviteApp({ inviterName, me, relStatus, relGap }: Props) {
  const [form, setForm] = useState<FormState>(() => emptyForm(me.sex === "M" ? "F" : "M"));
  const [html, setHtml] = useState("");
  const [err, setErr] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      const v = validDate(form);
      if (v) { setErr(v); return; }
      const A = analyzePerson({
        name: me.name, sex: me.sex === "M" ? "M" : "F",
        year: me.year!, month: me.month!, day: me.day!,
        hourIdx: typeof me.hourIdx === "number" ? me.hourIdx : -1,
        calendar: me.calendar === "lunar" ? "lunar" : "solar", leap: !!me.leap,
        fallbackName: inviterName,
      });
      const B = analyzePerson({ ...personPayload(form), fallbackName: "당신" });
      setHtml(renderReport("gunghap", A, { B, relStatus, relGap }));
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (ex) {
      setErr("풀이 중 오류가 났습니다: " + (ex instanceof Error ? ex.message : String(ex)));
    }
  };

  return (
    <>
      {!html && (
        <form onSubmit={onSubmit} noValidate>
          <p className="form-hint">
            {inviterName}님의 정보는 이미 담겨 있어요. 당신의 생년월일만 알려 주시면 두 사람의 궁합이 바로 펼쳐집니다.
          </p>
          <PersonFields legend="나의 정보" form={form} setForm={setForm} idPrefix="iv" />
          <button className="submit" type="submit">두 사람의 궁합 펼쳐 보기</button>
          {err && <p className="err" style={{ display: "block" }}>{err}</p>}
        </form>
      )}
      {html && (
        <div id="result" ref={resultRef} style={{ display: "block" }}>
          <SceneReader html={html} />
        </div>
      )}
    </>
  );
}
