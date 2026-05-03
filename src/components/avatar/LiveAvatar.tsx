"use client";

import { useEffect, useRef, useState } from "react";
import { LiveAvatarSession, AgentEventsEnum, SessionEvent } from "@heygen/liveavatar-web-sdk";

interface Props {
  speakText:      string | null;
  language?:      string;
  onSpeakStart?:  () => void;
  onSpeakEnd?:    () => void;
  onReady?:       () => void;
  onFail?:        () => void;
  onAvatarReady?: (handlesAudio: boolean) => void;
}

export default function LiveAvatarComponent({
  speakText,
  onSpeakStart,
  onSpeakEnd,
  onReady,
  onFail,
  onAvatarReady,
}: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const sessionRef  = useRef<LiveAvatarSession | null>(null);
  const lastTextRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let destroyed = false;

    async function init() {
      try {
        const res = await fetch("/api/liveavtar/token", { method: "POST" });
        if (!res.ok) throw new Error(`Token ${res.status}`);
        const { session_token } = await res.json();

        const session = new LiveAvatarSession(session_token);
        sessionRef.current = session;

        session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => onSpeakStart?.());
        session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED,   () => onSpeakEnd?.());
        session.on(SessionEvent.SESSION_STREAM_READY, () => {
          if (destroyed) return;
          if (videoRef.current) session.attach(videoRef.current);
          setConnected(true);
          onReady?.();
          onAvatarReady?.(true);
        });
        session.on(SessionEvent.SESSION_DISCONNECTED, () => {
          if (!destroyed) setConnected(false);
        });

        await session.start();
      } catch (err) {
        console.error("[LiveAvatar] init failed:", err);
        if (!destroyed) {
          onFail?.();
          onAvatarReady?.(false);
        }
      }
    }

    init();

    return () => {
      destroyed = true;
      sessionRef.current?.stop().catch(() => {});
      sessionRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!speakText || speakText === lastTextRef.current || !connected || !sessionRef.current) return;
    lastTextRef.current = speakText;
    sessionRef.current.repeat(speakText);
  }, [speakText, connected]);

  return (
    <div style={{ width: "100%", height: "100%", background: "#000", position: "relative" }}>
      {!connected && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0d0f" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span className="td" /><span className="td td-2" /><span className="td td-3" />
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: connected ? 1 : 0, transition: "opacity 0.4s" }}
      />
    </div>
  );
}
