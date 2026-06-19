"use client";

import { MutableRefObject, useEffect } from "react";

export interface InterviewAvatarProps {
  isSpeaking:     boolean;
  isListening?:   boolean;
  isLoading?:     boolean;
  language:       string;
  speakText:      string | null;
  analyserRef?:   MutableRefObject<AnalyserNode | null>;
  onSpeakStart?:  () => void;
  onSpeakEnd?:    () => void;
  onAvatarReady?: (handlesAudio: boolean) => void;
}

/* Client asked for a plain image avatar (no animated SVG face). */
export default function InterviewAvatar({ onAvatarReady }: InterviewAvatarProps) {
  useEffect(() => { onAvatarReady?.(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0d0d0f" }}>
      <img
        src="/dena_avatar.avif"
        alt="Mrs Dissanayake"
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
      />
    </div>
  );
}
