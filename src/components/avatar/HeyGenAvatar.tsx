"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  VoiceEmotion,
} from "@heygen/streaming-avatar";

export interface HeyGenAvatarProps {
  /** Text to speak. Pass a new string (even same content) to trigger speech. */
  speakText: string | null;
  /** BCP-47 locale, e.g. "en-US", "si-LK", "ta-IN" */
  language: string;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onReady?: () => void;
}

/* HeyGen locale → ISO-639-1 that HeyGen accepts */
function toHeyGenLang(bcp47: string): string {
  const prefix = bcp47.split("-")[0].toLowerCase();
  const MAP: Record<string, string> = {
    si: "en", // Sinhala not natively supported; fall back to English voice
    ta: "en", // Tamil not natively supported
    en: "en",
  };
  return MAP[prefix] ?? "en";
}

export default function HeyGenAvatar({
  speakText,
  language,
  onSpeakStart,
  onSpeakEnd,
  onReady,
}: HeyGenAvatarProps) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const avatarRef   = useRef<StreamingAvatar | null>(null);
  const [ready,     setReady]     = useState(false);
  const [initError, setInitError] = useState(false);
  const lastTextRef = useRef<string | null>(null);

  /* ── Initialise session once on mount ── */
  useEffect(() => {
    let alive = true;

    async function init() {
      try {
        const res = await fetch("/api/heygen/token", { method: "POST" });
        if (!res.ok) throw new Error("token fetch failed");
        const { token } = await res.json();
        if (!token) throw new Error("no token");

        const avatar = new StreamingAvatar({ token });
        avatarRef.current = avatar;

        avatar.on(StreamingEvents.STREAM_READY, (e: CustomEvent<MediaStream>) => {
          if (videoRef.current) {
            videoRef.current.srcObject = e.detail;
            videoRef.current.play().catch(() => {});
          }
          if (alive) { setReady(true); onReady?.(); }
        });

        avatar.on(StreamingEvents.AVATAR_START_TALKING, () => { if (alive) onSpeakStart?.(); });
        avatar.on(StreamingEvents.AVATAR_STOP_TALKING,  () => { if (alive) onSpeakEnd?.();   });

        avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
          if (alive) setReady(false);
        });

        await avatar.createStartAvatar({
          quality:    AvatarQuality.High,
          avatarName: process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID ?? "default",
          voice: {
            voiceId:  process.env.NEXT_PUBLIC_HEYGEN_VOICE_ID,
            rate:     1.0,
            emotion:  VoiceEmotion.FRIENDLY,
          },
          language: toHeyGenLang(language),
          disableIdleTimeout: false,
        });
      } catch (err) {
        console.error("[HeyGenAvatar] init error:", err);
        if (alive) setInitError(true);
      }
    }

    init();

    return () => {
      alive = false;
      avatarRef.current?.stopAvatar().catch(() => {});
      avatarRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Speak when speakText changes ── */
  useEffect(() => {
    if (!speakText || !ready || !avatarRef.current) return;
    if (speakText === lastTextRef.current) return;
    lastTextRef.current = speakText;

    avatarRef.current
      .speak({ text: speakText, task_type: TaskType.TALK })
      .catch((err) => console.error("[HeyGenAvatar] speak error:", err));
  }, [speakText, ready]);

  /* ── Fallback if HeyGen fails to initialise ── */
  if (initError) {
    return (
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "#0d0d0f", gap: 12,
      }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#1a1a1f", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.25)" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.20)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Avatar unavailable</span>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "#0d0d0f" }}>
      {/* Loading shimmer while session starts */}
      {!ready && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#0d0d0f",
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span className="td" /><span className="td td-2" /><span className="td td-3" />
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false}
        style={{
          width: "100%", height: "100%",
          objectFit: "cover",
          display: "block",
          opacity: ready ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      />
    </div>
  );
}
