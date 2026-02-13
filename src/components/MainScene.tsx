"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { WebGLRenderer } from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { MainModel, type HeroModelType } from "./MainModel";
import {
  getModelStateAtScroll,
  type ScrollPoint,
} from "@/config/scrollPoints";

/** Default hero model when not passed via props (e.g. from route). */
const DEFAULT_MAIN_MODEL_PATH = "/models/hitem3d.fbx";
const DEFAULT_MAIN_MODEL_TYPE = "fbx" as HeroModelType;

/** Default model scale and rotation when no scroll points. */
const DEFAULT_SCALE = 800.2;
const DEFAULT_ROTATION: [number, number, number] = [1.7, 3.3, 4.3];

/** Ignore context lost in the first N ms to avoid false positives from Strict Mode / initial mount. */
const CONTEXT_LOST_GRACE_MS = 300;

interface MainSceneProps {
  /** Override model path (e.g. from route). When changed, model fully reloads. */
  modelPath?: string;
  /** Override model type (e.g. from route). */
  modelType?: HeroModelType;
  /** 0–1 scroll progress for scroll-point animations. */
  scrollProgress?: number;
  /** Keyframes for rotation/scale at scroll positions. */
  scrollPoints?: ScrollPoint[];
}

export function MainScene({
  modelPath: modelPathProp,
  modelType: modelTypeProp,
  scrollProgress = 0,
  scrollPoints,
}: MainSceneProps = {}) {
  const modelPath = modelPathProp ?? DEFAULT_MAIN_MODEL_PATH;
  const modelType = modelTypeProp ?? DEFAULT_MAIN_MODEL_TYPE;

  const modelState = useMemo(() => {
    if (scrollPoints && scrollPoints.length > 0) {
      return getModelStateAtScroll(scrollProgress, scrollPoints, {
        rotation: DEFAULT_ROTATION,
        scale: DEFAULT_SCALE,
      });
    }
    return { rotation: DEFAULT_ROTATION, scale: DEFAULT_SCALE };
  }, [scrollProgress, scrollPoints]);

  const isHeavyFormat =
    modelType === "fbx" || modelType === "obj" || modelType === "usdz";

  const [contextLost, setContextLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountedAtRef = useRef<number>(Date.now());
  const handlersRef = useRef<{
    lost: (e: Event) => void;
    restored: () => void;
  } | null>(null);

  const modelKey = `${modelType}-${modelPath}`;
  useEffect(() => {
    setModelLoaded(false);
  }, [modelKey]);

  const onCreated = useCallback(({ gl }: { gl: WebGLRenderer }) => {
    const canvas = gl.domElement;
    canvasRef.current = canvas;
    mountedAtRef.current = Date.now();

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      const elapsed = Date.now() - mountedAtRef.current;
      if (elapsed < CONTEXT_LOST_GRACE_MS) return;
      setContextLost(true);
    };

    const handleContextRestored = () => {
      setContextLost(false);
      setCanvasKey((k) => k + 1);
    };

    handlersRef.current = { lost: handleContextLost, restored: handleContextRestored };
    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);
  }, []);

  useEffect(() => {
    return () => {
      const canvas = canvasRef.current;
      const handlers = handlersRef.current;
      if (canvas && handlers) {
        canvas.removeEventListener("webglcontextlost", handlers.lost);
        canvas.removeEventListener("webglcontextrestored", handlers.restored);
      }
      canvasRef.current = null;
      handlersRef.current = null;
    };
  }, []);

  const glOptions = useMemo(
    () => ({
      antialias: !isHeavyFormat,
      alpha: true,
      powerPreference: "high-performance" as const,
      failIfMajorPerformanceCaveat: false,
    }),
    []
  );

  const handleTryAgain = useCallback(() => {
    setContextLost(false);
    setCanvasKey((k) => k + 1);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full bg-zinc-950">
      {!modelLoaded && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950"
          aria-busy="true"
          aria-label="Loading model"
        >
          <div className="h-6 w-6 rounded-full border-2 border-zinc-600 border-t-zinc-400 animate-spin" />
        </div>
      )}
      <Canvas
        key={canvasKey}
        camera={{
          position: [0, 0, 0.05],
          fov: 45,
          near: 0.001,
          far: 1000,
        }}
        gl={glOptions}
        dpr={isHeavyFormat ? 1 : [1, 2]}
        onCreated={onCreated}
      >
        <color attach="background" args={["#0a0a0a"]} />
        <ambientLight intensity={0.4} color="#ffffff" />
        <ambientLight intensity={0.3} color="#4488ff" />
        {/* <directionalLight position={[0, 10, 5]} intensity={2} color="#ffffff" /> */}
        {/* <directionalLight position={[0, 10, 0]} intensity={2.5} color="#ffffff" /> */}
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#ffffff" />
        {!isHeavyFormat && <Environment preset="city" />}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
        <group position={[0, 0, -0.005]}>
          <MainModel
            key={`${modelType}-${modelPath}`}
            modelPath={modelPath}
            modelType={modelType}
            scale={modelState.scale}
            rotation={modelState.rotation}
            disableEntryAnimation
            mouseTilt={{ maxTilt: 0.08, smoothness: 0.08 }}
            onLoaded={() => setModelLoaded(true)}
          />
        </group>
      </Canvas>

      {contextLost && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-zinc-950 p-6 text-center text-zinc-300"
          aria-live="polite"
        >
          <p className="text-sm font-medium">Display connection lost.</p>
          <p className="text-xs max-w-sm text-zinc-500">
            Large FBX or OBJ files can use too much GPU memory. Try converting the model to GLB
            (smaller and faster), or use a simplified version. Closing other tabs may help.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleTryAgain}
              className="rounded-full border border-zinc-500 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition-opacity hover:opacity-90"
            >
              Reload page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
