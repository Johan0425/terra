// Generates "heavy" and "thin" morph targets for the avatar body, purely
// procedurally — no new 3D assets, no software to install. Uses the mesh's
// EXISTING bone weights (which vertices belong to the torso/hips/thighs vs.
// hands/feet/head) to push vertices outward along their normal for a
// heavier build, or inward for a thinner one, weighted so the belly/hips/
// thighs move the most and extremities barely move at all.
//
// Usage: node scripts/generate-body-morphs.mjs
// Reads:  public/models/character.glb (current, no morph targets)
// Writes: public/models/character.glb (in place, now with 2 morph targets
//         per affected primitive: index 0 = heavy, index 1 = thin)

import { NodeIO, Accessor } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";

const INPUT = "public/models/character.glb";
const OUTPUT = "public/models/character.glb";

// How much each bone influences "girth" — hips/belly move the most, chest
// and thighs a moderate amount, extremities essentially not at all so
// hands/feet/head don't balloon.
const GIRTH_BY_BONE = [
  [/hips/i, 1.0],
  [/spine1$/i, 0.95],
  [/spine2/i, 0.6],
  [/^.*spine$/i, 0.85],
  [/upleg/i, 0.75], // thighs
  [/^(?!.*up).*leg/i, 0.15], // shins — matches "Leg" but not "UpLeg"
  [/shoulder/i, 0.25],
  [/(?<!fore)arm/i, 0.3], // upper arms, not forearms
  [/forearm/i, 0.15],
  [/neck|head|hand|foot|toe/i, 0], // explicitly excluded
];

function girthForBone(name) {
  for (const [pattern, weight] of GIRTH_BY_BONE) {
    if (pattern.test(name)) return weight;
  }
  return 0;
}

// Meshes that should inflate/deflate. Hair and eyelashes are excluded —
// they shouldn't balloon along with the body.
const MORPHABLE_MESHES = new Set([
  "Ch21_Body",
  "Ch21_Shirt",
  "Ch21_Pants",
  "Ch21_Shoes",
]);

const HEAVY_DISPLACEMENT = 0.11; // meters, at max girth weight
const THIN_DISPLACEMENT = -0.05; // meters — less range going thin than heavy

async function main() {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "draco3d.encoder": await draco3d.createEncoderModule(),
    });

  const doc = await io.read(INPUT);
  const root = doc.getRoot();

  for (const mesh of root.listMeshes()) {
    if (!MORPHABLE_MESHES.has(mesh.getName())) continue;

    for (const prim of mesh.listPrimitives()) {
      const posAccessor = prim.getAttribute("POSITION");
      const normalAccessor = prim.getAttribute("NORMAL");
      const jointsAccessor = prim.getAttribute("JOINTS_0");
      const weightsAccessor = prim.getAttribute("WEIGHTS_0");
      const skin = findSkinForPrimitive(root, mesh);
      if (!posAccessor || !normalAccessor || !jointsAccessor || !weightsAccessor || !skin) {
        console.warn(`[skip] ${mesh.getName()}: missing required attributes/skin`);
        continue;
      }

      const jointNames = skin.listJoints().map((j) => j.getName());
      const count = posAccessor.getCount();
      const normals = normalAccessor.getArray();
      const joints = jointsAccessor.getArray();
      const weights = weightsAccessor.getArray();

      const heavyDeltas = new Float32Array(count * 3);
      const thinDeltas = new Float32Array(count * 3);

      for (let v = 0; v < count; v++) {
        let girth = 0;
        for (let j = 0; j < 4; j++) {
          const jointIndex = joints[v * 4 + j];
          const weight = weights[v * 4 + j];
          if (weight <= 0) continue;
          const boneName = jointNames[jointIndex] ?? "";
          girth += weight * girthForBone(boneName);
        }

        const nx = normals[v * 3];
        const ny = normals[v * 3 + 1];
        const nz = normals[v * 3 + 2];

        heavyDeltas[v * 3] = nx * girth * HEAVY_DISPLACEMENT;
        heavyDeltas[v * 3 + 1] = ny * girth * HEAVY_DISPLACEMENT;
        heavyDeltas[v * 3 + 2] = nz * girth * HEAVY_DISPLACEMENT;

        thinDeltas[v * 3] = nx * girth * THIN_DISPLACEMENT;
        thinDeltas[v * 3 + 1] = ny * girth * THIN_DISPLACEMENT;
        thinDeltas[v * 3 + 2] = nz * girth * THIN_DISPLACEMENT;
      }

      const heavyAccessor = doc
        .createAccessor(`${mesh.getName()}_heavy`)
        .setType(Accessor.Type.VEC3)
        .setArray(heavyDeltas);
      const thinAccessor = doc
        .createAccessor(`${mesh.getName()}_thin`)
        .setType(Accessor.Type.VEC3)
        .setArray(thinDeltas);

      const heavyTarget = doc.createPrimitiveTarget("heavy").setAttribute("POSITION", heavyAccessor);
      const thinTarget = doc.createPrimitiveTarget("thin").setAttribute("POSITION", thinAccessor);
      prim.addTarget(heavyTarget);
      prim.addTarget(thinTarget);

      console.log(`[ok] ${mesh.getName()}: ${count} verts, morph targets added`);
    }

    // Name the morph targets on the mesh itself (glTF extras.targetNames is
    // the de facto convention three.js's GLTFLoader reads to populate
    // mesh.morphTargetDictionary).
    mesh.setExtras({ ...mesh.getExtras(), targetNames: ["heavy", "thin"] });
  }

  await io.write(OUTPUT, doc);
  console.log(`Wrote ${OUTPUT}`);
}

function findSkinForPrimitive(root, mesh) {
  for (const node of root.listNodes()) {
    if (node.getMesh() === mesh) return node.getSkin();
  }
  return null;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
