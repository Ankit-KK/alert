import type { RigState } from '@/lib/three/sceneStore'
import type { SectionId } from '@/content/site'

/**
 * Scroll phases → camera/scene keyframes.
 *
 * Each section on the page owns one keyframe. The scene director blends
 * between neighbouring keyframes as the viewport centre travels from one
 * section's centre to the next, holding each keyframe while its section is
 * centred. Phases:
 *
 *   A hero        — engine established, framed right of the headline
 *   B/C features  — camera moves inward, modules separate to stations
 *   D experience  — voice station in focus
 *   E soundboard  — pad station prominent
 *   F visuals     — camera rises toward the media frames
 *   G control/how — stage pulls back and dims under product UI
 *   H story/cta   — closing wide composition, modules re-docked
 *
 * Desktop keyframes offset the camera left of its subject so the 3D sits on
 * the right while text reads on the left. Mobile keyframes centre the subject
 * in the upper part of the viewport and dim more for legibility.
 */
type Keyframes = Record<SectionId, RigState>

const kf = (
  cam: RigState['cam'],
  target: RigState['target'],
  sep: number,
  focus: RigState['focus'],
  dim: number,
  veil = 0,
): RigState => ({ cam, target, sep, focus, dim, veil })

export const DESKTOP_KEYFRAMES: Keyframes = {
  top: kf([-2.6, 0.3, 12], [-2.6, -0.1, 0], 0, [0, 0, 0], 0, 0.35),
  features: kf([-1.9, 0.35, 10.5], [-1.9, -0.1, 0], 1, [0, 0, 0], 0.1, 1),
  experience: kf([-6.0, 0.7, 7.2], [-6.0, 0.35, 1.0], 1, [1, 0, 0], 0.08, 1),
  soundboard: kf([2.2, 1.5, 8.8], [2.2, -0.5, 1.2], 1, [0, 1, 0], 0.08, 1),
  visuals: kf([0.9, 2.0, 10], [0.9, 2.3, -2.0], 1, [0, 0, 1], 0.82),
  control: kf([0, 0.6, 13], [0, 0, 0], 0.6, [0, 0, 0], 0.88),
  'how-it-works': kf([0, 0.4, 14], [0, 0, 0], 0.35, [0, 0, 0], 0.9),
  story: kf([0, 0.25, 17], [0, 0.1, 0], 0, [0, 0, 0], 0.32),
  'get-started': kf([0, 3.0, 13], [0, 2.0, 0], 0, [0, 0, 0], 0.6),
}

export const MOBILE_KEYFRAMES: Keyframes = {
  top: kf([0, -2.0, 15], [0, -3.05, 0], 0, [0, 0, 0], 0.05),
  features: kf([0, -0.4, 13.5], [0, -1.3, 0], 1, [0, 0, 0], 0.62),
  experience: kf([-4.4, -0.2, 9.4], [-4.4, -1.0, 1.0], 1, [1, 0, 0], 0.72),
  soundboard: kf([4.4, 0.8, 9.4], [4.4, -1.1, 1.2], 1, [0, 1, 0], 0.72),
  visuals: kf([0.9, 2.0, 12], [0.9, 2.2, -2.0], 1, [0, 0, 1], 0.85),
  control: kf([0, 0.6, 16], [0, 0, 0], 0.6, [0, 0, 0], 0.86),
  'how-it-works': kf([0, 0.4, 17], [0, 0, 0], 0.35, [0, 0, 0], 0.86),
  story: kf([0, 0.2, 21], [0, 0.1, 0], 0, [0, 0, 0], 0.35),
  'get-started': kf([0, 2.6, 15.5], [0, 1.3, 0], 0, [0, 0, 0], 0.55),
}

/** Matches the CameraRig field-of-view switch. */
export const isMobileAspect = (w: number, h: number) => w / h < 0.85 || w < 640

export function lerpRig(a: RigState, b: RigState, t: number, out: RigState) {
  for (let i = 0; i < 3; i++) {
    out.cam[i] = a.cam[i] + (b.cam[i] - a.cam[i]) * t
    out.target[i] = a.target[i] + (b.target[i] - a.target[i]) * t
    out.focus[i] = a.focus[i] + (b.focus[i] - a.focus[i]) * t
  }
  out.sep = a.sep + (b.sep - a.sep) * t
  out.dim = a.dim + (b.dim - a.dim) * t
  out.veil = a.veil + (b.veil - a.veil) * t
}
