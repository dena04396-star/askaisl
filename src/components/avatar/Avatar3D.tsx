"use client";

import {
  Component, Suspense, useRef, useEffect, useState, useCallback, type ReactNode,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import AvatarPortrait from "./AvatarPortrait";

export interface Avatar3DProps {
  isSpeaking: boolean;
  isListening?: boolean;
  analyserRef?: { current: AnalyserNode | null };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Ready Player Me shut down January 2026. Use Avaturn instead (free, realistic):

   1. Go to  https://avaturn.me
   2. Click "Create Avatar" → choose Female → customise → Export → "Download GLB"
   3. Copy the downloaded .glb file into your project at:
        public/avatar/female.glb
   4. Change AVATAR_URL below to "/avatar/female.glb"

   OR paste any hosted GLB URL directly — the code supports both Oculus Visemes
   (viseme_aa / viseme_E …) and ARKit (jawOpen / mouthSmileLeft …) blend shapes.
   ──────────────────────────────────────────────────────────────────────────── */
const AVATAR_URL = "/avatar/female.glb"; /* ← change this once you have your GLB */

useGLTF.preload(AVATAR_URL);

/* ─── All RPM / ARKit viseme morph target names ───────────────────────────── */
type VKey = "aa" | "E" | "I" | "O" | "U" | "PP" | "FF" | "TH" | "DD" | "kk" | "CH" | "SS" | "nn" | "RR";

/* Each viseme maps candidates from: Oculus Visemes, ARKit, and common alt names.
   First match found in the avatar's morphTargetDictionary is used. */
const VMAP: Record<VKey, string[]> = {
  aa: ["viseme_aa",  "jawOpen",         "mouthOpen"],
  E:  ["viseme_E",   "mouthSmileLeft"],
  I:  ["viseme_I",   "mouthStretchLeft"],
  O:  ["viseme_O",   "mouthFunnel"],
  U:  ["viseme_U",   "mouthPucker"],
  PP: ["viseme_PP",  "mouthClose",      "mouthPressLeft"],
  FF: ["viseme_FF",  "mouthLowerDownLeft"],
  TH: ["viseme_TH",  "tongueOut"],
  DD: ["viseme_DD",  "mouthUpperUpLeft"],
  kk: ["viseme_kk",  "mouthShrugUpper"],
  CH: ["viseme_CH",  "mouthShrugLower"],
  SS: ["viseme_SS",  "mouthDimpleLeft"],
  nn: ["viseme_nn",  "mouthRollLower"],
  RR: ["viseme_RR",  "mouthRollUpper"],
};

const ALL_V_KEYS = Object.keys(VMAP) as VKey[];

type VWeights = Record<VKey, number>;
const zeroWeights = (): VWeights =>
  Object.fromEntries(ALL_V_KEYS.map((k) => [k, 0])) as VWeights;

/* Smooth linear interpolation helper */
function lp(a: number, b: number, t: number) { return a + (b - a) * t; }

/* ─── RPMAvatarInner ──────────────────────────────────────────────────────── */
interface RPMProps extends Avatar3DProps { onReady: () => void }

function RPMAvatarInner({ isSpeaking, isListening = false, analyserRef, onReady }: RPMProps) {
  const { scene } = useGLTF(AVATAR_URL);

  const groupRef    = useRef<THREE.Group>(null!);
  const meshes      = useRef<THREE.SkinnedMesh[]>([]);
  const headBone    = useRef<THREE.Bone | null>(null);
  const neckBone    = useRef<THREE.Bone | null>(null);
  const spineBone   = useRef<THREE.Bone | null>(null);
  const readyFired  = useRef(false);

  /* Smoothed frequency bands */
  const lowSmooth  = useRef(0);
  const midSmooth  = useRef(0);
  const highSmooth = useRef(0);

  /* Smoothed viseme weights */
  const vWeights   = useRef<VWeights>(zeroWeights());

  /* Blink state */
  const blinkTimer = useRef(0);
  const blinkProg  = useRef(0);
  const isBlinking = useRef(false);

  /* Breathing */
  const breathT    = useRef(0);

  /* Frequency buffer */
  const freqBuf    = useRef<Uint8Array | null>(null);

  /* Pre-cache per-mesh morph target index maps */
  const idxMaps = useRef<
    { mesh: THREE.SkinnedMesh; map: Partial<Record<VKey, number[]>> }[]
  >([]);

  useEffect(() => {
    const found: THREE.SkinnedMesh[] = [];
    scene.traverse((c) => {
      if (c instanceof THREE.SkinnedMesh) {
        found.push(c);
        c.castShadow    = true;
        c.receiveShadow = true;
        c.frustumCulled = false;
      }
      if (c instanceof THREE.Bone) {
        const n = c.name.toLowerCase();
        if (!headBone.current  && n.includes("head"))  headBone.current  = c as THREE.Bone;
        if (!neckBone.current  && n.includes("neck"))  neckBone.current  = c as THREE.Bone;
        if (!spineBone.current && (n === "spine" || n === "spine1" || n === "spine2"))
          spineBone.current = c as THREE.Bone;
      }
    });
    meshes.current = found;

    /* Cache morph target indices once so useFrame doesn't do repeated dictionary lookups */
    idxMaps.current = found.map((mesh) => {
      const dict = mesh.morphTargetDictionary ?? {};
      const map: Partial<Record<VKey, number[]>> = {};
      for (const key of ALL_V_KEYS) {
        const hits = VMAP[key].map((name) => dict[name]).filter((i) => i !== undefined) as number[];
        if (hits.length) map[key] = hits;
      }
      return { mesh, map };
    });

    /* Randomise blink and breath phase on mount (safe outside render) */
    blinkTimer.current = 2.5 + Math.random() * 3;
    breathT.current    = Math.random() * Math.PI * 2;

    if (!readyFired.current) { readyFired.current = true; onReady(); }
  }, [scene, onReady]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    /* ── 1. Read audio analyser (3 frequency bands) ───────────────────────── */
    const analyser = analyserRef?.current;
    let rawLow = 0, rawMid = 0, rawHigh = 0;

    if (analyser) {
      const bc = analyser.frequencyBinCount;
      if (!freqBuf.current || freqBuf.current.length !== bc)
        freqBuf.current = new Uint8Array(bc) as Uint8Array<ArrayBuffer>;
      analyser.getByteFrequencyData(freqBuf.current as Uint8Array<ArrayBuffer>);

      const avg = (lo: number, hi: number) => {
        let s = 0; const n = Math.min(hi, bc);
        for (let i = lo; i < n; i++) s += freqBuf.current![i] / 255;
        return s / (n - lo);
      };
      /*
        With fftSize=256 and ~44100 Hz sample rate, each bin ≈ 344 Hz:
        bins 1–4   → ~344–1376 Hz  voiced fundamentals (drives open/close)
        bins 4–14  → ~1376–4816 Hz vowel formants (drives vowel shapes)
        bins 14–35 → ~4816–12040 Hz fricatives (s, f, th shapes)
      */
      rawLow  = avg(1, 4);
      rawMid  = avg(4, 14);
      rawHigh = avg(14, 35);
    } else if (isSpeaking) {
      /* Procedural simulation when no analyser — gives natural-looking mouth movement */
      rawLow  = Math.max(0, Math.sin(t * 7.4)       * 0.45 + 0.28 + Math.sin(t * 3.2)       * 0.12);
      rawMid  = Math.max(0, Math.sin(t * 5.8 + 1.1) * 0.28 + 0.14 + Math.sin(t * 11.1 + 0.7) * 0.06);
      rawHigh = Math.max(0, Math.sin(t * 13.2 + 2.5) * 0.14 + 0.04);
    }

    /* Exponential smoothing — fast attack (0.40), slow release (0.15) */
    const lowTarget  = rawLow,  midTarget  = rawMid,  highTarget  = rawHigh;
    const lRate = rawLow  > lowSmooth.current  ? 0.40 : 0.18;
    const mRate = rawMid  > midSmooth.current  ? 0.38 : 0.16;
    const hRate = rawHigh > highSmooth.current ? 0.35 : 0.14;
    lowSmooth.current  = lp(lowSmooth.current,  lowTarget,  lRate);
    midSmooth.current  = lp(midSmooth.current,  midTarget,  mRate);
    highSmooth.current = lp(highSmooth.current, highTarget, hRate);

    const low  = lowSmooth.current;
    const mid  = midSmooth.current;
    const high = highSmooth.current;
    const totalAmp = Math.min(1, low + mid * 0.5 + high * 0.2);

    /* ── 2. Compute target viseme weights ─────────────────────────────────── */
    const target = zeroWeights();

    if (totalAmp > 0.03) {
      /* Open-mouth vowels — driven by low-frequency energy */
      target.aa = Math.min(1, low * 2.0) * (1 - high * 0.6);     /* "aah" */
      target.O  = Math.min(1, low * 1.4) * 0.55;                  /* "oh" */
      target.U  = Math.min(1, low * 0.8) * 0.30;                  /* "oo" */

      /* Front vowels — driven by mid-frequency formants */
      target.E  = Math.min(1, mid * 1.8) * (1 - low * 0.7);       /* "ee" */
      target.I  = Math.min(1, mid * 1.2) * 0.40;                  /* "ih" */

      /* Fricatives — driven by high-frequency energy */
      target.SS = Math.min(1, high * 3.0);                         /* s/z */
      target.FF = Math.min(1, high * 2.2) * 0.65;                  /* f/v */
      target.CH = Math.min(1, high * 1.8) * 0.45;                  /* ch/sh */
      target.TH = Math.min(1, high * 1.5) * 0.35;                  /* th */

      /* Light lip closure between syllables */
      target.PP = Math.max(0, 0.25 - totalAmp * 1.8) * (isSpeaking ? 1 : 0);
      target.nn = Math.max(0, 0.15 - totalAmp * 1.2) * (isSpeaking ? 1 : 0);
    } else if (isSpeaking) {
      /* Very quiet moment — small lip press so mouth doesn't just hang open */
      target.PP = 0.12;
    }

    /* ── 3. Lerp viseme weights toward targets ────────────────────────────── */
    /* Use different rates per group: vowels need to be fast, closures slower */
    const OPEN_RATE  = 0.32;
    const FRIC_RATE  = 0.28;
    const CLOSE_RATE = 0.14;

    for (const k of ["aa", "E", "I", "O", "U"] as VKey[])
      vWeights.current[k] = lp(vWeights.current[k], target[k], OPEN_RATE);
    for (const k of ["SS", "FF", "CH", "TH", "DD", "kk", "RR"] as VKey[])
      vWeights.current[k] = lp(vWeights.current[k], target[k], FRIC_RATE);
    for (const k of ["PP", "nn"] as VKey[])
      vWeights.current[k] = lp(vWeights.current[k], target[k], CLOSE_RATE);

    /* ── 4. Apply visemes + expressions to every mesh ─────────────────────── */
    for (let mi = 0; mi < idxMaps.current.length; mi++) {
      const entry = idxMaps.current[mi];
      const inf  = entry.mesh.morphTargetInfluences;
      const dict = entry.mesh.morphTargetDictionary;
      if (!inf || !dict) continue;

      /* Visemes */
      for (const key of ALL_V_KEYS) {
        const indices = entry.map[key];
        if (!indices) continue;
        const w = vWeights.current[key];
        for (let ii = 0; ii < indices.length; ii++) inf[indices[ii]] = w;
      }

      /* Smile — warm resting smile that dims slightly during intense speaking */
      const smileOpen  = vWeights.current.aa + vWeights.current.O;
      const smileBase  = lp(0.16, 0.06, Math.min(1, smileOpen * 1.5));
      const slL = dict["mouthSmileLeft"];
      const slR = dict["mouthSmileRight"];
      if (slL !== undefined) inf[slL] = lp(inf[slL], smileBase, 0.04);
      if (slR !== undefined) inf[slR] = lp(inf[slR], smileBase, 0.04);

      /* Brow raise when listening */
      const browTgt = isListening ? 0.30 : 0;
      for (const bn of ["browInnerUp", "browOuterUpLeft", "browOuterUpRight"]) {
        const idx = dict[bn];
        if (idx !== undefined) inf[idx] = lp(inf[idx], browTgt, 0.04);
      }

      /* Blink */
      blinkTimer.current -= delta;
      if (blinkTimer.current <= 0 && !isBlinking.current) {
        isBlinking.current = true;
        blinkProg.current  = 0;
        blinkTimer.current = 2.2 + Math.random() * 4.8;
      }
      if (isBlinking.current) {
        blinkProg.current = Math.min(blinkProg.current + delta / 0.09, 1);
        const p = blinkProg.current;
        const v = p < 0.5 ? p * 2 : (1 - p) * 2;
        for (const bn of ["eyeBlinkLeft",  "blink_left"])  { const i = dict[bn]; if (i !== undefined) inf[i] = v; }
        for (const bn of ["eyeBlinkRight", "blink_right"]) { const i = dict[bn]; if (i !== undefined) inf[i] = v; }
        if (p >= 1) isBlinking.current = false;
      }

      /* Subtle cheek and jaw softness from speaking amplitude */
      const cheekIdx = dict["cheekPuff"];
      if (cheekIdx !== undefined) inf[cheekIdx] = lp(inf[cheekIdx], vWeights.current.aa * 0.08, 0.05);
    }

    /* ── 5. Skeleton animations ───────────────────────────────────────────── */
    /* Breathing */
    breathT.current += delta * 0.30;
    const breath = Math.sin(breathT.current) * 0.006;

    /* Whole-body subtle sway */
    groupRef.current.position.y = breath + Math.sin(t * 0.55) * 0.003;
    groupRef.current.rotation.y = Math.sin(t * 0.22) * 0.010;

    if (spineBone.current) {
      spineBone.current.rotation.x = breath * 0.5;
      spineBone.current.rotation.z = Math.sin(t * 0.20) * 0.006;
    }

    if (neckBone.current) {
      neckBone.current.rotation.y = lp(
        neckBone.current.rotation.y,
        Math.sin(t * 0.24) * 0.020,
        0.030,
      );
      neckBone.current.rotation.z = Math.sin(t * 0.18) * 0.005;
    }

    if (headBone.current) {
      /* Slight forward tilt when listening (attentive lean) */
      const targetX = isListening ? -0.055 : Math.sin(t * 0.40) * 0.008;
      const targetY = Math.sin(t * 0.17) * 0.014;
      headBone.current.rotation.x = lp(headBone.current.rotation.x, targetX, 0.045);
      headBone.current.rotation.y = lp(headBone.current.rotation.y, targetY, 0.035);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} position={[0, -1.46, 0]} scale={1.0} />
    </group>
  );
}

/* ─── Error boundary ──────────────────────────────────────────────────────── */
class AvatarErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/* ─── Scene wrapper ───────────────────────────────────────────────────────── */
interface SceneProps extends Avatar3DProps { onReady: () => void; onError: () => void }

function AvatarScene({ onReady, onError, ...props }: SceneProps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const readyCb = useCallback(() => onReady(), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const errorCb = useCallback(() => onError(), []);

  return (
    <>
      {/* Three-point lighting for warm professional look */}
      <ambientLight intensity={0.9} />
      <directionalLight
        position={[1.4, 3.2, 2.6]} intensity={2.2}
        color="#fff8f2" castShadow
        shadow-mapSize={[512, 512]}
      />
      <directionalLight position={[-2.0, 1.6, 1.4]} intensity={0.75} color="#dce8ff" />
      <directionalLight position={[0,    1.0, -2.2]} intensity={0.40} color="#ffe4c4" />
      <pointLight       position={[0,   -0.3,  1.3]} intensity={0.22} color="#fff4e0" />

      <Environment preset="apartment" background={false} />

      <AvatarErrorBoundary onError={errorCb}>
        <Suspense fallback={null}>
          <RPMAvatarInner {...props} onReady={readyCb} />
        </Suspense>
      </AvatarErrorBoundary>
    </>
  );
}

/* ─── Loading overlay ─────────────────────────────────────────────────────── */
function LoadingOverlay() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 10,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#0d0d0f", gap: 20,
    }}>
      <svg width="72" height="100" viewBox="0 0 72 100" fill="none"
        style={{ opacity: 0.16, animation: "breathe 2.6s ease-in-out infinite" }}>
        <ellipse cx="36" cy="25" rx="18" ry="22" fill="white" />
        <path d="M6 100 Q12 64 36 56 Q60 64 66 100Z" fill="white" />
      </svg>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", letterSpacing: "0.06em" }}>
          Loading avatar{".".repeat(dots)}
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 4 }}>
          First load may take a moment
        </p>
      </div>
    </div>
  );
}

