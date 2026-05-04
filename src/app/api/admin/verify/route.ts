import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/admin";

export async function GET(req: NextRequest) {
  const ok = await verifyAdmin(req);
  return NextResponse.json({ ok }, { status: ok ? 200 : 403 });
}
