"use client";

import { useState, useCallback, MutableRefObject } from "react";
import dynamic from "next/dynamic";

const HeyGenStreamingAvatar = dynamic(() => import("./HeyGenAvatar"), { ssr: false });
const Avatar3D              = dynamic(() => import("./Avatar3D"),      { ssr: false });

export interface InterviewAvatarProps {
  isSpeaking:     boolean;
  isListening?:   boolean;
  language:       string;
  speakText:      string | null;
  analyserRef?:   MutableRefObject<AnalyserNode | null>;
  onSpeakStart?:  () => void;
  onSpeakEnd?:    () => void;
  onAvatarReady?: (handlesAudio: boolean) => void;
}

export default function InterviewAvatar({
  isSpeaking, isListening, language, speakText,
  analyserRef, onSpeakStart, onSpeakEnd, onAvatarReady,
}: InterviewAvatarProps) {
  const [heygenFailed, setHeygenFailed] = useState(false);

  const heygenConfigured = !!process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID;

  const handleHeygenFail = useCallback(() => {
    setHeygenFailed(true);
    onAvatarReady?.(false);   // fall through — ChatInterface handles its own TTS
  }, [onAvatarReady]);

  if (heygenConfigured && !heygenFailed) {
    return (
      <HeyGenStreamingAvatar
        speakText={speakText}
        language={language}
        onSpeakStart={onSpeakStart}
        onSpeakEnd={onSpeakEnd}
        onFail={handleHeygenFail}
        onAvatarReady={onAvatarReady}
      />
    );
  }

  return (
    <Avatar3D
      isSpeaking={isSpeaking}
      isListening={isListening}
      analyserRef={analyserRef}
    />
  );
}
