import type { Vec3 } from './sceneStore'

/**
 * World coordinate system for the Interaction Engine.
 *
 * The core sits at the origin with the stream display behind it. Each feature
 * module has a "docked" position close to the core (hero) and a "station"
 * position it travels to when the scene separates (sep → 1). Camera keyframes
 * in motion/keyframes.ts frame these same stations, so the two files must move
 * together.
 */
export const WORLD = {
  core: [0, -0.95, 0.25] as Vec3,
  display: [0, 0.55, -0.55] as Vec3,
  voice: { docked: [-2.1, -1.55, 0.3] as Vec3, station: [-4.4, 0.35, 1.0] as Vec3 },
  pads: { docked: [2.0, -1.65, 0.8] as Vec3, station: [4.4, -0.45, 1.2] as Vec3 },
  media: { docked: [-0.4, 2.1, -1.6] as Vec3, station: [0.9, 2.6, -2.0] as Vec3 },
} as const