/* ─── Public component ────────────────────────────────────────────────────── */
export default function Avatar3D(props: Avatar3DProps) {
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 5 s timeout — if GLB hasn't arrived, fall back to 2D portrait */
  useEffect(() => {
    timerRef.current = setTimeout(
      () => setLoadState((s) => (s === "loading" ? "error" : s)),
      5_000,
    );
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleReady = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoadState("ready");
  }, []);

  const handleError = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoadState("error");
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, background: "#0d0d0f" }}>
      {loadState === "loading" && <LoadingOverlay />}

      {loadState === "error" && (
        <AvatarPortrait isSpeaking={props.isSpeaking} isListening={props.isListening} />
      )}

      {/* Canvas is always mounted so loading begins immediately */}
      <div style={{
        position: "absolute", inset: 0,
        opacity: loadState === "ready" ? 1 : 0,
        transition: "opacity 0.8s ease",
        pointerEvents: loadState === "ready" ? "auto" : "none",
      }}>
        <Canvas
          camera={{ position: [0, 0.12, 1.5], fov: 28 }}
          shadows
          style={{ width: "100%", height: "100%", background: "transparent", display: "block" }}
          gl={{ antialias: true, alpha: true }}
        >
          <AvatarScene {...props} onReady={handleReady} onError={handleError} />
        </Canvas>
      </div>
    </div>
  );
}
