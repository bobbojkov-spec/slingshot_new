import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BG_PREFIX = "/bg";

const isPublicFile = (pathname: string) => {
  return pathname.includes(".") || pathname.startsWith("/_next");
};

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (isPublicFile(pathname)) {
    return NextResponse.next();
  }

  const hasLangQuery = searchParams.get("lang") === "bg";
  const isBgPath = pathname === BG_PREFIX || pathname.startsWith(`${BG_PREFIX}/`);

  if (hasLangQuery && !isBgPath) {
    const targetPath = `${BG_PREFIX}${pathname}`;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = targetPath;
    redirectUrl.searchParams.delete("lang");
    const response = NextResponse.redirect(redirectUrl, 308);
    response.cookies.set("lang", "bg", { path: "/" });
    return response;
  }

  if (isBgPath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname.replace(BG_PREFIX, "") || "/";
    const response = NextResponse.rewrite(rewriteUrl);
    response.cookies.set("lang", "bg", { path: "/" });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)"],
};