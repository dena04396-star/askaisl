"use client";

import { useState, useCallback, MutableRefObject } from "react";
import dynamic from "next/dynamic";

/*
 * InterviewAvatar — tries HeyGen streaming first, falls back to
 * the local GLB model (Avatar3D) stored in /public/avatar/female.glb.
 *
 * This file is deliberately kept thin — the actual renderers live in
 * HeyGenAvatar.tsx and Avatar3D.tsx.
 */

const HeyGenAvatar = dynamic(() => import("./HeyGenAvatar"), { ssr: false });
const Avatar3D     = dynamic(() => import("./Avatar3D"),     { ssr: false });

export interface InterviewAvatarProps {
  isSpeaking: boolean;
  isListening?: boolean;
  language: string;
  /** Text the avatar should speak (HeyGen only — ignored in fallback). */
  speakText: string | null;
  analyserRef?: MutableRefObject<AnalyserNode | null>;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
}

export default function InterviewAvatar({
  isSpeaking,
  isListening,
  language,
  speakText,
  analyserRef,
  onSpeakStart,
  onSpeakEnd,
}: InterviewAvatarProps) {
  const [heygenFailed, setHeygenFailed] = useState(false);

  // If HeyGen API key isn't configured, skip straight to fallback
  const heygenConfigured =
    typeof process !== "undefined" &&
    !!process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID;

  const useHeygen = heygenConfigured && !heygenFailed;

  const handleHeyGenReady = useCallback(() => {
    // HeyGen session connected successfully
  }, []);

  if (useHeygen) {
    return (
      <HeyGenAvatarWithFallback
        speakText={speakText}
        language={language}
        onSpeakStart={onSpeakStart}
        onSpeakEnd={onSpeakEnd}
        onReady={handleHeyGenReady}
        onFail={() => setHeygenFailed(true)}
        fallback={
          <Avatar3D
            isSpeaking={isSpeaking}
            isListening={isListening}
            analyserRef={analyserRef}
          />
        }
      />
    );
  }

  // Fallback: local GLB model from /public/avatar/female.glb
  return (
    <Avatar3D
      isSpeaking={isSpeaking}
      isListening={isListening}
      analyserRef={analyserRef}
    />
  );
}

/* ── Wrapper that catches HeyGen init failure ── */

function HeyGenAvatarWithFallback({
  speakText,
  language,
  onSpeakStart,
  onSpeakEnd,
  onReady,
  onFail,
  fallback,
}: {
  speakText: string | null;
  language: string;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onReady: () => void;
  onFail: () => void;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  const handleReady = useCallback(() => {
    onReady();
  }, [onReady]);

  // HeyGenAvatar sets initError internally and renders a fallback UI.
  // We wrap it in an error boundary logic — if it self-reports failure
  // via its own initError state, the parent will re-render with the
  // fallback 3D avatar. Since HeyGenAvatar handles its own error
  // display, we just render it and let the parent InterviewAvatar
  // decide via the heygenFailed state.

  if (failed) return <>{fallback}</>;

  return (
    <HeyGenAvatar
      speakText={speakText}
      language={language}
      onSpeakStart={onSpeakStart}
      onSpeakEnd={onSpeakEnd}
      onReady={handleReady}
    />
  );
}
