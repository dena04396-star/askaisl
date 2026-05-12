"use client";

import { Suspense, useRef, useEffect, MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export interface Avatar3DProps {
  isSpeaking:   boolean;
  isListening?: boolean;
  isLoading?:   boolean;
  analyserRef?: MutableRefObject<AnalyserNode | null>;
  onReady?:     () => void;
}

const AVATAR_URL = "/avatar/female.glb";
const L = THREE.MathUtils.lerp;

/* ── FFT amplitude (0-1) ──────────────────────────────────────────────────── */
function fftAmp(analyser: AnalyserNode): number {
  const buf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(buf);
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i];
  return s / buf.length / 255;
}

/* ── Inner component (inside Canvas) ─────────────────────────────────────── */
interface InnerProps extends Avatar3DProps { onReadyInner: () => void; }

function AvatarInner({ isSpeaking, isListening, isLoading, analyserRef, onReadyInner }: InnerProps) {
  const { scene } = useGLTF(AVATAR_URL);

  /* morph-target mesh — auto-discovered (supports Wolf3D_ AND avaturn_ avatars) */
  const morphMeshes = useRef<THREE.SkinnedMesh[]>([]);

  /* bones — confirmed names from GLB: LeftArm, RightArm, LeftForeArm, RightForeArm */
  const headBone  = useRef<THREE.Object3D | null>(null);
  const lArmRef   = useRef<THREE.Object3D | null>(null);
  const rArmRef   = useRef<THREE.Object3D | null>(null);
  const lForeRef  = useRef<THREE.Object3D | null>(null);
  const rForeRef  = useRef<THREE.Object3D | null>(null);
  const jawRef    = useRef<THREE.Object3D | null>(null);

  const lBase = useRef({ z: 1.2, x: -0.1, y: 0 });
  const rBase = useRef({ z: -1.2, x: -0.1, y: 0 });

  /* time / blink */
  const t        = useRef(0);
  const blinkT   = useRef(2.5);
  const blink    = useRef(0);
  const blinkDir = useRef(1);
  const blinking = useRef(false);
  const eyeX     = useRef(0);
  const eyeY     = useRef(0);
  const eyeWait  = useRef(3.5);

  useEffect(() => {
    t.current       = Math.random() * 100;
    blinkT.current  = 2 + Math.random() * 3;
    eyeWait.current = 3 + Math.random() * 3;

    const found: THREE.SkinnedMesh[] = [];

    scene.traverse(child => {
      /* shadow */
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
      /* collect every skinned mesh that HAS morph targets */
      const sm = child as THREE.SkinnedMesh;
      if (sm.isSkinnedMesh && sm.morphTargetDictionary && Object.keys(sm.morphTargetDictionary).length > 0) {
        found.push(sm);
      }
      /* jaw bone (some RPM exports have it) */
      if (child.name.toLowerCase() === "jaw") jawRef.current = child;
    });

    morphMeshes.current = found;

    /* Head bone for sway */
    headBone.current = scene.getObjectByName("Head") ?? null;

    /* bone lookup — try standard RPM name, then mixamorig prefix */
    const get = (name: string) =>
      scene.getObjectByName(name) ?? scene.getObjectByName("mixamorig" + name) ?? null;

    const la = get("LeftArm");
    const ra = get("RightArm");
    const lf = get("LeftForeArm");
    const rf = get("RightForeArm");

    const lb = lBase.current;
    const rb = rBase.current;

    if (la) { la.rotation.set(lb.x, lb.y, lb.z); lArmRef.current = la; }
    if (ra) { ra.rotation.set(rb.x, rb.y, rb.z); rArmRef.current = ra; }
    if (lf) { lf.rotation.set(0, 0, 0); lForeRef.current = lf; }
    if (rf) { rf.rotation.set(0, 0, 0); rForeRef.current = rf; }

    onReadyInner();
  }, [scene, onReadyInner]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, dt) => {
    t.current += dt;
    const tc = t.current;

    /* blink */
    blinkT.current -= dt;
    if (!blinking.current && blinkT.current <= 0) {
      blinking.current = true; blinkDir.current = 1;
      blinkT.current = 3.5 + Math.random() * 4;
    }
    if (blinking.current) {
      blink.current += blinkDir.current * dt * 18;
      if (blink.current >= 1) { blink.current = 1; blinkDir.current = -1; }
      if (blink.current <= 0) { blink.current = 0; blinking.current = false; }
    }

    /* eye wander */
    eyeWait.current -= dt;
    if (eyeWait.current <= 0) {
      eyeX.current    = (Math.random() - 0.5) * 0.04;
      eyeY.current    = (Math.random() - 0.5) * 0.02;
      eyeWait.current = 2 + Math.random() * 5;
    }

    /* head idle sway — subtle thinking nod when isLoading */
    if (headBone.current) {
      const spd = isSpeaking ? 1.4 : isLoading ? 0.9 : 0.5;
      const tiltX = isLoading ? Math.sin(tc * 0.6) * 0.04 + 0.025 : 0; // slight downward thinking tilt
      headBone.current.rotation.y = L(headBone.current.rotation.y, Math.sin(tc * spd * 0.4) * 0.06 + eyeX.current, 0.05);
      headBone.current.rotation.x = L(headBone.current.rotation.x, Math.sin(tc * spd * 0.3) * 0.03 + eyeY.current + tiltX, 0.05);
      headBone.current.rotation.z = L(headBone.current.rotation.z, Math.sin(tc * spd * 0.25) * 0.015, 0.05);
    }

    /* arms static at sides */
    if (lArmRef.current) {
      const lb = lBase.current;
      lArmRef.current.rotation.x = L(lArmRef.current.rotation.x, lb.x, 0.04);
      lArmRef.current.rotation.y = L(lArmRef.current.rotation.y, lb.y, 0.04);
      lArmRef.current.rotation.z = L(lArmRef.current.rotation.z, lb.z, 0.04);
    }
    if (rArmRef.current) {
      const rb = rBase.current;
      rArmRef.current.rotation.x = L(rArmRef.current.rotation.x, rb.x, 0.04);
      rArmRef.current.rotation.y = L(rArmRef.current.rotation.y, rb.y, 0.04);
      rArmRef.current.rotation.z = L(rArmRef.current.rotation.z, rb.z, 0.04);
    }

    /* ── jaw bone animation — never moves during loading/thinking ── */
    const jawTarget = (isSpeaking && !isLoading)
      ? Math.max(0, Math.sin(tc * 9.5) * 0.55 + Math.sin(tc * 5.8) * 0.22) * 0.18
      : 0;
    if (jawRef.current) {
      // open: 0.5 lerp (fast open), close: 0.6 lerp (snap shut quickly)
      jawRef.current.rotation.x = L(jawRef.current.rotation.x, -jawTarget, jawTarget > Math.abs(jawRef.current.rotation.x) ? 0.5 : 0.6);
    }

    /* ── morph target mouth — mouth stays closed during loading/thinking ── */
    if (morphMeshes.current.length > 0) {
      let jawOpen = 0;
      if (isSpeaking && !isLoading) {
        const raw = Math.max(0, Math.sin(tc * 9.5) * 0.55 + Math.sin(tc * 5.8) * 0.25 + Math.sin(tc * 14.2) * 0.10);
        jawOpen = raw * 0.80;
        if (analyserRef?.current) {
          const amp = fftAmp(analyserRef.current);
          if (amp > 0.01) jawOpen = raw * Math.min(amp * 5.0, 1.0);
        }
      }

      const VISEME_CYCLE = ["viseme_aa","viseme_E","viseme_I","viseme_O","viseme_U","viseme_PP","viseme_kk","viseme_SS","viseme_FF","viseme_TH","viseme_DD","viseme_CH","viseme_nn","viseme_RR"];
      const cycleIdx = isSpeaking ? Math.floor(tc * 4.5) % VISEME_CYCLE.length : -1;

      for (const mesh of morphMeshes.current) {
        const dict = mesh.morphTargetDictionary!;
        const infl = mesh.morphTargetInfluences!;

        /* jawOpen + mouthOpen driven together */
        const jiJaw = dict["jawOpen"];
        const jiMouth = dict["mouthOpen"];
        if (jiJaw   !== undefined) infl[jiJaw]   = L(infl[jiJaw],   jawOpen,       jawOpen > infl[jiJaw]   ? 0.55 : 0.55);
        if (jiMouth !== undefined) infl[jiMouth] = L(infl[jiMouth], jawOpen * 0.7, jawOpen > infl[jiMouth] ? 0.55 : 0.55);

        /* viseme cycling — lip shape variety while speaking */
        for (let vi = 0; vi < VISEME_CYCLE.length; vi++) {
          const i = dict[VISEME_CYCLE[vi]];
          if (i !== undefined) {
            const target = vi === cycleIdx ? jawOpen * 0.55 : 0;
            infl[i] = L(infl[i], target, 0.28);
          }
        }
        /* silence viseme when not speaking */
        const iSil = dict["viseme_sil"];
        if (iSil !== undefined) infl[iSil] = L(infl[iSil], isSpeaking ? 0 : 1, 0.15);

        /* blink */
        for (const key of ["eyeBlinkLeft","eyeBlinkRight","eyesClosed","eyeBlink"]) {
          const i = dict[key];
          if (i !== undefined) infl[i] = L(infl[i], blink.current, 0.5);
        }

        /* brow: raise on listening, slight furrow when thinking */
        const browAmt = isListening ? 0.30 : 0;
        const browDownAmt = isLoading ? 0.20 : 0;
        const browDown = ["browDownLeft","browDownRight"];
        for (const key of browDown) { const i = dict[key]; if (i !== undefined) infl[i] = L(infl[i], browDownAmt, 0.07); }
        for (const key of ["browInnerUp","browOuterUpLeft","browOuterUpRight"]) {
          const i = dict[key];
          if (i !== undefined) infl[i] = L(infl[i], browAmt, 0.08);
        }
      }
    }
  });

  return (
    <group position={[0, -1.55, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function Scene(props: InnerProps) {
  return (
    <>
      <ambientLight intensity={0.60} />
      <directionalLight
        position={[-1.5, 3.5, 2.5]} intensity={1.9} color="#fff8f0" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-near={0.1} shadow-camera-far={8}
        shadow-camera-left={-1} shadow-camera-right={1}
        shadow-camera-top={1}   shadow-camera-bottom={-1}
      />
      <directionalLight position={[2.2, 1.5, 1.8]} intensity={0.55} color="#ddeeff" />
      <directionalLight position={[0, 2, -3]}       intensity={0.35} color="#ffe8d0" />
      <pointLight       position={[0, -0.6, 1.2]}   intensity={0.32} color="#ffead5" />
      <Suspense fallback={null}>
        <AvatarInner {...props} />
      </Suspense>
    </>
  );
}

export default function Avatar3D({ isSpeaking, isListening, isLoading, analyserRef, onReady }: Avatar3DProps) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0d0d0f" }}>
      <Canvas
        camera={{ position: [0, 0.18, 1.38], fov: 26 }}
        shadows="soft"
        style={{ width: "100%", height: "100%", display: "block" }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Scene
          isSpeaking={isSpeaking}
          isListening={isListening}
          isLoading={isLoading}
          analyserRef={analyserRef}
          onReadyInner={onReady ?? (() => {})}
        />
      </Canvas>
    </div>
  );
}
