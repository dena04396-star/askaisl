"use client";

import {
  Suspense, useRef, useEffect, useCallback
} from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

export interface Avatar3DProps {
  isSpeaking: boolean;
  isListening?: boolean;
  analyserRef?: { current: AnalyserNode | null };
}

const AVATAR_URL = "/avatar/female.glb"; 

/* ─── RPMAvatarInner ──────────────────────────────────────────────────────── */
interface RPMProps extends Avatar3DProps { onReady: () => void }

function RPMAvatarInner({ onReady }: RPMProps) {
  const { scene } = useGLTF(AVATAR_URL);
  const readyFired = useRef(false);

  useEffect(() => {
    // Ensure the scene casts/receives shadows safely
    scene.traverse((c: any) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    if (!readyFired.current) { 
      readyFired.current = true; 
      onReady(); 
    }
  }, [scene, onReady]);

  return (
    <group position={[0, -1.55, 0]}>
      <primitive object={scene} scale={1.0} />
    </group>
  );
}

/* ─── Scene wrapper ───────────────────────────────────────────────────────── */
interface SceneProps extends Avatar3DProps { onReady: () => void; onError: () => void }

function AvatarScene({ onReady, ...props }: SceneProps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const readyCb = useCallback(() => onReady(), []);

  return (
    <>
      <ambientLight intensity={0.4} />
      
      <directionalLight
        position={[1.2, 3.0, 2.8]} intensity={1.2}
        color="#fff5ee" castShadow
        shadow-mapSize={[512, 512]}
      />
      <directionalLight position={[-1.8, 1.8, 1.6]} intensity={0.5} color="#e8f0ff" />
      <directionalLight position={[0,    1.2, -2.0]} intensity={0.3} color="#ffddc4" />

      <Suspense fallback={null}>
        <RPMAvatarInner {...props} onReady={readyCb} />
      </Suspense>
    </>
  );
}

/* ─── Public component ────────────────────────────────────────────────────── */
export default function Avatar3D(props: Avatar3DProps) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0d0d0f" }}>
      <Canvas
        camera={{ position: [0, 0.18, 1.38], fov: 26 }}
        shadows
        style={{ width: "100%", height: "100%", background: "transparent", display: "block" }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <AvatarScene {...props} onReady={() => {}} onError={() => {}} />
        </Suspense>
      </Canvas>
    </div>
  );
}
