/** OG 이미지용 폰트 서브셋 로더 — satori(next/og)는 CSS 변수·시스템 폰트를 못 써 웹폰트 바이너리가 필요하다.
 *  필요한 글자만 Google Fonts에서 서브셋으로 받아 번들을 가볍게 유지한다. (브랜드 Pretendard에 가까운 Noto Sans KR) */
export async function loadOgFont(text: string): Promise<ArrayBuffer> {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(text)}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1)" } }, // 구형 UA → ttf 응답
    )
  ).text();
  const m = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/);
  if (!m) throw new Error("OG 폰트 서브셋 로드 실패");
  return await (await fetch(m[1])).arrayBuffer();
}
