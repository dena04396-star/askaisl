import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db/client";

function isAdmin(req: NextRequest): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const email = req.headers.get("x-admin-email");
  return !!adminEmail && !!email && email === adminEmail;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDbClient();
  const { data, error } = await db
    .from("interview_sessions")
    .select("id,token,title,study_type,language,product_category,status,created_at,created_by")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status } = await req.json();
  if (!id || !["active", "closed"].includes(status)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const db = getDbClient();
  const { error } = await db
    .from("interview_sessions")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const db = getDbClient();
  const { error } = await db.from("interview_sessions").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
