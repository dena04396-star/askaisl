"use client";

import { MutableRefObject } from "react";
import dynamic from "next/dynamic";

const Avatar3D = dynamic(() => import("./Avatar3D"), { ssr: false });

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
  isSpeaking, isListening, analyserRef, onAvatarReady,
}: InterviewAvatarProps) {
  return (
    <Avatar3D
      isSpeaking={isSpeaking}
      isListening={isListening}
      analyserRef={analyserRef}
      onReady={() => onAvatarReady?.(false)}
    />
  );
}
