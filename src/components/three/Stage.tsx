import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import type { QualityTier } from '@/lib/three/capabilities'
import { sceneStore } from '@/lib/three/sceneStore'
import { DESKTOP_KEYFRAMES } from '@/lib/motion/keyframes'
import { CameraRig } from './CameraRig'
import { Dust } from './Dust'
import { Engine } from './Engine'
import { Lighting } from './Lighting'
import { PALETTE, textureQuality } from './textures'

const Effects = lazy(() => import('./Effects'))

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

/** Stops the render loop while the page's dim layer fully hides the stage. */
function CoverBridge({ reduced }: { reduced: boolean }) {
  const setFrameloop = useThree((s) => s.setFrameloop)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const idle = reduced ? 'demand' : 'always'
    sceneStore.setCovered = (covered) => {
      setFrameloop(covered ? 'never' : idle)
      if (!covered) invalidate()
    }
    if (sceneStore.rig.dim > 0.995) setFrameloop('never')
    return () => {
      sceneStore.setCovered = undefined
    }
  }, [reduced, setFrameloop, invalidate])
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
  onReady: () => void
}

/**
 * The single fixed WebGL canvas behind the page. It never receives pointer
 * events: all controls are DOM elements layered above it, and the 3D only
 * mirrors their state.
 */
export default function Stage({ tier, reduced, parallax, onReady }: StageProps) {
  const high = tier === 'high'
  // Runs once, before any engine part creates its canvas textures.
  useState(() => {
    textureQuality.supersample = high ? 2 : 1.25
  })
  const [dprCap, setDprCap] = useState(high ? 1.75 : 1.25)
  const [effects, setEffects] = useState(high)

  return (
    <Canvas
      aria-hidden="true"
      tabIndex={-1}
      style={{ pointerEvents: 'none' }}
      dpr={[1, dprCap]}
      frameloop={reduced ? 'demand' : 'always'}
      gl={{ antialias: !high, powerPreference: 'high-performance', alpha: false, stencil: false }}
      camera={{ fov: 35, near: 0.1, far: 60, position: DESKTOP_KEYFRAMES.top.cam }}
    >
      <color attach="background" args={[PALETTE.obsidian]} />
      <fog attach="fog" args={[PALETTE.obsidian, 13, 34]} />
      <PerformanceMonitor
        onDecline={() => {
          setDprCap(1)
          setEffects(false)
        }}
      />
      <Lighting lowDetail={!high} />
      <Engine tier={tier} reduced={reduced} />
      <Dust count={high ? 650 : 200} reduced={reduced} />
      <CameraRig reduced={reduced} parallax={parallax} />
      {effects && (
        <Suspense fallback={null}>
          <Effects />
        </Suspense>
      )}
      <ToneMappingSync effects={effects} />
      <DemandBridge />
      <CoverBridge reduced={reduced} />
      <ReadySignal onReady={onReady} />
    </Canvas>
  )
}
