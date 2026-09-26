"use client";

// Generated from public/models/character.glb via:
//   npx gltf-transform optimize assets-src/RobotExpressive.raw.glb public/models/character.glb \
//     --compress draco --flatten false --join false --instance false --simplify false
//   npx gltfjsx public/models/character.glb --types --keepnames
//
// Model: "RobotExpressive" by Tomás Laulhé (CC0 1.0), modifications by Don McCurdy.
// This is Phase 2's placeholder rig — bone-parented body meshes + two skinned hands,
// with 14 named AnimationClips (see ActionName below).
//
// TODO: Johan — swap this for your own branded humanoid later. Export a Mixamo
// character with clips renamed to match AnimationStateMachine.tsx's mapping
// (Idle / Running / Sitting / Dance, or rename the mapping itself), run it through
// the same gltf-transform + gltfjsx pipeline above, and drop it in at the same path.

import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import type { JSX } from "react";
import { useGraph } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import type { GLTF } from "three-stdlib";

export type ActionName =
  | "Dance"
  | "Death"
  | "Idle"
  | "Jump"
  | "No"
  | "Punch"
  | "Running"
  | "Sitting"
  | "Standing"
  | "ThumbsUp"
  | "Walking"
  | "WalkJump"
  | "Wave"
  | "Yes";

interface GLTFAction extends THREE.AnimationClip {
  name: ActionName;
}

type GLTFResult = GLTF & {
  nodes: {
    FootL_1: THREE.Mesh;
    LowerLegL_1: THREE.Mesh;
    LegL: THREE.Mesh;
    LowerLegR_1: THREE.Mesh;
    LegR: THREE.Mesh;
    Head_2: THREE.Mesh;
    Head_3: THREE.Mesh;
    Head_4: THREE.Mesh;
    ArmL: THREE.Mesh;
    ShoulderL_1: THREE.Mesh;
    ArmR: THREE.Mesh;
    ShoulderR_1: THREE.Mesh;
    Torso_2: THREE.Mesh;
    Torso_3: THREE.Mesh;
    FootR_1: THREE.Mesh;
    HandR_1: THREE.SkinnedMesh;
    HandR_2: THREE.SkinnedMesh;
    HandL_1: THREE.SkinnedMesh;
    HandL_2: THREE.SkinnedMesh;
    Bone: THREE.Bone;
  };
  materials: {
    Grey: THREE.MeshStandardMaterial;
    Main: THREE.MeshStandardMaterial;
    Black: THREE.MeshStandardMaterial;
  };
  animations: GLTFAction[];
};

export const AVATAR_MODEL_PATH = "/models/character.glb";

// The source GLB's node transforms bake in a x100 bone-space scale. Per
// `gltf-transform inspect`, the authored scene bbox is [-3.31,-0.02,-1.27] to
// [3.31,4.44,1.42] — a raw height of ~4.46. This correction (0.4) brings the
// standing figure to a real-world ~1.8m tall, feet at y≈0, centered at
// x/z≈0, so the camera/lighting/floor constants in AvatarCanvas.tsx can
// assume real-world scale. Recompute if the placeholder model is swapped.
const AVATAR_SCALE_CORRECTION = 0.4;

/** Exposes `actions` (AnimationAction map) via onReady for the state machine to drive. */
export function AvatarModel(
  props: JSX.IntrinsicElements["group"] & {
    onReady?: (actions: Record<string, THREE.AnimationAction | null>) => void;
  },
) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(
    AVATAR_MODEL_PATH,
  ) as unknown as GLTFResult;
  // useGLTF caches/returns a stable `scene` per URL, so memoizing on it is
  // enough to clone exactly once per mount (SkeletonUtils.clone is not free).
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone) as unknown as GLTFResult;
  const { actions } = useAnimations(animations, group);

  const { onReady, ...groupProps } = props;

  useEffect(() => {
    onReady?.(actions);
  }, [actions, onReady]);

  return (
    <group {...groupProps} dispose={null}>
      <group ref={group} scale={AVATAR_SCALE_CORRECTION}>
        <group name="Root_Scene">
          <group name="RootNode">
            <group
              name="RobotArmature"
              rotation={[-Math.PI / 2, 0, 0]}
              scale={100}
            >
              <primitive object={nodes.Bone} />
            </group>
            <group
              name="HandR"
              position={[-0.003, 2.37, -0.021]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={100}
            >
              <skinnedMesh
                name="HandR_1"
                geometry={nodes.HandR_1.geometry}
                material={materials.Main}
                skeleton={nodes.HandR_1.skeleton}
              />
              <skinnedMesh
                name="HandR_2"
                geometry={nodes.HandR_2.geometry}
                material={materials.Grey}
                skeleton={nodes.HandR_2.skeleton}
              />
            </group>
            <group
              name="HandL"
              position={[-0.003, 2.37, -0.021]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={100}
            >
              <skinnedMesh
                name="HandL_1"
                geometry={nodes.HandL_1.geometry}
                material={materials.Main}
                skeleton={nodes.HandL_1.skeleton}
              />
              <skinnedMesh
                name="HandL_2"
                geometry={nodes.HandL_2.geometry}
                material={materials.Grey}
                skeleton={nodes.HandL_2.skeleton}
              />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(AVATAR_MODEL_PATH);
