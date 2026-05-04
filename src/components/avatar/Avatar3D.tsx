"use client";

import { Suspense, useRef, useEffect, useCallback, MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export interface Avatar3DProps {
  isSpeaking:   boolean;
  isListening?: boolean;
  analyserRef?: MutableRefObject<AnalyserNode | null>;
}

const AVATAR_URL = "/avatar/female.glb";

/* ── Audio analysis → viseme weights ─────────────────────────────────────── */
function audioToVisemes(analyser: AnalyserNode): Record<string, number> {
  const buf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(buf);
  const n = buf.length;

  /* overall amplitude */
  let sum = 0;
  for (let i = 0; i < n; i++) sum += buf[i];
  const amp = sum / n / 255;
  if (amp < 0.008) return {};

  /* frequency centroid — vowel colour */
  let wS = 0, wT = 0;
  for (let i = 0; i < n; i++) { wS += i * buf[i]; wT += buf[i]; }
  const cent = wT > 0 ? wS / wT / n : 0.5;

  /* high-frequency energy — fricatives / sibilants */
  let hS = 0;
  const hStart = Math.floor(n * 0.55);
  for (let i = hStart; i < n; i++) hS += buf[i];
  const hE = hS / (n - hStart) / 255;

  const sc = Math.min(amp * 3.8, 1.0);

  /* select dominant vowel */
  let aa = 0, E = 0, I = 0, O = 0, U = 0;
  if      (cent < 0.17) { U = 1.0; O = 0.35; }
  else if (cent < 0.31) { O = 1.0; aa = 0.30; U = 0.15; }
  else if (cent < 0.47) { aa = 1.0; O = 0.28; E = 0.18; }
  else if (cent < 0.63) { E = 1.0; aa = 0.38; I = 0.18; }
  else                  { I = 1.0; E = 0.40; }

  return {
    viseme_aa: aa * sc,
    viseme_E:  E  * sc,
    viseme_I:  I  * sc,
    viseme_O:  O  * sc,
    viseme_U:  U  * sc,
    viseme_SS: hE * 0.75 * sc,
    viseme_FF: hE * 0.40 * sc,
    viseme_TH: hE * 0.20 * sc,
    viseme_kk: (1 - hE) * amp * 0.30,
    viseme_DD: amp * 0.22,
    viseme_PP: amp < 0.05 ? amp * 2 : 0,   /* bilabial burst on quiet onset */
  };
}

/* ── lerp helper ─────────────────────────────────────────────────────────── */
const L = THREE.MathUtils.lerp;

/* ── Avatar inner (runs inside Canvas) ──────────────────────────────────── */
interface InnerProps extends Avatar3DProps { onReady: () => void; }

function AvatarInner({ isSpeaking, isListening, analyserRef, onReady }: InnerProps) {
  const { scene } = useGLTF(AVATAR_URL);

  /* refs to meshes we animate */
  const headRef   = useRef<THREE.SkinnedMesh | null>(null);
  const teethRef  = useRef<THREE.SkinnedMesh | null>(null);
  const headBone  = useRef<THREE.Object3D | null>(null);

  const t       = useRef(0);
  const blinkT  = useRef(2.5);
  const blink   = useRef(0);
  const blinkDir= useRef(1);
  const blinking= useRef(false);
  const eyeX    = useRef(0);
  const eyeY    = useRef(0);
  const eyeWait = useRef(3.5);

  /* discover meshes once */
  const onReadyCb = useCallback(onReady, []); // eslint-disable-line
  useEffect(() => {
    /* seed random timers here — safe, runs after mount */
    t.current      = Math.random() * 100;
    blinkT.current = 2 + Math.random() * 3;
    eyeWait.current= 3 + Math.random() * 3;

    scene.traverse(child => {
      const m = child as THREE.SkinnedMesh;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
      if (child.name === "Wolf3D_Head")  headRef.current  = m;
      if (child.name === "Wolf3D_Teeth") teethRef.current = m;
    });
    headBone.current = scene.getObjectByName("Head") ?? null;

    /* log available morph targets once (dev aid) */
    if (headRef.current?.morphTargetDictionary) {
      console.debug("[Avatar3D] morph targets:", Object.keys(headRef.current.morphTargetDictionary));
    }
    onReadyCb();
  }, [scene, onReadyCb]);

  /* ── animation loop ─────────────────────────────────────────────────── */
  useFrame((_, dt) => {
    t.current += dt;

    /* blink timer */
    blinkT.current -= dt;
    if (!blinking.current && blinkT.current <= 0) {
      blinking.current = true;
      blinkDir.current = 1;
      blinkT.current = 3.5 + Math.random() * 4;
    }
    if (blinking.current) {
      blink.current += blinkDir.current * dt * 18;
      if (blink.current >= 1) { blink.current = 1; blinkDir.current = -1; }
      if (blink.current <= 0) { blink.current = 0; blinking.current = false; }
    }

    /* subtle eye wander */
    eyeWait.current -= dt;
    if (eyeWait.current <= 0) {
      eyeX.current  = (Math.random() - 0.5) * 0.04;
      eyeY.current  = (Math.random() - 0.5) * 0.02;
      eyeWait.current = 2 + Math.random() * 5;
    }

    /* subtle head movement */
    if (headBone.current) {
      const spd = isSpeaking ? 1.4 : 0.5;
      headBone.current.rotation.y = L(headBone.current.rotation.y, Math.sin(t.current * spd * 0.4) * 0.06 + eyeX.current, 0.05);
      headBone.current.rotation.x = L(headBone.current.rotation.x, Math.sin(t.current * spd * 0.3) * 0.03 + eyeY.current, 0.05);
      headBone.current.rotation.z = L(headBone.current.rotation.z, Math.sin(t.current * spd * 0.25) * 0.015, 0.05);
    }

    /* audio → viseme targets */
    const targets: Record<string, number> =
      isSpeaking && analyserRef?.current
        ? audioToVisemes(analyserRef.current)
        : {};

    /* apply morph targets to head + teeth */
    for (const mesh of [headRef.current, teethRef.current]) {
      if (!mesh?.morphTargetDictionary || !mesh.morphTargetInfluences) continue;
      const dict = mesh.morphTargetDictionary;
      const infl = mesh.morphTargetInfluences;

      /* drive visemes */
      for (const [key, idx] of Object.entries(dict)) {
        if (!key.startsWith("viseme_")) continue;
        const tgt = targets[key] ?? 0;
        infl[idx] = L(infl[idx], tgt, tgt > infl[idx] ? 0.40 : 0.22);
      }

      /* eye blink — handle both RPM naming conventions */
      for (const name of ["eyeBlinkLeft","eyeBlinkRight","eyesClosed","eyeBlink"]) {
        const idx2 = dict[name];
        if (idx2 !== undefined) infl[idx2] = L(infl[idx2], blink.current, 0.5);
      }

      /* listening brow raise */
      const browAmt = isListening ? 0.35 : 0;
      for (const name of ["browInnerUp","browOuterUpLeft","browOuterUpRight"]) {
        const idx2 = dict[name];
        if (idx2 !== undefined) infl[idx2] = L(infl[idx2], browAmt, 0.08);
      }
    }
  });

  return (
    <group position={[0, -1.55, 0]}>
      <primitive object={scene} />
    </group>
  );
}

/* ── Scene (lights + avatar) ─────────────────────────────────────────────── */
function Scene(props: InnerProps) {
  return (
    <>
      {/* ambient */}
      <ambientLight intensity={0.55} />

      {/* key light — warm, upper left */}
      <directionalLight
        position={[-1.5, 3.5, 2.5]} intensity={1.8}
        color="#fff8f0" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-near={0.1}  shadow-camera-far={8}
        shadow-camera-left={-1}   shadow-camera-right={1}
        shadow-camera-top={1}     shadow-camera-bottom={-1}
      />
      {/* fill light — cool, right */}
      <directionalLight position={[2.2, 1.5, 1.8]} intensity={0.55} color="#ddeeff" />
      {/* rim / back light */}
      <directionalLight position={[0, 2, -3]} intensity={0.35} color="#ffe8d0" />
      {/* face up-light (bounce) */}
      <pointLight position={[0, -0.6, 1.2]} intensity={0.3} color="#ffead5" />

      <Suspense fallback={null}>
        <AvatarInner {...props} />
      </Suspense>
    </>
  );
}

/* ── Public component ────────────────────────────────────────────────────── */
export default function Avatar3D(props: Avatar3DProps) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0d0d0f" }}>
      <Canvas
        camera={{ position: [0, 0.18, 1.38], fov: 26 }}
        shadows="soft"
        style={{ width: "100%", height: "100%", display: "block" }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Scene {...props} onReady={() => {}} />
      </Canvas>
    </div>
  );
}
