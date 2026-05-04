import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/lib/db/client";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";

function last14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
}

function groupBy(arr: Record<string, unknown>[], key: string): Record<string, number> {
  return arr.reduce((acc: Record<string, number>, item) => {
    const k = String(item[key] ?? "unknown");
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  const db = getDbClient();

  const [usersRes, sessionsRes, txRes] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 1000, page: 1 }),
    db.from("interview_sessions").select("id,study_type,language,status,created_at,created_by"),
    db.from("transcripts").select("session_id,messages,created_at"),
  ]);

  const users    = usersRes.data?.users ?? [];
  const sessions = (sessionsRes.data ?? []) as Record<string, unknown>[];
  const txList   = txRes.data ?? [];

  const now      = new Date();
  const weekAgo  = new Date(now.getTime() - 7  * 86_400_000);
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000);
  const days     = last14Days();

  const totalTurns = txList.reduce((sum, t) => {
    const msgs = Array.isArray(t.messages) ? t.messages : [];
    return sum + (msgs as { role: string }[]).filter(m => m.role === "user").length;
  }, 0);

  return NextResponse.json({
    users: {
      total:     users.length,
      thisWeek:  users.filter(u => new Date(u.created_at) >= weekAgo).length,
      thisMonth: users.filter(u => new Date(u.created_at) >= monthAgo).length,
      daily:     days.map(d => ({ date: d, count: users.filter(u => u.created_at.slice(0, 10) === d).length })),
      recent:    [...users]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 30)
        .map(u => ({
          id:          u.id,
          email:       u.email ?? "—",
          created_at:  u.created_at,
          last_sign_in: u.last_sign_in_at ?? null,
        })),
    },
    sessions: {
      total:       sessions.length,
      active:      sessions.filter(s => s.status === "active").length,
      closed:      sessions.filter(s => s.status === "closed").length,
      thisWeek:    sessions.filter(s => new Date(s.created_at as string) >= weekAgo).length,
      thisMonth:   sessions.filter(s => new Date(s.created_at as string) >= monthAgo).length,
      byStudyType: groupBy(sessions, "study_type"),
      byLanguage:  groupBy(sessions, "language"),
      daily:       days.map(d => ({ date: d, count: sessions.filter(s => (s.created_at as string).slice(0, 10) === d).length })),
    },
    transcripts: {
      total:      txList.length,
      totalTurns,
      thisWeek:   txList.filter(t => new Date(t.created_at) >= weekAgo).length,
      thisMonth:  txList.filter(t => new Date(t.created_at) >= monthAgo).length,
      daily:      days.map(d => ({ date: d, count: txList.filter(t => t.created_at.slice(0, 10) === d).length })),
    },
  });
}
