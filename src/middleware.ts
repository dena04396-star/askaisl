import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    // Allow login page through without a cookie check
    if (pathname === "/admin/login") return NextResponse.next();

    const isPageRequest = !pathname.startsWith("/api") &&
      !pathname.match(/\.(js|css|ico|png|svg|woff2?)$/);

    if (isPageRequest) {
      const session = request.cookies.get("admin_session")?.value;
      if (!session) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
