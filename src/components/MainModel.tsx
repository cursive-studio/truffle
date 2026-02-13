"use client";

import { useRef, Suspense, useLayoutEffect, useMemo, useEffect } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useGLTF, useFBX } from "@react-three/drei";
import * as THREE from "three";
import type { Group } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { USDLoader } from "three/examples/jsm/loaders/USDLoader.js";

/** Creates a silver matcap texture via canvas (sphere gradient). */
function createSilverMatcapTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const center = size / 2;
  const radius = center - 2;
  const gradient = ctx.createRadialGradient(
    center - radius * 0.4,
    center - radius * 0.4,
    0,
    center,
    center,
    radius * 1.2
  );
  gradient.addColorStop(0, "#e8e8e8");
  gradient.addColorStop(0.4, "#a0a0a0");
  gradient.addColorStop(0.7, "#606060");
  gradient.addColorStop(1, "#383838");
  ctx.fillStyle = "#505050";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSilverMatcapMaterial(): THREE.MeshMatcapMaterial {
  const matcap = createSilverMatcapTexture();
  return new THREE.MeshMatcapMaterial({
    matcap,
    wireframe: true,
    side: THREE.DoubleSide,
  });
}

function applyModelMaterial(
  root: THREE.Object3D,
  material: THREE.Material
) {
  root.traverse((node) => {
    if (node instanceof THREE.Mesh && node.isMesh) {
      node.material = material;
    }
  });
}

export type HeroModelType = "glb" | "obj" | "fbx" | "usdz";

const DEFAULT_MODEL_PATH = "/models/ttrr_2.fbx";
const DEFAULT_MODEL_TYPE: HeroModelType = "fbx";

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
  /** Called when the model has finished loading. */
  /** X rotation in radians, e.g. from scroll progress. */
  scrollRotationX?: number;
  /** If true, skip the scale/rotation entry animation and show at final state. */
  disableEntryAnimation?: boolean;
  /** Mouse-follow tilt. Omit or pass null to disable. */
  mouseTilt?: MouseTiltConfig | null;
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
  onLoaded,
}: MainModelProps) {
  const groupRef = useRef<Group>(null);
  const matcapMaterial = useMemo(() => createSilverMatcapMaterial(), []);
  const entryElapsed = useRef(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const currentTilt = useRef({ x: 0, y: 0 });

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
  }, [modelPath, modelType]);

  useEffect(() => {
    return () => clearLoaderCache(modelType, modelPath);
  }, [modelType, modelPath]);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    applyModelMaterial(group, matcapMaterial);
  }, [matcapMaterial, modelPath, modelType]);

  useEffect(() => {
    return () => {
      matcapMaterial.dispose();
      matcapMaterial.matcap?.dispose();
    };
  }, [matcapMaterial]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

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

    group.position.set(position[0], position[1], position[2]);

    if (disableEntryAnimation) {
      group.scale.setScalar(1);
      group.rotation.x = rotation[0] + scrollRotationX + tiltX;
      group.rotation.y = rotation[1] + scrollRotationY + tiltY;
      group.rotation.z = rotation[2] + scrollRotationZ;
    } else {
      entryElapsed.current += delta;
      const t = Math.min(1, entryElapsed.current / ENTRY_DURATION);
      const eased = easeOutCubic(t);

      if (t < 1) {
        group.scale.setScalar(eased);
        group.rotation.x = rotation[0] * eased + scrollRotationX + tiltX;
        group.rotation.y = rotation[1] * eased + tiltY;
        group.rotation.z = rotation[2] * eased;
      } else {
        group.scale.setScalar(1);
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
