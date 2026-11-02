import type { Focus, RigState, Vec3 } from '@/lib/three/sceneStore'
import type { SectionId } from '@/content/site'
import { WORLD } from '@/lib/three/layout'

/**
 * Scroll phases → camera/scene shots.
 *
 * Each section on the page owns one shot. The scene director blends between
 * neighbouring shots as the viewport centre travels from one section's centre
 * to the next, holding each shot while its section is centred. Phases:
 *
 *   A hero        — engine established beside the headline (above it on phones)
 *   B/C features  — camera moves inward, modules separate to stations
 *   D experience  — voice station in focus
 *   E soundboard  — pad station prominent
 *                   (phones: copy fills the screen in B–G, so the stage is covered)
 *   F visuals     — the pad shot fades out under the product UI
 *   G control/how — stage stays fully covered (rendering paused) while the
 *                   engine folds away, so the next reveal shows only the mark
 *   H story       — brand solo: the HC mark alone, fitted into the slot above
 *                   the closing type
 *   I get-started — the mark leaves with its slot and the stage fades out
 *                   completely behind the call to action
 *
 * A shot does not store a camera position. It names its subject (a world-space
 * centre and the half-extents that must stay in frame), the direction the
 * camera views it from, and the screen region it belongs in. The director
 * measures those regions from the live layout (the hero copy, each section's
 * text column, the brand moment's mark slot) and `frameShot` solves the camera
 * for the current viewport, so the subject lands beside the copy at any width
 * or aspect instead of at an offset tuned for one screen.
 */

/** Where in the viewport a shot's subject is fitted. */
export type RegionKind =
  /** Beside the hero copy, or in the band above its eyebrow when that leaves more room. */
  | 'hero'
  /** Right of the section's text column (two-column layouts). */
  | 'column'
  /** The brand moment's mark slot. */
  | 'slot'

export interface Shot {
  /** World-space centre of what the shot is about. */
  subject: Vec3
  /** Half-width and half-height (world units, at the subject's depth) that must stay in frame. */
  extent: [number, number]
  /** Direction from the subject toward the camera. */
  view: Vec3
  region: RegionKind
  sep: number
  focus: Focus
  dim: number
  veil: number
  solo: number
}

/** A screen rectangle in CSS px, relative to the viewport. */
export interface Region {
  left: number
  top: number
  right: number
  bottom: number
}

type Shots = Record<SectionId, Shot>

// Subjects and extents were measured from renders of each composition (see
// lib/three/layout.ts for the positions they are built around).
const HERO = { subject: [0.34, -0.11, 0] as Vec3, extent: [3.05, 3.0] as [number, number], view: [0, 0.4, 12] as Vec3 }
// Phones get MessageOrbit's compact cards, pulled in toward the display, so the composition is tighter.
const HERO_COMPACT = { ...HERO, subject: [-0.05, 0.17, 0] as Vec3, extent: [2.5, 2.45] as [number, number] }
const FEATURES = { subject: [0.35, 0.75, 0] as Vec3, extent: [2.15, 2.05] as [number, number], view: [0, 0.45, 10.5] as Vec3 }
const VOICE = {
  // The panel's waveform ribbon runs past its right edge, so the subject sits a little right of the station.
  subject: [WORLD.voice.station[0] + 0.1, WORLD.voice.station[1], WORLD.voice.station[2]] as Vec3,
  extent: [1.3, 0.72] as [number, number],
  view: [0, 0.35, 6.2] as Vec3,
}
const PADS = {
  subject: [WORLD.pads.station[0] + 0.05, WORLD.pads.station[1], WORLD.pads.station[2] + 0.1] as Vec3,
  extent: [1.3, 0.85] as [number, number],
  // Looks down onto the tilted deck.
  view: [0, 2.0, 7.6] as Vec3,
}
const MARK = { subject: WORLD.soloMark.centre, extent: [WORLD.soloMark.radius, WORLD.soloMark.radius] as [number, number], view: [0, 0.12, 10.5] as Vec3 }

const NONE: Focus = [0, 0, 0]

const shot = (
  base: Pick<Shot, 'subject' | 'extent' | 'view'>,
  region: RegionKind,
  sep: number,
  focus: Focus,
  dim: number,
  veil = 0,
  solo = 0,
): Shot => ({ ...base, region, sep, focus, dim, veil, solo })

/** Two-column layouts (768 px and up): subjects sit right of the copy, a veil keeps the text column clean. */
export const DESKTOP_SHOTS: Shots = {
  top: shot(HERO, 'hero', 0, NONE, 0, 0.35),
  features: shot(FEATURES, 'column', 1, NONE, 0.1, 1),
  experience: shot(VOICE, 'column', 1, [1, 0, 0], 0.08, 1),
  soundboard: shot(PADS, 'column', 1, [0, 1, 0], 0.08, 1),
  // Holds the pad shot while it fades, so nothing sweeps behind the Visuals heading.
  visuals: shot(PADS, 'column', 1, [0, 1, 0], 1, 1),
  // Fully covered: fold the engine and line up on the mark while nobody can see it.
  control: shot(MARK, 'slot', 0, NONE, 1, 0, 1),
  'how-it-works': shot(MARK, 'slot', 0, NONE, 1, 0, 1),
  story: shot(MARK, 'slot', 0, NONE, 0, 0, 1),
  // The mark rides up with its slot and fades out before the call to action.
  'get-started': shot(MARK, 'slot', 0, NONE, 1, 0, 1),
}

