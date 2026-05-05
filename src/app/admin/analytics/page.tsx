"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, BarChart2, MessageSquare, TrendingUp,
  Activity, Globe, RefreshCw, ChevronRight,
} from "lucide-react";

interface DailyPoint { date: string; count: number; }

interface AnalyticsData {
  users: {
    total: number; thisWeek: number; thisMonth: number;
    daily: DailyPoint[];
    recent: { id: string; email: string; created_at: string; last_sign_in: string | null }[];
  };
  sessions: {
    total: number; active: number; closed: number; thisWeek: number; thisMonth: number;
    byStudyType: Record<string, number>;
    byLanguage:  Record<string, number>;
    daily: DailyPoint[];
  };
  transcripts: {
    total: number; totalTurns: number; thisWeek: number; thisMonth: number;
    daily: DailyPoint[];
  };
}

const STUDY_LABELS: Record<string, string> = {
  behavioral:       "Behavioral",
  decision_journey: "Decision Journey",
  pain_points:      "Pain Points",
  perception:       "Brand Perception",
  concept_testing:  "Concept Testing",
};

const LANG_LABELS: Record<string, string> = { en: "English", si: "Sinhala", ta: "Tamil" };
const PALETTE = ["#6366f1", "#22d3ee", "#f59e0b", "#34d399", "#f87171"];

/* ── small helpers ── */

