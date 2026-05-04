import { NextRequest, NextResponse } from "next/server";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* POST /api/admin/auth — verify token, set cookie */
export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({ token: "" }));
  const secret = process.env.ADMIN_SECRET_TOKEN;

  if (!secret) return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  if (!token || !safeEq(token.trim(), secret)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, secret, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   MAX_AGE,
    path:     "/",
  });
  return res;
}

/* DELETE /api/admin/auth — logout */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
