/** 페이지 아이덴티티 헤더 — 도장 글자 + 큰 제목 + 설명 (모든 탭 공통 문법) */
export default function PageHead({ mk, title, desc }: { mk?: string; title: string; desc?: string }) {
  return (
    <div className="page-head">
      {mk && <span className="page-mk" aria-hidden="true">{mk}</span>}
      <div>
        <h1 className="page-title">{title}</h1>
        {desc && <p className="page-desc">{desc}</p>}
      </div>
    </div>
  );
}
