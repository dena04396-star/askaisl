"use client";

import { MutableRefObject, useEffect } from "react";
import SimpleAvatar from "./SimpleAvatar";

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

export default function InterviewAvatar({
  isSpeaking, isListening, isLoading, analyserRef, onAvatarReady,
}: InterviewAvatarProps) {
  useEffect(() => { onAvatarReady?.(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <SimpleAvatar
      isSpeaking={isSpeaking}
      isListening={isListening}
      isLoading={isLoading}
      analyserRef={analyserRef}
    />
  );
}
