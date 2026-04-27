"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

interface AvatarModelProps {
  isSpeaking: boolean;
}

function FallbackHead({ isSpeaking }: AvatarModelProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Subtle breathing / idle bob
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.04;
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.05;

    if (isSpeaking) {
      // Pulse scale while speaking
      const scale = 1 + Math.sin(t * 8) * 0.03;
      groupRef.current.scale.setScalar(scale);
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.6 + Math.sin(t * 8) * 0.4;
    } else {
      groupRef.current.scale.setScalar(1);
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh ref={glowRef} castShadow>
        <sphereGeometry args={[0.55, 64, 64]} />
        <meshStandardMaterial
          color="#f5cba7"
          roughness={0.6}
          metalness={0.05}
          emissive="#e8a87c"
          emissiveIntensity={0.1}
        />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.57, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3b1f0a" roughness={0.9} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.17, 0.05, 0.5]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial color="#1a0a00" />
      </mesh>
      <mesh position={[0.17, 0.05, 0.5]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial color="#1a0a00" />
      </mesh>
      {/* Nose */}
      <mesh position={[0, -0.1, 0.53]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#e8a87c" roughness={0.8} />
      </mesh>
      {/* Mouth */}
      <mesh position={[0, -0.24, 0.5]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.1, 0.02, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#c0706a" roughness={0.5} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, -0.75, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.4, 32]} />
        <meshStandardMaterial color="#f5cba7" roughness={0.6} />
      </mesh>
      {/* Shoulders */}
      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[1.4, 0.35, 0.6]} />
        <meshStandardMaterial color="#4a6fa5" roughness={0.7} />
      </mesh>
    </group>
  );
}

function GLBModel({ isSpeaking }: AvatarModelProps) {
  const { scene } = useGLTF("/avatar.glb");
  const ref = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.position.y = Math.sin(t * 1.2) * 0.04;
    if (isSpeaking) {
      ref.current.scale.setScalar(1 + Math.sin(t * 8) * 0.025);
    } else {
      ref.current.scale.setScalar(1);
    }
  });

  return <primitive ref={ref} object={scene} />;
}

function AvatarScene({ isSpeaking }: AvatarModelProps) {
  return (
    <Suspense fallback={<FallbackHead isSpeaking={isSpeaking} />}>
      <GLBModel isSpeaking={isSpeaking} />
    </Suspense>
  );
}

interface Avatar3DProps {
  isSpeaking: boolean;
}

export default function Avatar3D({ isSpeaking }: Avatar3DProps) {
  return (
    <div className="relative h-full w-full">
      {isSpeaking && (
        <div className="pointer-events-none absolute inset-0 animate-pulse rounded-2xl ring-2 ring-indigo-400/50" />
      )}
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 3]} intensity={1.2} castShadow />
        <directionalLight position={[-2, 1, -2]} intensity={0.4} color="#b8c8ff" />
        <Environment preset="city" />
        <Suspense fallback={<FallbackHead isSpeaking={isSpeaking} />}>
          <AvatarScene isSpeaking={isSpeaking} />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
}
