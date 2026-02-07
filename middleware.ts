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

  const langQuery = searchParams.get("lang");
  const cookieLang = request.cookies.get("lang")?.value;
  const isBgPath = pathname === BG_PREFIX || pathname.startsWith(`${BG_PREFIX}/`);

  // Explicit override: ?lang=en on a /bg path should redirect to non-bg path
  if (langQuery === "en" && isBgPath) {
    const targetPath = pathname.replace(BG_PREFIX, "") || "/";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = targetPath;
    redirectUrl.searchParams.delete("lang");
    const response = NextResponse.redirect(redirectUrl, 308);
    response.cookies.set("lang", "en", { path: "/" });
    return response;
  }

  // Explicit override: ?lang=bg on a non-bg path should redirect to /bg path
  if (langQuery === "bg" && !isBgPath) {
    const targetPath = `${BG_PREFIX}${pathname === "/" ? "" : pathname}`;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = targetPath;
    redirectUrl.searchParams.delete("lang");
    const response = NextResponse.redirect(redirectUrl, 308);
    response.cookies.set("lang", "bg", { path: "/" });
    return response;
  }

  // Enforcement: If cookie is bg but path is not /bg, redirect to /bg
  // EXCEPT if we are currently manually overriding to EN via query
  if (cookieLang === "bg" && !isBgPath && langQuery !== "en") {
    const targetPath = `${BG_PREFIX}${pathname === "/" ? "" : pathname}`;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = targetPath;
    const response = NextResponse.redirect(redirectUrl, 308);
    return response;
  }

  // Handle the rewrite for /bg paths to internal root paths
  if (isBgPath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname.replace(BG_PREFIX, "") || "/";
    const response = NextResponse.rewrite(rewriteUrl);
    // Ensure cookie is synced
    if (cookieLang !== "bg") {
      response.cookies.set("lang", "bg", { path: "/" });
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)"],
};