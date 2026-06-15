"use client";

import { useRef, useEffect } from "react";

interface Props {
  isSpeaking:   boolean;
  isListening?: boolean;
  isLoading?:   boolean;
  analyserRef?: React.MutableRefObject<AnalyserNode | null>;
}

/*
 * Living Portrait — a calm, broadcast-quality interviewer presence.
 * Pure SVG + CSS + a single rAF loop. The mouth lip-syncs to the audio
 * analyser in real time; the eyes blink and the head breathes via CSS.
 * No three.js, no streaming avatar — lightweight and dependency-free.
 */
export default function SimpleAvatar({ isSpeaking, isListening, isLoading, analyserRef }: Props) {
  /* SVG nodes mutated directly inside rAF (avoids 60fps React re-renders) */
  const cavityRef = useRef<SVGEllipseElement>(null);   // dark mouth opening
  const teethRef  = useRef<SVGEllipseElement>(null);   // upper teeth hint
  const lowerLipRef = useRef<SVGPathElement>(null);    // lower lip drops as mouth opens
  const restLipRef  = useRef<SVGPathElement>(null);    // resting smile line (fades when open)
  const headRef   = useRef<SVGGElement>(null);         // micro head nod on emphasis
  const rafRef    = useRef<number>(0);
  const openRef   = useRef(0);                          // smoothed mouth-open value 0..1

  useEffect(() => {
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      /* Target mouth-open from speech energy (low-mid bands carry vowels) */
      let target = 0;
      const analyser = analyserRef?.current;
      if (isSpeaking && analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const n = Math.max(1, Math.floor(data.length * 0.45));
        let sum = 0;
        for (let i = 0; i < n; i++) sum += data[i];
        const avg = sum / n / 255;                       // 0..1
        target = Math.min(1, Math.pow(avg, 0.7) * 2.1);  // perceptual curve + gain
      } else if (isSpeaking) {
        // no analyser available — gentle procedural mouth movement so she still "talks"
        target = 0.35 + 0.35 * Math.abs(Math.sin(performance.now() * 0.012));
      }

      // Asymmetric smoothing: open fast, close a touch slower → natural articulation
      const cur = openRef.current;
      const k = target > cur ? 0.55 : 0.28;
      const open = cur + (target - cur) * k;
      openRef.current = open;

      if (cavityRef.current) cavityRef.current.setAttribute("ry", String(1.2 + open * 9.5));
      if (teethRef.current) {
        teethRef.current.setAttribute("ry", String(open * 3.4));
        teethRef.current.setAttribute("opacity", String(Math.min(1, open * 2.2)));
      }
      if (lowerLipRef.current) lowerLipRef.current.setAttribute("transform", `translate(0 ${open * 5})`);
      if (restLipRef.current)  restLipRef.current.setAttribute("opacity", String(0.55 * (1 - Math.min(1, open * 3))));
      if (headRef.current) {
        // a tiny nod proportional to loudness adds life without looking jittery
        headRef.current.setAttribute("transform", `translate(0 ${-open * 1.6})`);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isSpeaking, analyserRef]);

  /* State-driven ambient colors */
  const accent = isSpeaking ? "#4ade80" : isListening ? "#60a5fa" : isLoading ? "#fbbf24" : "#8b7fd6";
  const glow   = isSpeaking
    ? "0 0 64px rgba(74,222,128,0.32), 0 0 120px rgba(74,222,128,0.12)"
    : isListening
    ? "0 0 64px rgba(96,165,250,0.34), 0 0 120px rgba(96,165,250,0.12)"
    : isLoading
    ? "0 0 52px rgba(251,191,36,0.26)"
    : "0 0 48px rgba(139,127,214,0.16)";

  const headAnim = isSpeaking
    ? "lp-breathe 3.4s ease-in-out infinite, lp-sway-active 6s ease-in-out infinite"
    : isListening
    ? "lp-breathe 4.2s ease-in-out infinite, lp-listen 7s ease-in-out infinite"
    : "lp-breathe 5.2s ease-in-out infinite, lp-idle 11s ease-in-out infinite";

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
      background: "radial-gradient(ellipse 70% 60% at 50% 32%, #241b33 0%, #14111d 46%, #0b0a10 100%)",
    }}>
      {/* studio key light */}
      <div aria-hidden style={{
        position: "absolute", top: "-18%", left: "50%", transform: "translateX(-50%)",
        width: 560, height: 560, borderRadius: "50%", pointerEvents: "none",
        background: "radial-gradient(circle, rgba(255,240,220,0.10) 0%, rgba(255,240,220,0) 62%)",
      }} />
      {/* fine grain overlay for depth */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.05, mixBlendMode: "overlay",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }} />

      {/* reactive halo rings */}
      {(isSpeaking || isListening) && [0, 1, 2].map((i) => (
        <div key={i} aria-hidden style={{
          position: "absolute", width: 250 + i * 70, height: 250 + i * 70, borderRadius: "50%",
          border: `1px solid ${accent}2e`, pointerEvents: "none",
          animation: isListening
            ? `lp-ring-in ${1.1 + i * 0.3}s ease-in-out infinite`
            : `lp-ring-out ${1.3 + i * 0.35}s ease-out infinite`,
          animationDelay: `${i * 0.22}s`,
        }} />
      ))}

      {/* portrait frame */}
      <div style={{
        width: 252, height: 252, borderRadius: "50%", position: "relative", overflow: "hidden",
        background: "radial-gradient(ellipse 75% 70% at 50% 30%, #2a2238 0%, #16121f 100%)",
        border: `2px solid ${accent}`,
        boxShadow: `${glow}, inset 0 -30px 60px rgba(0,0,0,0.55), inset 0 20px 40px rgba(255,255,255,0.04)`,
        transition: "border-color 0.5s ease, box-shadow 0.5s ease",
      }}>
        {/* soft top vignette light inside frame */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 45% at 50% 22%, rgba(255,238,214,0.12) 0%, rgba(0,0,0,0) 60%)",
        }} />

        <svg
          viewBox="0 0 300 330" width="100%" height="100%"
          style={{ position: "absolute", bottom: -6, left: 0, transformBox: "fill-box", transformOrigin: "50% 80%", animation: headAnim }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="lpSkin" cx="46%" cy="34%" r="68%">
              <stop offset="0%" stopColor="#E8B488" />
              <stop offset="62%" stopColor="#CE8C5E" />
              <stop offset="100%" stopColor="#A2602F" />
            </radialGradient>
            <radialGradient id="lpNeck" cx="50%" cy="20%" r="80%">
              <stop offset="0%" stopColor="#C6855A" />
              <stop offset="100%" stopColor="#8F5328" />
            </radialGradient>
            <linearGradient id="lpHair" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#241019" />
              <stop offset="100%" stopColor="#0c0406" />
            </linearGradient>
            <linearGradient id="lpBlazer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a2d57" />
              <stop offset="100%" stopColor="#1a1430" />
            </linearGradient>
            <radialGradient id="lpIris" cx="38%" cy="34%" r="66%">
              <stop offset="0%" stopColor="#7A4A14" />
              <stop offset="100%" stopColor="#1c0c02" />
            </radialGradient>
            <radialGradient id="lpCheek" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(214,110,96,0.45)" />
              <stop offset="100%" stopColor="rgba(214,110,96,0)" />
            </radialGradient>
          </defs>

          {/* shoulders / blazer */}
          <path d="M22 330 Q44 250 96 224 L120 244 Q150 258 180 244 L204 224 Q256 250 278 330Z" fill="url(#lpBlazer)" />
          {/* lapels + collar */}
          <path d="M120 244 L150 280 L180 244 L168 220 L150 236 L132 220Z" fill="#ECE6D6" />
          <path d="M132 220 L150 236 L150 280 L120 244Z" fill="#cfc6ad" opacity="0.45" />

          {/* neck */}
          <ellipse cx="150" cy="214" rx="26" ry="40" fill="url(#lpNeck)" />
          <ellipse cx="150" cy="190" rx="26" ry="18" fill="#000" opacity="0.10" />

          {/* head group — gets the lip-sync nod */}
          <g ref={headRef}>
            {/* hair back mass */}
            <path d="M58 132 Q60 40 150 30 Q240 40 242 132 Q252 178 232 214 Q236 150 214 120 Q150 100 86 120 Q64 150 68 214 Q48 178 58 132Z" fill="url(#lpHair)" />
            {/* bun */}
            <ellipse cx="150" cy="34" rx="42" ry="22" fill="url(#lpHair)" />
            <ellipse cx="150" cy="26" rx="27" ry="13" fill="#2a141d" />

            {/* face */}
            <ellipse cx="150" cy="138" rx="84" ry="96" fill="url(#lpSkin)" />
            {/* forehead highlight */}
            <ellipse cx="150" cy="92" rx="44" ry="24" fill="#fff" opacity="0.06" />
            {/* jaw shading */}
            <path d="M78 150 Q90 220 150 232 Q210 220 222 150 Q206 210 150 218 Q94 210 78 150Z" fill="#7a4a22" opacity="0.16" />

            {/* hair front frame */}
            <path d="M58 132 Q72 58 150 48 Q228 58 242 132 Q214 86 150 82 Q86 86 58 132Z" fill="url(#lpHair)" />
            <path d="M58 132 Q50 180 66 214 Q60 168 78 138Z" fill="url(#lpHair)" />
            <path d="M242 132 Q250 180 234 214 Q240 168 222 138Z" fill="url(#lpHair)" />

            {/* ears + earrings */}
            <ellipse cx="68" cy="150" rx="11" ry="16" fill="#B5713F" />
            <ellipse cx="232" cy="150" rx="11" ry="16" fill="#B5713F" />
            <circle cx="68" cy="166" r="6.5" fill="#D9B23C" />
            <circle cx="68" cy="166" r="3.6" fill="#F2D255" />
            <circle cx="232" cy="166" r="6.5" fill="#D9B23C" />
            <circle cx="232" cy="166" r="3.6" fill="#F2D255" />

            {/* brows */}
            <path d="M98 118 Q116 110 136 116" stroke="#1b0c10" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M164 116 Q184 110 202 118" stroke="#1b0c10" strokeWidth="5" strokeLinecap="round" fill="none" />

            {/* cheeks */}
            <ellipse cx="96" cy="162" rx="20" ry="13" fill="url(#lpCheek)" />
            <ellipse cx="204" cy="162" rx="20" ry="13" fill="url(#lpCheek)" />

            {/* eyes */}
            <g>
              {/* left */}
              <ellipse cx="116" cy="134" rx="18" ry="11.5" fill="#F6F1E7" />
              <circle cx="116" cy="134" r="9" fill="url(#lpIris)" />
              <circle cx="116" cy="134" r="4.6" fill="#070300" />
              <circle cx="119.5" cy="130.5" r="2.8" fill="#fff" opacity="0.92" />
              {/* right */}
              <ellipse cx="184" cy="134" rx="18" ry="11.5" fill="#F6F1E7" />
              <circle cx="184" cy="134" r="9" fill="url(#lpIris)" />
              <circle cx="184" cy="134" r="4.6" fill="#070300" />
              <circle cx="187.5" cy="130.5" r="2.8" fill="#fff" opacity="0.92" />
              {/* upper lash lines */}
              <path d="M98 130 Q116 122 134 130" stroke="#150a0e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path d="M166 130 Q184 122 202 130" stroke="#150a0e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              {/* blinking eyelids — skin-colored shutters that scale down to cover the eye */}
              <ellipse className="lp-lid" cx="116" cy="134" rx="19" ry="12.5" fill="url(#lpSkin)" />
              <ellipse className="lp-lid" cx="184" cy="134" rx="19" ry="12.5" fill="url(#lpSkin)" />
            </g>

            {/* bindi */}
            <circle cx="150" cy="108" r="6" fill="#C8000F" />
            <circle cx="150" cy="108" r="3.4" fill="#FF1322" />

            {/* nose */}
            <path d="M145 146 Q142 164 140 176 Q150 182 160 176 Q158 164 155 146" stroke="#8a5424" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <ellipse cx="141" cy="177" rx="6" ry="4.6" fill="#955424" opacity="0.7" />
            <ellipse cx="159" cy="177" rx="6" ry="4.6" fill="#955424" opacity="0.7" />

            {/* ── Mouth (lip-synced) ── */}
            <g>
              {/* upper lip */}
              <path d="M120 196 Q135 188 150 191 Q165 188 180 196 Q165 202 150 203 Q135 202 120 196Z" fill="#9a3f30" />
              {/* mouth cavity — ry animated by rAF */}
              <ellipse ref={cavityRef} cx="150" cy="200" rx="17" ry="1.2" fill="#3a1411" />
              {/* upper teeth hint — appears as mouth opens */}
              <ellipse ref={teethRef} cx="150" cy="196.5" rx="12.5" ry="0" fill="#F3EEE0" opacity="0" />
              {/* lower lip — drops via translate as mouth opens */}
              <path ref={lowerLipRef} d="M120 196 Q135 210 150 213 Q165 210 180 196 Q165 205 150 206 Q135 205 120 196Z" fill="#bd5b58" />
              {/* resting smile line — fades out when speaking */}
              <path ref={restLipRef} d="M122 198 Q150 210 178 198" stroke="#7a2f22" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.55" />
            </g>
          </g>
        </svg>
      </div>

      {/* thinking dots while loading */}
      {isLoading && !isSpeaking && (
        <div aria-hidden style={{ position: "absolute", bottom: "21%", display: "flex", gap: 5 }}>
          <span className="td" /><span className="td td-2" /><span className="td td-3" />
        </div>
      )}

      <style>{`
        @keyframes lp-ring-out {
          0%   { transform: scale(0.92); opacity: 0.65; }
          60%  { transform: scale(1.07); opacity: 0.15; }
          100% { transform: scale(0.92); opacity: 0.65; }
        }
        @keyframes lp-ring-in {
          0%   { transform: scale(1.08); opacity: 0.12; }
          50%  { transform: scale(0.93); opacity: 0.6; }
          100% { transform: scale(1.08); opacity: 0.12; }
        }
        @keyframes lp-breathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-3px) scale(1.012); }
        }
        @keyframes lp-idle {
          0%, 100% { rotate: 0deg; }
          35%      { rotate: 1deg; }
          70%      { rotate: -0.8deg; }
        }
        @keyframes lp-listen {
          0%, 100% { rotate: 0deg; }
          45%      { rotate: -2.2deg; }
          80%      { rotate: 1deg; }
        }
        @keyframes lp-sway-active {
          0%, 100% { rotate: 0deg; }
          25%      { rotate: 0.9deg; }
          60%      { rotate: -0.9deg; }
        }
        /* natural blink — eyes are open ~95% of the time, quick double-friendly close */
        .lp-lid {
          transform-box: fill-box;
          transform-origin: 50% 0%;
          animation: lp-blink 5.6s ease-in-out infinite;
        }
        @keyframes lp-blink {
          0%, 92%, 100% { transform: scaleY(0); }
          95%           { transform: scaleY(1.05); }
          97%           { transform: scaleY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-lid { animation: none; transform: scaleY(0); }
        }
      `}</style>
    </div>
  );
}
