"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

const MainScene = dynamic(() => import("./MainScene").then((m) => m.MainScene), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-zinc-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-100" />
    </div>
  ),
});

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SceneErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950 p-6 text-zinc-300">
          <p className="text-sm">Something went wrong with the 3D scene.</p>
          {this.state.error && (
            <pre className="max-h-32 overflow-auto rounded bg-zinc-900 px-3 py-2 text-xs text-red-400">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

import type { HeroModelType } from "./MainModel";
import type { ScrollPoint } from "@/config/scrollPoints";

interface MainCanvasProps {
  /** Override model path (e.g. from route). When changed, model fully reloads. */
  modelPath?: string;
  /** Override model type (e.g. from route). */
  modelType?: HeroModelType;
  /** 0–1 scroll progress; drives model animation when scrollPoints are provided. */
  scrollProgress?: number;
  /** Keyframes for model rotation/scale at scroll positions. */
  scrollPoints?: ScrollPoint[];
}

export function MainCanvas({
  modelPath,
  modelType,
  scrollProgress = 0,
  scrollPoints,
}: MainCanvasProps) {
  return (
    <SceneErrorBoundary>
      <MainScene
        modelPath={modelPath}
        modelType={modelType}
        scrollProgress={scrollProgress}
        scrollPoints={scrollPoints}
      />
    </SceneErrorBoundary>
  );
}
