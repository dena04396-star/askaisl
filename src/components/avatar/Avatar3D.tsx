"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

export interface Avatar3DProps {
  isSpeaking: boolean;
  isListening?: boolean;
}

/* ──────────────────────────────────────────────────────────────
   GLB MODEL  (Ready Player Me or any humanoid .glb)
   Place your avatar.glb in /public/avatar.glb
   OR set NEXT_PUBLIC_AVATAR_GLB_URL in .env.local to a remote URL
   e.g. NEXT_PUBLIC_AVATAR_GLB_URL=https://models.readyplayer.me/YOUR_ID.glb
   ────────────────────────────────────────────────────────────── */
const GLB_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_AVATAR_GLB_URL) ||
  "/avatar.glb";

function GLBAvatar({ isSpeaking, isListening = false }: Avatar3DProps) {
  const { scene } = useGLTF(GLB_URL);
  const groupRef = useRef<THREE.Group>(null!);

  /* Find the head/face mesh that has morph targets */
  const faceMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  const blinkTimerRef    = useRef(Math.random() * 4 + 3);
  const blinkProgressRef = useRef(0);
  const blinkingRef      = useRef(false);
  const listenTiltRef    = useRef(0);

  useEffect(() => {
    /* Ready Player Me morph-target mesh is usually named "Wolf3D_Head"
       or "Wolf3D_Avatar". Fall back to any SkinnedMesh with morphTargets. */
    scene.traverse((child) => {
      if (
        child instanceof THREE.SkinnedMesh &&
        child.morphTargetDictionary &&
        Object.keys(child.morphTargetDictionary).length > 0 &&
        !faceMeshRef.current
      ) {
        faceMeshRef.current = child;
      }
    });
  }, [scene]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    /* Breathing */
    groupRef.current.position.y = Math.sin(t * 1.1) * 0.012;

    /* Listening tilt */
    const targetTilt = isListening ? -0.10 : 0;
    listenTiltRef.current += (targetTilt - listenTiltRef.current) * 0.06;
    groupRef.current.rotation.z = listenTiltRef.current;

    /* Speaking nod */
    groupRef.current.rotation.x += (
      (isSpeaking ? Math.sin(t * 2.8) * 0.012 : 0) - groupRef.current.rotation.x
    ) * 0.12;

    const mesh = faceMeshRef.current;
    if (!mesh?.morphTargetDictionary || !mesh.morphTargetInfluences) return;
    const dict = mesh.morphTargetDictionary;
    const inf  = mesh.morphTargetInfluences;

    /* ── Speaking: mouthOpen or viseme_aa ── */
    const mouthOpenIdx = dict["mouthOpen"] ?? dict["viseme_aa"] ?? dict["viseme_PP"] ?? -1;
    if (mouthOpenIdx >= 0) {
      const target = isSpeaking ? (Math.sin(t * 9) * 0.5 + 0.5) * 0.75 : 0;
      inf[mouthOpenIdx] += (target - inf[mouthOpenIdx]) * 0.20;
    }

    /* ── Blink ── */
    blinkTimerRef.current -= delta;
    if (blinkTimerRef.current <= 0 && !blinkingRef.current) {
      blinkingRef.current      = true;
      blinkProgressRef.current = 0;
      blinkTimerRef.current    = Math.random() * 4 + 3;
    }
    if (blinkingRef.current) {
      blinkProgressRef.current = Math.min(blinkProgressRef.current + delta / 0.13, 1);
      const p   = blinkProgressRef.current;
      const val = Math.max(p < 0.5 ? p * 2 : (1 - p) * 2, 0);

      const leftIdx  = dict["eyeBlinkLeft"]  ?? dict["blink_left"]  ?? -1;
      const rightIdx = dict["eyeBlinkRight"] ?? dict["blink_right"] ?? -1;
      if (leftIdx  >= 0) inf[leftIdx]  = val;
      if (rightIdx >= 0) inf[rightIdx] = val;

      if (p >= 1) blinkingRef.current = false;
    }
  });

  return (
    <group ref={groupRef}>
      {/*
        RPM avatars are ~1.7 m tall standing.
        Offset -1.45 puts the head (~1.6 m up) near the camera's y=0.15 centre.
        Adjust if your model uses a different scale.
      */}
      <primitive object={scene} position={[0, -1.45, 0]} />
    </group>
  );
}

/* ──────────────────────────────────────────────────────────────
   GEOMETRY FALLBACK  (shown while GLB loads or if load fails)
   ────────────────────────────────────────────────────────────── */
