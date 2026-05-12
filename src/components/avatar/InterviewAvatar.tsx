"use client";

import { MutableRefObject } from "react";
import dynamic from "next/dynamic";

const Avatar3D = dynamic(() => import("./Avatar3D"), { ssr: false });

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
  return (
    <Avatar3D
      isSpeaking={isSpeaking}
      isListening={isListening}
      isLoading={isLoading}
      analyserRef={analyserRef}
      onReady={() => onAvatarReady?.(false)}
    />
  );
}
