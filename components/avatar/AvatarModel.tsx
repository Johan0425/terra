"use client";

// Generated from public/models/character.glb via:
//   node_modules/fbx2gltf/bin/Darwin/FBX2glTF -i assets-src/mixamo/tpose.fbx \
//     -o assets-src/mixamo-converted/tpose.glb --binary
//   npx gltf-transform optimize assets-src/mixamo-converted/tpose.glb public/models/character.glb \
//     --compress draco --texture-compress webp --texture-size 1024 --simplify false
//   npx gltfjsx public/models/character.glb --types --keepnames
//
// Model: a Mixamo character ("Ch21"), exported as a static T-pose — this is
// a placeholder body swap-in, not the final animated rig. Unlike Phase 2's
// RobotExpressive placeholder, this one is *properly* skinned (JOINTS_0/
// WEIGHTS_0 per vertex, standard glTF skinning) and already sits at
// real-world meter scale (~1.76m tall) — no bone-space scale correction
// needed, and no bone-parented-rigid-mesh weirdness to work around.
//
// TODO: Johan — the T-pose has no real animation clips (just a junk
// zero-duration "mixamo.com" entry), so AnimationStateMachine's clip lookups
// all miss and the avatar just holds the T-pose for now — expected, not a
// bug. Once you've downloaded Idle/Running/Sitting/Dance-equivalent clips
// from Mixamo for this same character, they'll need combining into one GLB
// with each clip *renamed* to match CLIP_FOR_STATE in
// AnimationStateMachine.tsx (Mixamo exports every clip as "mixamo.com"
// regardless of which animation you picked — rename during the
// FBX->GLB step, e.g. via gltf-transform's scripting API or Blender).
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import type { JSX } from "react";
import { useFrame, useGraph, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import type { GLTF } from "three-stdlib";

// Loose on purpose: this model currently ships no named clips worth typing
// strictly. Tighten back to a literal union once real clips are combined in.
export type ActionName = string;

interface GLTFAction extends THREE.AnimationClip {
  name: ActionName;
}

type GLTFResult = GLTF & {
  nodes: {
    Ch21_Pants: THREE.SkinnedMesh;
    Ch21_Shirt: THREE.SkinnedMesh;
    Ch21_Body: THREE.SkinnedMesh;
    Ch21_Shoes: THREE.SkinnedMesh;
    Ch21_Eyelasshes: THREE.SkinnedMesh;
    Ch21_Hair: THREE.SkinnedMesh;
    mixamorigHips: THREE.Bone;
  };
  materials: {
    Ch21_body: THREE.MeshStandardMaterial;
    Ch21_hair: THREE.MeshStandardMaterial;
  };
  animations: GLTFAction[];
};

export const AVATAR_MODEL_PATH = "/models/character.glb";

/** ~real-world meters the face card should span, regardless of the rig's own scale. */
const FACE_CARD_WORLD_SIZE = 0.15;

/** Exposes `actions` (AnimationAction map) via onReady for the state machine to drive. */
export function AvatarModel(
  props: JSX.IntrinsicElements["group"] & {
    onReady?: (actions: Record<string, THREE.AnimationAction | null>) => void;
    /** Same-origin URL serving the user's cropped face photo (see /api/avatar-photo/photo). */
    facePhotoUrl?: string;
    /**
     * -1 (thinnest) to 1 (heaviest), 0 = as-authored. Drives the "heavy"/
     * "thin" morph targets baked in by scripts/generate-body-morphs.mjs —
     * procedural, no new 3D assets, reusing this mesh's own bone weights to
     * decide how much each vertex should move.
     */
    bodyWeight?: number;
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

  const { onReady, facePhotoUrl, bodyWeight = 0, ...groupProps } = props;
  const { scene: r3fScene, camera } = useThree();
  const faceCardRef = useRef<THREE.Mesh | null>(null);
  const headBoneRef = useRef<THREE.Object3D | null>(null);

  // Plain object refs (not ref-callback functions) — React populates these
  // itself during commit, so there's no closure here reading/writing
  // `.current` during render for the linter's purity rules to trip on.
  const pantsMeshRef = useRef<THREE.SkinnedMesh>(null);
  const shirtMeshRef = useRef<THREE.SkinnedMesh>(null);
  const bodyMeshRef = useRef<THREE.SkinnedMesh>(null);
  const shoesMeshRef = useRef<THREE.SkinnedMesh>(null);

  useEffect(() => {
    const meshes = [
      pantsMeshRef.current,
      shirtMeshRef.current,
      bodyMeshRef.current,
      shoesMeshRef.current,
    ];
    for (const mesh of meshes) {
      if (!mesh) continue;
      // R3F assigns `geometry` as a plain prop after construction, so the
      // constructor-time `updateMorphTargets()` call that normally builds
      // `morphTargetInfluences`/`morphTargetDictionary` from
      // geometry.morphAttributes never runs — without this, the renderer
      // finds geometry.morphAttributes present but the mesh's own influences
      // array undefined, and throws reading `.length` on it every frame.
      mesh.updateMorphTargets();
      const dict = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;
      if (!dict || !influences) continue;
      if (dict.heavy !== undefined) influences[dict.heavy] = Math.max(0, bodyWeight);
      if (dict.thin !== undefined) influences[dict.thin] = Math.max(0, -bodyWeight);
    }
  }, [bodyWeight]);

  useEffect(() => {
    onReady?.(actions);
  }, [actions, onReady]);

  // Attaches the user's face photo as a small unlit card tracking whatever
  // bone is named "Head" (case-insensitive substring match) — matches this
  // rig's "mixamorig:Head" and would match a differently-sourced Mixamo
  // character just the same.
  //
  // The card is added directly to the R3F scene root (not as a child of the
  // bone) and repositioned every frame from the bone's *world* matrix in
  // useFrame below, rather than parented with a local-space offset — see the
  // git history on this file for why (short version: it's the only part of
  // this file's geometry math that survives a model swap unchanged, and the
  // previous placeholder's bone-space scale made local offsets brittle).
  useEffect(() => {
    if (!facePhotoUrl || !group.current) return;

    let headBone: THREE.Object3D | undefined;
    group.current.traverse((obj) => {
      if (!headBone && /head/i.test(obj.name)) {
        headBone = obj;
      }
    });
    if (!headBone) return;
    headBoneRef.current = headBone;

    let cancelled = false;

    new THREE.TextureLoader().load(
      facePhotoUrl,
      (texture) => {
        if (cancelled) return;
        texture.colorSpace = THREE.SRGBColorSpace;

        const card = new THREE.Mesh(
          new THREE.PlaneGeometry(FACE_CARD_WORLD_SIZE, FACE_CARD_WORLD_SIZE),
          new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            toneMapped: false,
            side: THREE.DoubleSide,
            // Always renders on top rather than fighting the mesh for depth
            // — reasonable for what's essentially an identity/nameplate
            // overlay, not a seamlessly-integrated part of the face.
            depthTest: false,
          }),
        );
        card.name = "FaceCard";
        card.renderOrder = 999; // draw after the particle aura and body geometry
        r3fScene.add(card);
        faceCardRef.current = card;
      },
      undefined,
      (err) => console.warn("[AvatarModel] face texture failed to load:", err),
    );

    return () => {
      cancelled = true;
      headBoneRef.current = null;
      const card = faceCardRef.current;
      if (card) {
        r3fScene.remove(card);
        card.geometry.dispose();
        (card.material as THREE.Material).dispose();
        faceCardRef.current = null;
      }
    };
  }, [facePhotoUrl, r3fScene]);

  const faceCardWorldPos = useMemo(() => new THREE.Vector3(), []);
  const faceCardWorldQuat = useMemo(() => new THREE.Quaternion(), []);
  const faceCardScale = useMemo(() => new THREE.Vector3(), []);
  const faceCardForward = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const card = faceCardRef.current;
    const bone = headBoneRef.current;
    if (!card || !bone) return;

    bone.updateWorldMatrix(true, false);
    bone.matrixWorld.decompose(faceCardWorldPos, faceCardWorldQuat, faceCardScale);

    // Billboards toward the camera rather than inheriting the head bone's
    // rotation, so the card stays readable as OrbitControls/AutoRotate swing
    // the camera around instead of ever going edge-on.
    faceCardForward
      .copy(camera.position)
      .sub(faceCardWorldPos)
      .normalize()
      .multiplyScalar(0.12);
    card.position.copy(faceCardWorldPos).add(faceCardForward);
    card.quaternion.copy(camera.quaternion);
  });

  return (
    <group {...groupProps} dispose={null}>
      <group ref={group}>
        <group name="Root_Scene">
          <group name="RootNode">
            <primitive object={nodes.mixamorigHips} />
          </group>
          <skinnedMesh
            ref={pantsMeshRef}
            name="Ch21_Pants"
            geometry={nodes.Ch21_Pants.geometry}
            material={materials.Ch21_body}
            skeleton={nodes.Ch21_Pants.skeleton}
          />
          <skinnedMesh
            ref={shirtMeshRef}
            name="Ch21_Shirt"
            geometry={nodes.Ch21_Shirt.geometry}
            material={materials.Ch21_body}
            skeleton={nodes.Ch21_Shirt.skeleton}
          />
          <skinnedMesh
            ref={bodyMeshRef}
            name="Ch21_Body"
            geometry={nodes.Ch21_Body.geometry}
            material={materials.Ch21_body}
            skeleton={nodes.Ch21_Body.skeleton}
          />
          <skinnedMesh
            ref={shoesMeshRef}
            name="Ch21_Shoes"
            geometry={nodes.Ch21_Shoes.geometry}
            material={materials.Ch21_body}
            skeleton={nodes.Ch21_Shoes.skeleton}
          />
          <skinnedMesh
            name="Ch21_Eyelasshes"
            geometry={nodes.Ch21_Eyelasshes.geometry}
            material={materials.Ch21_hair}
            skeleton={nodes.Ch21_Eyelasshes.skeleton}
          />
          <skinnedMesh
            name="Ch21_Hair"
            geometry={nodes.Ch21_Hair.geometry}
            material={materials.Ch21_hair}
            skeleton={nodes.Ch21_Hair.skeleton}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(AVATAR_MODEL_PATH);
