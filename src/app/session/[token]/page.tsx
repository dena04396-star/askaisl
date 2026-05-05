"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
    <div className="w-5.5 h-5.5 rounded-md flex items-center justify-center shrink-0"
      style={{ background: "var(--inv)" }}>
      <svg viewBox="0 0 12 12" fill="none" width={12} height={12}>
        <path d="M2 10L6 2l4 8" stroke="var(--inv-txt)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

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
      .select("id,token,title,study_type,language,product_category,discussion_guide,status,created_at,created_by")
      .eq("token", token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setStep("error"); return; }
        setSession(data as SessionRow);
        setStep(data.status === "active" ? "welcome" : "error");
      });
  }, [token]);

  if (step === "started" && session) {
    return (
      <ChatInterface
        preConfig={{
          studyType:       session.study_type as StudyType,
          language:        session.language   as Locale,
          productCategory: session.product_category,
          respondentName:  name || undefined,
          customGuide:     session.discussion_guide,
          sessionToken:    session.token,
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: "var(--bg)" }}>

      {/* Logo — not a link during consent so respondent can't navigate away */}
      <div className="flex items-center gap-2 font-medium text-xl mb-12"
        style={{ fontFamily: "var(--font-serif)", color: "var(--txt)" }}>
        <LogoMark /> askaisl
      </div>

      {/* Loading */}
      {step === "loading" && (
        <div className="flex gap-1.5">
          <span className="td" /><span className="td td-2" /><span className="td td-3" />
        </div>
      )}

      {/* Error */}
      {step === "error" && (
        <div className="max-w-sm text-center">
          <div className="w-13 h-13 rounded-full flex items-center justify-center mx-auto mb-5 text-xl"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>✕</div>
          <h1 className="text-2xl font-normal mb-3"
            style={{ fontFamily: "var(--font-serif)", color: "var(--txt)" }}>Link not found</h1>
          <p className="text-sm font-light leading-relaxed" style={{ color: "var(--txt2)" }}>
            This interview link is invalid or has been closed. Please contact the researcher who shared it.
          </p>
        </div>
      )}

      {/* Welcome */}
      {step === "welcome" && session && (
        <div className="w-full max-w-md p-8 rounded-2xl border shadow-lg"
          style={{ background: "var(--bg)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}>

          <div className="flex flex-wrap gap-2 mb-7">
            <span className="px-3 py-1 rounded-full border text-[12.5px] font-medium"
              style={{ borderColor: "var(--border)", color: "var(--txt2)" }}>
              {STUDY_LABELS[session.study_type] ?? session.study_type}
            </span>
            <span className="px-3 py-1 rounded-full border text-[12.5px] font-medium"
              style={{ borderColor: "var(--border)", color: "var(--txt2)" }}>
              {LOCALE_LABELS[session.language] ?? session.language}
            </span>
          </div>

          <h1 className="text-[28px] font-normal leading-tight mb-3"
            style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.02em", color: "var(--txt)" }}>
            You&apos;ve been invited to a research interview
          </h1>
          <p className="text-[14.5px] font-light leading-relaxed mb-8" style={{ color: "var(--txt2)" }}>
            Mrs Dissanayake, our AI market research interviewer, will conduct a{" "}
            <strong className="font-medium" style={{ color: "var(--txt)" }}>{session.product_category}</strong>{" "}
            study with you today. The interview takes around 10–15 minutes.
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            try {
              await navigator.mediaDevices.getUserMedia({ audio: true });

              if (!isMobile) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                  video: { displaySurface: "monitor" },
                  audio: false,
                });
                const screenTrack = screenStream.getVideoTracks()[0];
                screenTrack.onended = () => {
                  if (!(window as any).interviewFinished) {
                    alert("Screen sharing ended. The interview has been terminated to prevent cheating.");
                    window.location.reload();
                  }
                };
                try {
                  if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                  }
                } catch { /* fullscreen is best-effort */ }
                const handleFullscreenChange = () => {
                  if (!document.fullscreenElement && !(window as any).interviewFinished) {
                    alert("Please return to full screen to continue your interview.");
                    document.documentElement.requestFullscreen().catch(() => {});
                  }
                };
                document.addEventListener("fullscreenchange", handleFullscreenChange);
              }

              setStep("started");
            } catch {
              alert(isMobile
                ? "You must allow microphone access to begin the interview."
                : "You must allow both microphone and screen sharing to begin the interview."
              );
            }
          }}
            className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--txt2)" }}>
                Your name <span className="normal-case font-normal opacity-60">(optional)</span>
              </label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name" autoFocus
                className="w-full px-3.5 py-3 rounded-xl border text-[14.5px] outline-none transition-colors font-[inherit]"
                style={{ background: "var(--bg2)", color: "var(--txt)", borderColor: "var(--border)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--txt)"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; }}
              />
            </div>
            <p className="text-[12px] opacity-70 mt-1" style={{ color: "var(--txt2)" }}>Note: You will be asked to allow microphone access to proceed.</p>
            <button type="submit"
              className="w-full py-3.5 rounded-xl text-[15px] font-medium flex items-center justify-center gap-2 transition-all border-none cursor-pointer mt-1 font-[inherit]"
              style={{ background: "var(--inv)", color: "var(--inv-txt)" }}>
              Begin Interview <ChevronRight size={16} />
            </button>
          </form>

          <p className="text-center mt-5 text-[12.5px] leading-relaxed" style={{ color: "var(--txt3)" }}>
            Your responses are confidential and used only for research purposes.
          </p>
        </div>
      )}
    </div>
  );
}