const SKIN     = "#C8855A";
const HAIR     = "#100602";
const BLAZER   = "#1B2B5E";
const COLLAR   = "#E6E0D4";
const LIP      = "#A86860";
const LIP_DARK = "#6E3838";
const IRIS     = "#4A2C00";
const GOLD     = "#D4AF37";

function GeometryAvatar({ isSpeaking, isListening = false }: Avatar3DProps) {
  const bodyRef      = useRef<THREE.Group>(null!);
  const headRef      = useRef<THREE.Group>(null!);
  const mouthOpenRef = useRef<THREE.Mesh>(null!);
  const leftLidRef   = useRef<THREE.Mesh>(null!);
  const rightLidRef  = useRef<THREE.Mesh>(null!);

  const blinkTimer    = useRef(Math.random() * 4 + 3);
  const blinkProgress = useRef(0);
  const blinking      = useRef(false);
  const listenTilt    = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    bodyRef.current.position.y      = Math.sin(t * 1.08) * 0.016;
    headRef.current.rotation.y      = Math.sin(t * 0.32) * 0.032;
    const targetTilt                = isListening ? -0.10 : 0;
    listenTilt.current             += (targetTilt - listenTilt.current) * 0.06;
    headRef.current.rotation.z      = listenTilt.current;
    const targetNod                 = isSpeaking ? Math.sin(t * 2.8) * 0.014 : 0;
    headRef.current.rotation.x     += (targetNod - headRef.current.rotation.x) * 0.12;

    if (mouthOpenRef.current) {
      const target = isSpeaking ? 0.55 + Math.sin(t * 9) * 0.35 : 0.001;
      mouthOpenRef.current.scale.y += (target - mouthOpenRef.current.scale.y) * 0.22;
    }

    blinkTimer.current -= delta;
    if (blinkTimer.current <= 0 && !blinking.current) {
      blinking.current      = true;
      blinkProgress.current = 0;
      blinkTimer.current    = Math.random() * 4 + 3;
    }
    if (blinking.current) {
      blinkProgress.current = Math.min(blinkProgress.current + delta / 0.13, 1);
      const p   = blinkProgress.current;
      const lid = Math.max(p < 0.5 ? p * 2 : (1 - p) * 2, 0.001);
      if (leftLidRef.current)  leftLidRef.current.scale.y  = lid;
      if (rightLidRef.current) rightLidRef.current.scale.y = lid;
      if (p >= 1) {
        blinking.current = false;
        if (leftLidRef.current)  leftLidRef.current.scale.y  = 0.001;
        if (rightLidRef.current) rightLidRef.current.scale.y = 0.001;
      }
    }
  });

  return (
    <group ref={bodyRef} position={[0, -0.35, 0]}>
      {/* Neck */}
      <mesh position={[0, -0.65, 0]}><cylinderGeometry args={[0.135, 0.165, 0.30, 32]} /><meshStandardMaterial color={SKIN} roughness={0.60} /></mesh>
      {/* Blazer body */}
      <mesh position={[0, -1.08, 0]}><boxGeometry args={[1.08, 0.48, 0.52]} /><meshStandardMaterial color={BLAZER} roughness={0.70} /></mesh>
      {/* Left shoulder */}
      <mesh position={[-0.55, -0.94, 0]} rotation={[0, 0, 0.35]}><capsuleGeometry args={[0.088, 0.20, 6, 14]} /><meshStandardMaterial color={BLAZER} roughness={0.70} /></mesh>
      {/* Right shoulder */}
      <mesh position={[0.55, -0.94, 0]} rotation={[0, 0, -0.35]}><capsuleGeometry args={[0.088, 0.20, 6, 14]} /><meshStandardMaterial color={BLAZER} roughness={0.70} /></mesh>
      {/* Lapel left */}
      <mesh position={[-0.165, -0.86, 0.265]} rotation={[0.38, 0.05, 0.28]}><boxGeometry args={[0.16, 0.30, 0.035]} /><meshStandardMaterial color={BLAZER} roughness={0.70} /></mesh>
      {/* Lapel right */}
      <mesh position={[0.165, -0.86, 0.265]} rotation={[0.38, -0.05, -0.28]}><boxGeometry args={[0.16, 0.30, 0.035]} /><meshStandardMaterial color={BLAZER} roughness={0.70} /></mesh>
      {/* Collar */}
      <mesh position={[0, -0.88, 0.265]}><boxGeometry args={[0.18, 0.22, 0.018]} /><meshStandardMaterial color={COLLAR} roughness={0.62} /></mesh>

      <group ref={headRef}>
        {/* Head */}
        <mesh scale={[1, 1.09, 0.92]} castShadow><sphereGeometry args={[0.50, 64, 64]} /><meshStandardMaterial color={SKIN} roughness={0.58} /></mesh>
        {/* Hair cap */}
        <mesh position={[0, 0.05, 0]} scale={[1.012, 1.105, 0.930]}><sphereGeometry args={[0.506, 64, 48, 0, Math.PI*2, 0, Math.PI*0.524]} /><meshStandardMaterial color={HAIR} roughness={0.91} /></mesh>
        <mesh position={[-0.355, 0.07, -0.22]} scale={[0.48, 0.42, 0.55]}><sphereGeometry args={[0.22, 16, 16]} /><meshStandardMaterial color={HAIR} roughness={0.91} /></mesh>
        <mesh position={[0.355, 0.07, -0.22]} scale={[0.48, 0.42, 0.55]}><sphereGeometry args={[0.22, 16, 16]} /><meshStandardMaterial color={HAIR} roughness={0.91} /></mesh>
        {/* Bun */}
        <mesh position={[0, 0.45, -0.41]}><sphereGeometry args={[0.135, 28, 28]} /><meshStandardMaterial color={HAIR} roughness={0.91} /></mesh>
        <mesh position={[0, 0.45, -0.41]} rotation={[0.20, 0, 0]}><torusGeometry args={[0.100, 0.026, 10, 28]} /><meshStandardMaterial color={HAIR} roughness={0.89} /></mesh>
        {/* Bindi */}
        <mesh position={[0, 0.162, 0.496]}><circleGeometry args={[0.026, 20]} /><meshStandardMaterial color="#CC0000" emissive="#990000" emissiveIntensity={0.65} roughness={0.18} /></mesh>
        {/* Eyebrows */}
        <mesh position={[-0.174, 0.106, 0.479]} rotation={[0, -0.09, -0.08]}><capsuleGeometry args={[0.011, 0.102, 4, 10]} /><meshStandardMaterial color="#0D0400" roughness={0.82} /></mesh>
        <mesh position={[0.174, 0.106, 0.479]} rotation={[0, 0.09, 0.08]}><capsuleGeometry args={[0.011, 0.102, 4, 10]} /><meshStandardMaterial color="#0D0400" roughness={0.82} /></mesh>
        {/* Left eye */}
        <group position={[-0.168, 0.040, 0.450]}>
          <mesh scale={[1, 0.78, 0.66]}><sphereGeometry args={[0.066, 28, 28]} /><meshStandardMaterial color="#F5F0E6" roughness={0.18} /></mesh>
          <mesh position={[0, 0, 0.040]}><circleGeometry args={[0.040, 26]} /><meshStandardMaterial color={IRIS} roughness={0.25} /></mesh>
          <mesh position={[0, 0, 0.046]}><circleGeometry args={[0.023, 18]} /><meshStandardMaterial color="#040100" roughness={0.16} /></mesh>
          <mesh position={[0.013, 0.013, 0.052]}><circleGeometry args={[0.009, 8]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={1.2} /></mesh>
          <mesh ref={leftLidRef} position={[0, 0.032, 0.048]} scale={[1, 0.001, 1]}><sphereGeometry args={[0.070, 26, 18, 0, Math.PI*2, 0, Math.PI*0.60]} /><meshStandardMaterial color={SKIN} roughness={0.60} /></mesh>
        </group>
        {/* Right eye */}
        <group position={[0.168, 0.040, 0.450]}>
          <mesh scale={[1, 0.78, 0.66]}><sphereGeometry args={[0.066, 28, 28]} /><meshStandardMaterial color="#F5F0E6" roughness={0.18} /></mesh>
          <mesh position={[0, 0, 0.040]}><circleGeometry args={[0.040, 26]} /><meshStandardMaterial color={IRIS} roughness={0.25} /></mesh>
          <mesh position={[0, 0, 0.046]}><circleGeometry args={[0.023, 18]} /><meshStandardMaterial color="#040100" roughness={0.16} /></mesh>
          <mesh position={[0.013, 0.013, 0.052]}><circleGeometry args={[0.009, 8]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={1.2} /></mesh>
          <mesh ref={rightLidRef} position={[0, 0.032, 0.048]} scale={[1, 0.001, 1]}><sphereGeometry args={[0.070, 26, 18, 0, Math.PI*2, 0, Math.PI*0.60]} /><meshStandardMaterial color={SKIN} roughness={0.60} /></mesh>
        </group>
        {/* Nose bridge */}
        <mesh position={[0, -0.055, 0.490]} scale={[0.42, 0.72, 0.40]}><capsuleGeometry args={[0.014, 0.068, 4, 10]} /><meshStandardMaterial color="#B87838" roughness={0.70} /></mesh>
        {/* Mouth interior (animated) */}
        <mesh ref={mouthOpenRef} position={[0, -0.224, 0.480]} scale={[1, 0.001, 1]}><circleGeometry args={[0.068, 22]} /><meshStandardMaterial color="#160404" roughness={0.96} /></mesh>
        {/* Upper lip */}
        <mesh position={[0, -0.206, 0.484]}><torusGeometry args={[0.068, 0.015, 8, 26, Math.PI]} /><meshStandardMaterial color={LIP} roughness={0.44} /></mesh>
        {/* Lower lip */}
        <mesh position={[0, -0.244, 0.484]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.068, 0.018, 8, 26, Math.PI]} /><meshStandardMaterial color={LIP} roughness={0.44} /></mesh>
        {/* Lip crease */}
        <mesh position={[0, -0.223, 0.486]} rotation={[0, 0, Math.PI/2]}><capsuleGeometry args={[0.004, 0.108, 4, 8]} /><meshStandardMaterial color={LIP_DARK} roughness={0.62} /></mesh>
        {/* Ears */}
        <mesh position={[-0.492, -0.018, 0.015]} scale={[0.48, 0.60, 0.30]}><sphereGeometry args={[0.096, 16, 16]} /><meshStandardMaterial color={SKIN} roughness={0.62} /></mesh>
        <mesh position={[0.492, -0.018, 0.015]} scale={[0.48, 0.60, 0.30]}><sphereGeometry args={[0.096, 16, 16]} /><meshStandardMaterial color={SKIN} roughness={0.62} /></mesh>
        {/* Studs */}
        <mesh position={[-0.508, -0.055, 0]}><sphereGeometry args={[0.013, 10, 10]} /><meshStandardMaterial color={GOLD} roughness={0.14} metalness={0.90} /></mesh>
        <mesh position={[0.508, -0.055, 0]}><sphereGeometry args={[0.013, 10, 10]} /><meshStandardMaterial color={GOLD} roughness={0.14} metalness={0.90} /></mesh>
      </group>
    </group>
  );
}

