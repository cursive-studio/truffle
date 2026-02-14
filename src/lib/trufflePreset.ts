/**
 * TRUFFLE_PRESET (Three.js)
 * - Translucent frosted silver plastic
 * - Glossy translucent polycarbonate (test model look)
 * - Uses MeshPhysicalMaterial with transmission (GPU-friendly)
 */

import * as THREE from "three";

/** Frosted translucent polycarbonate — light cool grey, matte, edge glow (matches TestModelView). */
export function createGlossyTranslucentMaterial(
  color: string = "#dce4ec",
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    metalness: 0,
    roughness: 0.55,
    transmission: 0.68,
    thickness: 2,
    ior: 1.45,
    attenuationColor: new THREE.Color("#ffffff"),
    attenuationDistance: 0.5,
  });
}

let sharedGlossyMaterial: THREE.MeshPhysicalMaterial | null = null;
let sharedWireframeMaterial: THREE.MeshBasicMaterial | null = null;

export function getSharedGlossyMaterial(): THREE.MeshPhysicalMaterial {
  if (!sharedGlossyMaterial) {
    sharedGlossyMaterial = createGlossyTranslucentMaterial();
  }
  return sharedGlossyMaterial;
}

/** Wireframe material for x-ray effect — bypasses transmission so wireframe is visible. */
export function getSharedWireframeMaterial(): THREE.MeshBasicMaterial {
  if (!sharedWireframeMaterial) {
    sharedWireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xe8ecf0,
      wireframe: true,
      transparent: true,
      opacity: 0.95,
    });
  }
  return sharedWireframeMaterial;
}

/** Creates the translucent frosted silver material. */
export function createTruffleMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#d0d0d8"),
    metalness: 0.5,
    roughness: 0.55,
    envMapIntensity: 1.2,
    emissive: new THREE.Color("#4466aa"),
    emissiveIntensity: 0.15,
    // Translucent frosted effect — kept low to avoid GPU context loss
    transmission: 0.55,
    thickness: 0.7,
    ior: 1.45,
    attenuationColor: new THREE.Color("#ffffff"),
    attenuationDistance: 1.2,
  });
}

/** Singleton material shared across all mounts — survives Strict Mode unmount/remount. */
let sharedMaterial: THREE.MeshPhysicalMaterial | null = null;

export function getSharedTruffleMaterial(): THREE.MeshPhysicalMaterial {
  if (!sharedMaterial) {
    sharedMaterial = createTruffleMaterial();
  }
  return sharedMaterial;
}

/** Applies material to all meshes in a subtree. */
export function applyTruffleMaterialToMesh(
  root: THREE.Object3D,
  material: THREE.MeshPhysicalMaterial,
) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.isMesh) {
      obj.material = material;
    }
  });
}

/** Applies any material to all meshes (e.g. wireframe for x-ray). */
export function applyMaterialToMesh(
  root: THREE.Object3D,
  material: THREE.Material,
) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.isMesh) {
      obj.material = material;
    }
  });
}
