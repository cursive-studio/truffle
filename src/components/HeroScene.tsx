"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { WebGLRenderer } from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { HeroModel, type HeroModelType } from "./HeroModel";

/** Default hero model when not passed via props (e.g. from route). */
const DEFAULT_HERO_MODEL_PATH = "/models/hitem3d.fbx";
const DEFAULT_HERO_MODEL_TYPE = "fbx" as HeroModelType;
const HERO_SCALE = 1;

/** Initial rotation in radians [x, y, z]. Scroll adds to Y. Example: [0, Math.PI / 4, 0] = 45° around Y. */
const HERO_INITIAL_ROTATION: [number, number, number] = [2.3, 3.6, 4.1];

/** One full rotation (2*PI) per full scroll range. */
const SCROLL_ROTATION_RADIANS = 2 * Math.PI;

interface HeroSceneProps {
  scrollProgress?: number;
  /** Override model path (e.g. from route). When changed, model fully reloads. */
  modelPath?: string;
  /** Override model type (e.g. from route). */
  modelType?: HeroModelType;
}

export function HeroScene({
  scrollProgress = 0,
  modelPath: modelPathProp,
  modelType: modelTypeProp,
}: HeroSceneProps = {}) {
  const modelPath = modelPathProp ?? DEFAULT_HERO_MODEL_PATH;
  const modelType = modelTypeProp ?? DEFAULT_HERO_MODEL_TYPE;

  const isHeavyFormat =
    modelType === "fbx" || modelType === "obj" || modelType === "usdz";

  const [contextLost, setContextLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);

  const modelKey = `${modelType}-${modelPath}`;
  useEffect(() => {
    setModelLoaded(false);
  }, [modelKey]);
  const scrollRotationY = scrollProgress * SCROLL_ROTATION_RADIANS;
  const scrollRotationZ = scrollProgress * SCROLL_ROTATION_RADIANS;
  const scrollRotationX = scrollProgress * SCROLL_ROTATION_RADIANS;

  const onCreated = useCallback(({ gl }: { gl: WebGLRenderer }) => {
    const canvas = gl.domElement;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };

    const handleContextRestored = () => {
      setContextLost(false);
    };

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
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
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={glOptions}
        dpr={isHeavyFormat ? 1 : [1, 2]}
        onCreated={onCreated}
      >
        <color attach="background" args={["#0a0a0a"]} />
        <ambientLight intensity={0.4} color="#ffffff" />
        <ambientLight intensity={0.3} color="#4488ff" />
        <directionalLight position={[0, 10, 5]} intensity={2} color="#ffffff" />
        <directionalLight position={[0, 10, 0]} intensity={2.5} color="#ffffff" />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#ffffff" />
        {!isHeavyFormat && <Environment preset="city" />}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
        <group>
          <HeroModel
            key={`${modelType}-${modelPath}`}
            modelPath={modelPath}
            modelType={modelType}
            scale={HERO_SCALE}
            rotation={HERO_INITIAL_ROTATION}
            scrollRotationY={scrollRotationY}
            scrollRotationZ={scrollRotationZ}
            scrollRotationX={scrollRotationX}
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
