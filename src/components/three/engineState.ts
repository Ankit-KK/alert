import type { InteractionKind } from './textures'

/**
 * Per-frame state shared between engine parts inside the canvas. Written by
 * Engine/MessageOrbit, read by the display, core and modules.
 */
export const engineState = {
  /** Damped scene separation (0 docked … 1 separated). */
  sep: 0,
  /** Damped station focus weights [voice, pads, media]. */
  focus: [0, 0, 0] as [number, number, number],
  /** Most recent interaction kind shown on the display overlay. */
  alertKind: 'chat' as InteractionKind,
  /** Timestamp the current overlay alert started (-10 = none). */
  alertAt: -10,
}
