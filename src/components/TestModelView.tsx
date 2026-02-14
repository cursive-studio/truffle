"use client";

import { useRef, Suspense, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Group } from "three";

/** Frosted translucent polycarbonate — light cool grey, matte, edge glow. */
function createGlossyTranslucentMaterial(
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

interface TestModelViewProps {
  modelPath?: string;
  shellColor?: string;
  scale?: number;
}

function TestModelInner({
  modelPath = "/models/truffleOS_machine_v4-compressed.glb",
  shellColor = "#88ccff",
  scale = 200,
}: TestModelViewProps) {
  const groupRef = useRef<Group>(null);
  const shellMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const appliedRef = useRef(false);

  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  if (!shellMaterialRef.current) {
    shellMaterialRef.current = createGlossyTranslucentMaterial(shellColor);
  }
  const shellMaterial = shellMaterialRef.current;

  useFrame(() => {
    const group = groupRef.current;
    if (!group || appliedRef.current) return;

    let meshCount = 0;
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.isMesh) meshCount++;
    });
    if (meshCount === 0) return;

    // Apply glossy shell to outer meshes
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.isMesh) {
        obj.material = shellMaterial;
      }
    });

    appliedRef.current = true;
  });

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

export function TestModelView(props: TestModelViewProps) {
  return (
    <Suspense fallback={null}>
      <TestModelInner {...props} />
    </Suspense>
  );
}
