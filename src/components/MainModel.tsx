"use client";

import { useRef, Suspense, useEffect, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useGLTF, useFBX } from "@react-three/drei";
import * as THREE from "three";
import type { Group } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { USDLoader } from "three/examples/jsm/loaders/USDLoader.js";
import {
  createTruffleMaterial,
  applyTruffleMaterialToMesh,
} from "@/lib/trufflePreset";

export type HeroModelType = "glb" | "obj" | "fbx" | "usdz";

const DEFAULT_MODEL_PATH = "/models/truffleOS_machine_v4-compressed.glb";
const DEFAULT_MODEL_TYPE: HeroModelType = "glb";

function clearLoaderCache(type: HeroModelType, path: string) {
  try {
    if (type === "glb") useGLTF.clear(path);
    else if (type === "fbx") useFBX.clear(path);
    else if (type === "obj") useLoader.clear(OBJLoader, path);
    else if (type === "usdz") useLoader.clear(USDLoader, path);
  } catch {
    // ignore
  }
}

const ENTRY_DURATION = 1.2;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Config for mouse-follow tilt effect. */
export interface MouseTiltConfig {
  /** Max tilt in radians (e.g. 0.08 for subtle, 0.15 for more pronounced). */
  maxTilt?: number;
  /** Lerp factor 0–1; lower = smoother/slower follow (e.g. 0.08). */
  smoothness?: number;
}

interface MainModelProps {
  /** Path to the model (e.g. /models/truffle.glb or /models/hero.obj) */
  modelPath?: string;
  /** "glb", "obj", "fbx", or "usdz" */
  modelType?: HeroModelType;
  scale?: number;
  rotation?: [number, number, number];
  /** Model position [x, y, z], e.g. from scroll progress. */
  position?: [number, number, number];
  /** Y rotation in radians, e.g. from scroll progress. */
  scrollRotationY?: number;
  /** Z rotation in radians, e.g. from scroll progress. */
  scrollRotationZ?: number;
  /** X rotation in radians, e.g. from scroll progress. */
  scrollRotationX?: number;
  /** If true, skip the scale/rotation entry animation and show at final state. */
  disableEntryAnimation?: boolean;
  /** Mouse-follow tilt. Omit or pass null to disable. */
  mouseTilt?: MouseTiltConfig | null;
  /** 0–1 intensity for emissive pulse effect (e.g. from scroll). When > 0, mesh glows from within. */
  pulseIntensity?: number;
  onLoaded?: () => void;
}

function GlbModel({ path, scale = 1 }: { path: string; scale?: number }) {
  const { scene } = useGLTF(path);
  return <primitive object={scene} scale={scale} />;
}

function ObjModel({ path, scale = 1 }: { path: string; scale?: number }) {
  const obj = useLoader(OBJLoader, path);
  return <primitive object={obj} scale={scale} />;
}

function FbxModel({ path, scale = 1 }: { path: string; scale?: number }) {
  const fbx = useFBX(path);
  return <primitive object={fbx} scale={scale} />;
}

function UsdzModel({ path, scale = 1 }: { path: string; scale?: number }) {
  const group = useLoader(USDLoader, path);
  return <primitive object={group} scale={scale} />;
}

/** No visible mesh while the model loads. */
function ModelFallback() {
  return <group />;
}

const DEFAULT_MOUSE_TILT: Required<MouseTiltConfig> = {
  maxTilt: 0.08,
  smoothness: 0.08,
};

