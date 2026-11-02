export type QualityTier = 'high' | 'low'

export interface Capabilities {
  webgl: boolean
  tier: QualityTier
  coarsePointer: boolean
  /** The tier was forced with `?quality=`; the stage then never bails out to the static fallback. */
  forced: boolean
  /** The only WebGL on offer is a software rasteriser. */
  software: boolean
}

/** Renderers that rasterise on the CPU. The full scene would starve the page of frames on them. */
const SOFTWARE_RENDERER = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i

/** Whether a WebGL context can be created, and whether it is a software rasteriser. */
function probeWebGL(): { ok: boolean; software: boolean } {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!gl) return { ok: false, software: false }
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '')
    // Release the probe context straight away so it doesn't count against the
    // browser's live-context limit.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return { ok: true, software: SOFTWARE_RENDERER.test(renderer) }
  } catch {
    return { ok: false, software: false }
  }
}

let cached: Capabilities | null = null

/**
 * One-time device probe. Software WebGL counts as no WebGL. For QA, `?webgl=0`
 * forces the static fallback, and `?quality=low|high` overrides the tier and
 * keeps the 3D stage running even on a software renderer.
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
  const quality = params.get('quality')
  const forced = quality === 'low' || quality === 'high'
  if (quality === 'low' || quality === 'high') tier = quality

  const gl = params.get('webgl') === '0' ? { ok: false, software: false } : probeWebGL()
  cached = {
    webgl: gl.ok && (!gl.software || forced),
    tier,
    coarsePointer,
    forced,
    software: gl.software,
  }
  return cached
}
