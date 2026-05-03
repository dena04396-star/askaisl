"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient } from "@/lib/auth/client";

async function adminHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const { data: { session } } = await getBrowserClient().auth.getSession();
  return {
    "Authorization": `Bearer ${session?.access_token ?? ""}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

interface AdminSession {
  id: string;
  token: string;
  title: string;
  study_type: string;
  language: string;
  product_category: string;
  status: "active" | "closed";
  created_at: string;
  created_by: string;
}

const STUDY_LABELS: Record<string, string> = {
  behavioral: "Behavioral",
  decision_journey: "Decision Journey",
  pain_points: "Pain Points",
  perception: "Brand Perception",
  concept_testing: "Concept Testing",
};

const LANG_LABELS: Record<string, string> = { en: "EN", si: "SI", ta: "TA" };

function LogoMark() {
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--inv)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
        <path d="M2 10L6 2l4 8" stroke="var(--inv-txt)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "closed" }) {
  const isActive = status === "active";
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 600,
      background: isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
      color: isActive ? "rgb(22,163,74)" : "rgb(220,38,38)",
      border: `1px solid ${isActive ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)"}`,
      letterSpacing: "0.02em",
    }}>
      {isActive ? "Active" : "Closed"}
    </span>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const [sessions, setSessions]     = useState<AdminSession[]>([]);
  const [fetching, setFetching]     = useState(true);
  const [actionId, setActionId]     = useState<string | null>(null);
  const [filterStatus, setFilter]   = useState<"all" | "active" | "closed">("all");

  const isAdmin = !!user && user.email === adminEmail;

  const fetchSessions = useCallback(async () => {
    setFetching(true);
    const res = await fetch("/api/admin/sessions", { headers: await adminHeaders() });
    if (res.ok) setSessions(await res.json());
    setFetching(false);
  }, []);

  const fetchRef = useRef(fetchSessions);
  useEffect(() => { fetchRef.current = fetchSessions; }, [fetchSessions]);

  useEffect(() => {
    if (loading) return;
    if (!user)    { router.replace("/login");     return; }
    if (!isAdmin) { router.replace("/dashboard"); return; }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    if (user && isAdmin) void fetchRef.current();
  }, [user, isAdmin]);

  async function patchStatus(id: string, status: "active" | "closed") {
    setActionId(id);
    await fetch("/api/admin/sessions", {
      method: "PATCH",
      headers: await adminHeaders(),
      body: JSON.stringify({ id, status }),
    });
    await fetchRef.current();
    setActionId(null);
  }

  async function deleteSession(id: string) {
    if (!confirm("Permanently delete this session and all its data?")) return;
    setActionId(id);
    await fetch("/api/admin/sessions", {
      method: "DELETE",
      headers: await adminHeaders(),
      body: JSON.stringify({ id }),
    });
    setSessions(s => s.filter(x => x.id !== id));
    setActionId(null);
  }

  const visible = sessions.filter(s => filterStatus === "all" || s.status === filterStatus);
  const totalActive = sessions.filter(s => s.status === "active").length;
  const totalClosed = sessions.filter(s => s.status === "closed").length;

  if (loading || !user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Top bar */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--bg)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", height: 62 }}>
        <Link href="/" style={{ fontFamily: "var(--font-serif)", fontSize: 21, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--txt)", textDecoration: "none", display: "flex", alignItems: "center", gap: 7 }}>
          <LogoMark /> vinterview
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12.5, color: "var(--txt2)", padding: "3px 10px", borderRadius: 99, background: "rgba(0,0,0,0.05)", border: "1px solid var(--border)" }}>
            Admin
          </span>
          <span style={{ fontSize: 13, color: "var(--txt2)" }}>{user.email}</span>
          <Link href="/admin/analytics" style={{ fontSize: 13, color: "var(--txt2)", textDecoration: "none", padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", fontWeight: 500 }}>
            Analytics
          </Link>
          <Link href="/dashboard" style={{ fontSize: 13, color: "var(--txt2)", textDecoration: "none", padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", fontWeight: 500 }}>
            Dashboard
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>

        {/* Page heading */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 400, letterSpacing: "-0.02em", color: "var(--txt)", marginBottom: 6 }}>
            Admin Console
          </h1>
          <p style={{ fontSize: 14, color: "var(--txt2)", fontWeight: 300 }}>
            View and manage all interview sessions across all researchers.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 36 }}>
          {[
            { label: "Total Sessions",  value: sessions.length },
            { label: "Active",          value: totalActive },
            { label: "Closed",          value: totalClosed },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: "20px 24px", border: "1px solid var(--border)", borderRadius: 14, background: "var(--bg2)" }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: "var(--txt)", letterSpacing: "-0.02em", marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 12.5, color: "var(--txt2)", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
          {(["all", "active", "closed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "8px 18px", border: "none", borderBottom: filterStatus === f ? "2px solid var(--txt)" : "2px solid transparent",
              background: "transparent", color: filterStatus === f ? "var(--txt)" : "var(--txt2)",
              fontSize: 13.5, fontWeight: filterStatus === f ? 600 : 400, cursor: "pointer",
              marginBottom: -1, fontFamily: "inherit", textTransform: "capitalize",
            }}>
              {f === "all" ? `All (${sessions.length})` : f === "active" ? `Active (${totalActive})` : `Closed (${totalClosed})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", background: "var(--bg)" }}>
          {fetching ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--txt2)", fontSize: 14 }}>Loading sessions…</div>
          ) : visible.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--txt2)", fontSize: 14 }}>No sessions found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}>
                  {["Title", "Study Type", "Language", "Status", "Created", "Actions"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--txt2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < visible.length - 1 ? "1px solid var(--border)" : "none", opacity: actionId === s.id ? 0.5 : 1, transition: "opacity 0.15s" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--txt)", marginBottom: 2 }}>{s.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--txt3)", fontFamily: "monospace" }}>{s.token}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--txt2)" }}>
                      {STUDY_LABELS[s.study_type] ?? s.study_type}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--txt2)" }}>
                      {LANG_LABELS[s.language] ?? s.language}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge status={s.status} />
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12.5, color: "var(--txt2)" }}>
                      {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <a
                          href={`/session/${s.token}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 12.5, color: "var(--txt2)", textDecoration: "none", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", fontWeight: 500 }}
                        >
                          Open
                        </a>
                        {s.status === "active" ? (
                          <button
                            onClick={() => patchStatus(s.id, "closed")}
                            disabled={actionId === s.id}
                            style={{ fontSize: 12.5, color: "rgb(220,38,38)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}
                          >
                            Close
                          </button>
                        ) : (
                          <button
                            onClick={() => patchStatus(s.id, "active")}
                            disabled={actionId === s.id}
                            style={{ fontSize: 12.5, color: "rgb(22,163,74)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(34,197,94,0.3)", background: "transparent", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}
                          >
                            Reopen
                          </button>
                        )}
                        <button
                          onClick={() => deleteSession(s.id)}
                          disabled={actionId === s.id}
                          style={{ fontSize: 12.5, color: "var(--txt3)", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: "var(--txt3)", textAlign: "right" }}>
          {visible.length} session{visible.length !== 1 ? "s" : ""} shown
        </p>
      </main>
    </div>
  );
}
