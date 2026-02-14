"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { TestModelView } from "./TestModelView";

/**
 * Test scene: glossy translucent shell + visible internals + studio rim lighting + pure black background.
 * Use this to experiment with the reference look before applying to MainScene.
 */
export function TestModelScene() {
  return (
    <div className="absolute inset-0 w-full h-full bg-black">
      <Canvas
        camera={{
          position: [0, 0, 0.12],
          fov: 45,
          near: 0.001,
          far: 1000,
        }}
        gl={{ antialias: true, alpha: true }}
        dpr={1}
      >
        <color attach="background" args={["#0a0a0f"]} />
        {/* Studio rim lighting — edge glow, soft fill */}
        <ambientLight intensity={0.5} color="#e8ecf0" />
        <directionalLight
          position={[4, 5, 6]}
          intensity={1.2}
          color="#ffffff"
        />
        <directionalLight
          position={[-5, 4, 5]}
          intensity={1.5}
          color="#e8f0ff"
        />
        <directionalLight
          position={[0, 6, -4]}
          intensity={1.8}
          color="#ffffff"
        />
        <directionalLight
          position={[-4, -2, 6]}
          intensity={0.9}
          color="#d8e4f0"
        />
        <Environment background={false} resolution={128} frames={1}>
          <color attach="background" args={["#303848"]} />
        </Environment>
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
        />
        <group position={[0.5, 0, -0.005]}>
          <TestModelView
            modelPath="/models/truffle-os-latest.glb"
            shellColor="#dce4ec"
            scale={100}
          />
        </group>
      </Canvas>
    </div>
  );
}
