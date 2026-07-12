import { NextResponse, type NextRequest } from "next/server";

/** 어드민 숨은 입구 — /?view=admin 으로 들어오면 관리자 콘솔로 보낸다 */
export function middleware(req: NextRequest) {
  if (req.nextUrl.searchParams.get("view") === "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.delete("view");
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/"] };
