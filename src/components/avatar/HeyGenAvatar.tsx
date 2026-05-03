"use client";

import { useEffect, useRef, useState } from "react";
import StreamingAvatar, { StreamingEvents, TaskType, AvatarQuality, ElevenLabsModel } from "@heygen/streaming-avatar";

interface Props {
  speakText:      string | null;
  language?:      string;
  onSpeakStart?:  () => void;
  onSpeakEnd?:    () => void;
  onReady?:       () => void;
  onFail?:        () => void;
  onAvatarReady?: (handlesAudio: boolean) => void;
}

export default function HeyGenStreamingAvatar({
  speakText,
  language,
  onSpeakStart,
  onSpeakEnd,
  onReady,
  onFail,
  onAvatarReady,
}: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const avatarRef   = useRef<StreamingAvatar | null>(null);
  const lastTextRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let destroyed = false;

    async function init() {
      try {
        const res = await fetch("/api/heygen/token", { method: "POST" });
        if (!res.ok) throw new Error(`Token ${res.status}`);
        const { token } = await res.json();

        const avatar = new StreamingAvatar({ token });
        avatarRef.current = avatar;

        avatar.on(StreamingEvents.STREAM_READY, () => {
          if (destroyed) return;
          if (videoRef.current && avatar.mediaStream) {
            videoRef.current.srcObject = avatar.mediaStream;
            videoRef.current.play().catch(() => {});
          }
          setConnected(true);
          onReady?.();
          onAvatarReady?.(true);
        });

        avatar.on(StreamingEvents.AVATAR_START_TALKING, () => onSpeakStart?.());
        avatar.on(StreamingEvents.AVATAR_STOP_TALKING,  () => onSpeakEnd?.());

        avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
          if (!destroyed) setConnected(false);
        });

        const avatarId = process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID || "";
        const voiceId  = process.env.NEXT_PUBLIC_HEYGEN_VOICE_ID  || "";

        await avatar.newSession({
          quality:    AvatarQuality.High,
          avatarName: avatarId,
          voice: voiceId ? {
            voiceId,
            model: ElevenLabsModel.eleven_multilingual_v2,
          } : undefined,
          language: (language || "en").split("-")[0],
        });
      } catch (err) {
        console.error("[HeyGen] init failed:", err);
        if (!destroyed) {
          onFail?.();
          onAvatarReady?.(false);
        }
      }
    }

    init();

    return () => {
      destroyed = true;
      avatarRef.current?.stopAvatar().catch(() => {});
      avatarRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Speak when new text arrives */
  useEffect(() => {
    if (!speakText || speakText === lastTextRef.current || !connected || !avatarRef.current) return;
    lastTextRef.current = speakText;
    avatarRef.current.speak({ text: speakText, task_type: TaskType.REPEAT }).catch(console.error);
  }, [speakText, connected]);

  return (
    <div style={{ width: "100%", height: "100%", background: "#000", position: "relative" }}>
      {!connected && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0d0f" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span className="td" />
            <span className="td td-2" />
            <span className="td td-3" />
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
