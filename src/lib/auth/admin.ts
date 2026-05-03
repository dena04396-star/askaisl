import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

/**
 * Verifies that the request carries a valid Supabase JWT belonging to the
 * configured admin email. Returns the verified user email or null.
 */
export async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token      = authHeader.slice(7);
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!adminEmail || !url || !serviceKey) return null;

  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user || user.email !== adminEmail) return null;
    return user.email;
  } catch {
    return null;
  }
}
