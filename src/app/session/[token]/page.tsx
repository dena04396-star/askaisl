"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getBrowserClient } from "@/lib/auth/client";
import type { SessionRow, StudyType, Locale } from "@/types";
import ChatInterface from "@/components/chat/ChatInterface";

const STUDY_LABELS: Record<string, string> = {
  behavioral:       "Behavioral Research",
  decision_journey: "Decision Journey",
  pain_points:      "Pain Points",
  perception:       "Brand Perception",
  concept_testing:  "Concept Testing",
};

const LOCALE_LABELS: Record<string, string> = { en: "English", si: "සිංහල", ta: "தமிழ்" };

function LogoMark() {
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--inv)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
        <path d="M2 10L6 2l4 8" stroke="var(--inv-txt)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", background: "var(--bg2)", color: "var(--txt)",
  border: "1px solid var(--border)", borderRadius: 10, fontSize: 14.5, outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
};

type Step = "loading" | "welcome" | "started" | "error";

export default function SessionPage() {
  const { token } = useParams<{ token: string }>();

  const [session, setSession] = useState<SessionRow | null>(null);
  const [step,    setStep]    = useState<Step>("loading");
  const [name,    setName]    = useState("");

  useEffect(() => {
    if (!token) { setStep("error"); return; }
    getBrowserClient()
      .from("interview_sessions")
      .select("id,token,title,study_type,language,product_category,status,created_at,created_by")
      .eq("token", token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setStep("error"); return; }
        setSession(data as SessionRow);
        setStep(data.status === "active" ? "welcome" : "error");
      });
  }, [token]);

  /* ── Interview started ── */
  if (step === "started" && session) {
    return (
      <ChatInterface
        preConfig={{
          studyType:       session.study_type as StudyType,
          language:        session.language   as Locale,
          productCategory: session.product_category,
          respondentName:  name || undefined,
        }}
      />
    );
  }

  /* ── Shell (loading / welcome / error) ── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>

      {/* Logo */}
      <Link href="/" style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--txt)", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, marginBottom: 48 }}>
        <LogoMark /> vinterview
      </Link>

      {/* Loading */}
      {step === "loading" && (
        <div style={{ display: "flex", gap: 6 }}>
          <span className="td" /><span className="td td-2" /><span className="td td-3" />
        </div>
      )}

      {/* Error */}
      {step === "error" && (
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 22 }}>
            ✕
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 400, color: "var(--txt)", marginBottom: 10 }}>
            Link not found
          </h1>
          <p style={{ fontSize: 14, color: "var(--txt2)", fontWeight: 300, lineHeight: 1.7 }}>
            This interview link is invalid or has been closed. Please contact the researcher who shared it with you.
          </p>
        </div>
      )}

      {/* Welcome */}
      {step === "welcome" && session && (
        <div style={{ width: "100%", maxWidth: 480, padding: "40px", border: "1px solid var(--border)", borderRadius: 18, background: "var(--bg)", boxShadow: "var(--shadow-lg)" }}>

          {/* Session info chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            <span style={{ padding: "4px 12px", borderRadius: 99, border: "1px solid var(--border)", fontSize: 12.5, color: "var(--txt2)", fontWeight: 500 }}>
              {STUDY_LABELS[session.study_type] ?? session.study_type}
            </span>
            <span style={{ padding: "4px 12px", borderRadius: 99, border: "1px solid var(--border)", fontSize: 12.5, color: "var(--txt2)", fontWeight: 500 }}>
              {LOCALE_LABELS[session.language] ?? session.language}
            </span>
          </div>

          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.15, color: "var(--txt)", marginBottom: 12 }}>
            You&apos;ve been invited to a research interview
          </h1>
          <p style={{ fontSize: 14.5, color: "var(--txt2)", fontWeight: 300, lineHeight: 1.7, marginBottom: 32 }}>
            Mrs Dissanayake, our AI market research interviewer, will conduct a <strong style={{ fontWeight: 500, color: "var(--txt)" }}>{session.product_category}</strong> study with you today. The interview takes around 10–15 minutes.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); setStep("started"); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--txt2)", marginBottom: 8 }}>
                Your name <span style={{ fontWeight: 400, textTransform: "none", opacity: 0.6 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                autoFocus
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--txt)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,0,0,0.06)"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <button type="submit"
              style={{ width: "100%", padding: 13, borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: "pointer", border: "none", background: "var(--inv)", color: "var(--inv-txt)", transition: "all 0.15s", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}
            >
              Begin Interview <ChevronRight size={16} />
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 12.5, color: "var(--txt3)", lineHeight: 1.6 }}>
            Your responses are confidential and used only for research purposes.
          </p>
        </div>
      )}

    </div>
  );
}