/* ──────────────────────────────────────────────────────────────
   SMART LOADER  — tries GLB, falls back to geometry
   ────────────────────────────────────────────────────────────── */
function AvatarContent(props: Avatar3DProps) {
  /* If no GLB file is configured, skip straight to geometry fallback */
  const hasGLB =
    !!process.env.NEXT_PUBLIC_AVATAR_GLB_URL ||
    typeof window !== "undefined"; /* always try /avatar.glb in browser */

  if (!hasGLB) return <GeometryAvatar {...props} />;

  return (
    <Suspense fallback={<GeometryAvatar {...props} />}>
      <GLBErrorBoundaryInner {...props} />
    </Suspense>
  );
}

/* Attempt GLB load; error → geometry via Suspense fallback */
function GLBErrorBoundaryInner(props: Avatar3DProps) {
  try {
    return <GLBAvatar {...props} />;
  } catch {
    return <GeometryAvatar {...props} />;
  }
}

/* ──────────────────────────────────────────────────────────────
   CANVAS EXPORT
   ────────────────────────────────────────────────────────────── */
export default function Avatar3D({ isSpeaking, isListening = false }: Avatar3DProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      {isSpeaking && (
        <div className="pointer-events-none absolute inset-0 z-10 animate-pulse rounded-2xl ring-2 ring-teal-400/60" />
      )}
      <Canvas camera={{ position: [0, 0.14, 2.45], fov: 44 }} shadows>
        <color attach="background" args={["#0b1e1e"]} />
        <ambientLight intensity={0.48} />
        <directionalLight position={[1.6, 3.2, 2.6]} intensity={1.45} color="#fff8f0" castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-2.0, 0.8, 1.0]} intensity={0.40} color="#c8deff" />
        <directionalLight position={[0.2, 0.4, -3.2]} intensity={0.22} color="#90b0ff" />
        <pointLight position={[0, -1.4, 1.0]} intensity={0.16} color="#ffe8cc" />
        <Environment preset="studio" />
        <Suspense fallback={<GeometryAvatar isSpeaking={isSpeaking} isListening={isListening} />}>
          <AvatarContent isSpeaking={isSpeaking} isListening={isListening} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI/3} maxPolarAngle={Math.PI/1.75} minAzimuthAngle={-Math.PI/5} maxAzimuthAngle={Math.PI/5} />
      </Canvas>
    </div>
  );
}
