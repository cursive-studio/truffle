/**
 * Configurable scroll points: at each scroll progress (0–1) the model
 * can have a specific rotation and/or scale. Values are interpolated
 * between consecutive points.
 */
export interface ScrollPoint {
  /** Scroll progress 0–1 where this keyframe applies. */
  at: number;
  /** Model rotation in radians [x, y, z]. */
  rotation?: [number, number, number];
  /** Model scale. */
  scale?: number;
}

/** Interpolate rotation and scale at a given scroll progress from keyframes. */
export function getModelStateAtScroll(
  scrollProgress: number,
  points: ScrollPoint[],
  defaults: { rotation: [number, number, number]; scale: number }
): { rotation: [number, number, number]; scale: number } {
  if (points.length === 0) {
    return defaults;
  }
  const sorted = [...points].sort((a, b) => a.at - b.at);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;

  if (scrollProgress <= first.at) {
    return {
      rotation: first.rotation ?? defaults.rotation,
      scale: first.scale ?? defaults.scale,
    };
  }
  if (scrollProgress >= last.at) {
    return {
      rotation: last.rotation ?? defaults.rotation,
      scale: last.scale ?? defaults.scale,
    };
  }

  let i = 0;
  while (i < sorted.length - 1 && sorted[i + 1]!.at <= scrollProgress) {
    i++;
  }
  const a = sorted[i]!;
  const b = sorted[i + 1]!;
  const t = (scrollProgress - a.at) / (b.at - a.at);

  const rotA = a.rotation ?? defaults.rotation;
  const rotB = b.rotation ?? defaults.rotation;
  const scaleA = a.scale ?? defaults.scale;
  const scaleB = b.scale ?? defaults.scale;

  return {
    rotation: [
      rotA[0] + (rotB[0] - rotA[0]) * t,
      rotA[1] + (rotB[1] - rotA[1]) * t,
      rotA[2] + (rotB[2] - rotA[2]) * t,
    ],
    scale: scaleA + (scaleB - scaleA) * t,
  };
}

/** Example: model spins on Z axis over scroll (one full turn). Scale kept small to avoid GPU overload. */
const BASE_X = 1.7;
const BASE_Y = 3.3;
const BASE_Z = 4.3;
const BASE_SCALE = 15.2;

export const DEFAULT_SCROLL_POINTS: ScrollPoint[] = [
  { at: 0, rotation: [BASE_X, BASE_Y, BASE_Z], scale: BASE_SCALE },
  { at: 0.15, rotation: [BASE_X, BASE_Y - Math.PI /2, BASE_Z + Math.PI * 0.5], scale: BASE_SCALE * 1.02 },
  { at: 0.25, rotation: [BASE_X, BASE_Y - Math.PI /2, BASE_Z + Math.PI * 0.5], scale: BASE_SCALE * 1.02 },
  { at: 0.5, rotation: [BASE_X, BASE_Y, BASE_Z + Math.PI], scale: BASE_SCALE * 0.98 },
  { at: 0.75, rotation: [BASE_X, BASE_Y, BASE_Z + Math.PI * 1.5], scale: BASE_SCALE * 1.01 },
  { at: 1, rotation: [BASE_X, BASE_Y, BASE_Z + Math.PI * 2], scale: BASE_SCALE },
];
