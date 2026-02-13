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
  /** Model position [x, y, z]. */
  position?: [number, number, number];
}

/** Interpolate rotation, scale, and position at a given scroll progress from keyframes. */
export function getModelStateAtScroll(
  scrollProgress: number,
  points: ScrollPoint[],
  defaults: {
    rotation: [number, number, number];
    scale: number;
    position: [number, number, number];
  }
): {
  rotation: [number, number, number];
  scale: number;
  position: [number, number, number];
} {
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
      position: first.position ?? defaults.position,
    };
  }
  if (scrollProgress >= last.at) {
    return {
      rotation: last.rotation ?? defaults.rotation,
      scale: last.scale ?? defaults.scale,
      position: last.position ?? defaults.position,
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
  const posA = a.position ?? defaults.position;
  const posB = b.position ?? defaults.position;

  return {
    rotation: [
      rotA[0] + (rotB[0] - rotA[0]) * t,
      rotA[1] + (rotB[1] - rotA[1]) * t,
      rotA[2] + (rotB[2] - rotA[2]) * t,
    ],
    scale: scaleA + (scaleB - scaleA) * t,
    position: [
      posA[0] + (posB[0] - posA[0]) * t,
      posA[1] + (posB[1] - posA[1]) * t,
      posA[2] + (posB[2] - posA[2]) * t,
    ],
  };
}

/** Example: model spins on Z axis over scroll (one full turn). Scale kept small to avoid GPU overload. */
const BASE_X = 1.7;
const BASE_Y = 3.3;
const BASE_Z = 4.3;
const BASE_SCALE = 15.2;

export const DEFAULT_SCROLL_POINTS: ScrollPoint[] = [
  { at: 0, rotation: [BASE_X, BASE_Y, BASE_Z], scale: BASE_SCALE },
  { at: 0.15, position: [-0.02, 0, 0], rotation: [BASE_X, BASE_Y - Math.PI /1.7, BASE_Z + Math.PI * 0.5], scale: BASE_SCALE * 1.2 },
  { at: 0.25, position: [-0.02, 0, 0], rotation: [BASE_X, BASE_Y - Math.PI /1.7, BASE_Z + Math.PI * 0.5], scale: BASE_SCALE * 1.2 },
  { at: 0.5, rotation: [BASE_X, BASE_Y, BASE_Z + Math.PI], scale: BASE_SCALE * 0, },
  { at: 0.75, rotation: [BASE_X, BASE_Y, BASE_Z + Math.PI * 1.5], scale: BASE_SCALE * 0 },
  { at: 1, rotation: [BASE_X, BASE_Y, BASE_Z + Math.PI * 2], scale: BASE_SCALE },
];
