export type QualityTier = 'high' | 'low'

export interface Capabilities {
  webgl: boolean
  tier: QualityTier
  coarsePointer: boolean
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) return false
    // Release the probe context straight away so it doesn't count against the
    // browser's live-context limit.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

let cached: Capabilities | null = null

/**
 * One-time device probe. `?webgl=0` forces the static fallback and
 * `?quality=low|high` overrides the tier, which is handy for QA.
 */
export function getCapabilities(): Capabilities {
  if (cached) return cached

  const params = new URLSearchParams(window.location.search)
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }

  const smallScreen = Math.min(window.screen.width, window.screen.height) < 820
  const weakCpu = (navigator.hardwareConcurrency ?? 8) <= 4
  const lowMemory = (nav.deviceMemory ?? 8) <= 4
  const saveData = nav.connection?.saveData === true

  let tier: QualityTier = (coarsePointer && smallScreen) || weakCpu || lowMemory || saveData ? 'low' : 'high'
  const forced = params.get('quality')
  if (forced === 'low' || forced === 'high') tier = forced

  cached = {
    webgl: params.get('webgl') !== '0' && hasWebGL(),
    tier,
    coarsePointer,
  }
  return cached
}
