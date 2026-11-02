import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import type { QualityTier } from '@/lib/three/capabilities'
import { sceneStore } from '@/lib/three/sceneStore'
import { fovFor } from '@/lib/motion/keyframes'
import { StageErrorBoundary } from '@/components/layout/StageErrorBoundary'
import { CameraRig } from './CameraRig'
import { Dust } from './Dust'
import { Engine } from './Engine'
import { engineState } from './engineState'
import { Lighting } from './Lighting'
import { PALETTE, textureQuality } from './textures'

const Effects = lazy(() => import('./Effects'))

/** Average frame time (ms) above which, once already downgraded, the stage gives way to the static fallback. */
const SLOW_FRAME_MS = 50
const BUDGET_WINDOW_MS = 2500
/** Skipped at the start of each window series: shader compiles and texture uploads. */
const BUDGET_WARMUP_MS = 1500
/** A gap this long means the loop was paused (covered stage, background tab), not that a frame was slow. */
const PAUSE_GAP_MS = 1500

/** Announces the first rendered frame so the static fallback can fade out. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const fired = useRef(false)
  useFrame(() => {
    if (fired.current) return
    fired.current = true
    sceneStore.ready = true
    onReady()
  })
  return null
}

/**
 * In reduced-motion mode the canvas renders on demand. DOM-triggered moments
 * (pad strikes, voice playback) request a short burst of frames through this.
 */
function DemandBridge() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    sceneStore.invalidate = (frames = 60) => invalidate(frames)
    return () => {
      sceneStore.invalidate = undefined
    }
  }, [invalidate])
  return null
}

/**
 * Starts the engine's damped values and the camera from the scroll rig, as if
 * they had been following it all along. Used when rendering (re)starts: the rig
 * keeps moving while the stage is covered, and without this the engine would
 * visibly re-fold and the camera ease in from the last frame drawn.
 */
function syncToRig(reduced: boolean) {
  const { rig } = sceneStore
  engineState.sep = reduced ? 0 : rig.sep
  engineState.solo = rig.solo
  for (let i = 0; i < 3; i++) engineState.focus[i] = reduced ? 0 : rig.focus[i]
  sceneStore.snap = true
}

/** Stops the render loop while the page's dim layer fully hides the stage. */
function CoverBridge({ reduced }: { reduced: boolean }) {
  const setFrameloop = useThree((s) => s.setFrameloop)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const idle = reduced ? 'demand' : 'always'
    sceneStore.setCovered = (covered) => {
      setFrameloop(covered ? 'never' : idle)
      if (covered) return
      syncToRig(reduced)
      invalidate()
    }
    syncToRig(reduced)
    if (sceneStore.rig.dim > 0.995) setFrameloop('never')
    return () => {
      sceneStore.setCovered = undefined
    }
  }, [reduced, setFrameloop, invalidate])
  return null
}

/**
 * Watches real frame times. Calls `onSlow` whenever a window of frames
 * averages slower than SLOW_FRAME_MS, which happens on software GL or an
 * overloaded GPU, where the full scene would starve scrolling and the rest of
 * the page of frames.
 */
function FrameBudget({ onSlow }: { onSlow: () => void }) {
  const win = useRef({ from: -1, last: 0, frames: 0 })
  useFrame(() => {
    const t = performance.now()
    const w = win.current
    if (w.from < 0 || t - w.last > PAUSE_GAP_MS) {
      w.from = t + BUDGET_WARMUP_MS
      w.frames = 0
    }
    w.last = t
    if (t < w.from) return
    w.frames++
    if (t - w.from < BUDGET_WINDOW_MS) return
    const average = (t - w.from) / w.frames
    w.from = t
    w.frames = 0
    if (average > SLOW_FRAME_MS) onSlow()
  })
  return null
}

/** Renderer tone mapping is only used when the post stack (which tone-maps itself) is off. */
function ToneMappingSync({ effects }: { effects: boolean }) {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    gl.toneMapping = effects ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.05
    invalidate()
  }, [gl, effects, invalidate])
  return null
}

export interface StageProps {
  tier: QualityTier
  reduced: boolean
  parallax: boolean
  /** Whether to give way to the static fallback when frames stay slow after downgrading. */
  budget: boolean
  onReady: () => void
  /** The stage is too slow to keep; the caller should unmount it and show the static fallback. */
  onFallback: () => void
}

/**
 * The single fixed WebGL canvas behind the page. It never receives pointer
 * events: all controls are DOM elements layered above it, and the 3D only
 * mirrors their state.
 */
export default function Stage({ tier, reduced, parallax, budget, onReady, onFallback }: StageProps) {
  const high = tier === 'high'
  // Runs once, before any engine part creates its canvas textures.
  useState(() => {
    textureQuality.supersample = high ? 2 : 1.25
  })
  const [dprCap, setDprCap] = useState(high ? 1.75 : 1.25)
  const [effects, setEffects] = useState(high)
  const [degraded, setDegraded] = useState(false)
  const degrade = () => {
    setDprCap(1)
    setEffects(false)
    setDegraded(true)
  }

  return (
    <Canvas
      aria-hidden="true"
      tabIndex={-1}
      style={{ pointerEvents: 'none' }}
      dpr={[1, dprCap]}
      frameloop={reduced ? 'demand' : 'always'}
      // Anti-aliased context: the post stack multisamples on its own, but when
      // it is off (low tier, or after a downgrade) this is all there is.
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ fov: fovFor(window.innerWidth), near: 0.1, far: 80, position: sceneStore.rig.cam }}
    >
      <color attach="background" args={[PALETTE.obsidian]} />
      {/* CameraRig keeps the fog range relative to the current shot. */}
      <fog attach="fog" args={[PALETTE.obsidian, 13, 34]} />
      <PerformanceMonitor onDecline={degrade} />
      {/* Remounted after the downgrade, so it measures the downgraded stage afresh. */}
      {budget && <FrameBudget key={degraded ? 'degraded' : 'full'} onSlow={degraded ? onFallback : degrade} />}
      <Lighting lowDetail={!high} />
      <Engine tier={tier} reduced={reduced} />
      <Dust count={high ? 650 : 200} reduced={reduced} />
      <CameraRig reduced={reduced} parallax={parallax} />
      {effects && (
        // A post-processing chunk that fails to load only costs the bloom.
        <StageErrorBoundary onError={() => setEffects(false)}>
          <Suspense fallback={null}>
            <Effects />
          </Suspense>
        </StageErrorBoundary>
      )}
      <ToneMappingSync effects={effects} />
      <DemandBridge />
      <CoverBridge reduced={reduced} />
      <ReadySignal onReady={onReady} />
    </Canvas>
  )
}
