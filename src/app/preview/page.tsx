"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

/* Preview the ACTUAL interview avatar (Living Portrait) — same component used in sessions */
const SimpleAvatar = dynamic(() => import("@/components/avatar/SimpleAvatar"), { ssr: false });

export default function AvatarPreviewPage() {
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);

  const state = isSpeaking ? "Speaking" : isLoading ? "Thinking" : isListening ? "Listening" : "Idle";
  const stateColor = isSpeaking ? "#4ade80" : isLoading ? "#fbbf24" : isListening ? "#60a5fa" : "rgba(255,255,255,0.4)";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", height: "100vh", background: "#0d0d0f", fontFamily: "inherit" }}>

      {/* Avatar */}
      <div style={{ position: "relative" }}>
        <SimpleAvatar isSpeaking={isSpeaking} isListening={isListening} isLoading={isLoading} />
      </div>

      {/* Controls */}
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14, borderLeft: "1px solid rgba(255,255,255,0.08)", background: "#111113" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>
          Avatar Preview
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginBottom: 4 }}>
          The live interview avatar — no API calls, safe for testing.
        </p>

        <Btn active={isSpeaking} onClick={() => setIsSpeaking(v => !v)} label={isSpeaking ? "Speaking ON" : "Speaking OFF"} color="#4ade80" />
        <Btn active={isListening} onClick={() => setIsListening(v => !v)} label={isListening ? "Listening ON" : "Listening OFF"} color="#60a5fa" />
        <Btn active={isLoading} onClick={() => setIsLoading(v => !v)} label={isLoading ? "Thinking ON" : "Thinking OFF"} color="#fbbf24" />

        <div style={{ marginTop: 8, padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>State</div>
          <div style={{ fontSize: 13, color: stateColor }}>{state}</div>
        </div>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", lineHeight: 1.6, marginTop: 4 }}>
          Tip: blinking & breathing run continuously. In a real session the mouth lip-syncs to live audio; here “Speaking” uses procedural mouth movement.
        </p>
      </div>
    </div>
  );
}

function Btn({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "11px 16px", borderRadius: 9, border: "none", cursor: "pointer",
        fontFamily: "inherit", fontSize: 13, fontWeight: 500, transition: "all 0.15s",
        background: active ? color : "rgba(255,255,255,0.06)",
        color: active ? "#000" : "rgba(255,255,255,0.55)",
      }}
    >
      {label}
    </button>
  );
}
