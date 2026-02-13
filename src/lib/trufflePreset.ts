/**
 * TRUFFLE_PRESET (Three.js)
 * - Silver/metallic satin finish
 * - Uses MeshStandardMaterial (GPU-friendly, no transmission or env map needed)
 * - Designed to look good with directional + ambient lights only
 */

import * as THREE from "three";

/** Creates the silver metallic material synchronously. */
export function createTruffleMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color("#c0c0c0"),
    metalness: 0.4,
    roughness: 0.45,
  });
}

/** Applies material to all meshes in a subtree. */
export function applyTruffleMaterialToMesh(
  root: THREE.Object3D,
  material: THREE.MeshStandardMaterial,
) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.isMesh) {
      obj.material = material;
    }
  });
}
