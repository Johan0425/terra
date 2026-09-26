"use client";

// Phase 2: the 3D scene shell — GLB loading, orbit camera, three-point lighting,
// reflective floor. No Animation State Machine yet (that's Phase 3); this just
// proves the pipeline end-to-end by playing the model's "Idle" clip.

import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  MeshReflectorMaterial,
  OrbitControls,
} from "@react-three/drei";
import { AvatarModel } from "./AvatarModel";

const NEUTRAL_AURA = "#7c8a9a"; // grey-blue — matches the "idle/neutral" spec state

function ReflectiveFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[24, 24]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={40}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#050505"
        metalness={0.6}
        mirror={0}
      />
    </mesh>
  );
}

/** Key + fill + rim, matching the "premium pedestal" lighting spec. Rim tints with auraColor. */
function ThreePointLighting({ auraColor }: { auraColor: string }) {
  return (
    <>
      <spotLight
        position={[3, 5, 4]}
        angle={0.35}
        penumbra={0.5}
        intensity={40}
        color="#fff4e0"
        castShadow
      />
      <directionalLight position={[-4, 2, 2]} intensity={0.6} color="#8fb4ff" />
      <pointLight position={[0, 2.4, -3]} intensity={25} color={auraColor} />
    </>
  );
}

function Model() {
  const [actions, setActions] = useState<Record<
    string,
    THREE.AnimationAction | null
  > | null>(null);

  useEffect(() => {
    const idle = actions?.Idle;
    idle?.reset().fadeIn(0.3).play();
    return () => {
      idle?.fadeOut(0.3);
    };
  }, [actions]);

  return (
    <AvatarModel
      position={[0, 0, 0]}
      onReady={setActions}
    />
  );
}

function AutoRotate({ idleSeconds = 4 }: { idleSeconds?: number }) {
  const controlsRef = useRef<import("three-stdlib").OrbitControls>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const resetIdleTimer = () => {
    setAutoRotate(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setAutoRotate(true), idleSeconds * 1000);
  };

  useEffect(() => {
    resetIdleTimer();
    return () => clearTimeout(idleTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={0.6}
      onStart={resetIdleTimer}
      onEnd={resetIdleTimer}
      enablePan={false}
      minDistance={2.2}
      maxDistance={6}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 1.8}
      target={[0, 0.8, 0]}
    />
  );
}

function CanvasFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div className="h-10 w-10 animate-pulse rounded-full border-2 border-amber-500/60" />
    </div>
  );
}

export interface AvatarCanvasProps {
  auraColor?: string;
}

export default function AvatarCanvas({
  auraColor = NEUTRAL_AURA,
}: AvatarCanvasProps) {
  return (
    <div className="h-full w-full bg-black">
      <Suspense fallback={<CanvasFallback />}>
        <Canvas
          shadows
          camera={{ position: [0, 1.15, 4.6], fov: 38 }}
          dpr={[1, 1.5]}
        >
          <color attach="background" args={["#050505"]} />
          <fog attach="fog" args={["#050505", 6, 14]} />
          <ThreePointLighting auraColor={auraColor} />
          <Environment preset="city" environmentIntensity={0.15} />
          <Suspense fallback={null}>
            <Model />
          </Suspense>
          <ReflectiveFloor />
          <AutoRotate />
        </Canvas>
      </Suspense>
    </div>
  );
}
