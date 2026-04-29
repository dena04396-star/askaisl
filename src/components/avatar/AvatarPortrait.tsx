"use client";

interface AvatarPortraitProps {
  isSpeaking: boolean;
  isListening?: boolean;
}

export default function AvatarPortrait({ isSpeaking, isListening = false }: AvatarPortraitProps) {
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse 80% 70% at 50% 40%, #1f1a2e 0%, #0d0d0f 100%)",
      position: "relative",
    }}>
      {/* speaking ring */}
      {isSpeaking && (
        <>
          <div style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.12)", animation: "av-pulse 1.1s ease-out infinite", pointerEvents: "none" }} />
          <div style={{ position: "absolute", width: 230, height: 230, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.08)", animation: "av-pulse 1.1s ease-out infinite 0.38s", pointerEvents: "none" }} />
        </>
      )}

      <svg
        viewBox="0 0 300 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: "min(72%, 280px)",
          filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.55))",
          animation: isSpeaking
            ? "av-speak-bob 0.55s ease-in-out infinite alternate"
            : isListening
            ? "av-listen-tilt 3s ease-in-out infinite"
            : "av-idle 4s ease-in-out infinite",
        }}
      >
        <defs>
          <radialGradient id="skinG" cx="48%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#D4926A" />
            <stop offset="100%" stopColor="#A96432" />
          </radialGradient>
          <radialGradient id="skinNeckG" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#CA8860" />
            <stop offset="100%" stopColor="#A05E2C" />
          </radialGradient>
          <linearGradient id="blazerG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E2B68" />
            <stop offset="100%" stopColor="#111833" />
          </linearGradient>
          <radialGradient id="irisG" cx="38%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#6B3E0A" />
            <stop offset="100%" stopColor="#1A0800" />
          </radialGradient>
        </defs>

        {/* ── Blazer / Body ── */}
        <path d="M20 420 Q42 330 88 295 L108 315 L150 330 L192 315 L212 295 Q258 330 280 420Z" fill="url(#blazerG)" />
        {/* lapels */}
        <path d="M126 295 L150 330 L174 295 L164 272 L150 285 L136 272Z" fill="#EDE8DC" />
        {/* lapel shading */}
        <path d="M136 272 L150 285 L150 330 L126 295Z" fill="#D4C8B0" opacity="0.5" />

        {/* ── Neck ── */}
        <ellipse cx="150" cy="278" rx="28" ry="44" fill="url(#skinNeckG)" />

        {/* ── Face ── */}
        <ellipse cx="150" cy="178" rx="90" ry="104" fill="url(#skinG)" />

        {/* ── Hair — main mass ── */}
        <path d="M60 162 Q63 72 150 60 Q237 72 240 162 Q215 84 150 78 Q85 84 60 162Z" fill="#0E0804" />
        {/* bun */}
        <ellipse cx="150" cy="65" rx="44" ry="25" fill="#0E0804" />
        <ellipse cx="150" cy="54" rx="30" ry="16" fill="#1A0E0A" />
        {/* side hair */}
        <ellipse cx="62" cy="168" rx="19" ry="44" fill="#0E0804" />
        <ellipse cx="238" cy="168" rx="19" ry="44" fill="#0E0804" />

        {/* ── Ears ── */}
        <ellipse cx="62" cy="186" rx="13" ry="19" fill="#B87040" />
        <ellipse cx="238" cy="186" rx="13" ry="19" fill="#B87040" />

        {/* ── Earrings ── */}
        <circle cx="62" cy="201" r="8" fill="#D4AF37" />
        <circle cx="62" cy="201" r="5" fill="#E8C848" />
        <circle cx="238" cy="201" r="8" fill="#D4AF37" />
        <circle cx="238" cy="201" r="5" fill="#E8C848" />

        {/* ── Eyebrows ── */}
        <path d="M96 150 Q114 142 134 148" stroke="#0E0804" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M166 148 Q186 142 204 150" stroke="#0E0804" strokeWidth="5.5" strokeLinecap="round" />

        {/* ── Eyes ── */}
        {/* left */}
        <ellipse cx="115" cy="167" rx="20" ry="13" fill="white" />
        <circle cx="115" cy="167" r="10" fill="url(#irisG)" />
        <circle cx="115" cy="167" r="5.5" fill="#050200" />
        <circle cx="119" cy="163" r="3.5" fill="white" />
        {/* eyelid top left */}
        <path d="M95 162 Q115 155 135 162" stroke="#0E0804" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* lash corners */}
        <path d="M95 162 L90 158" stroke="#0E0804" strokeWidth="2" strokeLinecap="round" />
        <path d="M135 162 L140 158" stroke="#0E0804" strokeWidth="2" strokeLinecap="round" />

        {/* right */}
        <ellipse cx="185" cy="167" rx="20" ry="13" fill="white" />
        <circle cx="185" cy="167" r="10" fill="url(#irisG)" />
        <circle cx="185" cy="167" r="5.5" fill="#050200" />
        <circle cx="189" cy="163" r="3.5" fill="white" />
        <path d="M165 162 Q185 155 205 162" stroke="#0E0804" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M165 162 L160 158" stroke="#0E0804" strokeWidth="2" strokeLinecap="round" />
        <path d="M205 162 L210 158" stroke="#0E0804" strokeWidth="2" strokeLinecap="round" />

        {/* ── Nose ── */}
        <path d="M144 185 Q141 200 138 213 Q150 220 162 213 Q159 200 156 185" fill="none" stroke="#8A5020" strokeWidth="1.8" strokeLinecap="round" />
        <ellipse cx="138" cy="215" rx="9" ry="7" fill="#9A5828" />
        <ellipse cx="162" cy="215" rx="9" ry="7" fill="#9A5828" />
        <ellipse cx="150" cy="213" rx="6" ry="4.5" fill="#8A4820" />

        {/* ── Bindi ── */}
        <circle cx="150" cy="143" r="7.5" fill="#CC0010" />
        <circle cx="150" cy="143" r="4.5" fill="#FF1020" />

        {/* ── Mouth ── */}
        {/* upper lip */}
        <path d="M116 232 Q130 224 150 227 Q170 224 184 232 Q170 239 150 240 Q130 239 116 232Z" fill="#8A3C2C" />
        {/* cupid's bow highlight */}
        <path d="M130 226 Q140 220 150 222 Q160 220 170 226" stroke="#B05040" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* lower lip */}
        <path d="M116 232 Q130 244 150 247 Q170 244 184 232 Q170 239 150 240 Q130 239 116 232Z" fill="#B85050" />

        {isSpeaking ? (
          /* speaking state — mouth open */
          <>
            <ellipse cx="150" cy="238" rx="20" ry="9" fill="#1A0808" />
            <ellipse cx="150" cy="234" rx="14" ry="4" fill="#EAD8D4" />
          </>
        ) : (
          /* rest — warm smile line */
          <path d="M118 234 Q150 246 182 234" stroke="#7A3020" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
        )}

        {/* ── Cheek blush ── */}
        <ellipse cx="88" cy="198" rx="22" ry="13" fill="#D08060" opacity="0.18" />
        <ellipse cx="212" cy="198" rx="22" ry="13" fill="#D08060" opacity="0.18" />

        {/* ── Forehead highlight ── */}
        <ellipse cx="150" cy="130" rx="45" ry="22" fill="white" opacity="0.05" />
      </svg>

      <style>{`
        @keyframes av-idle {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          30%       { transform: translateY(-5px) rotate(0.4deg); }
          70%       { transform: translateY(-2px) rotate(-0.3deg); }
        }
        @keyframes av-speak-bob {
          from { transform: translateY(0px) scale(1); }
          to   { transform: translateY(-4px) scale(1.008); }
        }
        @keyframes av-listen-tilt {
          0%, 100% { transform: rotate(0deg); }
          40%      { transform: rotate(-1.8deg) translateY(-3px); }
          75%      { transform: rotate(0.8deg); }
        }
        @keyframes av-pulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0;   }
        }
      `}</style>
    </div>
  );
}
