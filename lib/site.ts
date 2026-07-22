/** 사이트 정규 URL·이름 — 메타데이터·사이트맵·OG 절대경로 해석의 단일 출처.
 *  배포 도메인이 바뀌면 Vercel 환경변수 NEXT_PUBLIC_SITE_URL만 설정하면 된다. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://wolha-saju.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "월하";
