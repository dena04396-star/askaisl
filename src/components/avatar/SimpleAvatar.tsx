"use client";

import { useRef, useEffect } from "react";

interface Props {
  isSpeaking:  boolean;
  isListening?: boolean;
  isLoading?:  boolean;
  analyserRef?: React.MutableRefObject<AnalyserNode | null>;
}

export default function SimpleAvatar({ isSpeaking, isListening, isLoading, analyserRef }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const micCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef       = useRef<number>(0);
  const micRafRef    = useRef<number>(0);
  const micBarRef    = useRef<number[]>([0.15, 0.3, 0.45, 0.6, 0.45, 0.3, 0.15]);

  /* TTS waveform — driven by analyser when speaking */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const analyser = analyserRef?.current;
      if (!analyser || !isSpeaking) return;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const barW = canvas.width / 28;
      for (let i = 0; i < 28; i++) {
        const v = data[Math.floor(i * data.length / 28)] / 255;
        const h = Math.max(3, v * canvas.height * 0.85);
        ctx.fillStyle = `rgba(74,222,128,${0.25 + v * 0.75})`;
        ctx.beginPath();
        ctx.roundRect(i * barW + 1, (canvas.height - h) / 2, barW - 2, h, 2);
        ctx.fill();
      }
    };
    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isSpeaking, analyserRef]);

  /* Listening bars — animated bars via canvas for mic-input feedback */
  useEffect(() => {
    const canvas = micCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const BARS = 7;
    const phases = Array.from({ length: BARS }, (_, i) => (i / BARS) * Math.PI * 2);

    const animate = (t: number) => {
      micRafRef.current = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!isListening) return;
      const barW = canvas.width / BARS;
      for (let i = 0; i < BARS; i++) {
        const v = 0.35 + 0.55 * Math.abs(Math.sin(t * 0.003 + phases[i]));
        const h = Math.max(4, v * canvas.height * 0.88);
        ctx.fillStyle = `rgba(96,165,250,${0.3 + v * 0.6})`;
        ctx.beginPath();
        ctx.roundRect(i * barW + 2, (canvas.height - h) / 2, barW - 4, h, 3);
        ctx.fill();
      }
    };
    micRafRef.current = requestAnimationFrame(animate);
    return () => { if (micRafRef.current) cancelAnimationFrame(micRafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const ringColor   = isSpeaking ? "#4ade80" : isListening ? "#60a5fa" : "#fbbf24";
  const borderColor = isSpeaking ? "#4ade80" : isListening ? "#60a5fa" : isLoading ? "#fbbf2488" : "rgba(255,255,255,0.10)";
  const glow        = isSpeaking ? "0 0 40px rgba(74,222,128,0.22)" : isListening ? "0 0 40px rgba(96,165,250,0.28)" : "none";

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0d0d0f", position: "relative", overflow: "hidden" }}>

      {/* animated rings — outward for speaking, inward-pulse for listening */}
      {(isSpeaking || isListening) && [0, 1, 2].map(i => (
        <div key={i} style={{
          position: "absolute",
          width:  220 + i * 64, height: 220 + i * 64,
          borderRadius: "50%",
          border: `1px solid ${ringColor}33`,
          animation: isListening
            ? `sa-ring-in ${1.0 + i * 0.30}s ease-in-out infinite`
            : `sa-ring ${1.2 + i * 0.35}s ease-out infinite`,
          animationDelay: `${i * 0.22}s`,
          pointerEvents: "none",
        }} />
      ))}

      {/* portrait */}
      <div style={{
        width: 210, height: 210, borderRadius: "50%",
        background: "linear-gradient(145deg, #1c1c2a 0%, #13131f 100%)",
        border: `2.5px solid ${borderColor}`,
        boxShadow: glow,
        transition: "border-color 0.35s, box-shadow 0.35s",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* illustrated face */}
        <svg width="148" height="164" viewBox="0 0 148 164" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* hair back */}
          <ellipse cx="74" cy="66" rx="47" ry="50" fill="#1e0e06"/>
          {/* face */}
          <ellipse cx="74" cy="80" rx="38" ry="42" fill="#c8856a"/>
          {/* hair top */}
          <path d="M27 66 Q28 28 74 24 Q120 28 121 66 Q110 42 74 40 Q38 42 27 66Z" fill="#2c1408"/>
          {/* side hair strands */}
          <path d="M27 66 Q18 88 22 116 Q28 98 34 92" fill="#2c1408"/>
          <path d="M121 66 Q130 88 126 116 Q120 98 114 92" fill="#2c1408"/>
          {/* ears */}
          <ellipse cx="36" cy="82" rx="6" ry="8" fill="#b87560"/>
          <ellipse cx="112" cy="82" rx="6" ry="8" fill="#b87560"/>
          {/* eyes white */}
          <ellipse cx="60" cy="76" rx="6" ry="7" fill="white"/>
          <ellipse cx="88" cy="76" rx="6" ry="7" fill="white"/>
          {/* irises */}
          <ellipse cx="60" cy="77" rx="4" ry="5" fill="#3d200e"/>
          <ellipse cx="88" cy="77" rx="4" ry="5" fill="#3d200e"/>
          {/* pupils */}
          <ellipse cx="60" cy="77" rx="2" ry="2.5" fill="#0d0703"/>
          <ellipse cx="88" cy="77" rx="2" ry="2.5" fill="#0d0703"/>
          {/* eye shine */}
          <ellipse cx="61.5" cy="75.5" rx="1.2" ry="1.2" fill="white"/>
          <ellipse cx="89.5" cy="75.5" rx="1.2" ry="1.2" fill="white"/>
          {/* brows */}
          <path d="M52 68 Q60 64 68 67" stroke="#2c1408" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
          <path d="M80 67 Q88 64 96 68" stroke="#2c1408" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
          {/* nose */}
          <path d="M71 87 Q74 94 77 87" stroke="#a86a50" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          {/* smile */}
          <path d="M63 99 Q74 110 85 99" stroke="#9b5040" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
          {/* lips hint */}
          <path d="M66 99 Q74 104 82 99" stroke="#b06050" strokeWidth="1" fill="none"/>
          {/* neck */}
          <rect x="62" y="120" width="24" height="22" rx="6" fill="#c8856a"/>
          {/* blouse */}
          <path d="M10 164 Q36 136 62 128 Q74 140 86 128 Q112 136 138 164Z" fill="#2d3a4a"/>
          <path d="M62 128 Q74 142 86 128 L82 148 Q74 154 66 148Z" fill="#3d4f62"/>
        </svg>

        {/* thinking dots overlay */}
        {isLoading && (
          <div style={{ position: "absolute", bottom: 18, display: "flex", gap: 5 }}>
            <span className="td" /><span className="td td-2" /><span className="td td-3" />
          </div>
        )}
      </div>

      {/* TTS waveform canvas — visible when speaking */}
      <canvas ref={canvasRef} width={260} height={36} style={{ marginTop: 16, opacity: isSpeaking ? 1 : 0, transition: "opacity 0.3s", position: "absolute", bottom: 16 }} />

      {/* Mic input canvas — visible when listening */}
      <canvas ref={micCanvasRef} width={160} height={36} style={{ marginTop: 16, opacity: isListening ? 1 : 0, transition: "opacity 0.3s", position: "absolute", bottom: 16 }} />

      <style>{`
        @keyframes sa-ring {
          0%   { transform: scale(0.92); opacity: 0.7; }
          60%  { transform: scale(1.06); opacity: 0.2; }
          100% { transform: scale(0.92); opacity: 0.7; }
        }
        @keyframes sa-ring-in {
          0%   { transform: scale(1.08); opacity: 0.15; }
          50%  { transform: scale(0.93); opacity: 0.65; }
          100% { transform: scale(1.08); opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