/**
 * Single-column layouts (phones): the hero engine sits in the band above the
 * eyebrow and scrolls away with it. Copy fills the whole screen in every other
 * content section, so nothing is drawn behind it there: the stage stays fully
 * covered (and paused) until the brand moment.
 */
export const MOBILE_SHOTS: Shots = {
  top: shot(HERO_COMPACT, 'hero', 0, NONE, 0),
  features: shot(HERO_COMPACT, 'hero', 0, NONE, 1),
  experience: shot(HERO_COMPACT, 'hero', 0, NONE, 1),
  soundboard: shot(HERO_COMPACT, 'hero', 0, NONE, 1),
  visuals: shot(HERO_COMPACT, 'hero', 0, NONE, 1),
  control: shot(MARK, 'slot', 0, NONE, 1, 0, 1),
  'how-it-works': shot(MARK, 'slot', 0, NONE, 1, 0, 1),
  story: shot(MARK, 'slot', 0, NONE, 0, 0, 1),
  'get-started': shot(MARK, 'slot', 0, NONE, 1, 0, 1),
}

/**
 * Reduced motion keeps the modules docked (see Engine), so every section that
 * is not brand-solo holds the hero shot; only dim and veil follow the page.
 */
export function reducedShots(set: Shots): Shots {
  const out = { ...set }
  for (const id of Object.keys(out) as SectionId[]) {
    const s = out[id]
    if (s.solo < 0.5) out[id] = { ...set.top, dim: s.dim, veil: s.veil }
  }
  return out
}

/** Below this width the page is a single column (Tailwind `md`). Chooses shots, field of view and readability layers. */
export const TWO_COLUMN_MIN_WIDTH = 768
export const isMobileLayout = (w: number) => w < TWO_COLUMN_MIN_WIDTH
/** Vertical field of view: wider on single-column layouts, whose subjects sit in a short band. */
export const fovFor = (w: number) => (isMobileLayout(w) ? 45 : 35)

/** Portrait or narrow viewports, where the engine's message cards use their compact layout (see MessageOrbit). */
export const isMobileAspect = (w: number, h: number) => w / h < 0.85 || w < 640

/** Closest the camera may come to a subject, whatever the region asks for. */
const MIN_DISTANCE = 4

/**
 * Solves the camera for `s` so its subject, seen from `s.view`, fits inside
 * `region` and is centred in it, for a `vw`×`vh` viewport with vertical field
 * of view `fov` (degrees). Writes the camera, its look-at target (on the view
 * axis, at the subject's depth) and the shot's scene values into `out`.
 */
export function frameShot(s: Shot, region: Region, vw: number, vh: number, fov: number, out: RigState) {
  const tanV = Math.tan((fov * Math.PI) / 360)
  const tanH = tanV * (vw / vh)
  // Region centre and half-size in normalised device coordinates.
  const cx = (region.left + region.right) / vw - 1
  const cy = 1 - (region.top + region.bottom) / vh
  const rx = Math.max(8, region.right - region.left) / vw
  const ry = Math.max(8, region.bottom - region.top) / vh
  const d = Math.max(MIN_DISTANCE, s.extent[0] / (rx * tanH), s.extent[1] / (ry * tanV))

  // Camera basis: back (subject → camera), right = up × back, up' = back × right.
  const [vx, vy, vz] = s.view
  const vl = Math.hypot(vx, vy, vz) || 1
  const bx = vx / vl
  const by = vy / vl
  const bz = vz / vl
  const rl = Math.hypot(bz, bx) || 1
  const rxv = bz / rl
  const rzv = -bx / rl
  const ux = by * rzv
  const uy = bz * rxv - bx * rzv
  const uz = -by * rxv

  // Shift the view axis so the subject projects at the region centre.
  const ox = cx * d * tanH
  const oy = cy * d * tanV
  for (let i = 0; i < 3; i++) {
    const right = i === 0 ? rxv : i === 1 ? 0 : rzv
    const up = i === 0 ? ux : i === 1 ? uy : uz
    const back = i === 0 ? bx : i === 1 ? by : bz
    out.target[i] = s.subject[i] - right * ox - up * oy
    out.cam[i] = out.target[i] + back * d
    out.focus[i] = s.focus[i]
  }
  out.sep = s.sep
  out.dim = s.dim
  out.veil = s.veil
  out.solo = s.solo
}

export function lerpRig(a: RigState, b: RigState, t: number, out: RigState) {
  for (let i = 0; i < 3; i++) {
    out.cam[i] = a.cam[i] + (b.cam[i] - a.cam[i]) * t
    out.target[i] = a.target[i] + (b.target[i] - a.target[i]) * t
    out.focus[i] = a.focus[i] + (b.focus[i] - a.focus[i]) * t
  }
  out.sep = a.sep + (b.sep - a.sep) * t
  out.dim = a.dim + (b.dim - a.dim) * t
  out.veil = a.veil + (b.veil - a.veil) * t
  out.solo = a.solo + (b.solo - a.solo) * t
}
