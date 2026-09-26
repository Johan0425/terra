"use client";

// Ambient particle aura around the avatar, driven by energyLevel + moodState.
// Uses a single InstancedMesh (not N separate meshes) so particle count stays
// cheap on mobile GPUs regardless of how many of the MAX_PARTICLES are "active".
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { MoodState } from "@/lib/types";

const MAX_PARTICLES = 160;

interface Particle {
  angle: number;
  radius: number;
  height: number;
  speed: number;
  phase: number;
}

export interface ParticleAuraProps {
  auraColor: string;
  energyLevel: number; // 0-100
  moodState: MoodState;
}

export function ParticleAura({
  auraColor,
  energyLevel,
  moodState,
}: ParticleAuraProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(auraColor), [auraColor]);

  // Randomized per-particle layout is generated in an effect (not during
  // render) — Math.random is an impure function React's render phase must
  // not call. The array is then only ever mutated inside useFrame, which
  // runs in Three's render loop, outside React's render cycle entirely.
  const particlesRef = useRef<Particle[]>([]);
  useEffect(() => {
    particlesRef.current = Array.from({ length: MAX_PARTICLES }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.5 + Math.random() * 0.7,
      height: Math.random() * 1.9,
      speed: 0.15 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  // energyLevel scales both how many particles are visible and how fast they move.
  const activeCount = Math.max(
    12,
    Math.round((energyLevel / 100) * MAX_PARTICLES),
  );

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const particles = particlesRef.current;
    if (!mesh || particles.length === 0) return;

    const t = state.clock.elapsedTime;
    const drift =
      moodState === "energized" || moodState === "leveling-up"
        ? 1 // rise
        : moodState === "fatigued"
          ? -0.4 // fall, slower
          : 0.15; // neutral: gentle ambient rise

    const speedMul = moodState === "leveling-up" ? 2.4 : 1;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = particles[i];
      if (i >= activeCount) {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      p.height += drift * p.speed * speedMul * delta;
      // wrap around once a particle drifts past the top (or below the floor when fatigued)
      if (p.height > 2.1) p.height = 0;
      if (p.height < -0.1) p.height = 2.0;

      const wobble = Math.sin(t * p.speed * 2 + p.phase) * 0.08;
      const angle = p.angle + t * 0.12 * speedMul;
      const radius = p.radius + wobble;

      dummy.position.set(
        Math.cos(angle) * radius,
        p.height,
        Math.sin(angle) * radius,
      );
      const scale = 0.02 + (1 - Math.abs(wobble) * 2) * 0.015;
      dummy.scale.setScalar(Math.max(0.012, scale));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_PARTICLES]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.75}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
