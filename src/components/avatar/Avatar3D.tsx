"use client";

import { Component, Suspense, useRef, useEffect, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";

export interface Avatar3DProps {
  isSpeaking: boolean;
  isListening?: boolean;
  /* pass useRef<AnalyserNode | null> from parent for real-time lip sync */
  analyserRef?: { current: AnalyserNode | null };
}

/* ─── Ready Player Me female avatar with ARKit + Oculus Visemes ─── */
const RPM_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_AVATAR_GLB_URL) ||
  "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb" +
  "?morphTargets=ARKit,Oculus%20Visemes&textureAtlas=1024&lod=0";

/* ─── ARKit viseme morph target names ─── */
const VISEME_OPEN = ["viseme_aa", "viseme_E", "viseme_O", "mouthOpen"];
const VISEME_BROW_RAISE = ["browInnerUp", "browOuterUpLeft", "browOuterUpRight"];

function RPMAvatarInner({ isSpeaking, isListening = false, analyserRef }: Avatar3DProps) {
  const { scene } = useGLTF(RPM_URL);
  const groupRef   = useRef<THREE.Group>(null!);
  const meshesRef  = useRef<THREE.SkinnedMesh[]>([]);
  const freqBuf    = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const smoothAmp  = useRef(0);
  const blinkTimer = useRef(3.2);
  const blinkProg  = useRef(0);
  const blinking   = useRef(false);
  const headBone   = useRef<THREE.Bone | null>(null);
  const neckBone   = useRef<THREE.Bone | null>(null);

  useEffect(() => {
    const meshes: THREE.SkinnedMesh[] = [];
    scene.traverse((c) => {
      if (c instanceof THREE.SkinnedMesh) {
        meshes.push(c);
        c.castShadow = true;
        c.receiveShadow = true;
      }
      if (c instanceof THREE.Bone) {
        const n = c.name.toLowerCase();
        if (n === "head" || n.includes("head") && !headBone.current) headBone.current = c as THREE.Bone;
        if (n === "neck" || n.includes("neck") && !neckBone.current) neckBone.current = c as THREE.Bone;
      }
    });
    meshesRef.current = meshes;
  }, [scene]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    /* Gentle idle sway */
    groupRef.current.position.y = Math.sin(t * 0.75) * 0.006;
    if (neckBone.current) {
      neckBone.current.rotation.y += (Math.sin(t * 0.28) * 0.025 - neckBone.current.rotation.y) * 0.04;
    }
    if (headBone.current) {
      const targetX = isListening ? -0.04 : Math.sin(t * 0.55) * 0.012;
      headBone.current.rotation.x += (targetX - headBone.current.rotation.x) * 0.05;
      headBone.current.rotation.y += (Math.sin(t * 0.22) * 0.018 - headBone.current.rotation.y) * 0.04;
    }

    /* ── Real audio amplitude from Web Audio API ── */
    const analyser = analyserRef?.current;
    let rawAmp = 0;
    if (analyser) {
      if (!freqBuf.current || freqBuf.current.length !== analyser.frequencyBinCount) {
        freqBuf.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      }
      analyser.getByteFrequencyData(freqBuf.current);
      /* Speech fundamental + formant range ~85-3400Hz.
         For fftSize 256 + sampleRate 44100Hz: bin width = 44100/256 ≈ 172Hz
         Bins 2-20 cover roughly 344Hz-3440Hz (speech core) */
      let sum = 0;
      const lo = 2, hi = Math.min(20, freqBuf.current.length);
      for (let i = lo; i < hi; i++) sum += freqBuf.current[i];
      rawAmp = sum / ((hi - lo) * 255);
    } else if (isSpeaking) {
      /* Fallback sine simulation when no analyser (Web Speech path) */
      rawAmp = (Math.sin(t * 9.5) * 0.5 + 0.5) * 0.55 + Math.sin(t * 4.3) * 0.15;
      rawAmp = Math.max(0, Math.min(1, rawAmp));
    }

    /* Smooth amplitude for more natural movement */
    smoothAmp.current += (rawAmp - smoothAmp.current) * 0.38;
    const amp = smoothAmp.current;

    /* ── Drive morph targets ── */
    for (const mesh of meshesRef.current) {
      const dict = mesh.morphTargetDictionary;
      const inf  = mesh.morphTargetInfluences;
      if (!dict || !inf) continue;

      /* Mouth open – try each viseme name */
      let didOpen = false;
      for (const name of VISEME_OPEN) {
        const idx = dict[name];
        if (idx !== undefined) {
          inf[idx] += (amp * 0.95 - inf[idx]) * 0.40;
          didOpen = true;
          break;
        }
      }
      /* If no open viseme found, try mouthClose as inverse */
      if (!didOpen) {
        const closeIdx = dict["mouthClose"];
        if (closeIdx !== undefined) inf[closeIdx] += ((isSpeaking ? 1 - amp : 1) - inf[closeIdx]) * 0.30;
      }

      /* Secondary lip shape when speaking – O viseme */
      const oIdx = dict["viseme_O"];
      if (oIdx !== undefined) inf[oIdx] += (amp * 0.35 - inf[oIdx]) * 0.28;

      /* Lips pressed at rest */
      const ppIdx = dict["viseme_PP"] ?? dict["mouthPressLeft"];
      if (ppIdx !== undefined) inf[ppIdx] += ((isSpeaking ? 0 : 0.18) - inf[ppIdx]) * 0.08;

      /* Brow raise when listening */
      for (const name of VISEME_BROW_RAISE) {
        const idx = dict[name];
        if (idx !== undefined) inf[idx] += ((isListening ? 0.25 : 0) - inf[idx]) * 0.05;
      }

      /* Slight smile at rest */
      const smileL = dict["mouthSmileLeft"];
      const smileR = dict["mouthSmileRight"];
      const smileTarget = isSpeaking ? 0.08 : 0.14;
      if (smileL !== undefined) inf[smileL] += (smileTarget - inf[smileL]) * 0.05;
      if (smileR !== undefined) inf[smileR] += (smileTarget - inf[smileR]) * 0.05;

      /* Blink */
      blinkTimer.current -= delta;
      if (blinkTimer.current <= 0 && !blinking.current) {
        blinking.current = true;
        blinkProg.current = 0;
        blinkTimer.current = Math.random() * 4.5 + 2.5;
      }
      if (blinking.current) {
        blinkProg.current = Math.min(blinkProg.current + delta / 0.11, 1);
        const p  = blinkProg.current;
        const v  = Math.max(p < 0.5 ? p * 2 : (1 - p) * 2, 0);
        const lL = dict["eyeBlinkLeft"]  ?? dict["blink_left"];
        const lR = dict["eyeBlinkRight"] ?? dict["blink_right"];
        if (lL !== undefined) inf[lL] = v;
        if (lR !== undefined) inf[lR] = v;
        if (p >= 1) blinking.current = false;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} position={[0, -1.46, 0]} scale={1.0} />
    </group>
  );
}

/* ─────────────────────────────────────── Geometry fallback ─── */
const SKIN = "#C5805A"; const HAIR = "#120704"; const BLAZER = "#1A2A5C";
const COLLAR = "#EDE8DC"; const LIP = "#A8685E"; const LIP_D = "#6C3636";
const IRIS = "#4A2C00"; const GOLD = "#D4AF37";

function GeometryAvatar({ isSpeaking, isListening = false, analyserRef }: Avatar3DProps) {
  const bodyRef  = useRef<THREE.Group>(null!);
  const headRef  = useRef<THREE.Group>(null!);
  const jawRef   = useRef<THREE.Group>(null!);
  const mouthRef = useRef<THREE.Mesh>(null!);
  const leftLid  = useRef<THREE.Mesh>(null!);
  const rightLid = useRef<THREE.Mesh>(null!);

  const blinkTimer = useRef(3.5);
  const blinkProg  = useRef(0);
  const blinking   = useRef(false);
  const listenTilt = useRef(0);
  const mouthOpen  = useRef(0);
  const smoothAmp  = useRef(0);
  const freqBuf    = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    bodyRef.current.position.y = Math.sin(t * 1.08) * 0.016;
    headRef.current.rotation.y = Math.sin(t * 0.32) * 0.032;
    const targetTilt = isListening ? -0.10 : 0;
    listenTilt.current += (targetTilt - listenTilt.current) * 0.06;
    headRef.current.rotation.z = listenTilt.current;
    const targetNod = isSpeaking ? Math.sin(t * 2.8) * 0.014 : 0;
    headRef.current.rotation.x += (targetNod - headRef.current.rotation.x) * 0.12;

    /* Audio amplitude */
    const analyser = analyserRef?.current;
    let rawAmp = 0;
    if (analyser) {
      if (!freqBuf.current || freqBuf.current.length !== analyser.frequencyBinCount) {
        freqBuf.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      }
      analyser.getByteFrequencyData(freqBuf.current);
      let sum = 0;
      const lo = 2, hi = Math.min(20, freqBuf.current.length);
      for (let i = lo; i < hi; i++) sum += freqBuf.current[i];
      rawAmp = sum / ((hi - lo) * 255);
    } else if (isSpeaking) {
      rawAmp = Math.max(0, Math.min(1, (Math.sin(t * 9) * 0.5 + 0.5) * 0.7));
    }
    smoothAmp.current += (rawAmp - smoothAmp.current) * 0.38;
    mouthOpen.current = smoothAmp.current;

    if (jawRef.current) {
      jawRef.current.rotation.x = mouthOpen.current * 0.55;
      jawRef.current.position.y = -0.230 - mouthOpen.current * 0.028;
    }
    if (mouthRef.current) mouthRef.current.scale.y = 0.001 + mouthOpen.current * 1.2;

    /* Blink */
    blinkTimer.current -= delta;
    if (blinkTimer.current <= 0 && !blinking.current) {
      blinking.current = true; blinkProg.current = 0;
      blinkTimer.current = Math.random() * 4 + 3;
    }
    if (blinking.current) {
      blinkProg.current = Math.min(blinkProg.current + delta / 0.13, 1);
      const p = blinkProg.current;
      const lid = Math.max(p < 0.5 ? p * 2 : (1 - p) * 2, 0.001);
      if (leftLid.current)  leftLid.current.scale.y  = lid;
      if (rightLid.current) rightLid.current.scale.y = lid;
      if (p >= 1) { blinking.current = false; leftLid.current.scale.y = 0.001; rightLid.current.scale.y = 0.001; }
    }
  });

  return (
    <group ref={bodyRef} position={[0, -0.35, 0]}>
      <mesh position={[0, -0.65, 0]}><cylinderGeometry args={[0.135, 0.165, 0.30, 32]} /><meshStandardMaterial color={SKIN} roughness={0.60} /></mesh>
      <mesh position={[0, -1.08, 0]}><boxGeometry args={[1.08, 0.48, 0.52]} /><meshStandardMaterial color={BLAZER} roughness={0.70} /></mesh>
      <mesh position={[-0.55, -0.94, 0]} rotation={[0,0,0.35]}><capsuleGeometry args={[0.088,0.20,6,14]} /><meshStandardMaterial color={BLAZER} roughness={0.70} /></mesh>
      <mesh position={[0.55, -0.94, 0]} rotation={[0,0,-0.35]}><capsuleGeometry args={[0.088,0.20,6,14]} /><meshStandardMaterial color={BLAZER} roughness={0.70} /></mesh>
      <mesh position={[0, -0.88, 0.265]}><boxGeometry args={[0.18,0.22,0.018]} /><meshStandardMaterial color={COLLAR} roughness={0.62} /></mesh>
      <group ref={headRef}>
        <mesh scale={[1,1.09,0.92]}><sphereGeometry args={[0.50,64,64]} /><meshStandardMaterial color={SKIN} roughness={0.58} /></mesh>
        <mesh position={[0,0.05,0]} scale={[1.012,1.105,0.930]}><sphereGeometry args={[0.506,64,48,0,Math.PI*2,0,Math.PI*0.524]} /><meshStandardMaterial color={HAIR} roughness={0.91} /></mesh>
        <mesh position={[0,0.45,-0.41]}><sphereGeometry args={[0.135,28,28]} /><meshStandardMaterial color={HAIR} roughness={0.91} /></mesh>
        <mesh position={[0,0.162,0.496]}><circleGeometry args={[0.026,20]} /><meshStandardMaterial color="#CC0000" emissive="#990000" emissiveIntensity={0.65} roughness={0.18} /></mesh>
        <mesh position={[-0.174,0.106,0.479]} rotation={[0,-0.09,-0.08]}><capsuleGeometry args={[0.011,0.102,4,10]} /><meshStandardMaterial color="#0D0400" roughness={0.82} /></mesh>
        <mesh position={[0.174,0.106,0.479]} rotation={[0,0.09,0.08]}><capsuleGeometry args={[0.011,0.102,4,10]} /><meshStandardMaterial color="#0D0400" roughness={0.82} /></mesh>
        <group position={[-0.168,0.040,0.450]}>
          <mesh scale={[1,0.78,0.66]}><sphereGeometry args={[0.066,28,28]} /><meshStandardMaterial color="#F5F0E6" roughness={0.18} /></mesh>
          <mesh position={[0,0,0.040]}><circleGeometry args={[0.040,26]} /><meshStandardMaterial color={IRIS} roughness={0.25} /></mesh>
          <mesh position={[0,0,0.046]}><circleGeometry args={[0.023,18]} /><meshStandardMaterial color="#040100" roughness={0.16} /></mesh>
          <mesh position={[0.013,0.013,0.052]}><circleGeometry args={[0.009,8]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={1.2} /></mesh>
          <mesh ref={leftLid} position={[0,0.032,0.048]} scale={[1,0.001,1]}><sphereGeometry args={[0.070,26,18,0,Math.PI*2,0,Math.PI*0.60]} /><meshStandardMaterial color={SKIN} roughness={0.60} /></mesh>
        </group>
        <group position={[0.168,0.040,0.450]}>
          <mesh scale={[1,0.78,0.66]}><sphereGeometry args={[0.066,28,28]} /><meshStandardMaterial color="#F5F0E6" roughness={0.18} /></mesh>
          <mesh position={[0,0,0.040]}><circleGeometry args={[0.040,26]} /><meshStandardMaterial color={IRIS} roughness={0.25} /></mesh>
          <mesh position={[0,0,0.046]}><circleGeometry args={[0.023,18]} /><meshStandardMaterial color="#040100" roughness={0.16} /></mesh>
          <mesh position={[0.013,0.013,0.052]}><circleGeometry args={[0.009,8]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={1.2} /></mesh>
          <mesh ref={rightLid} position={[0,0.032,0.048]} scale={[1,0.001,1]}><sphereGeometry args={[0.070,26,18,0,Math.PI*2,0,Math.PI*0.60]} /><meshStandardMaterial color={SKIN} roughness={0.60} /></mesh>
        </group>
        <mesh position={[0,-0.055,0.490]} scale={[0.42,0.72,0.40]}><capsuleGeometry args={[0.014,0.068,4,10]} /><meshStandardMaterial color="#B07838" roughness={0.70} /></mesh>
        <group ref={jawRef} position={[0,-0.230,0]}>
          <mesh ref={mouthRef} position={[0,0,0.480]} scale={[1,0.001,1]}><circleGeometry args={[0.072,24]} /><meshStandardMaterial color="#160404" roughness={0.96} /></mesh>
          <mesh position={[0,0.022,0.484]}><torusGeometry args={[0.068,0.015,8,26,Math.PI]} /><meshStandardMaterial color={LIP} roughness={0.44} /></mesh>
          <mesh position={[0,-0.016,0.484]} rotation={[0,0,Math.PI]}><torusGeometry args={[0.070,0.018,8,26,Math.PI]} /><meshStandardMaterial color={LIP} roughness={0.44} /></mesh>
          <mesh position={[0,0.002,0.486]} rotation={[0,0,Math.PI/2]}><capsuleGeometry args={[0.004,0.108,4,8]} /><meshStandardMaterial color={LIP_D} roughness={0.62} /></mesh>
        </group>
        <mesh position={[-0.492,-0.018,0.015]} scale={[0.48,0.60,0.30]}><sphereGeometry args={[0.096,16,16]} /><meshStandardMaterial color={SKIN} roughness={0.62} /></mesh>
        <mesh position={[0.492,-0.018,0.015]} scale={[0.48,0.60,0.30]}><sphereGeometry args={[0.096,16,16]} /><meshStandardMaterial color={SKIN} roughness={0.62} /></mesh>
        <mesh position={[-0.508,-0.055,0]}><sphereGeometry args={[0.013,10,10]} /><meshStandardMaterial color={GOLD} roughness={0.14} metalness={0.90} /></mesh>
        <mesh position={[0.508,-0.055,0]}><sphereGeometry args={[0.013,10,10]} /><meshStandardMaterial color={GOLD} roughness={0.14} metalness={0.90} /></mesh>
      </group>
    </group>
  );
}

/* ─── Error boundary ─── */
class AvatarErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/* ─── Scene ─── */
function AvatarScene(props: Avatar3DProps) {
  return (
    <>
      {/* Soft key light */}
      <ambientLight intensity={0.85} />
      <directionalLight position={[1.5, 3.5, 2.8]} intensity={1.8} color="#fff9f4" castShadow shadow-mapSize={[512, 512]} />
      {/* Fill light from left */}
      <directionalLight position={[-2.2, 1.8, 1.6]} intensity={0.70} color="#dde8ff" />
      {/* Rim / hair light */}
      <directionalLight position={[0, 1.2, -2.5]} intensity={0.40} color="#ffe0c0" />
      {/* Under-chin soft fill */}
      <pointLight position={[0, -0.6, 1.4]} intensity={0.22} color="#fff4e0" />
      <Environment preset="apartment" background={false} />

      <AvatarErrorBoundary fallback={<GeometryAvatar {...props} />}>
        <Suspense fallback={<GeometryAvatar {...props} />}>
          <RPMAvatarInner {...props} />
        </Suspense>
      </AvatarErrorBoundary>
    </>
  );
}

/* ─── Public export ─── */
export default function Avatar3D(props: Avatar3DProps) {
  const { isSpeaking } = props;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Speaking pulse ring overlays */}
      {isSpeaking && (
        <>
          <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none", borderRadius: "inherit", boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.12)", animation: "speak-ring 0.7s ease-in-out infinite" }} />
          <div style={{ position: "absolute", inset: -4, zIndex: 10, pointerEvents: "none", borderRadius: "inherit", boxShadow: "0 0 0 1.5px rgba(0,0,0,0.06)", animation: "speak-ring 0.7s ease-in-out infinite 0.18s" }} />
        </>
      )}

      <Canvas
        camera={{ position: [0, 0.28, 1.52], fov: 30 }}
        shadows
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
      >
        <AvatarScene {...props} />
      </Canvas>
    </div>
  );
}