function MainModelInner({
  modelPath = DEFAULT_MODEL_PATH,
  modelType = DEFAULT_MODEL_TYPE,
  scale = 1,
  rotation = [0, 0, 0],
  position = [0, 0, 0],
  scrollRotationY = 0,
  scrollRotationZ = 0,
  scrollRotationX = 0,
  disableEntryAnimation = false,
  mouseTilt,
  pulseIntensity = 0,
  onLoaded,
}: MainModelProps) {
  const groupRef = useRef<Group>(null);
  const timeRef = useRef(0);
  const bounceTimeRef = useRef(0);
  const materialAppliedRef = useRef(false);
  const entryElapsed = useRef(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const currentTilt = useRef({ x: 0, y: 0 });

  const truffleMaterial = useMemo(() => {
    const mat = createTruffleMaterial();
    mat.emissive = new THREE.Color(0x000000);
    mat.emissiveIntensity = 0;
    return mat;
  }, []);

  const tiltConfig = mouseTilt
    ? { ...DEFAULT_MOUSE_TILT, ...mouseTilt }
    : null;

  useEffect(() => {
    if (!tiltConfig) return;
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = 1 - (e.clientY / window.innerHeight) * 2;
      mousePos.current = { x, y };
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [!!mouseTilt]);

  useEffect(() => {
    onLoaded?.();
  }, [onLoaded]);

  useEffect(() => {
    entryElapsed.current = 0;
    materialAppliedRef.current = false;
  }, [modelPath, modelType]);

  useEffect(() => {
    return () => clearLoaderCache(modelType, modelPath);
  }, [modelType, modelPath]);

  // Dispose material on unmount
  useEffect(() => {
    return () => { truffleMaterial.dispose(); };
  }, [truffleMaterial]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Apply material to meshes every frame until successful.
    // This handles async model loading, Strict Mode double-mounts, and key-based remounts.
    if (!materialAppliedRef.current) {
      let meshCount = 0;
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.isMesh) meshCount++;
      });
      if (meshCount > 0) {
        applyTruffleMaterialToMesh(group, truffleMaterial);
        materialAppliedRef.current = true;
      }
    }

    bounceTimeRef.current += delta;
    const bt = bounceTimeRef.current;
    const bounceY = 0.003 * Math.sin(bt * 0.1);
    const bounceScale = 1 + 0.004 * Math.sin(bt * 1.8 + 0.3);

    // Pulse emissive glow
    if (pulseIntensity > 0) {
      timeRef.current += delta;
      const t = timeRef.current;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.5);
      truffleMaterial.emissive.setHex(0xaaddff);
      truffleMaterial.emissiveIntensity = pulseIntensity * (0.3 + pulse * 0.6);
    } else {
      truffleMaterial.emissiveIntensity = 0;
    }

    if (tiltConfig) {
      const { maxTilt, smoothness } = tiltConfig;
      const targetX = mousePos.current.y * maxTilt;
      const targetY = mousePos.current.x * maxTilt;
      const lerp = 1 - Math.exp(-smoothness * 60 * delta);
      currentTilt.current.x += (targetX - currentTilt.current.x) * lerp;
      currentTilt.current.y += (targetY - currentTilt.current.y) * lerp;
    } else {
      currentTilt.current.x = 0;
      currentTilt.current.y = 0;
    }

    const tiltX = currentTilt.current.x;
    const tiltY = currentTilt.current.y;

    group.position.set(position[0], position[1] + bounceY, position[2]);

    if (disableEntryAnimation) {
      group.scale.setScalar(bounceScale);
      group.rotation.x = rotation[0] + scrollRotationX + tiltX;
      group.rotation.y = rotation[1] + scrollRotationY + tiltY;
      group.rotation.z = rotation[2] + scrollRotationZ;
    } else {
      entryElapsed.current += delta;
      const t = Math.min(1, entryElapsed.current / ENTRY_DURATION);
      const eased = easeOutCubic(t);

      if (t < 1) {
        group.scale.setScalar(eased * bounceScale);
        group.rotation.x = rotation[0] * eased + scrollRotationX + tiltX;
        group.rotation.y = rotation[1] * eased + tiltY;
        group.rotation.z = rotation[2] * eased;
      } else {
        group.scale.setScalar(bounceScale);
        group.rotation.x = rotation[0] + scrollRotationX + tiltX;
        group.rotation.y = rotation[1] + scrollRotationY + tiltY;
        group.rotation.z = rotation[2] + scrollRotationZ;
      }
    }
  });

  const modelKey = `${modelType}-${modelPath}`;

  const model =
    modelType === "obj" ? (
      <ObjModel key={modelKey} path={modelPath} scale={scale} />
    ) : modelType === "fbx" ? (
      <FbxModel key={modelKey} path={modelPath} scale={scale} />
    ) : modelType === "usdz" ? (
      <UsdzModel key={modelKey} path={modelPath} scale={scale} />
    ) : (
      <GlbModel key={modelKey} path={modelPath} scale={scale} />
    );

  return <group ref={groupRef}>{model}</group>;
}

export function MainModel(props: MainModelProps) {
  return (
    <Suspense fallback={<ModelFallback />}>
      <MainModelInner {...props} />
    </Suspense>
  );
}

useGLTF.preload(DEFAULT_MODEL_PATH);
