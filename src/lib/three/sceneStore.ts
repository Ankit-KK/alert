/**
 * Mutable bridge between the DOM and the WebGL stage.
 *
 * High-frequency values (scroll rig, pointer, audio level) are written here by
 * DOM-side code and read inside `useFrame`, so nothing re-renders React per
 * frame. Treat it as a plain mutable struct, never as React state.
 */

export type Vec3 = [number, number, number]

/** Focus weights for the three feature stations: [voice, pads, media]. */
export type Focus = [number, number, number]

export interface RigState {
  cam: Vec3
  target: Vec3
  /** 0 = modules docked around the core, 1 = modules separated to stations. */
  sep: number
  focus: Focus
  /** 0..1 darkening of the stage under content-heavy sections. */
  dim: number
  /** 0..1 strength of the left-side readability veil behind text columns. */
  veil: number
}

export interface SceneStore {
  rig: RigState
  /** Hero entrance progress, tweened 0 → 1 by the hero timeline. */
  intro: number
  /** Pointer in normalized device coordinates (-1..1), desktop only. */
  pointer: { x: number; y: number }
  /** Smoothed 0..1 loudness of whatever the page is currently playing. */
  audioLevel: number
  /** True while the voice preview is speaking. */
  voiceActive: boolean
  /** Timestamp of the last spoken word boundary. */
  voiceWord: number
  /** Index of the pad currently hovered/focused in the DOM deck, -1 for none. */
  padHover: number
  /** Timestamp (performance.now() / 1000) of the last hit per pad. */
  padHits: number[]
  /** Timestamp of the last interaction that reached the core. */
  lastPulse: number
  /** Set by the stage once it has rendered its first frame. */
  ready: boolean
  /** Requests frames when the canvas renders on demand (reduced motion). */
  invalidate?: (frames?: number) => void
}

export const sceneStore: SceneStore = {
  rig: {
    cam: [-2.6, 0.3, 12],
    target: [-2.6, -0.1, 0],
    sep: 0,
    focus: [0, 0, 0],
    dim: 0,
    veil: 0,
  },
  intro: 0,
  pointer: { x: 0, y: 0 },
  audioLevel: 0,
  voiceActive: false,
  voiceWord: -10,
  padHover: -1,
  padHits: [-10, -10, -10, -10, -10, -10],
  lastPulse: -10,
  ready: false,
}

export const now = () => performance.now() / 1000

/** Register a pad strike coming from the DOM deck. */
export function hitPad(index: number) {
  const t = now()
  sceneStore.padHits[index] = t
  sceneStore.lastPulse = t
  sceneStore.invalidate?.(90)
}
