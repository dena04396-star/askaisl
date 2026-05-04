import type { NextRequest } from "next/server";

const COOKIE = "admin_session";

function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verifies an admin API request by checking the httpOnly admin_session cookie.
 * Returns true only if the cookie matches ADMIN_SECRET_TOKEN.
 */
export async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET_TOKEN;
  if (!secret) return false;
  const session = req.cookies.get(COOKIE)?.value ?? "";
  return safeEq(session, secret);
}
