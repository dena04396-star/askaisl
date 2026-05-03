import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware — blocks /admin routes for users who have no Supabase session.
 * Because auth is stored in localStorage (not cookies), we do a lightweight check:
 * if the Supabase project cookie is absent we redirect to /login.
 * The full JWT + admin-email verification still happens inside each API route.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    // Supabase JS v2 also writes a sb-<ref>-auth-token cookie in some flows.
    // Check for any supabase-related auth cookie as a lightweight gate.
    const cookies = request.cookies.getAll();
    const hasSession = cookies.some(
      c => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );

    // If no cookie exists AND the request is a full page navigation (not API/asset),
    // redirect to login so the blank page never flashes.
    const isPageRequest = !pathname.startsWith("/api") &&
      !pathname.match(/\.(js|css|ico|png|svg|woff2?)$/);

    if (!hasSession && isPageRequest) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