function LogoMark() {
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--inv)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
        <path d="M2 10L6 2l4 8" stroke="var(--inv-txt)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Dots() {
  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <span className="an-td" /><span className="an-td an-td-2" /><span className="an-td an-td-3" />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, color = "#6366f1",
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="an-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--txt2)" }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}1a`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={15} color={color} />
        </div>
      </div>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 38, fontWeight: 400, color: "var(--txt)", letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--txt3)" }}>{sub}</div>}
    </div>
  );
}

function MiniBarChart({ data, color, label }: { data: DailyPoint[]; color: string; label: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="an-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)" }}>{label}</span>
        <span style={{ fontSize: 11.5, color: "var(--txt3)" }}>{total} total</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 68 }}>
        {data.map((d, i) => {
          const h = Math.max(3, Math.round((d.count / max) * 60));
          const isToday = i === data.length - 1;
          return (
            <div key={d.date} title={`${d.date.slice(5).replace("-", "/")}  ·  ${d.count}`}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: "default" }}>
              <div className="an-bar" style={{
                width: "100%", height: h,
                background: isToday ? color : `${color}55`,
                borderRadius: "3px 3px 0 0",
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ fontSize: 10, color: "var(--txt3)" }}>{data[0]?.date.slice(5).replace("-", "/")}</span>
        <span style={{ fontSize: 10, color: "var(--txt3)" }}>Today</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: "var(--txt2)" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)" }}>
          {value} <span style={{ color: "var(--txt3)", fontWeight: 400, fontSize: 12 }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ height: 6, background: "var(--bg3)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--txt)", margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 12.5, color: "var(--txt3)", margin: "3px 0 0" }}>{sub}</p>}
    </div>
  );
}

/* ── page ── */

export default function AnalyticsPage() {
  const router = useRouter();

  const [data,       setData]       = useState<AnalyticsData | null>(null);
  const [fetching,   setFetching]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState("");

  const fetchData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setFetching(true);
    setError("");
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.status === 403) { router.replace("/admin/login"); return; }
      if (!res.ok) { setError("Failed to load analytics — check API."); return; }
      setData(await res.json());
    } catch {
      setError("Network error — could not reach the server.");
    } finally {
      setFetching(false); setRefreshing(false);
    }
  }, [router]);

  const fetchRef = useRef(fetchData);
  useEffect(() => { fetchRef.current = fetchData; }, [fetchData]);

  useEffect(() => { void fetchRef.current(); }, []);

  const d = data;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Header ── */}
      <header className="an-header">
        <Link href="/" className="an-logo">
          <LogoMark />
          <span>askaisl</span>
        </Link>

        <nav className="an-nav">
          <span className="an-badge">Analytics</span>
          <Link href="/admin" className="an-nav-link">
            Console <ChevronRight size={12} />
          </Link>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="an-nav-btn"
            aria-label="Refresh data"
          >
            <RefreshCw size={13} className={refreshing ? "an-spin" : ""} />
            <span className="an-refresh-label">{refreshing ? "Refreshing…" : "Refresh"}</span>
          </button>
          <button
            onClick={async () => { await fetch("/api/admin/auth", { method: "DELETE" }); router.replace("/admin/login"); }}
            className="an-nav-btn"
          >
            Logout
          </button>
        </nav>
      </header>

      <main className="an-main">

        {/* Heading */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(24px,4vw,36px)", fontWeight: 400, letterSpacing: "-0.02em", color: "var(--txt)", marginBottom: 6, lineHeight: 1.1 }}>
            Platform Analytics
          </h1>
          <p style={{ fontSize: 14, color: "var(--txt2)", fontWeight: 300 }}>
            Real-time overview of users, sessions, and interview activity.
          </p>
        </div>

        {error && (
          <div role="alert" style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 13.5, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {fetching ? <Dots /> : d ? (
          <>
            {/* ── KPI cards ── */}
            <div className="an-kpi-grid" style={{ marginBottom: 36 }}>
              <StatCard icon={Users}         label="Total Users"       value={d.users.total}            sub={`+${d.users.thisWeek} this week`}                             color="#6366f1" />
              <StatCard icon={BarChart2}     label="Total Sessions"    value={d.sessions.total}         sub={`${d.sessions.active} active · ${d.sessions.closed} closed`}  color="#22d3ee" />
              <StatCard icon={MessageSquare} label="Responses"         value={d.transcripts.total}      sub={`+${d.transcripts.thisWeek} this week`}                       color="#34d399" />
              <StatCard icon={TrendingUp}    label="Interview Turns"   value={d.transcripts.totalTurns} sub="Total respondent messages"                                    color="#f59e0b" />
              <StatCard icon={Activity}      label="Sessions · Month"  value={d.sessions.thisMonth}     sub="Created in last 30 days"                                      color="#f87171" />
              <StatCard icon={Globe}         label="New Users · Month" value={d.users.thisMonth}        sub="Registered in last 30 days"                                   color="#a78bfa" />
            </div>

            {/* ── 14-day bar charts ── */}
            <SectionTitle title="14-Day Activity" sub="Daily counts for the past two weeks — hover a bar for the exact date" />
            <div className="an-chart-grid" style={{ marginBottom: 40 }}>
              <MiniBarChart data={d.users.daily}       color="#6366f1" label="New User Signups" />
              <MiniBarChart data={d.sessions.daily}    color="#22d3ee" label="Sessions Created" />
              <MiniBarChart data={d.transcripts.daily} color="#34d399" label="Responses Collected" />
            </div>

            {/* ── Breakdowns ── */}
            <SectionTitle title="Breakdown" sub="Distribution across study types, languages, and session status" />
            <div className="an-breakdown-grid" style={{ marginBottom: 40 }}>

              <div className="an-card">
                <SectionTitle title="By Study Type" />
                {Object.entries(d.sessions.byStudyType).sort((a, b) => b[1] - a[1]).map(([k, v], i) => (
                  <BreakdownBar key={k} label={STUDY_LABELS[k] ?? k} value={v} total={d.sessions.total} color={PALETTE[i % PALETTE.length]} />
                ))}
                {Object.keys(d.sessions.byStudyType).length === 0 && (
                  <p style={{ fontSize: 13, color: "var(--txt3)" }}>No sessions yet.</p>
                )}
              </div>

              <div className="an-card">
                <SectionTitle title="By Language" />
                {Object.entries(d.sessions.byLanguage).sort((a, b) => b[1] - a[1]).map(([k, v], i) => (
                  <BreakdownBar key={k} label={LANG_LABELS[k] ?? k.toUpperCase()} value={v} total={d.sessions.total} color={PALETTE[i % PALETTE.length]} />
                ))}
                {Object.keys(d.sessions.byLanguage).length === 0 && (
                  <p style={{ fontSize: 13, color: "var(--txt3)" }}>No sessions yet.</p>
                )}
              </div>

              <div className="an-card">
                <SectionTitle title="Session Status" />
                <BreakdownBar label="Active" value={d.sessions.active} total={d.sessions.total} color="#22c55e" />
                <BreakdownBar label="Closed" value={d.sessions.closed} total={d.sessions.total} color="#ef4444" />
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 26, color: "var(--txt)" }}>{d.sessions.thisWeek}</div>
                    <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>This week</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 26, color: "var(--txt)" }}>{d.sessions.thisMonth}</div>
                    <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>This month</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 26, color: "var(--txt)" }}>
                      {d.sessions.total > 0 ? Math.round((d.transcripts.total / d.sessions.total) * 10) / 10 : 0}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Avg resp / session</div>
                  </div>
                </div>
              </div>

            </div>

            {/* ── User table ── */}
            <SectionTitle
              title="Registered Users"
              sub={`${d.users.total} total account${d.users.total !== 1 ? "s" : ""} · most recent first`}
            />
            <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", background: "var(--bg)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
                  <thead>
                    <tr style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}>
                      {["#", "User", "Signed Up", "Last Active"].map(h => (
                        <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--txt2)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {d.users.recent.map((u, i) => (
                      <tr key={u.id} className="an-user-row" style={{ borderBottom: i < d.users.recent.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--txt3)", width: 36 }}>{i + 1}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                              background: `hsl(${(u.email.charCodeAt(0) * 47) % 360},55%,58%)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: 700, color: "#fff",
                            }}>
                              {u.email[0]?.toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13.5, color: "var(--txt)", wordBreak: "break-all" }}>{u.email}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--txt2)", whiteSpace: "nowrap" }}>
                          {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--txt3)", whiteSpace: "nowrap" }}>
                          {u.last_sign_in
                            ? new Date(u.last_sign_in).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {d.users.recent.length === 0 && (
                <div style={{ padding: 48, textAlign: "center", color: "var(--txt2)", fontSize: 14 }}>No users yet.</div>
              )}
            </div>
            {d.users.total > 30 && (
              <p style={{ fontSize: 12, color: "var(--txt3)", textAlign: "right", marginTop: 8 }}>
                Showing 30 most recent of {d.users.total} total users.
              </p>
            )}
          </>
        ) : null}

      </main>

      <style>{`
        /* ── layout ── */
        .an-header {
          position: sticky; top: 0; z-index: 100;
          background: var(--bg); border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; height: 62px;
          gap: 12px;
        }
        .an-logo {
          font-family: var(--font-serif); font-size: 20px; font-weight: 500;
          color: var(--txt); text-decoration: none;
          display: flex; align-items: center; gap: 7px; flex-shrink: 0;
        }
        .an-nav {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          justify-content: flex-end;
        }
        .an-nav-link {
          font-size: 13px; color: var(--txt2); text-decoration: none;
          padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border);
          display: flex; align-items: center; gap: 3px;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .an-nav-link:hover { background: var(--bg2); color: var(--txt); }
        .an-nav-btn {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; padding: 6px 12px; border-radius: 8px;
          border: 1px solid var(--border); background: transparent;
          color: var(--txt2); cursor: pointer; font-family: inherit;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .an-nav-btn:hover:not(:disabled) { background: var(--bg2); color: var(--txt); }
        .an-nav-btn:disabled { opacity: 0.55; cursor: default; }
        .an-badge {
          font-size: 12px; padding: 3px 10px; border-radius: 99px;
          background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25);
          color: #6366f1; font-weight: 600; white-space: nowrap;
        }
        .an-main {
          max-width: 1200px; margin: 0 auto; padding: 48px 40px;
        }
        /* ── cards ── */
        .an-card {
          padding: 22px 24px; border: 1px solid var(--border);
          border-radius: 16px; background: var(--bg2);
        }
        /* ── grids ── */
        .an-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }
        .an-chart-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 16px;
        }
        .an-breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        /* ── bar animation ── */
        .an-bar { transition: height 0.4s ease; }
        /* ── user row hover ── */
        .an-user-row { transition: background 0.12s; }
        .an-user-row:hover { background: var(--bg2); }
        /* ── dots loader ── */
        .an-td { width:7px;height:7px;border-radius:50%;background:var(--txt3);display:inline-block;animation:an-td 1.2s ease-in-out infinite; }
        .an-td-2{animation-delay:.2s}.an-td-3{animation-delay:.4s}
        @keyframes an-td{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
        /* ── spinner ── */
        .an-spin { animation: an-spin 0.9s linear infinite; }
        @keyframes an-spin { to { transform: rotate(360deg); } }

        /* ── responsive ── */
        @media (max-width: 768px) {
          .an-header { padding: 0 16px; }
          .an-refresh-label { display: none; }
          .an-nav { gap: 6px; }
          .an-nav-link, .an-nav-btn { padding: 6px 10px; font-size: 12px; }
          .an-main { padding: 28px 16px; }
          .an-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .an-card { padding: 16px 18px; }
          .an-chart-grid { grid-template-columns: 1fr; }
          .an-breakdown-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .an-kpi-grid { grid-template-columns: 1fr 1fr; }
          .an-logo span { display: none; }
          .an-badge { display: none; }
        }
      `}</style>
    </div>
  );
}
