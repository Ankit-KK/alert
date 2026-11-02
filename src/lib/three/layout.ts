import type { Vec3 } from './sceneStore'

/**
 * World coordinate system for the Interaction Engine.
 *
 * The core sits at the origin with the stream display behind it. Each feature
 * module has a "docked" position close to the core (hero) and a "station"
 * position it travels to when the scene separates (sep → 1). Camera shots in
 * motion/keyframes.ts frame these same stations, so the two files must move
 * together. The side stations sit far enough out that, while one is in
 * focus, the display and the other stations stay fully off screen instead of
 * being sliced by the viewport edge.
 */
export const WORLD = {
  core: [0, -0.95, 0.25] as Vec3,
  display: [0, 0.55, -0.55] as Vec3,
  voice: { docked: [-2.1, -1.55, 0.3] as Vec3, station: [-5.4, 0.35, 1.0] as Vec3 },
  pads: { docked: [2.0, -1.65, 0.8] as Vec3, station: [5.4, -0.45, 1.2] as Vec3 },
  media: { docked: [-0.4, 2.1, -1.6] as Vec3, station: [0.9, 2.6, -2.0] as Vec3 },
  /**
   * The risen HC mark in brand-solo sections: Core lifts its badge by SOLO_Y
   * (1.22) above the core and scales it by SOLO_SCALE (1.7). The radius covers
   * the halo's outer arc, including its pulse, so the story camera can fit the
   * whole mark into the slot above the closing type.
   */
  soloMark: { centre: [0, -0.95 + 1.22, 0.1] as Vec3, radius: 1.42 },
} as const
